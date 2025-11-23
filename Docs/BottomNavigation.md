# Bottom Navigation Documentation

## Overview

This document describes the implementation of bottom navigation in the Obrazz app, including the iOS native liquid glass effect and Android floating navigation bar.

## Platform-Specific Implementations

### iOS - Native Liquid Glass Tab Bar

**Technology**: `expo-router/unstable-native-tabs` with native iOS UITabBar

**Features**:

- ✅ Native iOS liquid glass blur effect using `systemChromeMaterial`
- ✅ SF Symbols for icons (native iOS icons)
- ✅ Automatic dark/light mode support
- ✅ Compatible with **all iOS versions 13+**
- ✅ Minimize behavior on scroll (iOS 26+, gracefully ignored on older versions)

**Implementation** ([app/(tabs)/\_layout.tsx:102-151](<app/(tabs)/_layout.tsx#L102-L151>)):

```typescript
<NativeTabs
  // Liquid glass blur effect - works on all iOS versions (13+)
  blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}

  // Shadow for depth
  shadowColor={PlatformColor('separator')}

  // Minimize behavior on scroll (gracefully ignored on iOS < 26)
  minimizeBehavior="onScrollDown"

  // Color scheme
  iconColor={PlatformColor('systemGray')}
  tintColor={PlatformColor('label')}

  // Badge styling
  badgeBackgroundColor={Colors[colorScheme ?? 'light'].tint}

  // Label styling for consistency
  labelStyle={{
    fontSize: 10,
    fontWeight: '500',
  }}

  // Keep blur consistent when scrolling
  disableTransparentOnScrollEdge={false}
>
```

#### iOS Blur Effects Available

The `blurEffect` prop accepts the following values for different material appearances:

**System Materials** (automatically adapt to light/dark):

- `systemMaterial` - Standard material
- `systemChromeMaterial` - ⭐ **Recommended** - Chrome-like liquid glass
- `systemThinMaterial` - Thin material
- `systemThickMaterial` - Thick material
- `systemUltraThinMaterial` - Ultra thin material

**Light/Dark Specific**:

- `systemChromeMaterialLight` / `systemChromeMaterialDark`
- `systemMaterialLight` / `systemMaterialDark`
- (and other variants)

**Legacy**:

- `light`, `dark`, `regular`, `prominent`, `extraLight`

#### iOS Compatibility Notes

- **iOS 13-25**: Blur effects work perfectly. `minimizeBehavior` is ignored.
- **iOS 26+**: All features including `minimizeBehavior` are supported.
- **Graceful degradation**: Older iOS versions render blur effects as translucent backgrounds.

### Android - Floating Tab Bar

**Technology**: React Navigation `Tabs` component with custom styling

**Features**:

- ✅ Floating design (not attached to screen bottom)
- ✅ Apple-inspired rounded corners (24px border radius)
- ✅ Elevated with shadow for depth
- ✅ Semi-transparent background with blur-like appearance
- ✅ Smooth animations
- ✅ Dark/light mode support

**Implementation** ([app/(tabs)/\_layout.tsx:21-100](<app/(tabs)/_layout.tsx#L21-L100>)):

```typescript
<Tabs
  screenOptions={{
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    headerShown: false,
    tabBarStyle: {
      // Floating nav styling
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      height: 65,

      // Rounded corners and background
      backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 24,

      // Remove default border
      borderTopWidth: 0,

      // Shadow for floating effect
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,

      // Subtle border
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
  }}
>
```

## Important: Screen Content Padding

### Problem

Because the Android tab bar is **floating** (positioned absolutely), screen content can be hidden behind it.

### Solution

Use the `getTabBarPadding()` helper from [constants/Layout.ts](constants/Layout.ts):

```typescript
import { getTabBarPadding } from '@constants/Layout';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: getTabBarPadding(), // Automatically adds padding only on Android
  },
});
```

Or use the constants directly:

```typescript
import { TAB_BAR_TOTAL_HEIGHT } from '@constants/Layout';

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: Platform.OS === 'android' ? TAB_BAR_TOTAL_HEIGHT : 0,
  },
});
```

### Layout Constants

**File**: [constants/Layout.ts](constants/Layout.ts)

| Constant                | iOS | Android | Description                       |
| ----------------------- | --- | ------- | --------------------------------- |
| `TAB_BAR_HEIGHT`        | 0   | 65      | Tab bar height in pixels          |
| `TAB_BAR_MARGIN_BOTTOM` | 0   | 16      | Bottom margin for floating effect |
| `TAB_BAR_TOTAL_HEIGHT`  | 0   | 81      | Total space: height + margin      |
| `getTabBarPadding()`    | 0   | 81      | Helper function for padding       |

## Example Screen Implementation

### Correct ✅

```typescript
import { getTabBarPadding } from '@constants/Layout';

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Your content here */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: getTabBarPadding(), // Content won't be hidden behind tab bar
  },
});
```

### Incorrect ❌

```typescript
// DON'T: Content will be hidden behind the floating tab bar on Android
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Missing paddingBottom!
  },
});
```

## Design Specifications

### iOS

- **Background**: Native iOS blur material (systemChromeMaterial)
- **Height**: System default (~50px)
- **Position**: Bottom, full width
- **Icons**: SF Symbols (native)
- **Typography**: System font, 10px, medium weight

### Android

- **Background**: Semi-transparent (95% opacity)
  - Light mode: `rgba(255, 255, 255, 0.95)`
  - Dark mode: `rgba(28, 28, 30, 0.95)`
- **Height**: 65px
- **Border Radius**: 24px
- **Margin**: 16px (left, right, bottom)
- **Shadow**:
  - Elevation: 12
  - Shadow opacity: 15% (light), 40% (dark)
  - Shadow radius: 12px
- **Border**: 1px subtle border
  - Light: `rgba(0, 0, 0, 0.06)`
  - Dark: `rgba(255, 255, 255, 0.08)`
- **Icons**: FontAwesome, 24px
- **Typography**: 11px, semi-bold (600)

## Future Enhancements

Potential improvements for future versions:

1. **Android**:
   - Add haptic feedback on tab press
   - Implement smooth hide/show animation on scroll
   - Custom backdrop blur filter (if React Native supports)

2. **iOS**:
   - Badge notifications on tab icons
   - Custom tab bar shapes for specific tabs

3. **Both**:
   - Animated icon transitions
   - Custom tab press animations
   - Accessibility improvements

## Troubleshooting

### iOS: Blur effect not showing

**Cause**: Missing `blurEffect` prop or incompatible iOS version

**Solution**:

1. Verify `blurEffect` is set in `NativeTabs` component
2. Test on iOS 13+ device/simulator
3. Check that you're using `expo-router@6.0.12` or later

### Android: Content hidden behind tab bar

**Cause**: Missing `paddingBottom` on screen content

**Solution**:

1. Import `getTabBarPadding()` from `@constants/Layout`
2. Add to container or ScrollView `contentContainerStyle`
3. See [Example Screen Implementation](#example-screen-implementation)

### Android: Tab bar not floating

**Cause**: Incorrect `position` style

**Solution**: Verify `tabBarStyle.position === 'absolute'` in [\_layout.tsx:30](<app/(tabs)/_layout.tsx#L30>)

## References

- [Expo Router Tabs Documentation](https://docs.expo.dev/router/advanced/tabs/)
- [NativeTabs API](https://docs.expo.dev/router/advanced/native-tabs/)
- [Apple Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Material Design - Bottom Navigation](https://m3.material.io/components/navigation-bar/overview)

## Version History

- **2025-11-23**: Initial implementation with iOS liquid glass and Android floating nav
