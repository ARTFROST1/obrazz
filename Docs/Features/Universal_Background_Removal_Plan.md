# Universal Background Removal - Expo Go Compatible

> **Цель:** Удаление фона (subject lifting) на iOS + Android, совместимое с Expo Go  
> **Приоритет:** Универсальность > Скорость > Offline  
> **Ограничение:** Без нативных модулей (только JS/TS)

---

## ✅ Важные факты про Expo Go и WebView (критично)

1. **Expo Go допускает только JS/TS + встроенные нативные модули.** У вас уже есть `react-native-webview` и `expo-image-manipulator` в зависимостях, значит подход реалистичный.

2. **“Полностью offline” возможно только при выполнении условий.**

- Код внутри WebView можно сделать полностью локальным (HTML + JS бандл в `assets/`).
- Но сами ONNX/wasm ассеты большинства решений (включая @imgly) обычно подгружаются по сети при первом запуске.
- Реалистичный “offline” в Expo Go: **после первого успешного прогрева (скачивания) и при сохранённом WebView cache**.

3. **Слишком большие base64 строки ломают мобильные мосты.** Нельзя делать `injectJavaScript("...${base64}...")` — это часто падает/обрезается.
   Best practice: передавать данные из RN в WebView через `webViewRef.postMessage()` и **обязательно** даунскейлить изображение до разумного размера.

4. **Лицензия @imgly/background-removal — AGPL.** Это может быть стопером для закрытого приложения. Для продакшена потребуется коммерческая лицензия или замена провайдера (например API/self-hosted).

## 📋 Executive Summary

### Проблема

- Нативный iOS Vision требует dev client (не работает в Expo Go)
- Pixian API заблокирован/нестабилен в РФ
- Нужно решение для **обеих платформ**

### Решение: Multi-Provider Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    BackgroundRemoverService                  │
├─────────────────────────────────────────────────────────────┤
│  1. WebView + ML (primary)      - работает в Expo Go        │
│  2. Remove.bg API (fallback)    - качество/скорость         │
│  3. Self-hosted rembg (fallback)- контроль/без лимитов      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Анализ доступных решений

### Cloud APIs (работают в Expo Go)

| API           | Бесплатно      | Качество   | Блокировка РФ | Рекомендация    |
| ------------- | -------------- | ---------- | ------------- | --------------- |
| **Remove.bg** | 50 calls/month | ⭐⭐⭐⭐⭐ | ❌ Нет        | ✅ Primary      |
| Pixian.ai     | 50 credits     | ⭐⭐⭐⭐   | ⚠️ Да         | ❌ Отклонён     |
| PhotoRoom     | Limited        | ⭐⭐⭐⭐   | ?             | 🔄 Альтернатива |
| ClipDrop      | 100/month      | ⭐⭐⭐⭐   | ?             | 🔄 Альтернатива |

### Self-Hosted (полный контроль)

| Решение             | Модель        | Качество   | Сложность |
| ------------------- | ------------- | ---------- | --------- |
| **rembg (Python)**  | U²-Net, ISNet | ⭐⭐⭐⭐   | Средняя   |
| Segment Anything    | SAM           | ⭐⭐⭐⭐⭐ | Высокая   |
| ONNX Runtime Server | Any           | ⭐⭐⭐⭐   | Средняя   |

### In-Browser (WebView)

| Библиотека                    | Размер модели | Платформа | Expo Go                    |
| ----------------------------- | ------------- | --------- | -------------------------- |
| **@imgly/background-removal** | 40-80MB       | Web       | ✅ через WebView (но AGPL) |
| Transformers.js               | Varies        | Web       | ✅ через WebView (сложнее) |

---

## 🏆 Рекомендуемая стратегия

### Tier 1: WebView + ML (Primary)

```
+ Работает в Expo Go на iOS и Android
+ Даёт именно выделение объекта (foreground)
+ Может работать без сети после прогрева кэша
- Первая загрузка модели/wasm может быть большой
- Требует аккуратного обмена данными RN ⇄ WebView
- @imgly имеет AGPL (важно для продакшена)
```

### Tier 2: Remove.bg API (Fallback)

```
+ Очень высокое качество и стабильность
+ Просто интегрировать через HTTP
+ Есть бесплатный лимит (50/month)
- Платно после лимита
- Требует сети
```

### Tier 3: Self-hosted rembg (Fallback)

```
+ Полный контроль: не зависит от сторонних блокировок
+ Нет лимитов
- Нужен сервер и поддержка
- Требует сети
```

---

## 📝 Детальная реализация

## 0) Best practices (обязательно, иначе будет нестабильно)

### 0.1 Даунскейл входного изображения (до отправки в WebView)

Для сегментации одежды достаточно 1024–1536 px по большей стороне.

Используем `expo-image-manipulator`:

```ts
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export async function prepareImageForSegmentation(uri: string) {
  const out = await manipulateAsync(uri, [{ resize: { width: 1280 } }], {
    compress: 0.9,
    format: SaveFormat.JPEG,
    base64: true,
  });
  // out.base64 — готово для передачи в WebView
  return out;
}
```

### 0.2 Передача данных RN ⇄ WebView

Best practice:

- RN → WebView: `webViewRef.current?.postMessage(JSON.stringify({ type: 'process', base64 }))`
- WebView → RN: `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', base64 }))`

Если `base64` всё равно большой, использовать **чанки** (см. ниже).

### 0.3 Таймауты/отмена

Добавить таймаут на обработку (например 60–90 сек) и кнопку “Отмена” в UI, чтобы не зависать.

### 1. Remove.bg Integration

#### Регистрация

1. Зарегистрироваться на https://www.remove.bg/
2. Получить API ключ: https://www.remove.bg/dashboard#api-key
3. Добавить в `.env`:

```
EXPO_PUBLIC_REMOVEBG_API_KEY=your_api_key_here
```

#### Сервис

```typescript
// services/wardrobe/removeBgService.ts

import * as FileSystem from 'expo-file-system';
import { REMOVEBG_API_KEY } from '@/config/env';

const REMOVEBG_API_URL = 'https://api.remove.bg/v1.0/removebg';

interface RemoveBgOptions {
  size?: 'preview' | 'full' | 'auto';
  type?: 'auto' | 'person' | 'product' | 'car';
  format?: 'png' | 'jpg' | 'webp';
  crop?: boolean;
}

interface RemoveBgResult {
  outputUri: string;
  creditsCharged: number;
  foregroundType: string;
}

class RemoveBgService {
  private apiKey: string;

  constructor() {
    this.apiKey = REMOVEBG_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async removeBackground(imageUri: string, options: RemoveBgOptions = {}): Promise<RemoveBgResult> {
    if (!this.isConfigured()) {
      throw new Error('Remove.bg API key not configured');
    }

    const { size = 'auto', type = 'auto', format = 'png', crop = false } = options;

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('image_file_b64', base64);
    formData.append('size', size);
    formData.append('type', type);
    formData.append('format', format);
    formData.append('crop', crop.toString());

    // Make request
    const response = await fetch(REMOVEBG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      if (response.status === 402) {
        throw new Error('INSUFFICIENT_CREDITS');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      throw new Error(error.errors?.[0]?.title || 'Remove.bg API error');
    }

    // Get result
    const creditsCharged = parseFloat(response.headers.get('X-Credits-Charged') || '0');
    const foregroundType = response.headers.get('X-Type') || 'unknown';

    // Save result image
    const resultBlob = await response.blob();
    const resultBase64 = await blobToBase64(resultBlob);

    const outputPath = `${FileSystem.cacheDirectory}removebg_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(outputPath, resultBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      outputUri: outputPath,
      creditsCharged,
      foregroundType,
    };
  }

  async getAccountInfo(): Promise<{
    credits: number;
    freeApiCalls: number;
  }> {
    const response = await fetch('https://api.remove.bg/v1.0/account', {
      headers: {
        'X-Api-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch account info');
    }

    const data = await response.json();
    return {
      credits: data.data.attributes.credits,
      freeApiCalls: data.data.attributes.api.free_calls,
    };
  }
}

// Helper
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const removeBgService = new RemoveBgService();
```

### 2. Self-Hosted rembg Backend

#### Docker Compose (на VPS)

```yaml
# docker-compose.yml
version: '3.8'

services:
  rembg-api:
    image: danielgatis/rembg:latest
    ports:
      - '5100:5000'
    environment:
      - NUMBA_CACHE_DIR=/tmp
    volumes:
      - rembg_cache:/root/.u2net
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:5000/health']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  rembg_cache:
```

#### Nginx reverse proxy с HTTPS

```nginx
# /etc/nginx/sites-available/rembg
server {
    listen 443 ssl http2;
    server_name rembg.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/rembg.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rembg.yourdomain.com/privkey.pem;

    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:5100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```

#### Client Service

```typescript
// services/wardrobe/rembgService.ts

import * as FileSystem from 'expo-file-system';
import { REMBG_API_URL } from '@/config/env';

class RembgService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = REMBG_API_URL || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiUrl);
  }

  async removeBackground(imageUri: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Rembg API URL not configured');
    }

    // Read image
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine MIME type
    const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Create form data with file
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: mimeType,
      name: 'image.jpg',
    } as any);

    // POST to rembg
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'image/png',
      },
    });

    if (!response.ok) {
      throw new Error(`Rembg error: ${response.status}`);
    }

    // Save result
    const blob = await response.blob();
    const resultBase64 = await blobToBase64(blob);

    const outputPath = `${FileSystem.cacheDirectory}rembg_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(outputPath, resultBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return outputPath;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const rembgService = new RembgService();
```

### 3. WebView + @imgly (Primary)

> В этом документе этот вариант становится **Primary** (а не fallback).

### 3.1 Лицензия (важно)

`@imgly/background-removal` — AGPL. Это значит:

- Для закрытого приложения это почти всегда требует **коммерческой лицензии**.
- Если лицензия не подходит, WebView-Primary остаётся концепцией, но библиотека должна быть заменена (например на self-hosted или другой OSS с permissive license).

### 3.2 Загрузка кода в WebView: избегаем `esm.sh` в проде

Импорт из `https://esm.sh/...` удобен для прототипа, но:

- требует сети для первого запуска
- зависит от CORS/доступности CDN

Best practice для стабильности:

1. `npm i @imgly/background-removal onnxruntime-web`
2. Собрать небольшой web-бандл (vite/rollup) в один файл
3. Положить результат в `assets/html/` и грузить локально.

План сборки можно сделать отдельным скриптом в `scripts/` (без нативных модулей).

#### HTML страница с @imgly

```html
<!-- assets/html/background-remover.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Background Remover</title>
    <!-- Best practice: load local bundled JS instead of esm.sh -->
    <!-- <script src="./bg-remover.bundle.js"></script> -->

    <script type="module">
      // Prototype-only option (requires network):
      import imglyRemoveBackground from 'https://esm.sh/@imgly/background-removal@1.7.0';

      let pendingChunks = [];
      let expectedChunks = 0;
      let isProcessing = false;

      async function run(base64Image) {
        try {
          if (isProcessing) return;
          isProcessing = true;

          // Send progress updates
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              type: 'progress',
              message: 'Loading model...',
            }),
          );

          // Convert base64 to blob
          const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
          const blob = await response.blob();

          // Process
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              type: 'progress',
              message: 'Processing image...',
            }),
          );

          const resultBlob = await imglyRemoveBackground(blob, {
            // Best practice for mobile: start with smaller quantized model
            model: 'isnet_quint8',
            progress: (key, current, total) => {
              window.ReactNativeWebView?.postMessage(
                JSON.stringify({
                  type: 'download_progress',
                  key,
                  current,
                  total,
                }),
              );
            },
          });

          // Convert result to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Result = reader.result.split(',')[1];
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({
                type: 'result',
                base64: base64Result,
              }),
            );
          };
          reader.readAsDataURL(resultBlob);
        } catch (error) {
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              type: 'error',
              message: error.message,
            }),
          );
        } finally {
          isProcessing = false;
        }
      }

      // RN -> WebView messages
      window.addEventListener('message', async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'process') {
            await run(msg.base64);
          }

          // Optional: chunked transfer for huge base64
          if (msg.type === 'process_chunk') {
            expectedChunks = msg.total;
            pendingChunks[msg.index] = msg.chunk;
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({
                type: 'chunk_ack',
                index: msg.index,
              }),
            );

            const received = pendingChunks.filter(Boolean).length;
            if (received === expectedChunks) {
              const joined = pendingChunks.join('');
              pendingChunks = [];
              expectedChunks = 0;
              await run(joined);
            }
          }
        } catch (_) {
          // ignore
        }
      });

      // Signal ready
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));
    </script>
  </head>
  <body>
    <div id="status">Initializing...</div>
  </body>
</html>
```

#### React Native WebView Component

```typescript
// components/common/WebViewBackgroundRemover.tsx

import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface Props {
  imageUri: string;
  onComplete: (resultUri: string) => void;
  onError: (error: string) => void;
  onProgress?: (message: string) => void;
}

export function WebViewBackgroundRemover({
  imageUri,
  onComplete,
  onError,
  onProgress,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState('Loading...');

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'ready':
          setIsReady(true);
          break;

        case 'progress':
          setStatus(data.message);
          onProgress?.(data.message);
          break;

        case 'download_progress':
          const percent = Math.round((data.current / data.total) * 100);
          setStatus(`Downloading model: ${percent}%`);
          break;

        case 'result':
          // Save result to file
          const outputPath = `${FileSystem.cacheDirectory}imgly_${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(outputPath, data.base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          onComplete(outputPath);
          break;

        case 'error':
          onError(data.message);
          break;
      }
    } catch (err) {
      onError('Failed to parse WebView message');
    }
  }, [onComplete, onError, onProgress]);

  const processImage = async () => {
    try {
      // Best practice: downscale + base64 in one step
      const prepared = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1280 } }],
        { compress: 0.9, format: SaveFormat.JPEG, base64: true }
      );

      if (!prepared.base64) {
        onError('Failed to prepare image for segmentation');
        return;
      }

      // Send to WebView via postMessage (avoid injectJavaScript with huge strings)
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'process',
        base64: prepared.base64,
      }));
    } catch (err) {
      onError('Failed to read image');
    }
  };

  // HTML source - in production, host this or bundle it
  const htmlSource = require('../../assets/html/background-remover.html');

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <WebView
        ref={webViewRef}
        source={htmlSource}
        onMessage={handleMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        // Android: needed when loading local HTML that fetches remote assets
        // (can be removed when assets are bundled locally)
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        style={styles.webView}
        // Hide WebView visually
        containerStyle={styles.hiddenWebView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  webView: {
    flex: 1,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
});
```

### 4. Unified Background Remover Service

```typescript
// services/wardrobe/backgroundRemover.ts

import { removeBgService } from './removeBgService';
import { rembgService } from './rembgService';
import { Platform } from 'react-native';

export type BackgroundRemovalMethod =
  | 'webview' // WebView + ML (primary)
  | 'removebg' // Remove.bg API
  | 'rembg' // Self-hosted rembg
  | 'auto'; // Try in order

interface RemovalResult {
  outputUri: string;
  method: BackgroundRemovalMethod;
  processingTimeMs: number;
}

interface RemovalOptions {
  method?: BackgroundRemovalMethod;
  onProgress?: (message: string) => void;
}

class BackgroundRemoverService {
  /**
   * Remove background from image using best available method
   */
  async removeBackground(imageUri: string, options: RemovalOptions = {}): Promise<RemovalResult> {
    const { method = 'auto', onProgress } = options;
    const startTime = Date.now();

    if (method !== 'auto') {
      return this.removeWithMethod(imageUri, method, onProgress, startTime);
    }

    // Auto: try methods in order of preference
    const errors: string[] = [];

    // 1. WebView is PRIMARY but requires UI (component). In service form we cannot run it.
    // Contract:
    // - removeBackground() is for non-UI methods
    // - WebView method is executed via WebViewBackgroundRemover component
    // If you want strict "auto" including WebView, expose a higher-level helper that
    // decides whether to open the WebView flow.

    // 2. Try Remove.bg (fallback)
    if (removeBgService.isConfigured()) {
      try {
        onProgress?.('Using Remove.bg API...');
        const result = await removeBgService.removeBackground(imageUri);
        return {
          outputUri: result.outputUri,
          method: 'removebg',
          processingTimeMs: Date.now() - startTime,
        };
      } catch (err: any) {
        console.warn('[BackgroundRemover] Remove.bg failed:', err.message);
        errors.push(`Remove.bg: ${err.message}`);

        // Don't fallback if it's a credits issue - user should know
        if (err.message === 'INSUFFICIENT_CREDITS') {
          throw new Error('Remove.bg credits exhausted. Use WebView flow or add credits.');
        }
      }
    }

    // 3. Try self-hosted rembg
    if (rembgService.isConfigured()) {
      try {
        onProgress?.('Using rembg server...');
        const isHealthy = await rembgService.checkHealth();
        if (isHealthy) {
          const outputUri = await rembgService.removeBackground(imageUri);
          return {
            outputUri,
            method: 'rembg',
            processingTimeMs: Date.now() - startTime,
          };
        }
      } catch (err: any) {
        console.warn('[BackgroundRemover] Rembg failed:', err.message);
        errors.push(`Rembg: ${err.message}`);
      }
    }

    // WebView primary is handled outside this service
    throw new Error(`No non-UI methods available. Use WebView flow. Errors: ${errors.join('; ')}`);
  }

  private async removeWithMethod(
    imageUri: string,
    method: BackgroundRemovalMethod,
    onProgress?: (msg: string) => void,
    startTime: number = Date.now(),
  ): Promise<RemovalResult> {
    switch (method) {
      case 'removebg':
        const rbResult = await removeBgService.removeBackground(imageUri);
        return {
          outputUri: rbResult.outputUri,
          method: 'removebg',
          processingTimeMs: Date.now() - startTime,
        };

      case 'rembg':
        const rembgUri = await rembgService.removeBackground(imageUri);
        return {
          outputUri: rembgUri,
          method: 'rembg',
          processingTimeMs: Date.now() - startTime,
        };

      case 'webview':
        throw new Error('WebView method requires UI component');

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Check which methods are available
   */
  getAvailableMethods(): BackgroundRemovalMethod[] {
    const methods: BackgroundRemovalMethod[] = [];

    // WebView is always available if react-native-webview is installed
    methods.push('webview');

    if (removeBgService.isConfigured()) {
      methods.push('removebg');
    }

    if (rembgService.isConfigured()) {
      methods.push('rembg');
    }

    return methods;
  }

  /**
   * Check if any method is available
   */
  isAvailable(): boolean {
    return this.getAvailableMethods().length > 0;
  }
}

export const backgroundRemoverService = new BackgroundRemoverService();
```

---

## ⚙️ Конфигурация

### Environment Variables

```bash
# .env

# Remove.bg API (primary)
EXPO_PUBLIC_REMOVEBG_API_KEY=your_removebg_api_key

# Self-hosted rembg (backup)
EXPO_PUBLIC_REMBG_API_URL=https://rembg.yourdomain.com

# Legacy Pixian (disabled)
# EXPO_PUBLIC_PIXIAN_API_ID=
# EXPO_PUBLIC_PIXIAN_API_SECRET=
```

### Config Update

```typescript
// config/env.ts

export const REMOVEBG_API_KEY = process.env.EXPO_PUBLIC_REMOVEBG_API_KEY || '';
export const REMBG_API_URL = process.env.EXPO_PUBLIC_REMBG_API_URL || '';

// Legacy
export const PIXIAN_API_ID = process.env.EXPO_PUBLIC_PIXIAN_API_ID || '';
export const PIXIAN_API_SECRET = process.env.EXPO_PUBLIC_PIXIAN_API_SECRET || '';
```

---

## 📅 План реализации

### Этап 1: Remove.bg Integration (1 день)

- [x] Зарегистрировать аккаунт Remove.bg
- [ ] Получить API ключ
- [ ] Создать `removeBgService.ts`
- [ ] Добавить в env
- [ ] Тестирование

### Этап 2: Unified Service (0.5 дня)

- [ ] Создать `backgroundRemover.ts` с multi-provider логикой
- [ ] Обновить `add-item.tsx` для использования нового сервиса
- [ ] Добавить UI для выбора метода (опционально)

### Этап 3: Self-hosted rembg (1-2 дня)

- [ ] Развернуть Docker на VPS
- [ ] Настроить HTTPS
- [ ] Добавить `rembgService.ts`
- [ ] Тестирование

### Этап 4: WebView Fallback (1-2 дня)

- [ ] Создать HTML с @imgly
- [ ] Создать `WebViewBackgroundRemover` компонент
- [ ] Интегрировать в flow
- [ ] Тестирование (online first-run и offline after-cache)

---

## 💰 Стоимость

| Компонент       | Стоимость          | Примечание             |
| --------------- | ------------------ | ---------------------- |
| Remove.bg       | $0 первые 50/month | Потом $0.20-0.40/image |
| Self-hosted VPS | ~$5-10/month       | Contabo/Hetzner        |
| WebView @imgly  | $0                 | AGPL лицензия          |

**Рекомендация для MVP:**

1. Использовать Remove.bg (50 free calls достаточно для тестирования)
2. После запуска — добавить self-hosted rembg
3. Remove.bg/self-hosted как fallback

---

## ⚠️ Ограничения и Known Issues

1. **Remove.bg лимит**: 50 бесплатных вызовов/месяц, потом платно
2. **WebView производительность**: Первая загрузка модели ~80MB, потом кэшируется
3. **WebView memory**: На старых устройствах может быть OOM при больших изображениях
4. **Self-hosted latency**: Зависит от расположения сервера

---

## 🧪 Тестирование

### Чеклист

- [ ] Remove.bg работает с API ключом
- [ ] Fallback на rembg при ошибке Remove.bg
- [ ] WebView работает после прогрева кэша
- [ ] Прогресс отображается в UI
- [ ] Ошибки обрабатываются корректно
- [ ] Результат сохраняется и отображается

### Тестовые сценарии

1. **Happy path**: Remove.bg доступен → быстрый результат
2. **No credits**: Remove.bg вернул 402 → показать сообщение
3. **Network error**: Нет сети → WebView fallback
4. **Large image**: 4000x3000px → проверить memory

---

## 🔗 Ссылки

- [Remove.bg API Docs](https://www.remove.bg/api)
- [Remove.bg Pricing](https://www.remove.bg/pricing)
- [rembg GitHub](https://github.com/danielgatis/rembg)
- [@imgly/background-removal](https://www.npmjs.com/package/@imgly/background-removal)
- [react-native-webview](https://github.com/react-native-webview/react-native-webview)

---

_Документ создан: 22 декабря 2025_  
_Приоритет: Expo Go совместимость + обе платформы_
