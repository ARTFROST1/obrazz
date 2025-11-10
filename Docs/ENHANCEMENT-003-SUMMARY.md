# ENHANCEMENT-003: Adaptive Crop Frame (Dynamic Aspect Ratio)

**Date:** 2025-11-10  
**Status:** ✅ Completed  
**Component:** `components/common/ImageCropper.tsx`

---

## 🎯 Что было сделано

Реализована **адаптивная рамка кропа**, которая подстраивается под соотношение сторон входного изображения. Crop происходит с сохранением оригинального соотношения, затем изображение композируется на белый 3:4 холст.

### Проблема

Фиксированная рамка 3:4 не подходила для всех изображений:

- Рамка всегда имела соотношение 3:4
- Квадратные изображения обрезались сверху/снизу
- Панорамные изображения обрезались по бокам
- Пользователь **НЕ МОГ видеть** все изображение целиком в рамке

### Решение: Адаптивная рамка + Композиция на 3:4 холст

**Идея:** Рамка подстраивается под изображение, crop сохраняет оригинальное соотношение, затем композиция на белый 3:4 холст.

```typescript
/**
 * Calculate adaptive crop size based on image aspect ratio
 */
const getAdaptiveCropSize = () => {
  const imageAspect = resolution.width / resolution.height;
  const maxCropWidth = SCREEN_WIDTH * 0.9;
  const maxCropHeight = SCREEN_WIDTH * 1.5;

  if (imageAspect >= 1) {
    // Landscape/square: constrain by width
    cropWidth = maxCropWidth;
    cropHeight = cropWidth / imageAspect;
  } else {
    // Portrait: constrain by height
    cropHeight = maxCropHeight;
    cropWidth = cropHeight * imageAspect;
  }

  return { width, height }; // Adapts to image!
};

// Step 1: Adaptive frame
<CropZoom
  cropSize={adaptiveCropSize} // ← Adapts to 1:1, 3:4, 16:9, etc.
  resolution={resolution}
/>

// Step 2: Crop with original aspect ratio preserved
const croppedImage = await cropResult.crop();

// Step 3: Compose on 3:4 white canvas
const FINAL_OUTPUT_SIZE = { width: 750, height: 1000 };
const finalImage = await addWhiteBackgroundIfNeeded(
  croppedImage,
  FINAL_OUTPUT_SIZE // Always 3:4
);

---

## 📊 Примеры работы

### Пример 1: Квадратное изображение 1000×1000

```

1. Load image: 1000×1000
2. Calculate aspect: 1.0 (square)
3. Adaptive frame: 360×360 (square frame!)
4. User crops within 360×360 frame
5. Crop result: 360×360 (preserves square aspect)
6. Resize to fit 3:4: 360×360 (no resize needed)
7. Compose on 3:4 canvas: 360×480
8. Result: 360×480 with 60px white bars top/bottom ✅

```

### Пример 2: Portrait 3:4 изображение 1500×2000

```

1. Load image: 1500×2000
2. Calculate aspect: 0.75 (3:4)
3. Adaptive frame: 360×480 (3:4 frame!)
4. User crops within 360×480 frame
5. Crop result: 360×480 (preserves 3:4 aspect)
6. Resize to fit 3:4: 360×480 (already perfect)
7. Compose on 3:4 canvas: 360×480 (no white bg needed)
8. Result: 360×480 perfect 3:4 ✅

```

### Пример 3: Landscape 16:9 изображение 1920×1080

```

1. Load image: 1920×1080
2. Calculate aspect: 1.78 (16:9)
3. Adaptive frame: 360×202 (16:9 frame!)
4. User crops within 360×202 frame
5. Crop result: 360×202 (preserves 16:9 aspect)
6. Resize to fit 3:4: 360×202 (no resize needed)
7. Compose on 3:4 canvas: 360×480
8. Result: 360×480 with white bars top/bottom ✅

````

---

## ✅ Преимущества

1. **Адаптация под ЛЮБОЕ соотношение**
   - Рамка подстраивается: 1:1, 3:4, 16:9, 21:9, любое
   - Пользователь видит всё изображение
   - Нет обрезания важного контента

2. **Сохранение оригинального соотношения**
   - Crop происходит с сохранением aspect ratio
   - Квадрат остается квадратом
   - Панорама остается панорамой

3. **Гарантированный 3:4 выход**
   - Финальный результат всегда 3:4
   - Белый фон заполняет пустоты
   - Стандартизация для системы

4. **Простота реализации**
   - Один расчет `getAdaptiveCropSize()`
   - `CropOverlay` адаптируется автоматически
   - Нет сложной логики масштабирования координат

---

## 📁 Измененные файлы

### `components/common/ImageCropper.tsx`

**Добавлено:**

1. **Функция `getAdaptiveCropSize()`** (lines 47-98)
   - Расчет cropSize на основе aspect ratio изображения
   - Ограничение по maxWidth (90% экрана) и maxHeight (1.5x экрана)
   - Поддержка landscape, portrait, square, panorama

2. **Константа `FINAL_OUTPUT_SIZE`** (lines 102-106)
   - Финальный размер 3:4 для композиции
   - Используется в `resizeToFitCropFrame()` и `addWhiteBackgroundIfNeeded()`

3. **Обновлен `handleCrop()`** (lines 338-346)
   - Использует `FINAL_OUTPUT_SIZE` вместо `cropSize`
   - Гарантирует финальный выход 3:4

**Ключевой код:**
```typescript
const getAdaptiveCropSize = () => {
  const imageAspect = resolution.width / resolution.height;
  const maxCropWidth = SCREEN_WIDTH * 0.9;
  const maxCropHeight = SCREEN_WIDTH * 1.5;

  if (imageAspect >= 1) {
    // Landscape/square
    cropWidth = maxCropWidth;
    cropHeight = cropWidth / imageAspect;
  } else {
    // Portrait
    cropHeight = maxCropHeight;
    cropWidth = cropHeight * imageAspect;
  }

  return { width, height };
};

const cropSize = getAdaptiveCropSize(); // Adapts to image!
const FINAL_OUTPUT_SIZE = { width: 750, height: 1000 }; // Always 3:4
````

### `components/common/CropOverlay.tsx`

**Изменений не требуется** ✅

- Уже принимает `cropSize` как prop
- Автоматически адаптируется к любому размеру

---

## 🧪 Итоговый флоу

```
1. User selects image
   ↓
2. Calculate adaptive cropSize based on image aspect ratio
   ↓
3. Display adaptive frame (matches image aspect)
   ↓
4. User crops with preserved aspect ratio
   ↓
5. Apply crop transformations
   ↓
6. Resize to fit FINAL_OUTPUT_SIZE (3:4)
   ↓
7. Compose on white 3:4 canvas
   ↓
8. Result: Perfect 3:4 image ✅
```

**Adaptive Frames:**

- Square 1:1 → Frame 360×360
- Portrait 3:4 → Frame 360×480
- Landscape 16:9 → Frame 360×202
- Panorama 3:1 → Frame 360×120
- **Any ratio** → Adapts automatically ✅

**All output:** 360×480 (3:4) with white background if needed ✅

```
Original: 600×800
Crop frame: 750×1000

Display Phase:
- Contain scale: min(1.25, 1.25) = 1.25
- No adjustment needed (scale > 1)
- Adjusted resolution: 600×800 (same)
- CropZoom отображает: 600×800 ✅
- После crop + white bg: 750×1000 ✅
```

### Пример 3: Широкое 1600×900

```
Original: 1600×900
Crop frame: 750×1000

Display Phase:
- Contain scale: min(0.47, 1.11) = 0.47
- Adjustment: 1/0.47 = 2.13
- Adjusted resolution: 3408×1917
- CropZoom отображает: ~750×422 (CONTAIN) ✅
- После pinch: можно увеличить до COVER ✅
```

---

## 📁 Измененные файлы

### `components/common/ImageCropper.tsx`

**Добавлено:**

1. **Функция `getAdjustedResolution()`** (lines 48-93)
   - Рассчитывает увеличенный resolution для CONTAIN отображения
   - Возвращает оригинал если adjustment не нужен

2. **Передача `adjustedResolution` в `<CropZoom>`** (line 372)
   - Вместо оригинального `resolution`
   - Библиотека "думает" что изображение больше

3. **Масштабирование crop координат** в `handleCrop()` (lines 268-323)
   - Расчет `scaleFactor = original / adjusted`
   - Умножение всех crop/resize координат на scaleFactor
   - Применение к реальному изображению

4. **Сохранена функция `resizeToFitCropFrame()`**
   - Для post-processing (если crop вывел изображение > cropSize)
   - Гарантия: результат всегда ≤ cropSize

**Ключевой код:**

```typescript
// Lines 48-93: Adjusted resolution calculation
const getAdjustedResolution = () => {
  const containScale = Math.min(
    cropSize.width / resolution.width,
    cropSize.height / resolution.height
  );

  if (containScale < 1) {
    const adjustmentFactor = 1 / containScale;
    return {
      width: Math.round(resolution.width * adjustmentFactor),
      height: Math.round(resolution.height * adjustmentFactor)
    };
  }
  return resolution;
};

// Line 372: Pass to CropZoom
<CropZoom resolution={adjustedResolution} />

// Lines 268-323: Scale coordinates back
const scaleFactor = resolution.width / adjustedResolution.width;
const adjustedCrop = {
  originX: Math.round(cropResult.crop.originX * scaleFactor),
  originY: Math.round(cropResult.crop.originY * scaleFactor),
  width: Math.round(cropResult.crop.width * scaleFactor),
  height: Math.round(cropResult.crop.height * scaleFactor)
};
```

### `Docs/Bug_tracking.md`

**Добавлено:**

- Новая запись ENHANCEMENT-003 с полным описанием
- Таблица сравнения COVER vs CONTAIN
- Примеры расчетов для разных соотношений сторон
- Связь с ENHANCEMENT-002

### `Docs/IMAGE_CROP_WHITE_BACKGROUND_PLAN.md`

**Обновлено:**

- Step 2 отмечен как завершенный (✅ COMPLETED - 2025-11-10)
- Step 3 отмечен как завершенный (✅ COMPLETED - 2025-11-10)
- Добавлены детали реализации

---

## 🔍 Как это работает

### Before (COVER)

```
┌─────────────────┐
│                 │
│  ┌───────────┐  │ ← Image 1000×1000
│  │           │  │   (выходит за boundaries)
│  │   IMAGE   │  │
│  │           │  │
│  └───────────┘  │
│                 │
└─────────────────┘
  Crop Frame 750×1000
  ❌ Image larger than frame
  ❌ Cannot shrink to fit
```

### After (CONTAIN)

```
┌─────────────────┐
│  WHITE SPACE    │ ← 125px gap (filled by white bg)
│ ┌─────────────┐ │
│ │             │ │ ← Image 750×750
│ │    IMAGE    │ │   (полностью внутри)
│ │             │ │
│ └─────────────┘ │
│  WHITE SPACE    │ ← 125px gap (filled by white bg)
└─────────────────┘
  Crop Frame 750×1000
  ✅ Image fits completely
  ✅ White background fills gaps
  ✅ Result: Perfect 3:4
```

---

## 🚀 Следующие шаги

1. **Тестирование на устройстве**
   - Проверить на iOS
   - Проверить на Android
   - Протестировать с разными размерами изображений

2. **Проверка интеграции**
   - Камера → Crop → Save
   - Галерея → Crop → Save
   - Background removal с letterboxed images

3. **Performance testing**
   - Большие изображения (4000×4000px)
   - Очень маленькие изображения (200×200px)
   - Различные форматы (PNG, JPEG)

---

## 📚 Related

- **ENHANCEMENT-002:** Image Crop White Background Letterboxing
- **BUG-005:** iOS Image Cropping - Custom 3:4 Crop Solution
- **Plan:** IMAGE_CROP_WHITE_BACKGROUND_PLAN.md

---

**Created:** 2025-11-10  
**Author:** Cascade AI  
**Status:** ✅ Ready for Testing
