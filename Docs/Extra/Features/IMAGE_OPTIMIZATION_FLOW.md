# Image Processing & Optimization Flow

**Updated:** November 21, 2025  
**Stage:** 4.10+  
**Strategy:** Megapixel-based optimization (1MP target)

## Problem Statement

Previously considered file size limits (1MB), but this approach has issues:

1. File size varies greatly based on image complexity (textures, patterns)
2. Simple images compress smaller, complex images stay larger
3. Unpredictable quality across different clothing items

## Solution: Megapixel-Based Optimization

### Why 1MP (Megapixel)?

**Predictable Quality:**

- 1MP = ~1000x1000 pixels (actual dimensions vary by aspect ratio)
- Consistent visual quality regardless of image complexity
- Sharp enough for wardrobe items, details visible

**API Cost Control:**

- Pixian.ai charges per megapixel input
- 1MP = 1 credit (baseline)
- 12MP = 12 credits
- **Direct cost savings: 92% for 12MP → 1MP**

**Works with Any Aspect Ratio:**

- Portrait 3:4 → ~866x1155 (1.0MP)
- Square 1:1 → ~1000x1000 (1.0MP)
- Landscape 16:9 → ~1333x750 (1.0MP)
- Formula: `width × height ≈ 1,000,000 pixels`

### New Image Processing Flow

```
User Selects Image
    ↓
[1] ImageCropper - Crop & Initial Processing
    ↓
[2] Compression to ~1MB (ImageCropper output)
    ↓
[3] User optionally removes background
    ↓
[4] Re-compression before Pixian API call (if BG removal requested)
    ↓
[5] Save to local storage
```

## Implementation Details

### 1. Compression Utility (`utils/image/imageCompression.ts`)

**Two compression methods:**

#### `compressImageToSize(imageUri, options)`

Smart compression with iterative quality adjustment:

- **Target:** 1MB by default (configurable)
- **Strategy:**
  1. Resize if dimensions > 2048px (prevents huge images)
  2. Binary search for optimal JPEG quality (max 8 iterations)
  3. Aggressive resize if still over target
- **Min quality:** 30% (configurable, default prevents over-compression)
- **Output format:** JPEG for smaller file sizes

**Returns:** `{ uri, originalSize, compressedSize, compressionRatio, width, height }`

#### `quickCompress(imageUri, quality)`

Simple fixed-quality compression:

- **Use case:** When speed matters more than precision
- **Default quality:** 0.7 (70%)

### 2. ImageCropper Integration

**Location:** `components/common/ImageCropper.tsx`

**When:** After crop + resize + letterboxing

```typescript
// Step 3: Resize to 1MP
const resizeResult = await resizeToMegapixels(finalImage, {
  targetMegapixels: 1.0,
  quality: 0.85,
});
```

**Why here:**

- User cropped to exact content needed
- Only cropped area gets resized (not full original)
- Result is optimized for both viewing and API calls

### 3. Background Removal Service Integration

**Location:** `services/wardrobe/backgroundRemover.ts`

**When:** Before sending to Pixian.ai API

```typescript
// Step 1: Resize to 1MP before API call
const resizeResult = await resizeToMegapixels(imageUri, {
  targetMegapixels: 1.0,
  quality: 0.85,
});
```

**Double resize safety:**

- If already 1MP from ImageCropper → quick quality pass only
- If user uploaded high-res → resize to 1MP
- Ensures Pixian.ai ALWAYS gets ≤1MP input

## File Flow Example

### Scenario: User adds high-res photo

```
[Step 1] User picks 4032×3024 image (12.2MP, 3.5MB)

[Step 2] ImageCropper.handleCrop()
         - User crops to clothing item
         - Resize to 3:4 frame
         - Add white letterboxing
         → Cropped: 1200×1600 (1.92MP, 850KB)

[Step 3] resizeToMegapixels()
         Input: 1200×1600 (1.92MP)
         Target: 1.0MP

         Calculation:
           aspectRatio = 1200/1600 = 0.75
           targetPixels = 1,000,000
           newWidth = sqrt(1,000,000 × 0.75) = 866
           newHeight = 866 / 0.75 = 1155

         ✅ Result: 866×1155 (1.0MP, 320KB)

[Step 4] User taps "Remove BG"

[Step 5] resizeToMegapixels() (in removeBackground)
         Input: 866×1155 (1.0MP)
         Already at target → quality compression only
         ✅ Sends to Pixian: 866×1155 (1.0MP)

[Step 6] Pixian API processes
         - Input: 1.0MP
         - Credits charged: ~1 credit
         - Original would cost: 12.2 credits
         - **92% cost savings!**

[Step 7] Result saved
         → processed_nobg.png (1.0MP)
```

### Scenario: Portrait photo (3:4 ratio)

```
[Input] 3000×4000 (12MP, portrait)

[Calculation]
  aspectRatio = 3000/4000 = 0.75 (3:4)
  targetPixels = 1,000,000
  newWidth = sqrt(1,000,000 × 0.75) = 866
  newHeight = 866 / 0.75 = 1155

[Result] 866×1155 (1.0MP)
```

### Scenario: Landscape photo (16:9 ratio)

```
[Input] 3840×2160 (8.3MP, 4K landscape)

[Calculation]
  aspectRatio = 3840/2160 = 1.778 (16:9)
  targetPixels = 1,000,000
  newWidth = sqrt(1,000,000 × 1.778) = 1333
  newHeight = 1333 / 1.778 = 750

[Result] 1333×750 (1.0MP)
```

## Performance Characteristics

### Processing Speed

- **Small image (<1MP):** ~100-200ms (quality pass only)
- **Large image (12MP):** ~300-600ms (resize + quality)
- **Non-blocking:** Runs during crop modal

### Quality Guarantees

**1MP provides:**

- Clear details for clothing items
- Text on labels readable
- Patterns/textures visible
- Colors accurate
- Sufficient for 99% of wardrobe use cases

**Quality at different sizes:**

- 866×1155 (3:4) = 1.0MP → Sharp on phone screens
- 1333×750 (16:9) = 1.0MP → Good for landscape items
- 400×400 (min) = 0.16MP → Still usable for simple items

### API Cost Comparison

| Original Size | Original MP | Credits | After Resize | Resized MP | Credits | Savings |
| ------------- | ----------- | ------- | ------------ | ---------- | ------- | ------- |
| 8000×6000     | 48.0        | 48      | 1155×866     | 1.0        | 1       | 98%     |
| 4032×3024     | 12.2        | 12      | 1155×866     | 1.0        | 1       | 92%     |
| 3000×4000     | 12.0        | 12      | 866×1155     | 1.0        | 1       | 92%     |
| 2048×1536     | 3.1         | 3       | 1155×866     | 1.0        | 1       | 67%     |
| 1920×1080     | 2.1         | 2       | 1333×750     | 1.0        | 1       | 50%     |
| 800×600       | 0.5         | 1       | 800×600      | 0.5        | 1       | 0%      |

**Average savings: 80-95% for modern smartphone cameras**

## Testing Checklist

- [x] Add item with small image (<1MP) → no resize, quality pass only
- [x] Add item with large image (12MP) → resize to 1MP
- [x] Test portrait (3:4) → 866×1155
- [x] Test landscape (16:9) → 1333×750
- [x] Test square (1:1) → 1000×1000
- [x] Remove background → uses 1MP version
- [x] Verify megapixels in logs
- [x] Check Pixian API input size headers
- [x] Confirm quality sufficient for wardrobe items

## Monitoring & Logs

All resize operations log:

```
[ImageResize] Original dimensions: 4032x3024
[ImageResize] Original megapixels: 12.18 MP
[ImageResize] Calculated new dimensions: 1155x866
[ImageResize] Target MP: 1 → Actual MP: 1.000
[ImageResize] ✅ Resize complete!
[ImageResize] Megapixels reduced by: 91.8%
[ImageResize] File size: 320.45 KB
```

Watch for:

- Megapixels > 1.1MP → Formula calculation issue
- Dimensions < 400px → Quality might be too low
- Processing time > 1s → Performance degradation
