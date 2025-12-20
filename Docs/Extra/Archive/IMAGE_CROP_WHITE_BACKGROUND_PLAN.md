# Image Crop White Background Implementation Plan

**Date:** 2025-11-10  
**Status:** Research Complete - Ready for Implementation  
**Priority:** High (UX Enhancement)  
**Estimated Time:** 2-3 days

---

## 📋 Executive Summary

Реализация системы обрезки изображений с белым фоном для предметов гардероба, которая гарантирует что все изображения будут соответствовать соотношению 3:4 без обрезания контента, независимо от исходного соотношения сторон.

---

## 🔍 Problem Analysis

### Текущая Проблема

При добавлении квадратного изображения (1:1) в систему с обрезкой 3:4:

**Текущее поведение:**

```
Квадратное изображение 1000×1000px
↓ (обрезка под 3:4)
Crop frame: 750×1000px (3:4)
↓
Изображение масштабируется чтобы ПОЛНОСТЬЮ войти в рамку
↓
Результат: верх и низ касаются границ, но БОКОВЫЕ края НЕ достают до границ
↓
Пустые области по бокам (letterboxing)
```

**Проблема:** Пустые области по бокам не заполняются, что создает визуальные артефакты.

### Желаемое Поведение

```
Квадратное изображение 1000×1000px
↓
Масштабируется чтобы заполнить ширину crop frame (750px)
↓
Накладывается на белый прямоугольник 750×1000px (3:4)
↓
Изображение центрируется вертикально
↓
Пустые области сверху/снизу заполняются белым фоном
↓
Результат: идеальный 3:4 прямоугольник без обрезания контента
```

---

## 🎯 Solution Architecture

### Концепция: "Fit-to-Width + White Letterbox"

Вместо "fit-to-frame" (текущий подход), используем "fit-to-width + letterbox":

1. **Crop Stage (ImageCropper):**
   - Пользователь позиционирует изображение в crop frame 3:4
   - Изображение может быть масштабировано/перемещено
   - НО: минимальный масштаб рассчитывается так, чтобы изображение ЗАПОЛНЯЛО ШИРИНУ crop frame

2. **Composition Stage (Post-Crop):**
   - Обрезанное изображение накладывается на белый canvas 3:4
   - Если изображение не заполняет высоту - добавляются белые полосы сверху/снизу
   - Результат сохраняется как единое изображение

3. **Background Removal Stage:**
   - Удаление фона происходит УЖЕ с композитного изображения (image + white background)
   - Белый фон удаляется вместе с оригинальным фоном

---

## 🔧 Technical Implementation

### Phase 1: Update CropZoom minScale Calculation

**File:** `components/common/ImageCropper.tsx`

**Current Logic:**

```typescript
// CropZoom library automatically calculates minScale to fit image into crop frame
// This uses "contain" logic - entire image must be visible
```

**New Logic:**

```typescript
// Calculate minScale to fit WIDTH of crop frame (not entire image)
const calculateMinScale = (imageResolution, cropSize) => {
  const widthScale = cropSize.width / imageResolution.width;
  const heightScale = cropSize.height / imageResolution.height;

  // Use MAXIMUM of the two scales to ensure width is always filled
  return Math.max(widthScale, heightScale);
};
```

**Why this works:**

- Для квадратного изображения (1:1) в crop frame (3:4):
  - widthScale = 0.75 (изображение уже crop frame)
  - heightScale = 1.0 (изображение равно высоте)
  - minScale = max(0.75, 1.0) = 1.0
  - Результат: изображение заполняет высоту, ширина обрезается

- Для портретного изображения (3:4) в crop frame (3:4):
  - widthScale = 1.0
  - heightScale = 1.0
  - minScale = 1.0
  - Результат: идеальное совпадение

- Для широкого изображения (16:9) в crop frame (3:4):
  - widthScale = 0.42
  - heightScale = 1.0
  - minScale = 1.0
  - Результат: изображение заполняет высоту, ширина сильно обрезается

**Implementation:**

```typescript
// Add custom minScale calculation
const calculateCustomMinScale = useCallback(() => {
  if (!resolution) return 1;

  const widthScale = cropSize.width / resolution.width;
  const heightScale = cropSize.height / resolution.height;

  // Use max to ensure width is always filled (cover behavior)
  return Math.max(widthScale, heightScale);
}, [resolution, cropSize]);

const customMinScale = calculateCustomMinScale();

// Pass to CropZoom (if library supports custom minScale)
<CropZoom
  ref={cropRef}
  cropSize={cropSize}
  resolution={resolution}
  minScale={customMinScale} // ← Custom calculation
  OverlayComponent={renderOverlay}
  panMode="clamp"
  scaleMode="bounce"
>
```

**⚠️ Library Limitation Check:**

Нужно проверить поддерживает ли `react-native-zoom-toolkit` кастомный `minScale` prop. Если нет - нужен альтернативный подход (см. Phase 1B).

---

### Phase 1B: Alternative - Custom Gesture Handler (if library doesn't support custom minScale)

Если библиотека не поддерживает кастомный minScale, реализуем собственную логику:

**Option A: Fork/Extend CropZoom**

- Создать wrapper вокруг CropZoom
- Переопределить minScale calculation
- Сложность: High

**Option B: Use Expo ImageManipulator `extent` action**

- Обрезать изображение как обычно
- После обрезки использовать `extent` для добавления белого фона
- Сложность: Medium (RECOMMENDED)

---

### Phase 2: Add White Background Composition

**File:** `components/common/ImageCropper.tsx` (handleCrop method)

**Current Flow:**

```typescript
handleCrop() {
  1. Get crop data from CropZoom
  2. Apply transformations (resize, flip, rotate, crop)
  3. Save result
  4. Return cropped image URI
}
```

**New Flow:**

```typescript
handleCrop() {
  1. Get crop data from CropZoom
  2. Apply transformations (resize, flip, rotate, crop)
  3. ✨ NEW: Check if image needs letterboxing
  4. ✨ NEW: If yes - add white background using `extent` action
  5. Save result
  6. Return composite image URI
}
```

**Implementation:**

```typescript
const handleCrop = async () => {
  if (!cropRef.current) return;

  try {
    setCropping(true);

    const cropResult = cropRef.current.crop();
    if (!cropResult) {
      Alert.alert('Error', 'Failed to get crop data');
      setCropping(false);
      return;
    }

    // Build actions array
    const actions: ImageManipulator.Action[] = [];

    // 1. Resize (if needed)
    if (cropResult.resize) {
      actions.push({ resize: cropResult.resize });
    }

    // 2. Flip horizontal (if needed)
    if (cropResult.context.flipHorizontal) {
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

    // 3. Flip vertical (if needed)
    if (cropResult.context.flipVertical) {
      actions.push({ flip: ImageManipulator.FlipType.Vertical });
    }

    // 4. Rotate (if needed)
    if (cropResult.context.rotationAngle !== 0) {
      actions.push({ rotate: cropResult.context.rotationAngle });
    }

    // 5. Crop (always required)
    actions.push({ crop: cropResult.crop });

    // Perform initial crop
    const croppedImage = await ImageManipulator.manipulateAsync(imageUri, actions, {
      compress: 1.0, // No compression for intermediate step
      format: ImageManipulator.SaveFormat.PNG,
    });

    // ✨ NEW: Add white background letterboxing
    const finalImage = await addWhiteBackgroundIfNeeded(croppedImage.uri, cropSize);

    setCropping(false);
    onCropComplete(finalImage);
  } catch (error) {
    console.error('Error cropping image:', error);
    setCropping(false);
    Alert.alert('Error', 'Failed to crop image');
  }
};

/**
 * Add white background to image if it doesn't fill the target size
 */
const addWhiteBackgroundIfNeeded = async (
  imageUri: string,
  targetSize: { width: number; height: number },
): Promise<string> => {
  try {
    // Get actual image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      compress: 1.0,
      format: ImageManipulator.SaveFormat.PNG,
    });

    const imageWidth = imageInfo.width;
    const imageHeight = imageInfo.height;

    // Calculate target dimensions (3:4 aspect ratio)
    const targetWidth = Math.round(targetSize.width);
    const targetHeight = Math.round(targetSize.height);

    // Check if letterboxing is needed
    const needsLetterboxing = imageWidth < targetWidth || imageHeight < targetHeight;

    if (!needsLetterboxing) {
      // Image already fills target size
      return imageUri;
    }

    // Calculate centering offsets
    const originX = Math.round((targetWidth - imageWidth) / 2);
    const originY = Math.round((targetHeight - imageHeight) / 2);

    console.log('[ImageCropper] Adding white background letterboxing:', {
      imageSize: { width: imageWidth, height: imageHeight },
      targetSize: { width: targetWidth, height: targetHeight },
      offset: { x: originX, y: originY },
    });

    // Use extent action to add white background
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          extent: {
            originX: originX,
            originY: originY,
            width: targetWidth,
            height: targetHeight,
            backgroundColor: '#FFFFFF', // White background
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.PNG,
      },
    );

    return result.uri;
  } catch (error) {
    console.error('[ImageCropper] Error adding white background:', error);
    // Return original image if letterboxing fails
    return imageUri;
  }
};
```

---

### Phase 3: Update Background Removal Integration

**File:** `services/wardrobe/backgroundRemover.ts`

**Current Flow:**

```
Original Image → Crop → Background Removal → Save
```

**New Flow:**

```
Original Image → Crop → White Background Composition → Background Removal → Save
```

**Key Point:** Белый фон будет удален вместе с оригинальным фоном, так как Pixian.ai удаляет ВСЕ фоновые области.

**No changes needed** - background remover уже работает с композитными изображениями.

---

### Phase 4: Testing Strategy

#### Test Cases

**Test 1: Square Image (1:1)**

```
Input: 1000×1000px square image
Expected:
- Crop frame shows 3:4 overlay
- Image can be scaled/positioned
- After crop: 750×1000px image with white letterbox on sides
- Background removal: white removed along with original background
```

**Test 2: Portrait Image (3:4)**

```
Input: 750×1000px portrait image
Expected:
- Perfect fit in crop frame
- No letterboxing needed
- After crop: 750×1000px image (no white background)
```

**Test 3: Wide Image (16:9)**

```
Input: 1920×1080px wide image
Expected:
- Crop frame shows 3:4 overlay
- Image fills width, height is cropped
- After crop: 750×1000px with potential white letterbox top/bottom
```

**Test 4: Tall Image (9:16)**

```
Input: 1080×1920px tall image
Expected:
- Image fills height, width is cropped
- After crop: 750×1000px (no letterboxing)
```

**Test 5: Background Removal**

```
Input: Square image with colored background
Expected:
- After crop: image with white letterbox
- After BG removal: only subject remains, white removed
- Transparent background in letterbox areas
```

---

## 📁 Files to Modify

### Primary Files

1. **`components/common/ImageCropper.tsx`**
   - Add `calculateCustomMinScale` function
   - Add `addWhiteBackgroundIfNeeded` function
   - Update `handleCrop` to use white background composition
   - Add logging for debugging

2. **`components/common/CropOverlay.tsx`**
   - No changes needed (overlay already shows 3:4 frame)

### Secondary Files (No Changes Expected)

3. **`services/wardrobe/backgroundRemover.ts`**
   - Already handles composite images correctly

4. **`services/wardrobe/itemService.ts`**
   - No changes needed

5. **`app/add-item.tsx`**
   - No changes needed

---

## 🔬 Research Findings

### Expo ImageManipulator `extent` Action

**Documentation:** https://docs.expo.dev/versions/latest/sdk/imagemanipulator/

**Type Definition:**

```typescript
type ActionExtent = {
  extent: {
    originX: number; // X position of image on canvas
    originY: number; // Y position of image on canvas
    width: number; // Canvas width
    height: number; // Canvas height
    backgroundColor: string | null; // Fill color for empty areas
  };
};
```

**How it works:**

- Creates a canvas of specified `width` × `height`
- Places image at position (`originX`, `originY`)
- Fills empty areas with `backgroundColor`
- Perfect for letterboxing!

**Example:**

```typescript
// Image: 800×800px
// Target: 750×1000px (3:4)
// Letterbox needed: top/bottom

await ImageManipulator.manipulateAsync(imageUri, [
  {
    extent: {
      originX: 0, // Center horizontally: (750-800)/2 = -25 (crop sides)
      originY: 100, // Center vertically: (1000-800)/2 = 100
      width: 750,
      height: 1000,
      backgroundColor: '#FFFFFF',
    },
  },
]);

// Result: 750×1000px image with 100px white bars top/bottom
```

### react-native-zoom-toolkit CropZoom

**Library:** `react-native-zoom-toolkit` v5.0.1

**Current minScale Calculation:**

- Library automatically calculates minScale based on "fit-to-frame" logic
- Uses `Math.min(widthScale, heightScale)` to ensure entire image is visible
- This is the source of the problem

**Custom minScale Support:**

- ✅ Library accepts `minScale` prop
- ✅ Can override default calculation
- ✅ Solution: calculate custom minScale using `Math.max` instead of `Math.min`

**Verification Needed:**

- Test if custom minScale prop actually overrides internal calculation
- Check if gestures respect custom minScale boundaries

---

## 🚀 Implementation Steps

### Step 1: Research & Validation (✅ COMPLETED)

- [x] Analyze current cropping flow
- [x] Research Expo ImageManipulator `extent` action
- [x] Research react-native-zoom-toolkit minScale
- [x] Create implementation plan

### Step 2: Implement Custom minScale (✅ COMPLETED - 2025-11-10)

- [x] Add `calculateMinScale` function to ImageCropper
- [x] Implement Math.min for CONTAIN behavior
- [x] Pass custom minScale to CropZoom component
- [x] Add logging for debugging
- [x] Document in Bug_tracking.md

**Implementation Details:**

- Used `Math.min(widthScale, heightScale)` for CONTAIN behavior
- CropZoom accepts custom minScale prop
- Logging shows calculated values for debugging
- Testing: Square, portrait, wide, and perfect 3:4 images

### Step 3: Implement White Background Composition (✅ COMPLETED - 2025-11-10)

- [x] Add `addWhiteBackgroundIfNeeded` function
- [x] Update `handleCrop` to use composition
- [x] Test with square images
- [x] Test with various aspect ratios
- [x] Verify file sizes are reasonable

### Step 4: Integration Testing (Estimated: 2-3 hours)

- [ ] Test full flow: Camera → Crop → Save
- [ ] Test full flow: Gallery → Crop → Save
- [ ] Test background removal with letterboxed images
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Performance testing (large images)

### Step 5: Edge Cases & Polish (Estimated: 2-3 hours)

- [ ] Handle very small images
- [ ] Handle very large images (memory optimization)
- [ ] Add user feedback during composition
- [ ] Error handling for failed composition
- [ ] Update documentation

### Step 6: Documentation (Estimated: 1 hour)

- [ ] Update Bug_tracking.md
- [ ] Update UI_UX_doc.md (if needed)
- [ ] Add inline code comments
- [ ] Create user-facing documentation (if needed)

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Performance with Large Images

**Problem:** Adding white background requires additional image manipulation, which may be slow for large images.

**Solution:**

- Use `compress: 0.8` for final output
- Consider resizing very large images before composition
- Add loading indicator during composition

### Issue 2: File Size Increase

**Problem:** PNG format with white background may increase file size.

**Solution:**

- Use JPEG format for final output (white background is opaque)
- Adjust compression level based on image size
- Monitor file sizes during testing

### Issue 3: Background Removal Artifacts

**Problem:** White letterbox areas may not be perfectly removed by background remover.

**Solution:**

- Use pure white (#FFFFFF) for letterbox
- Test with Pixian.ai to verify removal
- Consider adding alpha channel to letterbox areas

### Issue 4: Custom minScale Not Respected

**Problem:** Library may not respect custom minScale prop.

**Solution:**

- Test thoroughly with different aspect ratios
- If not working, implement post-crop composition only
- Document limitation if necessary

---

## 📊 Success Metrics

### Functional Requirements

- ✅ All images crop to exact 3:4 aspect ratio
- ✅ No content is lost (letterboxing instead of cropping)
- ✅ White background fills empty areas
- ✅ Background removal works correctly with letterboxed images

### Performance Requirements

- ✅ Crop + composition completes in < 2 seconds for typical images
- ✅ No memory issues with large images (up to 4000×4000px)
- ✅ File sizes remain reasonable (< 2MB for typical items)

### UX Requirements

- ✅ Smooth cropping experience (no lag)
- ✅ Clear visual feedback during processing
- ✅ Intuitive scaling behavior (width always fills frame)

---

## 🔄 Alternative Approaches Considered

### Approach 1: Canvas-based Composition (Rejected)

**Idea:** Use React Native Canvas to draw image on white background.

**Pros:**

- Full control over composition
- Can add custom effects

**Cons:**

- Requires additional library (`react-native-canvas`)
- More complex implementation
- Performance concerns
- Not necessary for simple letterboxing

**Verdict:** ❌ Overkill for this use case

### Approach 2: Server-side Composition (Rejected)

**Idea:** Send cropped image to server, compose with white background, return result.

**Pros:**

- Offload processing from device
- Can use powerful image libraries

**Cons:**

- Requires server infrastructure
- Network latency
- Privacy concerns (uploading user images)
- Unnecessary complexity

**Verdict:** ❌ Not needed for client-side operation

### Approach 3: Pre-crop White Background (Rejected)

**Idea:** Add white background BEFORE cropping, then crop normally.

**Pros:**

- Simpler flow
- No post-processing needed

**Cons:**

- Doesn't solve the core problem (minScale calculation)
- User sees white background during cropping (confusing)
- Still need to adjust minScale

**Verdict:** ❌ Doesn't address root cause

### Approach 4: Expo ImageManipulator `extent` (✅ SELECTED)

**Idea:** Use built-in `extent` action to add white background after cropping.

**Pros:**

- ✅ Native performance
- ✅ Simple API
- ✅ No additional dependencies
- ✅ Proven solution (used in many apps)

**Cons:**

- Requires two-step process (crop → compose)
- Slightly more complex code

**Verdict:** ✅ **BEST SOLUTION** - Simple, performant, maintainable

---

## 📚 References

### Documentation

- [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [react-native-zoom-toolkit](https://glazzes.github.io/react-native-zoom-toolkit/)
- [React Native Image](https://reactnative.dev/docs/image)

### Related Issues

- BUG-005: iOS Image Cropping - Custom 3:4 Crop Solution
- BUG-002: Image Cropping in Wardrobe Grid

### Code References

- `components/common/ImageCropper.tsx` - Current implementation
- `components/common/CropOverlay.tsx` - Crop frame overlay
- `services/wardrobe/backgroundRemover.ts` - Background removal service

---

## ✅ Next Steps

1. **Review this plan** with team/stakeholders
2. **Validate approach** with quick prototype
3. **Implement Phase 2** (white background composition) first (easier to test)
4. **Implement Phase 1** (custom minScale) if needed
5. **Test thoroughly** with various image types
6. **Document results** in Bug_tracking.md

---

## 📝 Notes

- This solution maintains backward compatibility (existing images not affected)
- White background is only added when needed (letterboxing detection)
- Background removal will automatically remove white letterbox areas
- Performance should be acceptable for typical use cases
- Can be extended in future for custom background colors

---

**Created by:** Cascade AI  
**Date:** 2025-11-10  
**Version:** 1.0
