# Image Compression System - Complete Implementation

**Date:** 2025-12-14
**Status:** ✅ Completed
**Version:** 2.0 (Unified webview and manual compression)

## Overview

This document describes the complete image compression system in Obrazz, ensuring all images are optimized to **1 megapixel (1MP)** before background removal and storage. This approach significantly reduces API costs (Pixian.ai charges per megapixel) while maintaining excellent visual quality.

## Core Compression Utility

**Location:** [utils/image/imageCompression.ts](../../utils/image/imageCompression.ts)

**Function:** `resizeToMegapixels(imageUri: string, options?: ResizeToMegapixelsOptions)`

### Parameters

```typescript
interface ResizeToMegapixelsOptions {
  targetMegapixels?: number; // Default: 1.0 MP
  quality?: number; // Default: 0.85 (85% JPEG quality)
  minDimension?: number; // Default: 400px (minimum width/height)
}
```

### Algorithm

1. **Read image dimensions** using expo-image-manipulator
2. **Calculate original megapixels** (width × height / 1,000,000)
3. **Skip resize if already ≤ target** - only apply quality compression
4. **Calculate new dimensions:**
   - Preserve aspect ratio
   - Formula: `newWidth = sqrt(targetPixels × aspectRatio)`
   - Ensure minimum dimensions (400px default)
5. **Resize and compress** to JPEG with quality setting
6. **Return detailed stats** (dimensions, file sizes, compression ratio)

### Example Output

```
[ImageResize] Original dimensions: 4000 x 3000
[ImageResize] Original megapixels: 12.00 MP
[ImageResize] Calculated new dimensions: 1155 x 866
[ImageResize] Target MP: 1.0 → Actual MP: 1.000 MP
[ImageResize] Megapixels reduced by: 91.7%
[ImageResize] File size: 127.45 KB
[ImageResize] Compression ratio: 23.54x
```

## Image Processing Pipelines

### 1. Manual Addition (Camera/Gallery)

**Flow:** User photo → ImageCropper → Background removal → Save

**Location:** [components/common/ImageCropper.tsx:302-390](../../components/common/ImageCropper.tsx#L302-L390)

**Steps:**

1. **Crop with transformations** (rotation, flip)
   - Full quality, no compression
   - Preserves all user edits

2. **Resize to fit crop frame** (CONTAIN behavior)
   - Ensures image fits target size
   - Maintains aspect ratio

3. **Add white background letterboxing**
   - Centers image on 3:4 canvas
   - Fills gaps with white background

4. **✅ Compress to 1MP** (Line 373)

   ```typescript
   const resizeResult = await resizeToMegapixels(finalImage, {
     targetMegapixels: 1.0,
     quality: 0.85,
   });
   ```

5. **Background removal** via Pixian.ai
6. **Generate thumbnail** (300px, 70% quality)
7. **Save to local storage**

### 2. Webview Import - Gallery Selection (Auto Mode)

**Flow:** Browser → Detect images → Download → Compress → Background removal → Save

**Location:** [services/shopping/webCaptureService.ts:7-47](../../services/shopping/webCaptureService.ts#L7-L47)

**Steps:**

1. **Image detection** on webpage
   - JavaScript injection scans for product images
   - Filters by size (>200×200px), aspect ratio, keywords

2. **Download to local storage**
   - Fetch from URL
   - Save to cache directory

3. **✅ Compress to 1MP** (Line 30)

   ```typescript
   const resizeResult = await resizeToMegapixels(file.uri, {
     targetMegapixels: 1.0,
     quality: 0.85,
   });
   ```

4. **Navigate to add-item screen**
   - Pre-compressed image ready for use
   - Background removal operates on 1MP image

5. **Background removal** via Pixian.ai
6. **Save to wardrobe**

### 3. Webview Import - Manual Crop

**Flow:** Browser → Screenshot → Crop → Compress → Background removal → Save

**Location:** [components/shopping/WebViewCropOverlay.tsx:93-164](../../components/shopping/WebViewCropOverlay.tsx#L93-L164)

**Steps:**

1. **Capture webpage screenshot**
   - Using react-native-view-shot
   - Quality: 0.9, format: JPEG

2. **User crops selection area**
   - Resizable overlay with gesture handling
   - Calculate crop coordinates

3. **Perform crop**
   - expo-image-manipulator crop action
   - Quality: 0.9, format: JPEG

4. **✅ Compress to 1MP** (Line 152)

   ```typescript
   const resizeResult = await resizeToMegapixels(result.uri, {
     targetMegapixels: 1.0,
     quality: 0.85,
   });
   ```

5. **Navigate to add-item screen**
   - Pre-compressed crop ready for use

6. **Background removal** via Pixian.ai
7. **Save to wardrobe**

### 4. Webview Import - Safety Net

**Flow:** Browser → Navigate to add-item → Download & compress → Use

**Location:** [app/add-item.tsx:113-141](../../app/add-item.tsx#L113-L141)

**Purpose:** Ensures all webview images are downloaded and compressed, even if manual crop mode is selected.

**Implementation:**

```typescript
const handleWebCaptureImage = useCallback(async (imageUrl: string, needsCropping: boolean) => {
  // Always download and compress first
  const localUri = await downloadImageFromUrl(imageUrl); // Includes compression

  if (needsCropping) {
    // Show cropper with local compressed image
    setTempImageUri(localUri);
    setShowCropper(true);
  } else {
    // Use compressed image directly
    setImageUri(localUri);
  }
}, []);
```

**Before:** Manual crop mode received URL directly, causing issues with local file operations.
**After:** All modes download to local file first, ensuring compression and proper file handling.

## Background Removal Integration

**Service:** [services/wardrobe/backgroundRemover.ts](../../services/wardrobe/backgroundRemover.ts)

**API:** Pixian.ai

**Pricing:** Charged per megapixel processed

**Cost Savings:**

| Image Size | Original MP | Compressed MP | Cost Reduction     |
| ---------- | ----------- | ------------- | ------------------ |
| 4000×3000  | 12 MP       | 1 MP          | **91.7%** ⬇️       |
| 2048×1536  | 3.1 MP      | 1 MP          | **67.7%** ⬇️       |
| 1920×1080  | 2.1 MP      | 1 MP          | **52.4%** ⬇️       |
| 800×600    | 0.48 MP     | 0.48 MP       | **0%** (no resize) |

**Example:**

- Uncompressed 12MP image: 12 API credits
- Compressed 1MP image: 1 API credit
- **Savings: 11 credits (92% reduction)**

## Quality Assurance

### Visual Quality

- **1MP (1,000,000 pixels)** provides excellent quality for:
  - Mobile display (typical screens: 2-4MP)
  - AI processing (background removal, item analysis)
  - Wardrobe thumbnails and outfit creation

- **Aspect ratio preserved** - no distortion
- **High JPEG quality (85%)** - minimal artifacts
- **Smart letterboxing** - white background for non-3:4 images

### Performance Benefits

1. **Faster uploads** - smaller file sizes
2. **Reduced API costs** - charged by megapixel
3. **Faster processing** - less data to analyze
4. **Storage efficiency** - smaller local files
5. **Better UX** - faster image operations

## Testing & Verification

### Manual Testing Checklist

- [x] Camera capture → compress → background removal
- [x] Gallery selection → compress → background removal
- [x] Webview gallery auto → download → compress → background removal
- [x] Webview manual crop → screenshot → crop → compress → background removal
- [x] Batch import from webview cart
- [x] Various image sizes (small, medium, large)
- [x] Various aspect ratios (portrait, landscape, square)

### Console Logging

All compression operations log detailed information:

```
[WebCapture] Downloading image from: https://...
[WebCapture] Download destination: file://...
[WebCapture] Image downloaded successfully, resizing to 1MP...
[ImageResize] Original dimensions: 2400 x 1800
[ImageResize] Original megapixels: 4.32 MP
[ImageResize] Calculated new dimensions: 1155 x 866
[ImageResize] Resize to 1MP complete:
  - dimensions: 1155x866
  - megapixels: 1.00MP
  - fileSize: 142.33KB
  - compressionRatio: 18.42x
[WebCapture] Resize to 1MP complete: ...
```

## Migration Notes

### Changes from v1.0 to v2.0

1. **WebViewCropOverlay:** Added compression after cropping
2. **webCaptureService:** Added compression after downloading
3. **add-item.tsx:** Fixed manual crop mode to download first
4. **Unified approach:** All paths now compress to 1MP before background removal

### Backward Compatibility

- ✅ Existing manual addition flow unchanged (already had compression)
- ✅ ImageCropper component unchanged (already had compression)
- ✅ No database schema changes required
- ✅ No breaking changes to component APIs

## Future Improvements

### Potential Enhancements

1. **Adaptive quality** - Higher quality for large displays
2. **Progressive compression** - Show preview while processing
3. **Batch optimization** - Compress multiple images in parallel
4. **User settings** - Allow quality/size customization
5. **AI-based compression** - Smart quality per image type

### Known Limitations

1. **Fixed 1MP target** - Not configurable per use case
2. **JPEG only** - No WebP or AVIF support yet
3. **No cache** - Re-compress if image re-edited
4. **Synchronous** - Blocks UI during compression

## Code References

### Key Files

| File                                                                                           | Purpose                           | Lines   |
| ---------------------------------------------------------------------------------------------- | --------------------------------- | ------- |
| [utils/image/imageCompression.ts](../../utils/image/imageCompression.ts)                       | Core compression utility          | 44-181  |
| [components/common/ImageCropper.tsx](../../components/common/ImageCropper.tsx)                 | Manual addition compression       | 302-390 |
| [components/shopping/WebViewCropOverlay.tsx](../../components/shopping/WebViewCropOverlay.tsx) | Webview manual crop compression   | 93-164  |
| [services/shopping/webCaptureService.ts](../../services/shopping/webCaptureService.ts)         | Webview auto download compression | 7-47    |
| [app/add-item.tsx](../../app/add-item.tsx)                                                     | Webview safety net                | 113-141 |
| [services/wardrobe/backgroundRemover.ts](../../services/wardrobe/backgroundRemover.ts)         | Background removal API            | 45-196  |

### Dependencies

- **expo-image-manipulator** - Image resizing and manipulation
- **expo-file-system** - File I/O operations
- **react-native-view-shot** - Screenshot capture (webview)

## Summary

The image compression system ensures **100% coverage** of all image addition paths:

✅ Camera capture → compressed
✅ Gallery selection → compressed
✅ Webview gallery auto → compressed
✅ Webview manual crop → compressed
✅ Webview batch import → compressed

**All images are optimized to 1MP before background removal**, resulting in:

- 🎯 **Consistent quality** across all sources
- 💰 **90%+ cost reduction** on API calls
- ⚡ **Faster processing** and better UX
- 📦 **Smaller storage** footprint

---

**Last Updated:** 2025-12-14
**Contributors:** Claude Code Assistant
**Related Docs:** [REMOVE_BG_SETUP.md](REMOVE_BG_SETUP.md), [IMAGE_CROPPER_IMPROVEMENTS.md](IMAGE_CROPPER_IMPROVEMENTS.md)
