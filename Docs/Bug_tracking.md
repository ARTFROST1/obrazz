# Bug Tracking - Obrazz

## Overview

This document tracks all bugs, errors, and their solutions encountered during the development of the Obrazz application. Each entry includes error details, root cause analysis, and resolution steps.

## Bug Entry Template

```markdown
### BUG-[ID]: [Brief Description]

**Date:** [YYYY-MM-DD]
**Severity:** Critical | High | Medium | Low
**Status:** Open | In Progress | Resolved | Closed
**Component:** [Affected component/feature]
**Environment:** iOS | Android | Web | All

**Description:**
[Detailed description of the bug]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Messages/Logs:**
```

[Error logs or console output]

```

**Root Cause:**
[Analysis of why the bug occurs]

**Solution:**
[Steps taken to resolve the bug]

**Prevention:**
[Measures to prevent similar issues]

**Related Files:**
- [File 1]
- [File 2]
```

---

## Stage 1 Issues - RESOLVED

### BUG-S1-001: Package Version Compatibility

**Date:** 2025-01-13
**Severity:** Medium
**Status:** Resolved
**Component:** Dependencies
**Environment:** All

**Description:**
Multiple package version conflicts during initial npm install.

**Error Messages/Logs:**

```
- eslint-plugin-react@^7.38.0 not found
- eslint-plugin-react-native@^4.2.0 not found
- expo-device@~7.0.9 not found
- husky@^9.3.0 not found
- immer@^10.2.0 not found
```

**Root Cause:**
Requested versions did not exist in npm registry. Some packages had different versioning schemes.

**Solution:**
Updated to latest stable versions:

- `eslint-plugin-react: ^7.37.2`
- `eslint-plugin-react-native: ^4.1.0`
- `expo-device: ~7.0.0`
- `husky: ^9.1.7`
- `lint-staged: ^15.2.10`
- `immer: ^10.1.1`
- `eslint: ^8.57.0` (downgraded from ^9.20.0)
- `@typescript-eslint/*: ^7.18.0` (downgraded from ^8.20.0)

**Prevention:**
Always verify package versions exist before adding to package.json.

**Related Files:**

- package.json

---

### BUG-S1-002: TypeScript Configuration Error

**Date:** 2025-01-13
**Severity:** Low
**Status:** Resolved
**Component:** TypeScript Configuration
**Environment:** All

**Description:**
TypeScript error regarding customConditions option with node moduleResolution.

**Error Messages/Logs:**

```
error TS5098: Option 'customConditions' can only be used when 'moduleResolution' is set to 'node16', 'nodenext', or 'bundler'.
```

**Root Cause:**
Expo's base tsconfig.json uses customConditions but requires bundler moduleResolution.

**Solution:**
Changed moduleResolution from "node" to "bundler" in tsconfig.json.

**Prevention:**
Use recommended Expo TypeScript configuration.

**Related Files:**

- tsconfig.json

---

### BUG-S1-003: React Import Warnings

**Date:** 2025-01-13
**Severity:** Low
**Status:** Resolved
**Component:** TypeScript/ESLint
**Environment:** All

**Description:**
TypeScript warnings about React referring to UMD global in module files.

**Error Messages/Logs:**

```
'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
```

**Root Cause:**
Missing explicit React imports in component files.

**Solution:**
Added `import React from 'react';` to all component files.

**Prevention:**
Always import React explicitly in all component files, even if not directly used.

**Related Files:**

- All screen files in /app/(auth)/ and /app/(tabs)/

---

### BUG-S1-004: Babel Plugin Conflicts

**Date:** 2025-01-13
**Severity:** High
**Status:** Resolved
**Component:** Babel Configuration
**Environment:** All

**Description:**
Duplicate Babel plugin error caused by having both `react-native-worklets/plugin` and `react-native-reanimated/plugin`.

**Error Messages/Logs:**

```
Duplicate plugin/preset detected
react-native-worklets/plugin
react-native-reanimated/plugin
```

**Root Cause:**
React Native Reanimated 4.x already includes worklets functionality, so having both plugins creates a conflict.

**Solution:**

1. Removed `react-native-worklets/plugin` from babel.config.js
2. Kept only `react-native-reanimated/plugin` (which includes worklets)
3. Removed deprecated `expo-router/babel` (included in babel-preset-expo SDK 54)

**Prevention:**
Check Reanimated documentation for required plugins. For Reanimated 4.x, only the reanimated plugin is needed.

**Related Files:**

- babel.config.js

---

### BUG-S1-005: Missing Component Imports

**Date:** 2025-01-13
**Severity:** Medium
**Status:** Resolved
**Component:** Legacy Template Files
**Environment:** All

**Description:**
Template files importing non-existent `@/components/Themed` component.

**Error Messages/Logs:**

```
Unable to resolve "@/components/Themed" from "app\+not-found.tsx"
```

**Root Cause:**
Default Expo template files referencing components that were not part of our project structure.

**Solution:**
Updated legacy files to use standard React Native components:

- `app/+not-found.tsx` - Changed to use standard View/Text
- `app/modal.tsx` - Changed to use standard View/Text
- `app/_layout.tsx` - Changed to use react-native's useColorScheme
- `app/+html.tsx` - Added React import

**Prevention:**
Clean up template files when starting new projects, or create custom templates.

**Related Files:**

- app/+not-found.tsx
- app/modal.tsx
- app/\_layout.tsx
- app/+html.tsx

---

## Known Issues & Solutions

### BUG-001: Expo Router TypeScript Configuration

**Date:** 2025-01-13
**Severity:** High
**Status:** Resolved
**Component:** Navigation/TypeScript
**Environment:** All

**Description:**
TypeScript errors with Expo Router navigation types not properly recognized.

**Error Messages/Logs:**

```
Cannot find module 'expo-router' or its corresponding type declarations
```

**Root Cause:**
Missing TypeScript declarations for Expo Router in tsconfig.json.

**Solution:**

1. Update tsconfig.json with proper module resolution
2. Add "extends": "expo/tsconfig.base" to tsconfig.json
3. Install @types/react if missing
4. Clear TypeScript cache and restart TS server

**Prevention:**
Always use Expo's base TypeScript configuration as starting point.

---

### BUG-002: React Native Reanimated Worklets Plugin

**Date:** 2025-01-13
**Severity:** Critical
**Status:** Resolved
**Component:** Animations
**Environment:** All

**Description:**
React Native Reanimated 4.x requires worklets plugin but babel configuration missing.

**Error Messages/Logs:**

```
Error: Reanimated 3+ requires babel plugin 'react-native-worklets/plugin'
```

**Root Cause:**
Babel configuration missing required worklets plugin for Reanimated 4.

**Solution:**

1. Install react-native-worklets package
2. Add to babel.config.js:

```javascript
plugins: [
  'react-native-worklets/plugin',
  // other plugins
];
```

3. Clear Metro cache: `npx expo start --clear`

**Prevention:**
Check Reanimated documentation for required plugins when upgrading.

---

### BUG-003: Supabase Client Initialization

**Date:** 2025-01-13
**Severity:** High
**Status:** Open
**Component:** Backend/Auth
**Environment:** All

**Description:**
Supabase client not properly initialized with AsyncStorage for React Native.

**Error Messages/Logs:**

```
Warning: AsyncStorage not configured for Supabase Auth persistence
```

**Root Cause:**
Supabase client needs custom storage adapter for React Native.

**Solution:**

1. Install @react-native-async-storage/async-storage
2. Create custom storage adapter:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

**Prevention:**
Use React Native specific configuration for Supabase from the start.

---

### BUG-004: Image Picker Permissions iOS

**Date:** 2025-01-13
**Severity:** Medium
**Status:** Open
**Component:** Image Upload
**Environment:** iOS

**Description:**
iOS requires specific Info.plist permissions for camera and photo library access.

**Steps to Reproduce:**

1. Try to access camera or photo library on iOS
2. App crashes or shows permission error

**Solution:**
Add to app.json:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera to capture clothing items",
        "NSPhotoLibraryUsageDescription": "This app needs access to photo library to select clothing images"
      }
    }
  }
}
```

**Prevention:**
Always configure platform-specific permissions before implementing features.

---

### BUG-005: Android Build Configuration

**Date:** 2025-01-13
**Severity:** Medium
**Status:** Open
**Component:** Build System
**Environment:** Android

**Description:**
Android build fails with SDK version conflicts.

**Error Messages/Logs:**

```
Execution failed for task ':app:checkDebugDuplicateClasses'
```

**Root Cause:**
Conflicting Android SDK versions between dependencies.

**Solution:**

1. Update android/build.gradle:

```gradle
buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 23
        compileSdkVersion = 35
        targetSdkVersion = 35
    }
}
```

2. Run `cd android && ./gradlew clean`

**Prevention:**
Keep all Android SDK versions synchronized across the project.

---

## Common Error Patterns

### Metro Bundler Issues

**Symptoms:**

- Module resolution failures
- Transform errors
- Cache corruption

**Common Solutions:**

1. Clear Metro cache: `npx expo start --clear`
2. Delete node_modules and reinstall
3. Reset watchman: `watchman watch-del-all`
4. Clear all caches:

```bash
npm start -- --reset-cache
cd ios && pod cache clean --all
cd android && ./gradlew clean
```

### TypeScript Errors

**Symptoms:**

- Type definitions not found
- Import path errors
- Generic type errors

**Common Solutions:**

1. Restart TS server in VS Code
2. Delete .tsbuildinfo files
3. Check tsconfig.json paths configuration
4. Ensure all @types packages installed

### State Management Issues

**Symptoms:**

- State not persisting
- Hydration errors
- Infinite re-renders

**Common Solutions:**

1. Check Zustand store configuration
2. Verify persist middleware setup
3. Use proper selector patterns
4. Implement proper cleanup in useEffect

### Performance Issues

**Symptoms:**

- Slow list rendering
- Janky animations
- High memory usage

**Common Solutions:**

1. Use FlashList instead of FlatList
2. Implement proper memoization
3. Optimize image sizes
4. Profile with Flipper or React DevTools

---

## Testing Checklist

Before marking any bug as resolved, ensure:

- [ ] Bug is reproducible in development environment
- [ ] Solution tested on both iOS and Android
- [ ] No regression in related features
- [ ] Performance impact assessed
- [ ] Error handling added if applicable
- [ ] Unit tests updated/added
- [ ] Documentation updated if needed

---

## Debugging Tools

### React Native Debugger

- Download from: https://github.com/jhen0409/react-native-debugger
- Enable: Shake device or Cmd+D (iOS) / Cmd+M (Android)

### Flipper

- Performance monitoring
- Network inspection
- Database browsing
- Layout inspection

### Reactotron

- State inspection
- API call monitoring
- Custom commands
- Timeline tracking

### Chrome DevTools

- Console logging
- Network tab
- Performance profiling
- Memory profiling

---

## Environment Setup Issues

### Node Version

- Required: Node 18.x or higher
- Use nvm to manage versions
- Check with: `node --version`

### Package Manager

- Recommended: npm or yarn
- Don't mix package managers in same project
- Clear lock files when switching

### Platform Tools

- Xcode 15+ for iOS
- Android Studio Hedgehog or higher
- Java 17 for Android builds

---

## Useful Commands

```bash
# Clear everything and start fresh
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build
npm cache clean --force
npm install
cd ios && pod install
npx expo start --clear

# Check for dependency issues
npm ls
npm audit

# Update Expo SDK
expo upgrade

# Validate app.json
expo config --type introspect
```

---

## Contact for Critical Issues

For critical blocking issues that cannot be resolved using this document:

1. Check Expo forums: https://forums.expo.dev/
2. React Native GitHub issues: https://github.com/facebook/react-native/issues
3. Stack Overflow with tags: [react-native] [expo]
4. Discord communities: Reactiflux, Expo Developers

---

## Stage 3 Issues - RESOLVED

### BUG-S3-001: Duplicate React Keys in ColorPicker

**Date:** 2025-01-14
**Severity:** High
**Status:** Resolved
**Component:** ColorPicker Component
**Environment:** All

**Description:**
React warning about duplicate keys in ColorPicker component. The color `#C0C0C0` (Silver) was listed twice in the COLORS array, causing React to throw duplicate key errors.

**Error Messages/Logs:**

```
ERROR  Encountered two children with the same key, `%s` . Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. .$#C0C0C0
```

**Root Cause:**
The COLORS array in `components/wardrobe/ColorPicker.tsx` had duplicate entries:

- Line 21: `{ hex: '#C0C0C0', name: 'Silver' }`
- Line 32: `{ hex: '#C0C0C0', name: 'Silver' }` (duplicate)

**Solution:**
Replaced the duplicate Silver entry with Turquoise:

```typescript
{ hex: '#00CED1', name: 'Turquoise' }
```

**Prevention:**

- Ensure all array items used as React keys are unique
- Add ESLint rule to detect duplicate object values in arrays
- Review color palettes before implementation

**Related Files:**

- components/wardrobe/ColorPicker.tsx

---

### BUG-S3-002: Deprecated expo-file-system Methods

**Date:** 2025-01-14
**Severity:** Critical
**Status:** Resolved
**Component:** File System / Image Storage
**Environment:** All

**Description:**
Expo SDK 54 deprecated legacy file system methods (`readAsStringAsync`, `getInfoAsync`, `writeAsStringAsync`, etc.), causing errors when trying to save images or remove backgrounds.

**Error Messages/Logs:**

```
WARN  Method readAsStringAsync imported from "expo-file-system" is deprecated.
You can migrate to the new filesystem API using "File" and "Directory" classes or import the legacy API from "expo-file-system/legacy".

ERROR  Error saving image locally: [Error: Method getInfoAsync imported from "expo-file-system" is deprecated...]

ERROR  Error removing background: [Error: Method readAsStringAsync imported from "expo-file-system" is deprecated...]
```

**Root Cause:**
Expo SDK 54 introduced a new File System API and moved the old methods to a legacy namespace. Our code was using the deprecated imports directly from `expo-file-system`.

**Solution:**
Updated imports in affected files to use the legacy API:

**Before:**

```typescript
import * as FileSystem from 'expo-file-system';
```

**After:**

```typescript
import * as FileSystem from 'expo-file-system/legacy';
```

**Files Updated:**

1. `services/wardrobe/itemService.ts`
2. `services/wardrobe/backgroundRemover.ts`

**Prevention:**

- Check Expo SDK migration guides when upgrading
- Use the new File/Directory API for future implementations
- Add deprecation warnings to CI/CD pipeline
- Plan migration to new API in Stage 4

**Related Files:**

- services/wardrobe/itemService.ts
- services/wardrobe/backgroundRemover.ts

**Future Migration:**
The legacy API will eventually be removed. Plan to migrate to the new API:

```typescript
import { File, Directory } from 'expo-file-system';
```

---

### BUG-S3-003: TypeScript Import Path Errors

**Date:** 2025-01-14
**Severity:** Medium
**Status:** Resolved
**Component:** TypeScript Configuration
**Environment:** All

**Description:**
TypeScript errors when importing from `@types/` alias path.

**Error Messages/Logs:**

```
Cannot import type declaration files. Consider importing 'models/item' instead of '@types/models/item'.
Cannot import type declaration files. Consider importing 'models/user' instead of '@types/models/user'.
```

**Root Cause:**
TypeScript doesn't allow importing from paths that start with `@types/` as it's a reserved namespace for DefinitelyTyped packages.

**Solution:**
Changed imports from alias paths to relative paths:

**Before:**

```typescript
import { WardrobeItem, ItemCategory } from '@types/models/item';
import { Season, StyleTag } from '@types/models/user';
```

**After:**

```typescript
import { WardrobeItem, ItemCategory } from '../../types/models/item';
import { Season, StyleTag } from '../../types/models/user';
```

**Prevention:**

- Avoid using `@types/` prefix in custom path aliases
- Use different alias like `@models/` or `@app-types/`
- Update tsconfig.json paths if needed

**Related Files:**

- services/wardrobe/itemService.ts
- tsconfig.json (for future alias updates)

---

_Last Updated: 2025-01-14_
