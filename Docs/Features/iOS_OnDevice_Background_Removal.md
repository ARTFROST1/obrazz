# iOS On-Device Background Removal (Apple Vision)

**Status (Jan 2026):** ✅ Implemented and working.

This project supports **on-device background removal on iOS** via **Apple Vision (`Vision.framework`)** through a custom Expo native module `SubjectLifter`.

- **Primary (iOS):** Apple Vision on-device (free, offline)
- **Fallback (all platforms / unsupported iOS):** Pixian.ai API (cloud, paid)

---

## What’s implemented

### iOS versions

- **iOS 17+ (preferred):** `VNGenerateForegroundInstanceMaskRequest` (generic foreground instance masks)
- **iOS 16 (fallback):** `VNGeneratePersonSegmentationRequest` (person-only segmentation)

### Output

- Returns a **PNG with transparency** (`.png`) stored in app cache.

### Simulator limitation

Apple Vision segmentation is **not reliably supported in iOS Simulator** (Apple Neural Engine runtime is unavailable). In the app:

- `SubjectLifter.isAvailable()` returns `false` on Simulator
- The JS service will use **Pixian fallback** on Simulator

Test Apple Vision background removal on a **real device**.

---

## Code locations

### Native iOS module

- `modules/subject-lifter/ios/SubjectLifterModule.swift`
  - Exposes `isAvailable()`, `liftSubject(imageUri)` and `getSystemInfo()` to JS.
- `modules/subject-lifter/ios/SubjectLifterService.swift`
  - Loads the input image (`file://...`)
  - Runs the Vision request (iOS 17+ instance mask or iOS 16 person segmentation)
  - Applies the mask via **Core Image** (to avoid stride/bytesPerRow artifacts)
  - Writes the resulting PNG to cache and returns its URI

### JS service (method selection + fallback)

- `services/wardrobe/backgroundRemover.ts`
  - Uses Apple Vision on iOS when `SubjectLifter.isAvailable()` is true
  - Falls back to Pixian on Android / unsupported iOS / failures

---

## How the native pipeline works

1. **Load input image** from `file://...` into `UIImage` / `CGImage`.
2. **Run Vision** with correct EXIF orientation:
   - iOS 17+: `VNGenerateForegroundInstanceMaskRequest`
   - iOS 16: `VNGeneratePersonSegmentationRequest`
3. **Compositing (Core Image):**
   - Scale mask to source image with Lanczos
   - Convert to alpha (`CIMaskToAlpha`)
   - Blend source over transparent background (`CIBlendWithAlphaMask`)

Core Image compositing is used specifically to prevent classic “striping/banding” artifacts caused by manual per-pixel loops and row-stride mismatches.

---

## Build & test

### Requirements

- iOS 16.0+
- Dev build / prebuild (not available in Expo Go)

### Run on a real device

```bash
npx expo prebuild -p ios --clean
npx expo run:ios --device
```

### Expected logs

When Apple Vision is used:

- `[BackgroundRemover] Using Apple Vision (free, on-device)`

When Pixian fallback is used:

- `[BackgroundRemover] Using Pixian.ai API (cloud, paid)`

---

## Troubleshooting

### Always uses Pixian on iOS

- Confirm you’re on **real device**, not Simulator
- Confirm **iOS >= 16**
- Check logs from `SubjectLifter.isAvailable()` via `services/wardrobe/backgroundRemover.ts`

### Image looks misaligned / rotated

Native code passes EXIF orientation into Vision and normalizes output. If you still see issues, verify the input is a real `file://...` image (not an asset reference).

---

## Related docs

- Pixian (fallback) setup: `Docs/Extra/Features/REMOVE_BG_SETUP.md`
