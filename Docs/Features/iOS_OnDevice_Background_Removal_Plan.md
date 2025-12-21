# iOS On-Device Background Removal - Detailed Implementation Plan

> **Цель:** Реализовать удаление фона на устройстве (без сети) для iOS, используя системный Vision/VisionKit Framework.  
> **Платформа:** iOS 16+ (subject lifting), iOS 17+ (улучшения)  
> **Expo совместимость:** Через Expo Modules API (native Swift модуль)  
> **Android:** Отложено на следующий этап (отдельное решение)

---

## ✅ Важные ограничения (иначе «не заведётся»)

### 1) Это НЕ будет работать в Expo Go

Любой нативный модуль (Expo Modules API) требует **dev client** или **prebuild** + сборку приложения.

Минимальный рабочий путь:

- `npx expo prebuild -p ios` (если ещё не делали)
- `npx expo run:ios` (локально через Xcode) **или** `eas build --profile development --platform ios`

### 2) Входной `imageUri` должен быть читаем нативно

Лучше всего: `file://...` путь к файлу в песочнице приложения.

Проблемные схемы:

- `ph://` (Photos) — требует отдельной загрузки через Photos.framework
- `assets-library://` — устаревшее
- `content://` (обычно Android)

Best practice для стабильности: **на JS-стороне гарантировать `file://`** (копировать в cache) перед вызовом нативного метода.

---

## 📋 Executive Summary

### Что мы строим

Локальный модуль Expo (`modules/subject-lifter/`), который:

1. Принимает путь к изображению (file URI)
2. Вызывает iOS VisionKit/Vision для выделения subject(ов)
3. Возвращает путь к PNG с прозрачным фоном

### Почему это решение

| Критерий              | Pixian API                   | iOS Vision           |
| --------------------- | ---------------------------- | -------------------- |
| Работает без сети     | ❌                           | ✅                   |
| Работает в РФ без VPN | ❌ (заблокирован/нестабилен) | ✅                   |
| Бесплатно             | Нужны credits                | ✅                   |
| Скорость              | 2-10 сек (сеть)              | 0.5-2 сек (локально) |
| Качество              | Отличное                     | Хорошее (Apple ML)   |
| iOS требование        | -                            | iOS 16+              |

---

## 🔍 Анализ Apple Vision API

### Два подхода Apple предоставляет

#### 1. VisionKit (высокоуровневый, iOS 16+)

```swift
import VisionKit

// Анализ изображения
let analyzer = ImageAnalyzer()
let analysis = try await analyzer.analyze(image, configuration: config)

// Получение subjects
let subjects = await analysis.subjects

// Получение изображения с прозрачным фоном
let maskedImage = try await analysis.image(for: subjects)
```

Примечания:

- В реальном коде `analysis.image(for:)` обычно возвращает `CGImage` (который затем оборачивается в `UIImage`).
- Конфигурацию анализа нужно выбрать так, чтобы subjects реально вычислялись; в WWDC-потоке это связано с visual lookup/subject lifting. Перед финальной реализацией это проверяется автокомплитом Xcode (точные флаги могут отличаться).

**Плюсы:**

- Простой API
- Готовый UI для интерактивного выделения (не нужен нам)
- Выделяет любые foreground объекты (не только людей!)

**Минусы:**

- Ограничение на размер изображения (out-of-process)
- iOS 16+ обязательно

#### 2. Vision Framework (низкоуровневый, iOS 17+)

```swift
import Vision

// Создание запроса
let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cgImage)
try handler.perform([request])

// Получение маски
guard let result = request.results?.first else { return }
let mask = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)

// Применение маски через CoreImage
let ciMask = CIImage(cvPixelBuffer: mask)
let blended = CIFilter(name: "CIBlendWithMask")!
// ... compositing
```

Примечания:

- Этот кусок — **псевдо-код по мотивам доков/WWDC**. Реальные сигнатуры `VNInstanceMaskObservation` лучше сверить по автокомплиту Xcode при имплементации (Apple иногда меняет названия методов/аргументы между бета/релизами).

**Плюсы:**

- Полный контроль над процессом
- Работа с HDR
- Можно выделять отдельные instances

**Минусы:**

- iOS 17+ для `VNGenerateForegroundInstanceMaskRequest`
- Больше кода

### Наш выбор: VisionKit + fallback на Vision

Для максимального покрытия:

- iOS 16: используем `ImageAnalyzer` (VisionKit) — покрывает ~95% устройств
- iOS 17+: можем использовать Vision для более продвинутых сценариев

---

## 🏗️ Архитектура модуля

### Структура файлов

```
modules/
└── subject-lifter/
    ├── ios/
    │   ├── SubjectLifterModule.swift      # Expo module definition
    │   ├── SubjectLifterService.swift     # Core logic
    │   └── ImageUtils.swift               # Image loading/saving helpers
    ├── android/
    │   └── (placeholder для будущего)
    ├── src/
    │   └── index.ts                        # TypeScript API
    ├── expo-module.config.json
    └── package.json
```

### API контракт (TypeScript)

```typescript
// modules/subject-lifter/src/index.ts

export interface SubjectLifterResult {
  /** URI to the processed PNG image with transparent background */
  outputUri: string;
  /** Number of subjects detected */
  subjectCount: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Whether fallback method was used */
  usedFallback: boolean;
}

export interface SubjectLifterOptions {
  /** Whether to crop output to subject bounds. Default: false */
  cropToSubject?: boolean;
  /** Max dimension for output (preserves aspect ratio). Default: no limit */
  maxDimension?: number;
  /** Preferred processing method. Default: 'auto' */
  method?: 'auto' | 'visionkit' | 'vision';
  /** Which subject(s) to keep when multiple are detected. Default: 'largest' */
  subjectSelection?: 'largest' | 'all';
}

/**
 * Remove background from image using on-device ML
 * @param imageUri - Local file URI (file://, ph://, or content://)
 * @returns Promise with result containing output URI
 * @throws Error if no subjects detected or processing fails
 */
export function removeBackground(
  imageUri: string,
  options?: SubjectLifterOptions,
): Promise<SubjectLifterResult>;

/**
 * Check if on-device background removal is available
 * @returns true if iOS 16+ or Android with ML Kit
 */
export function isAvailable(): boolean;

/**
 * Get detailed capability info
 */
export function getCapabilities(): {
  available: boolean;
  platform: 'ios' | 'android' | 'unsupported';
  minOSVersion: string;
  currentOSVersion: string;
  supportsInstanceSegmentation: boolean;
};

/**
 * Normalize URI to a local file URI.
 * Recommended to call before removeBackground().
 */
export function ensureLocalFileUri(imageUri: string): Promise<string>;
```

---

## 📝 Детальная реализация iOS

## 📦 Установка/подключение модуля в проект

Чтобы импорт работал корректно в Metro/TypeScript, локальный модуль надо добавить как dependency:

- создать модуль через `npx create-expo-module@latest --local`
- затем установить его в корневой проект: `npm install ./modules/subject-lifter`

После этого импорт в приложении должен выглядеть как импорт пакета:

```ts
import { removeBackground, isAvailable } from 'subject-lifter';
```

А импорт через алиасы вида `@/modules/subject-lifter` лучше не использовать для нативного модуля, чтобы не упереться в отличия резолвера Metro/TS.

### 1. expo-module.config.json

```json
{
  "name": "subject-lifter",
  "platforms": ["ios", "android"],
  "ios": {
    "modules": ["SubjectLifterModule"]
  },
  "android": {
    "modules": ["expo.modules.subjectlifter.SubjectLifterModule"]
  }
}
```

### 2. SubjectLifterModule.swift

```swift
import ExpoModulesCore
import VisionKit
import Vision
import UIKit
import CoreImage

public class SubjectLifterModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectLifter")

    // Check availability
    Function("isAvailable") { () -> Bool in
      if #available(iOS 16.0, *) {
        return ImageAnalyzer.isSupported
      }
      return false
    }

    // Get capabilities
    Function("getCapabilities") { () -> [String: Any] in
      let version = UIDevice.current.systemVersion
      var available = false
      var supportsInstance = false

      if #available(iOS 17.0, *) {
        available = true
        supportsInstance = true
      } else if #available(iOS 16.0, *) {
        available = ImageAnalyzer.isSupported
        supportsInstance = false
      }

      return [
        "available": available,
        "platform": "ios",
        "minOSVersion": "16.0",
        "currentOSVersion": version,
        "supportsInstanceSegmentation": supportsInstance
      ]
    }

    // Main function - async
    AsyncFunction("removeBackground") {
      (imageUri: String, options: [String: Any]?, promise: Promise) in

      Task.detached {
        do {
          let result = try await SubjectLifterService.shared.removeBackground(
            imageUri: imageUri,
            options: options ?? [:]
          )
          promise.resolve(result)
        } catch {
          // Use structured error codes to handle UX reliably
          if let slError = error as? SubjectLifterError {
            promise.reject(slError.code, slError.localizedDescription)
          } else {
            promise.reject("E_PROCESSING_FAILED", error.localizedDescription)
          }
        }
      }
    }
  }
}
```

### 3. SubjectLifterService.swift (Core Logic)

```swift
import VisionKit
import Vision
import UIKit
import CoreImage

@available(iOS 16.0, *)
class SubjectLifterService {
  static let shared = SubjectLifterService()

  private let analyzer = ImageAnalyzer()
  private let context = CIContext()

  func removeBackground(
    imageUri: String,
    options: [String: Any]
  ) async throws -> [String: Any] {

    let startTime = CFAbsoluteTimeGetCurrent()

    // 1. Load image
    guard let image = try await loadImage(from: imageUri) else {
      throw SubjectLifterError.imageLoadFailed
    }

    // 2. Parse options
    let cropToSubject = options["cropToSubject"] as? Bool ?? false
    let maxDimension = options["maxDimension"] as? Int
    let method = options["method"] as? String ?? "auto"
    let subjectSelection = options["subjectSelection"] as? String ?? "largest"

    // 3. Normalize orientation and optionally downscale before analysis
    // Best practice: normalize image orientation to avoid rotated masks.
    let preparedImage = normalizeOrientation(image)
    let analysisImage: UIImage
    if let maxDim = maxDimension, maxDim > 0 {
      analysisImage = resizeImage(preparedImage, maxDimension: maxDim)
    } else {
      analysisImage = preparedImage
    }

    // 4. Analyze image for subjects
    // Note: конкретные флаги конфигурации подтверждаем в Xcode.
    let configuration = ImageAnalyzer.Configuration([.visualLookUp])
    let analysis = try await analyzer.analyze(analysisImage, configuration: configuration)

    // 5. Get subjects
    let subjects = await analysis.subjects
    guard !subjects.isEmpty else {
      throw SubjectLifterError.noSubjectsFound
    }

    // 5.1 Choose subject(s)
    // Best practice for wardrobe photos: default to keeping only the largest subject.
    // This avoids capturing extra objects (hands, chair, etc.) in the cutout.
    let selectedSubjects: [ImageAnalysis.Subject]
    if subjectSelection == "all" {
      selectedSubjects = subjects
    } else {
      selectedSubjects = [subjects.max(by: {
        ($0.bounds.width * $0.bounds.height) < ($1.bounds.width * $1.bounds.height)
      })!]
    }

    // 6. Generate masked image (subjects only, transparent background)
    var maskedImage: UIImage
    if #available(iOS 17.0, *), (method == "auto" || method == "vision") {
      maskedImage = try await generateMaskedImageVision(
        from: analysisImage,
        cropToSubject: cropToSubject
      )
    } else {
      // iOS 16+: VisionKit
      let cgImage = try await analysis.image(for: selectedSubjects)
      maskedImage = UIImage(cgImage: cgImage)

      // Best practice: crop by subject bounds (not by scanning alpha)
      if cropToSubject, let first = selectedSubjects.first {
        let cropRect = convertNormalizedRect(first.bounds, toPixelRectFor: cgImage)
        if let cropped = cgImage.cropping(to: cropRect) {
          maskedImage = UIImage(cgImage: cropped)
        }
      }
    }

    // 7. Save to cache directory
    // Output всегда PNG, чтобы сохранялась альфа.
    let outputUri = try saveImage(maskedImage)

    let processingTime = (CFAbsoluteTimeGetCurrent() - startTime) * 1000

    return [
      "outputUri": outputUri,
      "subjectCount": selectedSubjects.count,
      "processingTimeMs": Int(processingTime),
      "usedFallback": false
    ]
  }

  // MARK: - iOS 17+ Vision Implementation
  @available(iOS 17.0, *)
  private func generateMaskedImageVision(
    from image: UIImage,
    cropToSubject: Bool
  ) async throws -> UIImage {

    guard let cgImage = image.cgImage else {
      throw SubjectLifterError.invalidImage
    }

    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

    try handler.perform([request])

    guard let result = request.results?.first else {
      throw SubjectLifterError.noSubjectsFound
    }

    // Generate mask for all foreground instances
    let maskPixelBuffer = try result.generateScaledMaskForImage(
      forInstances: result.allInstances,
      from: handler
    )

    // Convert to CIImage for compositing
    let ciImage = CIImage(cgImage: cgImage)
    let ciMask = CIImage(cvPixelBuffer: maskPixelBuffer)

    // Apply mask using CoreImage
    guard let blendFilter = CIFilter(name: "CIBlendWithMask") else {
      throw SubjectLifterError.filterFailed
    }

    // Create transparent background (fully transparent)
    let transparentBackground = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0))
      .cropped(to: ciImage.extent)

    blendFilter.setValue(ciImage, forKey: kCIInputImageKey)
    blendFilter.setValue(transparentBackground, forKey: kCIInputBackgroundImageKey)
    blendFilter.setValue(ciMask, forKey: kCIInputMaskImageKey)

    guard let outputCIImage = blendFilter.outputImage,
          let outputCGImage = context.createCGImage(outputCIImage, from: outputCIImage.extent) else {
      throw SubjectLifterError.compositionFailed
    }

    var finalCGImage = outputCGImage

    // Crop strategy:
    // - Prefer bounds from Vision observations if available
    // - Avoid scanning alpha channel (slow + pixel format assumptions)
    // For initial implementation, cropping can be disabled on Vision path,
    // or implemented using observation bounding boxes.

    return UIImage(cgImage: finalCGImage)
  }

  // MARK: - Helpers

  private func loadImage(from uri: String) async throws -> UIImage? {
    // Handle file:// URIs
    let cleanUri = uri.replacingOccurrences(of: "file://", with: "")

    if FileManager.default.fileExists(atPath: cleanUri) {
      return UIImage(contentsOfFile: cleanUri)
    }

    // Handle other URI schemes if needed (ph://, etc.)
    if let url = URL(string: uri), let data = try? Data(contentsOf: url) {
      return UIImage(data: data)
    }

    return nil
  }

  private func saveImage(_ image: UIImage) throws -> String {
    let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
    let fileName = "subject_\(UUID().uuidString).png"
    let fileURL = cacheDir.appendingPathComponent(fileName)

    guard let pngData = image.pngData() else {
      throw SubjectLifterError.saveFailed
    }

    try pngData.write(to: fileURL)
    return fileURL.absoluteString
  }

  private func resizeImage(_ image: UIImage, maxDimension: Int) -> UIImage {
    let size = image.size
    let maxDim = CGFloat(maxDimension)

    guard size.width > maxDim || size.height > maxDim else {
      return image
    }

    let ratio = min(maxDim / size.width, maxDim / size.height)
    let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)

    UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
    image.draw(in: CGRect(origin: .zero, size: newSize))
    let resized = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return resized ?? image
  }

  private func normalizeOrientation(_ image: UIImage) -> UIImage {
    if image.imageOrientation == .up {
      return image
    }
    UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
    image.draw(in: CGRect(origin: .zero, size: image.size))
    let normalized = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    return normalized ?? image
  }

  private func convertNormalizedRect(_ rect: CGRect, toPixelRectFor image: CGImage) -> CGRect {
    // VisionKit bounds usually normalized (0..1) with origin in lower-left.
    // Convert to CoreGraphics pixel rect (origin upper-left).
    let width = CGFloat(image.width)
    let height = CGFloat(image.height)

    let x = rect.origin.x * width
    let y = (1.0 - rect.origin.y - rect.size.height) * height
    let w = rect.size.width * width
    let h = rect.size.height * height

    return CGRect(x: x, y: y, width: w, height: h).integral
  }
}

// MARK: - Errors
enum SubjectLifterError: LocalizedError {
  case imageLoadFailed
  case invalidImage
  case noSubjectsFound
  case notSupported
  case filterFailed
  case compositionFailed
  case saveFailed

  var code: String {
    switch self {
    case .imageLoadFailed: return "E_IMAGE_LOAD_FAILED"
    case .invalidImage: return "E_INVALID_IMAGE"
    case .noSubjectsFound: return "E_NO_SUBJECTS"
    case .notSupported: return "E_NOT_SUPPORTED"
    case .filterFailed: return "E_FILTER_FAILED"
    case .compositionFailed: return "E_COMPOSITION_FAILED"
    case .saveFailed: return "E_SAVE_FAILED"
    }
  }

  var errorDescription: String? {
    switch self {
    case .imageLoadFailed: return "Failed to load image from URI"
    case .invalidImage: return "Invalid image format"
    case .noSubjectsFound: return "No subjects detected in image"
    case .notSupported: return "On-device subject lifting is not supported on this OS version"
    case .filterFailed: return "CoreImage filter initialization failed"
    case .compositionFailed: return "Image composition failed"
    case .saveFailed: return "Failed to save output image"
    }
  }
}
```

### 4. TypeScript wrapper (src/index.ts)

```typescript
import { requireNativeModule } from 'expo-modules-core';
import * as FileSystem from 'expo-file-system';

const SubjectLifter = requireNativeModule('SubjectLifter');

export interface SubjectLifterResult {
  outputUri: string;
  subjectCount: number;
  processingTimeMs: number;
  usedFallback: boolean;
}

export interface SubjectLifterOptions {
  cropToSubject?: boolean;
  maxDimension?: number;
  method?: 'auto' | 'visionkit' | 'vision';
  subjectSelection?: 'largest' | 'all';
}

export interface SubjectLifterCapabilities {
  available: boolean;
  platform: 'ios' | 'android' | 'unsupported';
  minOSVersion: string;
  currentOSVersion: string;
  supportsInstanceSegmentation: boolean;
}

export function removeBackground(
  imageUri: string,
  options?: SubjectLifterOptions,
): Promise<SubjectLifterResult> {
  return SubjectLifter.removeBackground(imageUri, options ?? {});
}

export function isAvailable(): boolean {
  return SubjectLifter.isAvailable();
}

export function getCapabilities(): SubjectLifterCapabilities {
  return SubjectLifter.getCapabilities();
}

export async function ensureLocalFileUri(imageUri: string): Promise<string> {
  // If already a local file, keep it.
  if (imageUri.startsWith('file://')) {
    return imageUri;
  }

  // For iOS `ph://` and other schemes, safest approach is to copy into cache.
  // Note: `expo-file-system` cannot reliably read `ph://` directly on all setups.
  // Best practice: if you have an assetId (from ImagePicker/MediaLibrary), resolve it via
  // `MediaLibrary.getAssetInfoAsync(assetId)` and use its localUri, then copy that localUri.
  const targetUri = FileSystem.cacheDirectory + `bg-input-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: imageUri, to: targetUri });
  return targetUri;
}
```

---

## 🔄 Интеграция в приложение

### Изменения в backgroundRemover.ts

```typescript
// services/wardrobe/backgroundRemover.ts

import * as SubjectLifter from 'subject-lifter';
import { Platform } from 'react-native';

class BackgroundRemoverService {
  // ... existing code ...

  async removeBackground(imageUri: string, options: PixianOptions = {}): Promise<string> {
    // 1. Try on-device first (iOS)
    if (Platform.OS === 'ios' && SubjectLifter.isAvailable()) {
      try {
        console.log('[BackgroundRemover] Using on-device (iOS Vision)...');
        const localUri = await SubjectLifter.ensureLocalFileUri(imageUri);
        const result = await SubjectLifter.removeBackground(localUri, {
          cropToSubject: false,
          method: 'auto',
        });
        console.log('[BackgroundRemover] On-device success:', result);
        return result.outputUri;
      } catch (error) {
        console.warn('[BackgroundRemover] On-device failed, falling back to API:', error);
        // Fall through to API
      }
    }

    // 2. Fallback to Pixian API (with VPN or for Android)
    return this.removeBackgroundViaAPI(imageUri, options);
  }

  private async removeBackgroundViaAPI(imageUri: string, options: PixianOptions): Promise<string> {
    // ... existing Pixian code ...
  }
}
```

### Изменения в UI (add-item.tsx)

```typescript
// При нажатии на кнопку удаления фона показываем индикатор
// и сообщаем пользователю что происходит

const handleRemoveBackground = async () => {
  if (!imageUri) return;

  try {
    setRemovingBg(true);

    // Check method availability
    const onDeviceAvailable = Platform.OS === 'ios' && SubjectLifter.isAvailable();

    if (!onDeviceAvailable && !backgroundRemoverService.isConfigured()) {
      Alert.alert(
        'Недоступно',
        'Удаление фона недоступно на этом устройстве. Требуется iOS 16+ или подключение к сети.',
      );
      return;
    }

    const processedUri = await backgroundRemoverService.removeBackground(imageUri);
    setImageUri(processedUri);
  } catch (error) {
    console.error('Error removing background:', error);
    Alert.alert(t('common:states.error'), t('addItem.bgRemovalError'));
  } finally {
    setRemovingBg(false);
  }
};
```

---

## 📅 План реализации

### Этап 1: Создание модуля (2-3 дня)

- [ ] Создать структуру `modules/subject-lifter/`
- [ ] Реализовать `SubjectLifterModule.swift`
- [ ] Реализовать `SubjectLifterService.swift`
- [ ] Добавить TypeScript типы и wrapper
- [ ] Тестирование на симуляторе

### Этап 2: Интеграция (1 день)

- [ ] Обновить `backgroundRemover.ts` с fallback логикой
- [ ] Обновить UI для показа источника обработки
- [ ] Тестирование на реальном устройстве iOS

### Этап 3: Оптимизация (1 день)

- [ ] Добавить кэширование результатов
- [ ] Оптимизировать memory usage для больших изображений
- [ ] Добавить progress callback для UI

### Этап 4: Android (отдельный этап)

- [ ] Исследовать ML Kit / TFLite варианты
- [ ] Реализовать Android модуль

---

## ⚠️ Известные ограничения

1. **iOS версия**: Требуется iOS 16+
2. **Качество**: Apple Vision даёт хорошее, но не идеальное качество на сложных границах
3. **Производительность**: На старых устройствах (iPhone 8, X) может занимать 2-4 секунды
4. **Размер изображения**: VisionKit имеет ограничения, очень большие изображения могут быть отклонены
5. **Expo Go**: без dev client модуль недоступен
6. **Кроп**: кроп по альфе через скан пикселей не использовать (медленно/ломается из-за формата); кроп делаем через bounds из VisionKit/Vision observations

---

## 🧪 План тестирования (минимум)

- iOS 16 устройство: фон убирается на фото вещи (без VPN)
- iOS 17 устройство: фон убирается, без деградации качества
- Большие изображения (например 4000px): не падает по памяти (должно даунскейлиться)
- Проблемные кейсы: прозрачные объекты, белый фон, тонкие ремешки/шнурки (ожидаем возможные артефакты)
- Путь-источник: результат сохраняется в cache, отображается корректно в React Native

---

## 🧠 Best practices (чтобы не ловить «рандомные баги»)

- Прогонять обработку **не на main thread** (использовать `Task.detached`/background queue)
- Нормализовать ориентацию картинки перед анализом
- Всегда работать с `file://` URI (копировать в cache)
- Сразу ограничивать `maxDimension` для входного анализа (скорость/память)
- Возвращать **структурированные error codes**, чтобы UI мог показывать разные сообщения

---

## 🔗 Ссылки и ресурсы

- [WWDC23: Lift subjects from images](https://developer.apple.com/videos/play/wwdc2023/10176/)
- [VisionKit Documentation](https://developer.apple.com/documentation/VisionKit)
- [Vision Framework](https://developer.apple.com/documentation/Vision)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [Expo Modules Get Started](https://docs.expo.dev/modules/get-started/)

---

## ✅ Checklist перед началом

- [ ] Убедиться что Expo SDK поддерживает native modules (✅ Expo 54)
- [ ] Проверить что проект имеет ios/ директорию (`npx expo prebuild`)
- [ ] Установить Xcode 15+ для компиляции Swift
- [ ] Протестировать на устройстве с iOS 16+

---

_Документ создан: 22 декабря 2025_  
_Автор: GitHub Copilot + анализ Apple WWDC23_
