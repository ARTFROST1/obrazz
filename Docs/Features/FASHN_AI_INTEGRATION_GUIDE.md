# 🎨 FASHN AI — Полное руководство по интеграции

> **Версия документа:** 1.0.0  
> **Дата:** 30 января 2026  
> **Цель:** Превратить Obrazz в мобильный порт FASHN.AI с полным функционалом AI-генераций

---

## 📋 Оглавление

1. [Обзор FASHN AI](#обзор-fashn-ai)
2. [Полный каталог API функций](#полный-каталог-api-функций)
3. [Ценообразование и кредиты](#ценообразование-и-кредиты)
4. [Техническая интеграция](#техническая-интеграция)
5. [TypeScript SDK](#typescript-sdk)
6. [Webhooks](#webhooks)
7. [Data Retention & Privacy](#data-retention--privacy)
8. [Best Practices](#best-practices)
9. [Маппинг функций на Obrazz](#маппинг-функций-на-obrazz)
10. [Примеры кода для Node.js Backend](#примеры-кода-для-nodejs-backend)

---

## 🎯 Обзор FASHN AI

### Что такое FASHN AI

FASHN AI — это **премиальная платформа AI для fashion-индустрии**, предоставляющая:

- Виртуальную примерку одежды
- Генерацию fashion-моделей
- Редактирование изображений
- Создание видео из статичных фото

### Ключевые преимущества для Obrazz

| Преимущество         | Описание                                                   |
| -------------------- | ---------------------------------------------------------- |
| **Pay-as-you-go**    | Гибкое ценообразование, нет обязательных пакетов           |
| **TypeScript SDK**   | Нативная интеграция для Node.js backend                    |
| **10 API endpoints** | Полный набор fashion AI функций                            |
| **Высокое качество** | State-of-the-art модели (864×1296 до 4K)                   |
| **Privacy-first**    | Данные не хранятся постоянно, не используются для обучения |
| **Webhooks**         | Асинхронные уведомления вместо polling                     |

### Lifecycle статусы endpoints

| Статус         | Описание                                        | Рекомендация                 |
| -------------- | ----------------------------------------------- | ---------------------------- |
| `stable`       | Production-ready, backwards-compatible          | ✅ Использовать в продакшене |
| `preview`      | Стабильная функциональность, возможны улучшения | ✅ Можно использовать        |
| `experimental` | WIP, возможны изменения схемы                   | ⚠️ С осторожностью           |
| `deprecated`   | Устаревший, требует миграции                    | ❌ Не использовать           |

---

## 📦 Полный каталог API функций

### 1. Virtual Try-On v1.6 ⭐ ОСНОВНОЙ

> **Model Name:** `tryon-v1.6`  
> **Lifecycle:** `stable`  
> **Credits:** 1 per image  
> **Processing Time:** 5-17 сек (зависит от mode)

**Описание:** Примерка одежды на фото человека. Flagship продукт FASHN.

#### Параметры

| Параметр             | Тип        | Обязательный | Описание                                                    |
| -------------------- | ---------- | ------------ | ----------------------------------------------------------- |
| `model_image`        | URL/base64 | ✅           | Фото человека для примерки                                  |
| `garment_image`      | URL/base64 | ✅           | Фото одежды                                                 |
| `category`           | enum       | ❌           | `auto` \| `tops` \| `bottoms` \| `one-pieces`               |
| `mode`               | enum       | ❌           | `performance` (5s) \| `balanced` (8s) \| `quality` (12-17s) |
| `segmentation_free`  | boolean    | ❌           | Прямая примерка без сегментации (default: `true`)           |
| `moderation_level`   | enum       | ❌           | `conservative` \| `permissive` \| `none`                    |
| `garment_photo_type` | enum       | ❌           | `auto` \| `flat-lay` \| `model`                             |
| `num_samples`        | int        | ❌           | 1-4 изображений за раз                                      |
| `seed`               | int        | ❌           | Для воспроизводимости (0 - 2^32-1)                          |
| `output_format`      | enum       | ❌           | `png` \| `jpeg`                                             |
| `return_base64`      | boolean    | ❌           | Вернуть base64 вместо URL                                   |

#### Особенности

- **Resolution:** 864×1296 pixels
- **Saved Models:** Можно использовать сохранённые модели: `saved:<model_name>`
- **Auto category:** Автоматическое определение типа одежды

```typescript
// Пример использования
const result = await fashn.predictions.subscribe({
  model_name: 'tryon-v1.6',
  inputs: {
    model_image: 'https://example.com/person.jpg',
    garment_image: 'https://example.com/garment.jpg',
    category: 'tops',
    mode: 'balanced',
  },
});
```

---

### 2. Try-On Max 🆕 ПРЕМИУМ

> **Model Name:** `tryon-max`  
> **Lifecycle:** `experimental`  
> **Credits:** 4 per image  
> **Processing Time:** ~50 сек

**Описание:** Премиум virtual try-on для профессиональных фотосессий и e-commerce контента. Поддерживает одежду, обувь, шляпы, украшения, сумки.

#### Параметры

| Параметр        | Тип        | Обязательный | Описание                                       |
| --------------- | ---------- | ------------ | ---------------------------------------------- |
| `product_image` | URL/base64 | ✅           | Фото продукта (одежда, аксессуары)             |
| `model_image`   | URL/base64 | ✅           | Фото человека                                  |
| `prompt`        | string     | ❌           | Инструкции: "tuck in shirt", "roll up sleeves" |
| `num_images`    | int        | ❌           | 1-4                                            |
| `seed`          | int        | ❌           | Для воспроизводимости                          |

#### Особенности

- **Resolution:** до 4K
- **Prompt support:** Можно управлять стилем примерки
- **Premium quality:** Лучшее качество для публикации

---

### 3. Product to Model 🔥 DUAL-MODE

> **Model Name:** `product-to-model`  
> **Lifecycle:** `preview`  
> **Credits:** 1 per image (4 с face_reference)  
> **Processing Time:** ~12 сек

**Описание:** Превращает фото продукта в человека, носящего этот продукт. Два режима: генерация нового человека или примерка на существующего.

#### Параметры

| Параметр               | Тип        | Обязательный | Описание                                                        |
| ---------------------- | ---------- | ------------ | --------------------------------------------------------------- |
| `product_image`        | URL/base64 | ✅           | Фото продукта                                                   |
| `model_image`          | URL/base64 | ❌           | Фото человека (try-on mode)                                     |
| `image_prompt`         | URL/base64 | ❌           | Reference для позы/окружения                                    |
| `face_reference`       | URL/base64 | ❌           | Reference лица (+3 credits)                                     |
| `face_reference_mode`  | enum       | ❌           | `match_base` \| `match_reference`                               |
| `prompt`               | string     | ❌           | "man with tattoos", "studio background"                         |
| `aspect_ratio`         | string     | ❌           | `1:1`, `3:4`, `4:3`, `9:16`, `16:9`, `2:3`, `3:2`, `4:5`, `5:4` |
| `resolution`           | enum       | ❌           | `1k` \| `4k`                                                    |
| `background_reference` | URL/base64 | ❌           | Фон для генерации                                               |

#### Особенности

- **Dual-mode:** С `model_image` = try-on, без = генерация нового человека
- **Face consistency:** `face_reference` для консистентных фотосессий
- **Background control:** Можно задавать фон отдельно

---

### 4. Face to Model 🎭

> **Model Name:** `face-to-model`  
> **Lifecycle:** `experimental`  
> **Credits:** 1 per image  
> **Processing Time:** ~12 сек

**Описание:** Превращает селфи/портрет в upper-body аватар для virtual try-on. Решает проблему, когда у пользователя нет full-body фото.

#### Параметры

| Параметр       | Тип        | Обязательный | Описание                           |
| -------------- | ---------- | ------------ | ---------------------------------- |
| `face_image`   | URL/base64 | ✅           | Селфи или портрет                  |
| `prompt`       | string     | ❌           | "athletic build", "curvy figure"   |
| `aspect_ratio` | string     | ❌           | `1:1`, `4:5`, `3:4`, `2:3`, `9:16` |
| `seed`         | int        | ❌           | Для воспроизводимости              |

#### Use Cases для Obrazz

- Пользователь загружает селфи → получает try-on ready аватар
- Решение для пользователей без полноростовых фото

---

### 5. Model Create ✨ ГЕНЕРАЦИЯ МОДЕЛЕЙ

> **Model Name:** `model-create`  
> **Lifecycle:** `experimental`  
> **Credits:** 1 per image (4 с face_reference)  
> **Processing Time:** ~12 сек

**Описание:** Генерация реалистичных fashion-моделей по текстовому описанию или reference изображению.

#### Параметры

| Параметр              | Тип        | Обязательный | Описание                                                                |
| --------------------- | ---------- | ------------ | ----------------------------------------------------------------------- |
| `prompt`              | string     | ✅           | "Full body shot, woman wearing white t-shirt"                           |
| `image_reference`     | URL/base64 | ❌           | Reference для позы/композиции                                           |
| `face_reference`      | URL/base64 | ❌           | Reference лица (+3 credits)                                             |
| `face_reference_mode` | enum       | ❌           | `match_base` \| `match_reference`                                       |
| `aspect_ratio`        | string     | ❌           | `21:9`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `4:5`, `5:4`, `1:1` |
| `resolution`          | enum       | ❌           | `1k` \| `4k`                                                            |
| `num_images`          | int        | ❌           | 1-4                                                                     |

#### Use Cases для Obrazz

- Создание виртуальных моделей для примерки из гардероба
- Генерация lookbook с одной виртуальной моделью

---

### 6. Model Swap 🔄 ЗАМЕНА МОДЕЛИ

> **Model Name:** `model-swap`  
> **Lifecycle:** `experimental`  
> **Credits:** 1 per image (4 с face_reference)  
> **Processing Time:** 10-12 сек

**Описание:** Замена identity модели (лицо, кожа, волосы) при сохранении одежды и позы.

#### Параметры

| Параметр              | Тип        | Обязательный | Описание                          |
| --------------------- | ---------- | ------------ | --------------------------------- |
| `model_image`         | URL/base64 | ✅           | Исходное фото модели              |
| `prompt`              | string     | ❌           | "Asian woman with blue hair"      |
| `face_reference`      | URL/base64 | ❌           | Reference для конкретного лица    |
| `face_reference_mode` | enum       | ❌           | `match_base` \| `match_reference` |
| `num_images`          | int        | ❌           | 1-4                               |

#### Use Cases для Obrazz

- Примерка образа на "себя" вместо стоковой модели
- Создание разнообразия в AI-образах

---

### 7. Edit ✏️ РЕДАКТИРОВАНИЕ

> **Model Name:** `edit`  
> **Lifecycle:** `experimental`  
> **Credits:** 1 per image  
> **Processing Time:** ~12 сек

**Описание:** Универсальный post-processing для изменения позы, стиля, добавления аксессуаров.

#### Параметры

| Параметр        | Тип        | Обязательный | Описание                            |
| --------------- | ---------- | ------------ | ----------------------------------- |
| `image`         | URL/base64 | ✅           | Исходное изображение                |
| `prompt`        | string     | ✅           | "turn slightly left, add black bag" |
| `mask`          | URL/base64 | ❌           | Маска для точечного редактирования  |
| `image_context` | URL/base64 | ❌           | Reference для визуального контекста |
| `resolution`    | enum       | ❌           | `1k` \| `4k`                        |

#### Use Cases для Obrazz

- Исправление результатов Product to Model
- Добавление аксессуаров к образу
- Изменение фона или освещения

---

### 8. Reframe 📐 ИЗМЕНЕНИЕ ПРОПОРЦИЙ

> **Model Name:** `reframe`  
> **Lifecycle:** `experimental`  
> **Credits:** 1 per image  
> **Processing Time:** ~12 сек

**Описание:** Умное изменение aspect ratio через expand (outpaint) или crop на основе анализа контента.

#### Параметры

| Параметр       | Тип        | Обязательный | Описание                                                                |
| -------------- | ---------- | ------------ | ----------------------------------------------------------------------- |
| `image`        | URL/base64 | ✅           | Исходное изображение                                                    |
| `aspect_ratio` | enum       | ✅           | `21:9`, `1:1`, `4:3`, `3:2`, `2:3`, `5:4`, `4:5`, `3:4`, `16:9`, `9:16` |
| `num_images`   | int        | ❌           | 1-4                                                                     |

#### Use Cases для Obrazz

- Адаптация изображений под разные форматы (Stories, Feed, Cover)
- Расширение границ фото для social media

---

### 9. Image to Video 🎬 АНИМАЦИЯ

> **Model Name:** `image-to-video`  
> **Lifecycle:** `experimental`  
> **Credits:** 1-12 (зависит от resolution и duration)  
> **Processing Time:** variable

**Описание:** Создание коротких видео из статичного изображения с движением камеры и модели.

#### Параметры

| Параметр     | Тип        | Обязательный | Описание                     |
| ------------ | ---------- | ------------ | ---------------------------- |
| `image`      | URL/base64 | ✅           | Исходное изображение         |
| `prompt`     | string     | ❌           | "raising hand to touch face" |
| `duration`   | enum       | ❌           | `5` \| `10` секунд           |
| `resolution` | enum       | ❌           | `480p` \| `720p` \| `1080p`  |

#### Стоимость кредитов

| Resolution | Duration 5s | Duration 10s |
| ---------- | ----------- | ------------ |
| 480p       | 1 credit    | 2 credits    |
| 720p       | 3 credits   | 6 credits    |
| 1080p      | 6 credits   | 12 credits   |

#### Use Cases для Obrazz

- Анимация AI-образов для TikTok/Reels
- Презентация образов в динамике

---

### 10. Background Remove 🖼️

> **Model Name:** `background-remove`  
> **Lifecycle:** `experimental`  
> **Credits:** 1 per image  
> **Processing Time:** 1-3 сек

**Описание:** Удаление фона с созданием прозрачного PNG.

#### Параметры

| Параметр        | Тип        | Обязательный | Описание             |
| --------------- | ---------- | ------------ | -------------------- |
| `image`         | URL/base64 | ✅           | Исходное изображение |
| `return_base64` | boolean    | ❌           | Вернуть base64       |

#### Особенности

- **Resolution:** до 4MP
- **Speed:** Самый быстрый endpoint (1-3 сек)

#### Use Cases для Obrazz

- Подготовка одежды из shopping browser
- Альтернатива Pixian.ai

---

## 💰 Ценообразование и кредиты

### Модели оплаты

#### On-Demand (Гибкий)

| Параметр      | Значение                  |
| ------------- | ------------------------- |
| Стоимость     | **$0.075** за изображение |
| Минимум       | $7.50 (100 images)        |
| Срок действия | 12 месяцев                |

#### Commitment Tiers (Подписка)

| Tier         | Цена/месяц | Включено      | Top-up скидка |
| ------------ | ---------- | ------------- | ------------- |
| **Tier I**   | $19        | 282 images    | 10% ($0.0675) |
| **Tier II**  | $249       | 4,150 images  | 20% ($0.0600) |
| **Tier III** | $1,249     | 25,594 images | 35% ($0.0488) |

#### Annual Billing

- 2 месяца бесплатно (~16.7% скидка)
- Tier I: $190/год
- Tier II: $2,490/год
- Tier III: $12,490/год

### Стоимость кредитов по endpoints

| Endpoint            | Base Cost | + Face Reference |
| ------------------- | --------- | ---------------- |
| Virtual Try-On v1.6 | 1         | —                |
| Try-On Max          | 4         | —                |
| Product to Model    | 1         | 4                |
| Face to Model       | 1         | —                |
| Model Create        | 1         | 4                |
| Model Swap          | 1         | 4                |
| Edit                | 1         | —                |
| Reframe             | 1         | —                |
| Background Remove   | 1         | —                |
| Image to Video      | 1-6       | × duration       |

### Важные правила

1. **Failures = бесплатно** — кредиты не списываются при ошибках
2. **num_images умножает** — 3 изображения = 3 кредита
3. **face_reference = ×4** — добавление face reference увеличивает стоимость в 4 раза
4. **Top-ups не истекают** при активной подписке

---

## 🔧 Техническая интеграция

### API Endpoints

| Endpoint | Method | URL                                   |
| -------- | ------ | ------------------------------------- |
| Run      | POST   | `https://api.fashn.ai/v1/run`         |
| Status   | GET    | `https://api.fashn.ai/v1/status/{id}` |
| Credits  | GET    | `https://api.fashn.ai/v1/credits`     |

### Authentication

```bash
Authorization: Bearer YOUR_API_KEY
```

API key создаётся в [Developer API Dashboard](https://app.fashn.ai/api).

### Request Pattern

Все endpoints используют единый `/v1/run` с разными `model_name`:

```json
{
  "model_name": "tryon-v1.6",
  "inputs": {
    "model_image": "https://...",
    "garment_image": "https://..."
  }
}
```

### Response Pattern

**Initial response:**

```json
{
  "id": "123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1",
  "error": null
}
```

**Status polling → Completed:**

```json
{
  "id": "123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1",
  "status": "completed",
  "output": ["https://cdn.fashn.ai/.../output_0.png"],
  "error": null
}
```

### Status Values

| Status       | Description   |
| ------------ | ------------- |
| `starting`   | Инициализация |
| `in_queue`   | В очереди     |
| `processing` | Генерация     |
| `completed`  | ✅ Готово     |
| `failed`     | ❌ Ошибка     |

### Rate Limits

| Endpoint        | Limit                   |
| --------------- | ----------------------- |
| `/v1/run`       | 50 req / 60 sec         |
| `/v1/status`    | 50 req / 10 sec         |
| `/v1/credits`   | 30 req / 10 sec         |
| **Concurrency** | 6 параллельных запросов |

---

## 📦 TypeScript SDK

### Установка

```bash
npm install fashn
```

### Инициализация

```typescript
import Fashn from 'fashn';

const client = new Fashn({
  apiKey: process.env.FASHN_API_KEY, // можно опустить, если в env
});
```

### Основные методы

#### `subscribe` — рекомендуемый метод

Автоматически: submit → poll → return result

```typescript
const result = await client.predictions.subscribe({
  model_name: 'tryon-v1.6',
  inputs: {
    model_image: 'https://example.com/person.jpg',
    garment_image: 'https://example.com/garment.jpg',
  },
});

if (result.status === 'completed') {
  console.log('Output:', result.output);
} else {
  console.error('Error:', result.error?.message);
}
```

#### `run` — только submit

```typescript
const response = await client.predictions.run({
  model_name: "tryon-v1.6",
  inputs: { ... }
});
console.log("Prediction ID:", response.id);
```

#### `status` — проверка статуса

```typescript
const status = await client.predictions.status('9dafef71-6e90-4bc9-ac05-d0d97c612722');
console.log('Status:', status.status);
```

### Error Handling

```typescript
import Fashn from "fashn";

try {
  const response = await client.predictions.subscribe({
    model_name: "tryon-v1.6",
    inputs: { ... }
  });

  // 1. Runtime Errors (during model execution)
  if (response.status !== "completed") {
    console.error("Runtime Error:", response.status);
    console.error("Message:", response.error?.message);
    return;
  }

  // 2. Success
  console.log("Output:", response.output);

} catch (error) {
  // 3. API-Level Errors (before processing)
  if (error instanceof Fashn.APIError) {
    console.error("API Error:", error.status, error.message);
  } else {
    console.error("Network error:", error);
  }
}
```

### Типы ошибок

| Тип           | Когда возникает                     | Как обрабатывать               |
| ------------- | ----------------------------------- | ------------------------------ |
| **API-Level** | До начала обработки (401, 429, 400) | `catch (error)`                |
| **Runtime**   | Во время генерации                  | `response.status === "failed"` |

---

## 🔔 Webhooks

### Использование

```bash
POST https://api.fashn.ai/v1/run?webhook_url=https://your-server.com/webhook
```

### Payload

**Success:**

```json
{
  "id": "123a87r9-...",
  "status": "completed",
  "output": ["https://cdn.fashn.ai/.../output_0.png"],
  "error": null
}
```

**Error:**

```json
{
  "id": "123a87r9-...",
  "status": "failed",
  "error": {
    "name": "ImageLoadError",
    "message": "Error loading model image..."
  }
}
```

### Retry механизм

- До 5 повторных попыток
- В течение ~5 минут
- Если endpoint возвращает non-2xx

### Best Practices

1. **Idempotency** — обрабатывать дубликаты
2. **Quick response** — отвечать 2xx быстро, обрабатывать async
3. **Verification** — верифицировать источник запроса
4. **Monitoring** — мониторить failed webhooks

---

## 🔐 Data Retention & Privacy

### Что FASHN хранит

| Данные                 | Хранится                    |
| ---------------------- | --------------------------- |
| Request metadata       | ✅                          |
| Image URLs             | ✅ (но не сами изображения) |
| Base64 placeholders    | ✅ (`<base64>`)             |
| Input images           | ❌                          |
| Output images (CDN)    | 72 часа                     |
| Output images (base64) | 60 минут                    |

### Privacy-первый подход

1. **Данные НЕ используются для обучения**
2. **CDN URLs истекают через 72 часа**
3. **base64 outputs — 60 минут в памяти**

### Privacy-enhanced options

| Опция                 | Эффект                                     |
| --------------------- | ------------------------------------------ |
| `return_base64: true` | Outputs не сохраняются на CDN              |
| Expiring URLs         | URLs становятся недоступны после истечения |

### Рекомендации

```typescript
// Максимальная приватность
{
  model_image: "data:image/jpeg;base64,...",  // base64 input
  garment_image: "data:image/jpeg;base64,...",
  return_base64: true  // base64 output
}

// Баланс privacy/performance
{
  model_image: "https://cdn.com/signed-url?expires=...",  // expiring URL
  garment_image: "https://cdn.com/signed-url?expires=...",
  return_base64: true
}
```

---

## 🏆 Best Practices

### Image Quality

1. **Model images:**
   - Full-body, хорошее освещение
   - Нейтральная поза
   - Минимум occlusions

2. **Garment images:**
   - Flat-lay или ghost mannequin лучше всего
   - On-model тоже работает
   - Чистый фон предпочтителен

### Performance Optimization

```typescript
// Быстрое тестирование
mode: 'performance'; // 5 сек

// Финальный результат
mode: 'quality'; // 12-17 сек
```

### Seed Usage

```typescript
// Воспроизводимость
seed: 42; // всегда одинаковый результат

// Вариации
seed: Math.floor(Math.random() * 2 ** 32); // разные результаты
```

### num_samples Tip

```typescript
// Быстро найти хороший результат
{
  num_samples: 4,
  mode: "performance"
}
```

---

## 📱 Маппинг функций на Obrazz

### Полный функционал

| FASHN Function          | Obrazz Feature                | Priority          |
| ----------------------- | ----------------------------- | ----------------- |
| **Virtual Try-On v1.6** | Примерка вещей из гардероба   | ⭐ HIGH           |
| **Face to Model**       | Создание аватара из селфи     | ⭐ HIGH           |
| **Product to Model**    | Показ вещи на модели          | ⭐ HIGH           |
| **Model Swap**          | "Примерь на себя"             | MEDIUM            |
| **Edit**                | Редактирование AI-образов     | MEDIUM            |
| **Reframe**             | Адаптация под Stories/Feed    | LOW               |
| **Image to Video**      | Анимация образов              | LOW               |
| **Background Remove**   | Подготовка вещей              | LOW (есть Pixian) |
| Try-On Max              | Premium примерка              | FUTURE            |
| Model Create            | Генерация виртуальных моделей | FUTURE            |

### User Journey в Obrazz

```
1. Пользователь загружает селфи
   → Face to Model → создаём try-on ready аватар

2. Пользователь выбирает вещь из гардероба
   → Virtual Try-On v1.6 → примерка на аватар

3. Пользователь недоволен результатом
   → Edit → исправляем позу/стиль

4. Пользователь хочет видео
   → Image to Video → анимируем результат

5. Пользователь хочет для Stories
   → Reframe → меняем aspect ratio на 9:16
```

### Feature Mapping Table

| Obrazz Screen      | FASHN Endpoints    | Flow                          |
| ------------------ | ------------------ | ----------------------------- |
| **My Avatar**      | `face-to-model`    | Селфи → Avatar                |
| **Virtual Try-On** | `tryon-v1.6`       | Avatar + Garment → Result     |
| **AI Outfit**      | `product-to-model` | Outfit → Model wearing outfit |
| **Edit Result**    | `edit`             | Result → Refined result       |
| **Make Video**     | `image-to-video`   | Result → 5-10s video          |
| **For Stories**    | `reframe`          | Result → 9:16                 |
| **"Try on Me"**    | `model-swap`       | Result → User's face          |

---

## 💻 Примеры кода для Node.js Backend

### FashnService.ts

```typescript
// src/services/ai/fashn.service.ts
import Fashn from 'fashn';

const client = new Fashn({
  apiKey: process.env.FASHN_API_KEY!,
});

export interface TryOnParams {
  modelImage: string;
  garmentImage: string;
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  mode?: 'performance' | 'balanced' | 'quality';
  numSamples?: number;
  returnBase64?: boolean;
}

export interface FaceToModelParams {
  faceImage: string;
  prompt?: string;
  aspectRatio?: string;
}

export interface ProductToModelParams {
  productImage: string;
  modelImage?: string;
  faceReference?: string;
  prompt?: string;
  aspectRatio?: string;
  resolution?: '1k' | '4k';
}

export interface EditParams {
  image: string;
  prompt: string;
  mask?: string;
  resolution?: '1k' | '4k';
}

export interface ReframeParams {
  image: string;
  aspectRatio: string;
}

export interface ImageToVideoParams {
  image: string;
  prompt?: string;
  duration?: 5 | 10;
  resolution?: '480p' | '720p' | '1080p';
}

export class FashnService {
  // =====================
  // VIRTUAL TRY-ON
  // =====================

  async virtualTryOn(params: TryOnParams) {
    const result = await client.predictions.subscribe({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: params.modelImage,
        garment_image: params.garmentImage,
        category: params.category || 'auto',
        mode: params.mode || 'balanced',
        num_samples: params.numSamples || 1,
        return_base64: params.returnBase64 || false,
        output_format: 'jpeg',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // FACE TO MODEL
  // =====================

  async faceToModel(params: FaceToModelParams) {
    const result = await client.predictions.subscribe({
      model_name: 'face-to-model',
      inputs: {
        face_image: params.faceImage,
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio || '2:3',
        output_format: 'jpeg',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // PRODUCT TO MODEL
  // =====================

  async productToModel(params: ProductToModelParams) {
    const result = await client.predictions.subscribe({
      model_name: 'product-to-model',
      inputs: {
        product_image: params.productImage,
        model_image: params.modelImage,
        face_reference: params.faceReference,
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        resolution: params.resolution || '1k',
        output_format: 'jpeg',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // MODEL SWAP
  // =====================

  async modelSwap(params: { modelImage: string; faceReference?: string; prompt?: string }) {
    const result = await client.predictions.subscribe({
      model_name: 'model-swap',
      inputs: {
        model_image: params.modelImage,
        face_reference: params.faceReference,
        prompt: params.prompt,
        output_format: 'jpeg',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // EDIT
  // =====================

  async editImage(params: EditParams) {
    const result = await client.predictions.subscribe({
      model_name: 'edit',
      inputs: {
        image: params.image,
        prompt: params.prompt,
        mask: params.mask,
        resolution: params.resolution || '1k',
        output_format: 'jpeg',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // REFRAME
  // =====================

  async reframe(params: ReframeParams) {
    const result = await client.predictions.subscribe({
      model_name: 'reframe',
      inputs: {
        image: params.image,
        aspect_ratio: params.aspectRatio,
        output_format: 'jpeg',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // IMAGE TO VIDEO
  // =====================

  async imageToVideo(params: ImageToVideoParams) {
    const result = await client.predictions.subscribe({
      model_name: 'image-to-video',
      inputs: {
        image: params.image,
        prompt: params.prompt,
        duration: params.duration || 5,
        resolution: params.resolution || '720p',
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // BACKGROUND REMOVE
  // =====================

  async removeBackground(image: string, returnBase64 = false) {
    const result = await client.predictions.subscribe({
      model_name: 'background-remove',
      inputs: {
        image,
        return_base64: returnBase64,
      },
    });

    return this.handleResult(result);
  }

  // =====================
  // CREDITS
  // =====================

  async getCredits() {
    const response = await fetch('https://api.fashn.ai/v1/credits', {
      headers: {
        Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
      },
    });
    return response.json();
  }

  // =====================
  // HELPER
  // =====================

  private handleResult(result: any) {
    if (result.status === 'completed') {
      return {
        success: true,
        output: result.output,
        id: result.id,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Generation failed',
        status: result.status,
        id: result.id,
      };
    }
  }
}

export const fashnService = new FashnService();
```

### Hono Routes

```typescript
// src/routes/ai.routes.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { fashnService } from '../services/ai/fashn.service';
import { tokenBalanceService } from '../services/tokens/balance.service';

const ai = new Hono();

ai.use('/*', authMiddleware);

// Credits для каждого endpoint
const CREDIT_COSTS = {
  'virtual-try-on': 1,
  'face-to-model': 1,
  'product-to-model': 1, // +3 с face_reference
  'model-swap': 1, // +3 с face_reference
  edit: 1,
  reframe: 1,
  'background-remove': 1,
  'image-to-video': {
    '480p-5': 1,
    '480p-10': 2,
    '720p-5': 3,
    '720p-10': 6,
    '1080p-5': 6,
    '1080p-10': 12,
  },
};

// Virtual Try-On
ai.post('/virtual-try-on', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const cost = CREDIT_COSTS['virtual-try-on'] * (body.numSamples || 1);

  // Check balance
  const balance = await tokenBalanceService.getBalance(supabase, user.id);
  if (balance < cost) {
    return c.json({ error: 'Insufficient tokens', required: cost, available: balance }, 402);
  }

  // Create generation record
  const { data: generation } = await supabase
    .from('ai_generations')
    .insert({
      user_id: user.id,
      generation_type: 'virtual_try_on',
      status: 'pending',
      tokens_cost: cost,
      input_params: body,
    })
    .select()
    .single();

  // Debit tokens
  await tokenBalanceService.debit(supabase, user.id, cost, generation.id);

  // Call FASHN
  const result = await fashnService.virtualTryOn({
    modelImage: body.modelImage,
    garmentImage: body.garmentImage,
    category: body.category,
    mode: body.mode,
    numSamples: body.numSamples,
  });

  // Update generation
  await supabase
    .from('ai_generations')
    .update({
      status: result.success ? 'completed' : 'failed',
      output_image_urls: result.output,
      error_message: result.error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', generation.id);

  if (!result.success) {
    // Refund tokens on failure
    await tokenBalanceService.credit(supabase, user.id, cost, 'refund', generation.id);
  }

  return c.json({
    id: generation.id,
    status: result.success ? 'completed' : 'failed',
    output: result.output,
    error: result.error,
  });
});

// Face to Model
ai.post('/face-to-model', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const cost = CREDIT_COSTS['face-to-model'];

  const balance = await tokenBalanceService.getBalance(supabase, user.id);
  if (balance < cost) {
    return c.json({ error: 'Insufficient tokens' }, 402);
  }

  const { data: generation } = await supabase
    .from('ai_generations')
    .insert({
      user_id: user.id,
      generation_type: 'face_to_model',
      status: 'pending',
      tokens_cost: cost,
      input_params: body,
    })
    .select()
    .single();

  await tokenBalanceService.debit(supabase, user.id, cost, generation.id);

  const result = await fashnService.faceToModel({
    faceImage: body.faceImage,
    prompt: body.prompt,
    aspectRatio: body.aspectRatio,
  });

  await supabase
    .from('ai_generations')
    .update({
      status: result.success ? 'completed' : 'failed',
      output_image_urls: result.output,
      error_message: result.error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', generation.id);

  if (!result.success) {
    await tokenBalanceService.credit(supabase, user.id, cost, 'refund', generation.id);
  }

  return c.json({
    id: generation.id,
    status: result.success ? 'completed' : 'failed',
    output: result.output,
    error: result.error,
  });
});

// Product to Model
ai.post('/product-to-model', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  // +3 credits если есть face_reference
  const cost = body.faceReference
    ? CREDIT_COSTS['product-to-model'] + 3
    : CREDIT_COSTS['product-to-model'];

  const balance = await tokenBalanceService.getBalance(supabase, user.id);
  if (balance < cost) {
    return c.json({ error: 'Insufficient tokens', required: cost }, 402);
  }

  const { data: generation } = await supabase
    .from('ai_generations')
    .insert({
      user_id: user.id,
      generation_type: 'product_to_model',
      status: 'pending',
      tokens_cost: cost,
      input_params: body,
    })
    .select()
    .single();

  await tokenBalanceService.debit(supabase, user.id, cost, generation.id);

  const result = await fashnService.productToModel({
    productImage: body.productImage,
    modelImage: body.modelImage,
    faceReference: body.faceReference,
    prompt: body.prompt,
    aspectRatio: body.aspectRatio,
    resolution: body.resolution,
  });

  await supabase
    .from('ai_generations')
    .update({
      status: result.success ? 'completed' : 'failed',
      output_image_urls: result.output,
      error_message: result.error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', generation.id);

  if (!result.success) {
    await tokenBalanceService.credit(supabase, user.id, cost, 'refund', generation.id);
  }

  return c.json({
    id: generation.id,
    status: result.success ? 'completed' : 'failed',
    output: result.output,
  });
});

// ... аналогично для остальных endpoints

export default ai;
```

---

## 📚 Полезные ссылки

| Ресурс         | URL                                              |
| -------------- | ------------------------------------------------ |
| Documentation  | https://docs.fashn.ai                            |
| API Dashboard  | https://app.fashn.ai/api                         |
| Pricing        | https://fashn.ai/pricing#api                     |
| API Status     | https://status.fashn.ai                          |
| Changelog      | https://fashn.ai/changelog                       |
| Discord        | https://discord.gg/MCs39Gf4yn                    |
| TypeScript SDK | https://github.com/fashn-AI/fashn-typescript-sdk |
| Python SDK     | https://github.com/fashn-AI/fashn-python-sdk     |

---

## ✅ Checklist интеграции

### Подготовка

- [ ] Создать аккаунт на FASHN
- [ ] Получить API key
- [ ] Пополнить баланс ($7.50 минимум)
- [ ] Установить `fashn` npm package

### Backend

- [ ] Создать FashnService
- [ ] Интегрировать с токеновой системой
- [ ] Настроить webhooks (опционально)
- [ ] Добавить error handling
- [ ] Добавить refund logic при failures

### Mobile App

- [ ] UI для Virtual Try-On
- [ ] UI для Face to Model (создание аватара)
- [ ] UI для Product to Model
- [ ] Галерея генераций
- [ ] Показ баланса токенов

### Privacy

- [ ] Использовать expiring URLs для user photos
- [ ] Настроить `return_base64: true` для sensitive data
- [ ] Не хранить outputs дольше необходимого

---

**Документ создан:** 30 января 2026  
**Последнее обновление:** 30 января 2026  
**Версия:** 1.0.0
