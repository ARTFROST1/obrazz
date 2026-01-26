# Subject Lifter Module

Apple Vision integration (Vision.framework) for on-device background removal on iOS 16+.

## Features

- ✅ **Free & Offline** - No API costs, works without internet
- ⚡ **Fast** - 0.5-2 seconds on-device processing
- 🎯 **High Quality** - Apple's Neural Engine for subject detection
- 🔒 **Privacy** - All processing happens on device

## Requirements

- iOS 16.0+
- Development build (not compatible with Expo Go)
- iPhone 12+ recommended (Neural Engine)

> Note: Apple Vision segmentation is not reliably supported on iOS Simulator.
> Expect `SubjectLifter.isAvailable()` to be `false` on Simulator; test on a real device.

## Installation

This module is automatically included in the project. After running `npx expo prebuild -p ios`, the native module will be compiled.

## Usage

```typescript
import { SubjectLifter } from 'modules/subject-lifter/src';

// Check availability
const isAvailable = await SubjectLifter.isAvailable();

if (isAvailable) {
  // Remove background
  const resultUri = await SubjectLifter.liftSubject('file:///path/to/image.jpg');
  console.log('Result:', resultUri);
}
```

## Integration with BackgroundRemoverService

The `backgroundRemoverService` automatically uses Apple Vision when available:

```typescript
import { backgroundRemoverService } from '@services/wardrobe/backgroundRemover';

// Automatically chooses best method:
// - Apple Vision on iOS 16+ (free, fast)
// - Pixian.ai as fallback (cloud, paid)
const resultUri = await backgroundRemoverService.removeBackground(imageUri);
```

## Architecture

```
backgroundRemoverService
    ↓
Check platform & iOS version
    ↓
┌─────────────────┴─────────────────┐
│                                   │
iOS 16+                        Other
↓                                   ↓
SubjectLifter                  Pixian API
(Apple Vision)                 (Cloud)
↓                                   ↓
Result (PNG with transparency)
```

## Development

### File Structure

```
modules/subject-lifter/
├── expo-module.config.json    # Module configuration
├── package.json               # Module metadata
├── ios/
│   ├── SubjectLifterModule.swift      # Expo module definition
│   └── SubjectLifterService.swift     # Apple Vision (Vision.framework) implementation
└── src/
    └── index.ts               # TypeScript API
```

### Testing

1. Build development version:

```bash
npx expo run:ios
```

2. Test in app:

- Open Add Item screen
- Select/capture image
- Tap "Remove Background" button
- Check console for "Using Apple Vision" message

### Debugging

```typescript
// Get system info
const info = SubjectLifter.getSystemInfo();
console.log('iOS Version:', info.iosVersion);
console.log('Apple Vision Available:', info.isVisionAvailable);
```

## Known Limitations

1. **iOS 16+ only** - Older iOS versions automatically fall back to Pixian
2. **Development build required** - Not available in Expo Go
3. **PNG output only** - Always outputs PNG with transparency
4. **On-device only** - Cannot process images from remote URLs directly (downloads first)

## Fallback Strategy

The service implements a robust fallback chain:

1. **Primary**: Apple Vision (Vision.framework) (iOS 16+)
2. **Fallback**: Pixian.ai API (all platforms)

If Apple Vision fails for any reason, it automatically falls back to Pixian.

## Performance

Typical processing times:

| Method       | Device     | Time     |
| ------------ | ---------- | -------- |
| Apple Vision | iPhone 13+ | 0.5-1.5s |
| Apple Vision | iPhone 12  | 1-2s     |
| Pixian API   | Any        | 2-10s    |

## Privacy

Apple Vision processes images entirely on-device:

- No data sent to servers
- No API credentials needed
- Works offline
- Compliant with privacy regulations

## Future Improvements

- [ ] Support for batch processing
- [ ] Quality settings (speed vs accuracy)
- [ ] Progress callbacks for long operations
- [ ] Custom background colors/images
- [ ] Edge refinement options

## References

- [Apple Vision Framework](https://developer.apple.com/documentation/vision)
- [Expo Native Modules](https://docs.expo.dev/modules/overview/)
- [iOS On-Device Background Removal](../../Docs/Features/iOS_OnDevice_Background_Removal.md)
