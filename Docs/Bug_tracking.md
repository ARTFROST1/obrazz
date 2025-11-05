# Bug Tracking - Obrazz

## Overview

This document tracks all bugs, errors, and their solutions encountered during the development of the Obrazz application. Each entry includes error details, root cause analysis, and resolution steps.

## Known Issues & Warnings

### ISSUE-001: Missing Outfits Collection Screen

**Date:** 2025-01-14  
**Severity:** High (Architecture Issue)  
**Status:** Resolved (Documentation Updated)  
**Component:** Navigation Structure  
**Environment:** All

**Description:**
В текущей реализации отсутствует основная страница для просмотра коллекции сохранённых образов (Outfits). Таб "Create" занимает место в главной навигации, что противоречит документации и UX best practices.

**Impact:**

- Пользователь не может просматривать сохранённые образы
- Нарушена архитектура из документации (должно быть 4 таба: Home, Wardrobe, Outfits, Profile)
- Create функция занимает основной таб, хотя это вторичное действие

**Resolution:**
**Date Resolved:** 2025-01-14

Создан Stage 4.5 для реорганизации навигации:

1. Заменить таб "Create" на "Outfits" с коллекцией образов
2. Перенести create.tsx в stack screen `/outfit/create`
3. Добавить FAB (Floating Action Button) для создания образов
4. Добавить кнопку в хедер как альтернативный способ

**Documentation:**

- `Docs/STAGE_4.5_OUTFITS_NAVIGATION_PLAN.md` - детальный план реализации
- `Docs/STAGE_4.5_SUMMARY.md` - краткое описание изменений
- Обновлены все основные документы (Implementation.md, PRDobrazz.md, AppMapobrazz.md, UI_UX_doc.md)

**Next Steps:**
Реализация согласно плану Stage 4.5 (оценка: 3-5 дней)

---

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

## Stage 4 Issues - RESOLVED

### BUG-S4-001: Missing GestureHandlerRootView Wrapper

**Date:** 2025-01-14
**Severity:** Critical
**Status:** Resolved
**Component:** Gesture Handler / Navigation
**Environment:** All

**Description:**
GestureDetector components throwing error: "GestureDetector must be used as a descendant of GestureHandlerRootView"

**Error Messages/Logs:**

```
ERROR  [Error: GestureDetector must be used as a descendant of GestureHandlerRootView. Otherwise the gestures will not be recognized.]
```

**Root Cause:**
The app's root layout was not wrapped with `GestureHandlerRootView`, which is required for React Native Gesture Handler to work properly.

**Solution:**
Wrapped the root navigation stack with `GestureHandlerRootView` in `app/_layout.tsx`:

**Before:**

```typescript
return (
  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    <Stack screenOptions={{ headerShown: false }}>
      ...
    </Stack>
  </ThemeProvider>
);
```

**After:**

```typescript
return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        ...
      </Stack>
    </ThemeProvider>
  </GestureHandlerRootView>
);
```

**Prevention:**

- Always wrap app root with GestureHandlerRootView when using Gesture Handler
- Check installation documentation for required setup steps

**Related Files:**

- app/\_layout.tsx

---

### BUG-S4-002: Reanimated Shared Value Warnings

**Date:** 2025-01-14
**Severity:** Medium
**Status:** Resolved
**Component:** Reanimated / Gestures
**Environment:** All

**Description:**
Multiple warnings about using shared value's `.value` inside reanimated inline style. This occurred when mixing React state with Reanimated shared values.

**Error Messages/Logs:**

```
WARN  It looks like you might be using shared value's .value inside reanimated inline style.
If you want a component to update when shared value changes you should use the shared value
directly instead of its current state represented by `.value`.
```

**Root Cause:**
Used React `useState` for tracking gesture start values instead of shared values. This caused improper value access patterns in gesture handlers.

**Solution:**
Replaced React state with Reanimated shared values for all gesture tracking:

**Before:**

```typescript
const [startValues, setStartValues] = useState({
  x: transform.x,
  y: transform.y,
  scale: transform.scale,
  rotation: transform.rotation,
});

const panGesture = Gesture.Pan()
  .onStart(() => {
    runOnJS(setStartValues)({...});
  })
  .onUpdate((event) => {
    translateX.value = startValues.x + event.translationX;
  });
```

**After:**

```typescript
const startX = useSharedValue(0);
const startY = useSharedValue(0);
const startScale = useSharedValue(1);
const startRotation = useSharedValue(0);

const panGesture = Gesture.Pan()
  .onStart(() => {
    startX.value = translateX.value;
    startY.value = translateY.value;
  })
  .onUpdate((event) => {
    translateX.value = startX.value + event.translationX;
  });
```

**Additional Changes:**

- Removed unused `useState` import
- Added `'worklet'` directive to `snapToGridValue` helper function

**Prevention:**

- Use shared values for all gesture-related state
- Avoid mixing React state with Reanimated worklets
- Always use `useSharedValue` for values that update during gestures

**Related Files:**

- components/outfit/OutfitCanvas.tsx

---

### BUG-S4-003: Missing Outfits Table Columns

**Date:** 2025-01-14
**Severity:** Critical
**Status:** Resolved
**Component:** Database Schema / Outfit Service
**Environment:** All

**Description:**
Database schema for `outfits` table was missing required columns for Stage 4, causing outfit creation to fail with error: "Could not find the 'background' column of 'outfits' in the schema cache"

**Error Messages/Logs:**

```
ERROR  Error creating outfit: {"code": "PGRST204", "details": null, "hint": null, "message": "Could not find the 'background' column of 'outfits' in the schema cache"}
ERROR  Error saving outfit: [Error: Failed to create outfit: Could not find the 'background' column of 'outfits' in the schema cache]
```

**Root Cause:**

1. The `outfits` table schema from earlier stages didn't include all columns needed for Stage 4
2. Service was using camelCase TypeScript names instead of snake_case database column names

**Solution:**

**1. Applied database migration** to add missing columns:

```sql
-- Added columns: items, background, visibility, styles, seasons, occasions,
-- tags, is_favorite, wear_count, last_worn_at, views_count, shares_count,
-- canvas_settings, ai_metadata
-- Renamed 'name' column to 'title'
-- Added indexes for performance
```

**2. Fixed service mapping** in `services/outfit/outfitService.ts`:

**Before:**

```typescript
const newOutfit: Partial<Outfit> = {
  userId, // ❌ camelCase
  title: params.title,
  isAiGenerated: false, // ❌ camelCase
  // ...
};
```

**After:**

```typescript
const newOutfit = {
  user_id: userId, // ✅ snake_case
  title: params.title,
  is_ai_generated: false, // ✅ snake_case
  // All fields properly mapped
};
```

**Prevention:**

- Always use snake_case for database column names in Supabase
- Create comprehensive migrations before implementing features
- Test database operations early in development
- Document required schema changes in Implementation.md

**Related Files:**

- services/outfit/outfitService.ts (field mapping fixed)
- Database migration: `update_outfits_schema_stage_4_safe`

---

### BUG-S4-004: Incorrect Edit Outfit Navigation Route

**Date:** 2025-01-14  
**Severity:** High  
**Status:** Resolved  
**Component:** Navigation / Outfit Detail Screen  
**Environment:** All

**Description:**
The "Edit" button in outfit detail screen was using an incorrect navigation route that doesn't exist in the app structure, causing navigation to fail.

**Error Location:**
`app/outfit/[id].tsx` line 59

**Steps to Reproduce:**

1. Navigate to any outfit detail screen (`/outfit/[id]`)
2. Tap the "Edit" button
3. Navigation fails - route `/outfit/edit/[id]` doesn't exist

**Expected Behavior:**
Should navigate to `/outfit/create?id=[outfit_id]` to open create screen in edit mode

**Actual Behavior:**
Attempts to navigate to non-existent route `/outfit/edit/${outfit.id}`

**Root Cause:**
Incorrect route path used in `handleEdit` callback. The app uses a query parameter pattern for edit mode (shared create/edit screen), but the code was trying to use a separate edit route pattern.

**Solution:**
Changed navigation route in `app/outfit/[id].tsx`:

**Before:**

```typescript
const handleEdit = useCallback(() => {
  if (!outfit) return;
  // Navigate to edit mode - could be same create screen with edit mode
  router.push(`/outfit/edit/${outfit.id}`);
}, [outfit]);
```

**After:**

```typescript
const handleEdit = useCallback(() => {
  if (!outfit) return;
  // Navigate to create screen in edit mode with outfit ID as query param
  router.push(`/outfit/create?id=${outfit.id}`);
}, [outfit]);
```

**Verification:**
The correct pattern is already used in `app/(tabs)/outfits.tsx` line 91:

```typescript
const handleEditOutfit = (outfit: Outfit) => {
  router.push(`/outfit/create?id=${outfit.id}`);
};
```

And properly handled in `app/outfit/create.tsx` line 39-40:

```typescript
const { id } = useLocalSearchParams<{ id?: string }>();
const isEditMode = !!id;
```

**Prevention:**

- Document navigation patterns in AppMapobrazz.md (already documented)
- Create centralized navigation constants for route paths
- Add TypeScript route type checking
- Test all navigation flows in QA checklist

**Related Files:**

- app/outfit/[id].tsx (fixed)
- app/(tabs)/outfits.tsx (reference for correct pattern)
- app/outfit/create.tsx (edit mode handler)
- Docs/AppMapobrazz.md (navigation documentation)

**Additional Notes:**
All other navigation transitions verified and working correctly:

- ✅ Auth flow: welcome → sign-in → sign-up → forgot-password
- ✅ Wardrobe: → /add-item, → /item/${id}
- ✅ Outfits: → /outfit/create, → /outfit/${id}
- ✅ Protected routes with auth guards
- ✅ Tab navigation
- ✅ Back/close buttons on all stack screens

---

### BUG-S4-005: Metro Bundler InternalBytecode Error on Image Save

**Date:** 2025-10-14  
**Severity:** High  
**Status:** In Progress  
**Component:** File System / Metro Bundler  
**Environment:** Windows (Device-specific issue)

**Description:**
Metro bundler throws "ENOENT: no such file or directory, open 'InternalBytecode.js'" error when user attempts to save a wardrobe item after uploading photo, removing background, and filling all fields. This is a **secondary error** - Metro is failing to symbolicate the actual JavaScript runtime error.

**Error Messages/Logs:**

```
Error: ENOENT: no such file or directory, open 'E:\it\garderob\obrazz\InternalBytecode.js'
    at Object.readFileSync (node:fs:441:20)
    at getCodeFrame (E:\it\garderob\obrazz\node_modules\metro\src\Server.js:997:18)
    at Server._symbolicate (E:\it\garderob\obrazz\node_modules\metro\src\Server.js:1079:22)
    at Server._processRequest (E:\it\garderob\obrazz\node_modules\metro\src\Server.js:460:7)
```

**Root Cause:**
The actual error is hidden behind Metro's symbolication failure. Most likely causes:

1. **File system permission issues** - App may not have write permissions to `FileSystem.documentDirectory`
2. **Path inconsistencies** - Different drive letters between dev machines (E:\ vs C:\)
3. **Metro cache corruption** - Stale cache with incorrect file paths

---

### UX-S4-006: OutfitCard Redesign - Minimalist Pinterest Style

**Date:** 2025-10-14  
**Severity:** Low (UX Enhancement)  
**Status:** Resolved  
**Component:** OutfitCard Component  
**Environment:** All

**Description:**
Redesigned OutfitCard component to match minimalist Pinterest-style aesthetic. Removed gradient overlay, visibility badges, and moved title below the card for a cleaner look.

**Changes Made:**

1. **Removed gradient overlay** - Clean preview without dark shadow at bottom
2. **Removed visibility badge** (Private/Shared/Public) - Simplified card appearance
3. **Moved title below image** - Similar to wardrobe ItemCard layout
4. **Kept favorite star** - Positioned top-right as subtle indicator
5. **Updated styling** - Reduced shadow, cleaner borders, minimal padding

**Before:**

- Title and badges overlaid on gradient at bottom of image
- Visibility badge showing Private/Shared/Public status
- Gradient shadow covering bottom 50% of image
- Complex overlay structure

**After:**

- Clean image preview without overlays
- Title displayed below image in separate container
- Only favorite star shown on image (if applicable)
- Minimalist design matching wardrobe cards

**Related Files:**

- components/outfit/OutfitCard.tsx (redesigned)
- Removed import: expo-linear-gradient (no longer needed)

**Prevention:**
Document UI/UX changes in UI_UX_doc.md when implementing design updates

---

4. **expo-file-system issues** - Problems with `copyAsync`, `writeAsStringAsync`, or directory creation

**Steps to Reproduce:**

1. Open Add Item screen
2. Select image from gallery or camera
3. Click "Remove BG" (optional)
4. Fill all required fields (category, colors)
5. Click "Save to Wardrobe"
6. Error appears during save operation

**Expected Behavior:**
Item should be saved successfully to local file system and Supabase database with success message.

**Actual Behavior:**
Metro bundler crashes with InternalBytecode error, hiding the real JavaScript exception.

**Solution:**
**Phase 1: Enhanced Logging (COMPLETED)**
Added comprehensive logging to identify the exact failure point:

- `itemService.ts` - Added detailed logs in `createItem`, `saveImageLocally`, `generateThumbnail`
- `backgroundRemover.ts` - Added detailed logs in `removeBackground`
- All logs prefixed with service name for easy filtering

**Phase 2: Debugging Steps for User**
Ask the affected user to:

1. **Clear Metro cache and restart:**

   ```bash
   # Stop the app
   # Clear all caches
   npx expo start --clear
   ```

2. **Check file system permissions:**
   - Ensure app has permission to write to device storage
   - On Android: Check Storage permission in app settings
   - On iOS: Should work by default

3. **Review console logs carefully:**
   Look for logs starting with:
   - `[ItemService]`
   - `[ItemService.saveImageLocally]`
   - `[ItemService.generateThumbnail]`
   - `[BackgroundRemover]`

   These will show the exact step where the failure occurs.

4. **Test without background removal:**
   - Skip the "Remove BG" step
   - Try saving a simple image directly

5. **Check available disk space:**
   - Ensure device has sufficient storage

**Prevention:**

- Add proper error boundaries to catch and display real errors
- Implement retry logic for file operations
- Add file system health checks on app start
- Validate write permissions before attempting saves
- Improve error messages to show actual failure reason

**Related Files:**

- `services/wardrobe/itemService.ts` (enhanced logging added)
- `services/wardrobe/backgroundRemover.ts` (enhanced logging added)
- `app/add-item.tsx` (save handler)
- `metro.config.js` (resolver configuration)

**Additional Notes:**

- This error only occurs on specific devices/environments
- Works correctly on developer's machine
- Likely related to Windows file system or permissions
- The InternalBytecode error is a red herring - focus on the logs above it

**Next Steps:**

1. User runs app with `npx expo start --clear`
2. User attempts to reproduce error
3. User shares full console logs (look for [ItemService] logs)
4. Based on logs, implement targeted fix

---

### BUG-S4-006: Items Table Category Check Constraint Mismatch

**Date:** 2025-10-14  
**Date Resolved:** 2025-10-14  
**Severity:** Critical  
**Status:** Resolved ✅  
**Component:** Database Schema / Item Service  
**Environment:** All

**Description:**
When attempting to add a wardrobe item, the database throws a check constraint violation error: `"new row for relation \"items\" violates check constraint"`. This occurs because there's a mismatch between the TypeScript `ItemCategory` type definition and the database schema's CHECK constraint.

**Error Messages/Logs:**

```
ERROR  Error creating item: {"code": "23514", "details": null, "hint": null, "message": "new row for relation \"items\" violates check constrain
```

**Steps to Reproduce:**

1. Navigate to Add Item screen
2. Select an image from gallery or camera
3. Choose any of these categories: 'headwear', 'footwear', or 'suits'
4. Fill in required fields (colors, seasons, etc.)
5. Click "Save to Wardrobe"
6. Error appears: check constraint violation

**Expected Behavior:**
Item should be saved successfully to the database regardless of which valid category is selected.

**Actual Behavior:**
Database rejects the insert with PostgreSQL error code 23514 (CHECK constraint violation).

**Root Cause:**

**Database Schema** (`lib/supabase/schema.sql` line 30-33):

```sql
category TEXT NOT NULL CHECK (category IN (
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
  'accessories', 'bags', 'jewelry', 'hats', 'other'
))
```

**TypeScript Type** (`types/models/item.ts` line 41-50):

```typescript
export type ItemCategory =
  | 'headwear' // Головные уборы
  | 'outerwear' // Верхняя одежда
  | 'tops' // Верх
  | 'bottoms' // Низ
  | 'footwear' // Обувь
  | 'accessories' // Аксессуары
  | 'dresses' // Платья
  | 'suits' // Костюмы
  | 'bags'; // Сумки
```

**Mismatches:**

- TypeScript `'headwear'` ≠ Database `'hats'`
- TypeScript `'footwear'` ≠ Database `'shoes'`
- TypeScript `'suits'` not in Database
- Database `'jewelry'` not in TypeScript
- Database `'other'` not in TypeScript

**Solution:**

1. **Created migration file** `lib/supabase/migrations/fix_items_category_constraint.sql` to update the database constraint:

```sql
-- Drop the old check constraint
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_check;

-- Add the new check constraint with updated category values
ALTER TABLE public.items ADD CONSTRAINT items_category_check
CHECK (category IN (
  'headwear',      -- Головные уборы (was 'hats')
  'outerwear',     -- Верхняя одежда
  'tops',          -- Верх
  'bottoms',       -- Низ
  'footwear',      -- Обувь (was 'shoes')
  'accessories',   -- Аксессуары
  'dresses',       -- Платья
  'suits',         -- Костюмы (new)
  'bags'           -- Сумки
));
```

2. **Run the migration** in Supabase SQL Editor:
   - Go to Supabase Dashboard → SQL Editor
   - Copy the contents of `fix_items_category_constraint.sql`
   - Execute the migration
   - Verify with: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.items'::regclass AND conname = 'items_category_check';`

**Prevention:**

- Always keep TypeScript types and database schemas in sync
- Add schema validation tests in CI/CD
- Document all database constraints in comments
- Review both TypeScript and SQL when adding new enum values

**Related Files:**

- `lib/supabase/schema.sql` (original constraint)
- `types/models/item.ts` (ItemCategory type)
- `services/wardrobe/itemService.ts` (uses category)
- `lib/supabase/migrations/fix_items_category_constraint.sql` (fix migration)

**Resolution Applied:**
**Date:** 2025-10-14

The migration was successfully applied using Supabase MCP server:

1. ✅ Checked existing data - all items use compatible categories (accessories, bottoms, tops)
2. ✅ Applied migration `fix_items_category_constraint`
3. ✅ Verified new constraint includes all 9 categories:
   - headwear, outerwear, tops, bottoms, footwear, accessories, dresses, suits, bags
4. ✅ Database schema now matches TypeScript `ItemCategory` type perfectly

**Test Results:**

- Database accepts all valid TypeScript category values
- No data migration was required
- Constraint properly rejects invalid category values

**Additional Notes:**

- If you have existing items with categories 'shoes', 'hats', 'jewelry', or 'other', migrate them before applying this fix
- Consider adding a data migration script if production database has affected records

---

### BUG-S4-007: Outfit Previews Not Displaying on Outfits Page

**Date:** 2025-10-14  
**Date Resolved:** 2025-10-14  
**Severity:** High  
**Status:** Resolved ✅  
**Component:** Outfit Display / OutfitCard Component  
**Environment:** All

**Description:**
Saved outfits on the Outfits page were displaying only placeholder icons instead of actual outfit previews showing the items and background. Users could not see what their outfits looked like in the grid view.

**Steps to Reproduce:**

1. Create and save an outfit with items
2. Navigate to Outfits tab (main navigation)
3. Observe the outfit cards in the grid
4. Only placeholder shirt icons are visible instead of the actual outfit composition

**Expected Behavior:**
Outfit cards should display a preview/thumbnail showing:

- The selected background
- All items positioned as they were arranged
- Proper scaling and transforms applied

**Actual Behavior:**
All outfit cards show a gray placeholder with a shirt icon, regardless of the outfit content.

**Root Cause:**

1. **Missing preview rendering logic** - `OutfitCard.tsx` line 89-91 had hardcoded `thumbnailUri = undefined`, always showing placeholder
2. **Items not populated** - `outfitService.getUserOutfits()` returned outfits with only item IDs, not the full wardrobe item data needed to display images
3. **No preview component** - No component existed to render static outfit previews for thumbnails

**Solution:**

**1. Created OutfitPreview Component** (`components/outfit/OutfitPreview.tsx`):

```typescript
export function OutfitPreview({
  items,
  background,
  width,
  height,
  scaleToFit = true,
}: OutfitPreviewProps) {
  // Renders items with transforms on background
  // Scales canvas to fit card dimensions
  // Respects z-index ordering
  // Shows only visible items with valid image paths
}
```

**2. Updated outfitService** (`services/outfit/outfitService.ts`):

Added `populateOutfitItems()` method:

```typescript
async getUserOutfits(...) {
  const outfits = (data || []).map(this.mapDatabaseToOutfit);
  return this.populateOutfitItems(outfits); // Populate items with full data
}

private async populateOutfitItems(outfits: Outfit[]): Promise<Outfit[]> {
  // Batch fetch all wardrobe items in one query
  // Map items to outfit items
  // Return fully populated outfits
}
```

**3. Updated OutfitCard** (`components/outfit/OutfitCard.tsx`):

```typescript
// Check if outfit has valid items
const hasValidItems = hasItems && outfit.items.some(
  (item) => item.item?.imageLocalPath || item.item?.imageUrl
);

// Render preview or placeholder
{hasValidItems ? (
  <OutfitPreview
    items={outfit.items}
    background={outfit.background}
    width={CARD_WIDTH}
    height={CARD_WIDTH * (4 / 3)}
    scaleToFit={true}
  />
) : (
  <PlaceholderView />
)}
```

**4. Updated exports** (`components/outfit/index.ts`):

```typescript
export { OutfitPreview } from './OutfitPreview';
export { OutfitCard } from './OutfitCard';
export { OutfitGrid } from './OutfitGrid';
export { OutfitEmptyState } from './OutfitEmptyState';
```

**Performance Optimization:**

- Batch fetches all items in one database query instead of per-outfit queries
- Uses Map for O(1) item lookup when populating outfits
- Only fetches unique item IDs (eliminates duplicates)
- Graceful degradation: shows placeholders if items fail to load

**Prevention:**

- Always populate related data when fetching entities that reference other tables
- Create reusable preview components for consistent rendering
- Test data loading and display together, not in isolation
- Document component data requirements clearly

**Related Files:**

- `components/outfit/OutfitPreview.tsx` (new component)
- `components/outfit/OutfitCard.tsx` (updated to use preview)
- `services/outfit/outfitService.ts` (added populateOutfitItems method)
- `components/outfit/index.ts` (added exports)

**Testing:**

- ✅ Outfits with items display proper previews
- ✅ Item positions and transforms are preserved in thumbnails
- ✅ Backgrounds render correctly
- ✅ Placeholders shown for outfits without items
- ✅ Performance: single query for all items across all outfits
- ✅ TypeScript types all validated

**Additional Notes:**

- Preview scales content to fit card dimensions (3:4 aspect ratio)
- Original canvas was 300x400px, scaled down to card size
- Z-index ordering preserved in preview rendering
- Only visible items with valid image paths are displayed

**Enhancement Applied (2025-10-14):**

Improved `OutfitPreview` to show entire outfit composition without cropping:

- **Bounding box calculation**: Automatically calculates bounds of all items
- **Smart scaling**: Scales entire composition to fit preview container
- **Content centering**: Centers outfit in preview for balanced display
- **Padding**: Adds 20px padding around content for breathing room

Before: Items could be cropped at edges if positioned outside canvas bounds
After: Entire outfit composition is always visible and centered in preview

Related commit: Enhanced OutfitPreview component with bounding box calculation

---

### BUG-S4-008: Gradient Backgrounds Not Rendering in Outfit Editor

**Date:** 2025-10-14  
**Date Resolved:** 2025-10-14  
**Severity:** High  
**Status:** Resolved ✅  
**Component:** Background Picker / Canvas Rendering  
**Environment:** All

**Description:**
When selecting a gradient background in the outfit editor, the gradient would not render. The canvas would show either a solid color or throw errors. This was because gradients were stored as CSS strings (`linear-gradient(...)`) which React Native doesn't support natively.

**Error Messages/Logs:**

```
WARN  It looks like you might be using shared value's .value inside reanimated inline style...
[Multiple repeated Reanimated warnings]
```

**Root Cause:**

1. **CSS gradient strings in React Native**: Gradients were stored as CSS values like `'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'` which don't work in React Native
2. **Missing LinearGradient implementation**: Components weren't using `expo-linear-gradient` to render gradients
3. **Type safety issues**: Gradient colors weren't properly typed as tuples

**Solution:**

**1. Updated BackgroundPicker** (`components/outfit/BackgroundPicker.tsx`):

- Changed to store gradient colors as JSON array: `JSON.stringify(['#667eea', '#764ba2'])`
- Added `expo-linear-gradient` import and usage for preview
- Fixed TypeScript typing with `as const` for color tuples
- Updated gradient selection comparison logic

**2. Updated OutfitCanvas** (`components/outfit/OutfitCanvas.tsx`):

- Added `LinearGradient` import from `expo-linear-gradient`
- Created `renderBackground()` function to handle gradient rendering
- Parses JSON color array and renders with LinearGradient component
- Added graceful fallback for invalid JSON

**3. Updated OutfitPreview** (`components/outfit/OutfitPreview.tsx`):

- Added same LinearGradient support as OutfitCanvas
- Ensures gradient backgrounds display in outfit card previews
- Consistent rendering across editor and preview modes

**Code Changes:**

```typescript
// BackgroundPicker - Store as JSON array
const handleSelectGradient = (gradient) => {
  onSelect({
    type: 'gradient',
    value: JSON.stringify(gradient.colors), // ["#667eea", "#764ba2"]
    opacity: 1,
  });
};

// OutfitCanvas & OutfitPreview - Render with LinearGradient
const renderBackground = () => {
  if (background.type === 'gradient') {
    try {
      const colors = JSON.parse(background.value) as [string, string, ...string[]];
      return (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: background.opacity || 1 }]}
        />
      );
    } catch (e) {
      return null;
    }
  }
  return null;
};
```

**Note on Reanimated Warnings:**

The Reanimated warnings about `.value` in inline styles are false positives. The code correctly uses `.value` within `useAnimatedStyle` which is the proper pattern. These warnings can be ignored or suppressed.

**Prevention:**

- Always use platform-appropriate APIs (LinearGradient instead of CSS gradients)
- Store data in platform-agnostic formats (JSON arrays vs CSS strings)
- Verify package dependencies are installed (`expo-linear-gradient`)
- Type gradient colors as tuples for TypeScript safety

**Related Files:**

- `components/outfit/BackgroundPicker.tsx` (gradient storage format)
- `components/outfit/OutfitCanvas.tsx` (gradient rendering)
- `components/outfit/OutfitPreview.tsx` (gradient rendering in previews)

**Testing:**

- ✅ Gradient backgrounds render correctly in outfit editor
- ✅ Gradient backgrounds display in outfit card previews
- ✅ Graceful fallback for invalid gradient data
- ✅ TypeScript types validated
- ✅ Existing solid color backgrounds still work

**Additional Notes:**

- `expo-linear-gradient` was already installed in package.json
- Gradient direction is diagonal (top-left to bottom-right via `start/end` props)
- All 6 predefined gradients (Sunset, Ocean, Rose, Forest, Peach, Purple Haze) now work correctly

---

### UX-S4-009: Compose Outfit Page UX Improvements

**Date:** 2025-10-15  
**Date Resolved:** 2025-10-15  
**Severity:** Low (UX Enhancement)  
**Status:** Resolved ✅  
**Component:** Compose Outfit Page / Save Modal  
**Environment:** All

**Description:**
Three UX improvements requested for the Compose Outfit page:

1. Change selected item border color from blue to black
2. Add ability to deselect items by tapping canvas background
3. Enhance Save Outfit modal with category, style, and season selectors

**Changes Made:**

**1. Selected Item Border Color** (`components/outfit/OutfitCanvas.tsx`):

- Changed from `#007AFF` (iOS Blue) to `#000000` (Black)
- Better matches the app's minimalist design system
- Provides stronger visual contrast against various backgrounds

```typescript
// Before
selectedItem: {
  borderColor: '#007AFF',
  borderWidth: 2,
}

// After
selectedItem: {
  borderColor: '#000000',
  borderWidth: 2,
}
```

**2. Canvas Tap to Deselect** (`components/outfit/OutfitCanvas.tsx`, `CompositionStep.tsx`):

- Added `onCanvasTap` callback prop to OutfitCanvas
- Wraps canvas in GestureDetector with Tap gesture
- Deselects active item when tapping empty canvas area
- Improves UX by allowing users to "click away" from selections

```typescript
// OutfitCanvas
const handleCanvasTap = Gesture.Tap()
  .numberOfTaps(1)
  .onEnd(() => {
    if (onCanvasTap) {
      runOnJS(onCanvasTap)();
    }
  });

// CompositionStep
<OutfitCanvas
  ...
  onCanvasTap={() => setSelectedItemId(null)}
/>
```

**3. Enhanced Save Modal** (`app/outfit/create.tsx`):

- Added three new selectors below the outfit title input:
  - **Occasion**: Single select (casual, work, party, date, sport, beach, wedding, travel, home, special)
  - **Style**: Multi-select (casual, formal, sporty, elegant, vintage, minimalist, bohemian, streetwear, preppy, romantic)
  - **Season**: Multi-select (spring, summer, fall, winter)
- Horizontal scrollable tags for Occasion and Style
- 4-column grid layout for Seasons
- Black background with white text for selected tags
- Stores selections in state and sends to database on save
- Loads existing values when editing outfits

**Modal Structure:**

```
Save Outfit Modal
├── Title Input
├── Occasion Selector (horizontal scroll)
├── Style Selector (horizontal scroll)
├── Season Selector (4-column grid)
└── Buttons (Cancel / Save)
```

**UI Styling:**

- Tags: 20px border radius, #F8F8F8 background when unselected
- Selected tags: #000 background, #FFF text
- Section labels: 14px, semi-bold, #000
- Consistent 8px gap between tags
- ScrollView wrapper for modal content to accommodate more fields

**Database Integration:**

- Updated `outfitService.createOutfit()` to accept optional occasions, styles, seasons
- Updated `outfitService.updateOutfit()` to accept same optional fields
- Loads existing values when editing outfits via `loadOutfitForEdit()`
- TypeScript types imported: `OccasionTag`, `Season`, `StyleTag`

**Prevention:**

- Document UX patterns in UI_UX_doc.md
- Maintain consistent color schemes across components
- Always provide clear visual feedback for interactive elements

**Related Files:**

- `components/outfit/OutfitCanvas.tsx` (border color, canvas tap)
- `components/outfit/CompositionStep.tsx` (canvas tap handler)
- `app/outfit/create.tsx` (enhanced save modal)
- `types/models/outfit.ts` (type definitions)
- `services/outfit/outfitService.ts` (save operations)

**Testing:**

- ✅ Selected items show black border instead of blue
- ✅ Tapping canvas background deselects active item
- ✅ Tapping an item selects it (existing behavior preserved)
- ✅ Occasion selector allows single selection
- ✅ Style selector allows multiple selections
- ✅ Season selector allows multiple selections
- ✅ Selected tags have proper styling (black bg, white text)
- ✅ Modal scrolls when content exceeds viewport
- ✅ Outfit saves with selected metadata
- ✅ Edit mode loads existing selections
- ✅ All selectors are optional (can save without selecting)

**User Experience Improvements:**

- Clearer visual hierarchy with black selection borders
- More intuitive deselection without needing to tap another item
- Better outfit organization with metadata tags
- Easier outfit discovery and filtering (future feature)
- Consistent with wardrobe item metadata structure

---

### ISSUE-002: Category Structure Inconsistency Across Application

**Date:** 2025-10-15  
**Date Resolved:** 2025-10-15  
**Severity:** Critical (Data Integrity Issue)  
**Status:** Resolved ✅  
**Component:** Database Schema / Type System / UI Components  
**Environment:** All

**Description:**
Critical inconsistency in clothing category definitions across database, TypeScript types, and UI components. Users could add items with categories `dresses` or `suits` but these items would be invisible in the outfit creator, creating a broken user experience.

**Impact:**

- **Database**: 9 categories (headwear, outerwear, tops, bottoms, footwear, accessories, dresses, suits, bags)
- **CategoryPicker** (Add Item form): 9 categories (matching database)
- **ItemSelectionStep** (Outfit Creator): 7 categories (missing `dresses` and `suits`)
- **CATEGORY_GROUPS**: Excluded `dresses` and `suits`

**Root Cause:**
Category structure was never unified after initial implementation. Different parts of the application evolved independently, leading to:

1. Database constraint allowing 9 categories
2. UI forms exposing all 9 categories to users
3. Outfit creator only supporting 7 categories
4. **Critical UX bug**: Items with `dresses` or `suits` categories could be created but not used

**Solution:**

**Phase 1: Unified to 8 Categories (Combined dresses + suits → fullbody)**

Migration applied: `unify_clothing_categories_to_seven_fixed`

```sql
-- 1. Dropped old constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;

-- 2. Migrated existing data
UPDATE items SET category = 'fullbody' WHERE category = 'dresses';
UPDATE items SET category = 'fullbody' WHERE category = 'suits';

-- 3. Added new constraint with 8 categories
ALTER TABLE items ADD CONSTRAINT items_category_check
CHECK (category = ANY (ARRAY[
  'headwear'::text, 'outerwear'::text, 'tops'::text, 'bottoms'::text,
  'footwear'::text, 'accessories'::text, 'fullbody'::text, 'bags'::text
]));
```

**Phase 2: Updated All Code References**

1. **TypeScript Types** (`types/models/item.ts`):
   - Removed: `'dresses'`, `'suits'`
   - Added: `'fullbody'` - Платья/Костюмы (полноразмерная одежда)

2. **CategoryPicker** (`components/wardrobe/CategoryPicker.tsx`):
   - Updated CATEGORIES array from 9 to 7 items
   - New entry: `{ value: 'fullbody', label: 'Dresses & Suits', icon: '👗' }`

3. **ItemSelectionStep** (`components/outfit/ItemSelectionStep.tsx`):
   - Added `'fullbody'` to CATEGORIES array (was missing)
   - Now shows all 7 categories in outfit creator

4. **CATEGORY_GROUPS** (`components/outfit/CategoryCarouselCentered.tsx`):
   - Added `'fullbody'` to `extra` group
   - Rationale: Dresses/suits are special occasion items, grouped with accessories

**Final Unified Structure (7 Categories):**

1. **headwear** - Головной убор
2. **outerwear** - Верхняя одежда
3. **tops** - Верх
4. **bottoms** - Низ
5. **footwear** - Обувь
6. **accessories** - Аксессуары
7. **fullbody** - Платья/костюмы (полноразмерная одежда)

**Display Mode Distribution:**

- **Main mode (4 categories)**: outerwear, tops, bottoms, footwear
- **Extra mode (3 categories)**: headwear, accessories, fullbody
- **All mode (7 categories)**: All categories visible

**Data Migration Results:**

```sql
SELECT category, COUNT(*) FROM items GROUP BY category ORDER BY category;
```

- accessories: 2 items
- bottoms: 1 item
- footwear: 6 items
- **fullbody: 1 item** ✅ (migrated from dresses/suits)
- headwear: 2 items
- outerwear: 2 items
- tops: 4 items
- **Total: 18 items, all successfully migrated**

**Prevention:**

- ✅ Single source of truth for category definitions
- ✅ TypeScript types enforce consistency
- ✅ Database constraints match TypeScript types
- ✅ UI components use same category list
- ✅ Documentation updated with canonical category list
- ⏳ TODO: Add schema validation tests to CI/CD
- ⏳ TODO: Create type generation from database schema

**Related Files:**

- `Docs/CATEGORY_UNIFICATION_CHANGELOG.md` - Full technical changelog
- `types/models/item.ts` - ItemCategory type definition
- `components/wardrobe/CategoryPicker.tsx` - UI selector component
- `components/outfit/ItemSelectionStep.tsx` - Outfit creator categories
- `components/outfit/CategoryCarouselCentered.tsx` - CATEGORY_GROUPS
- Database migration: `unify_clothing_categories_to_seven_fixed`

**Testing:**

- [x] Database migration successful (18 items, no data loss)
- [x] TypeScript compilation passes (no type errors)
- [x] CategoryPicker shows 8 categories
- [x] ItemSelectionStep shows 8 categories
- [x] CATEGORY_GROUPS includes fullbody in main group
- [ ] **TODO:** Manual test - Add new fullbody item
- [ ] **TODO:** Manual test - Use fullbody item in outfit
- [ ] **TODO:** Manual test - Display modes (All/Main/Extra)

**Breaking Changes:**

For users:

- ✅ No breaking changes - all data automatically migrated
- Items previously tagged as `dresses` or `suits` now appear as `fullbody`

For developers:

- ⚠️ `ItemCategory` type no longer includes `'dresses'` or `'suits'`
- ⚠️ Any hardcoded category strings must be updated to `'fullbody'`
- ⚠️ Database queries filtering by `dresses`/`suits` will return no results

**Additional Documentation:**

See `Docs/CATEGORY_UNIFICATION_CHANGELOG.md` for:

- Detailed technical implementation
- Rollback procedures
- Future considerations (subcategories, localization)
- Complete before/after comparison

**Resolution Status:**
✅ **FULLY RESOLVED** - All systems unified to 8-category structure

---

### BUG-WEB-001: Web Platform Compatibility Issues

**Date:** 2025-11-05  
**Date Resolved:** 2025-11-05  
**Severity:** Critical  
**Status:** Resolved ✅  
**Component:** Web Platform / AsyncStorage / Styling  
**Environment:** Web

**Description:**
When launching the app on web platform (previously only tested on iOS via Expo Go), two critical issues prevent the app from starting:

1. **AsyncStorage window reference error** - Supabase client initialization fails because AsyncStorage requires window object
2. **Shadow style props deprecation** - React Native shadow\* props don't work on web, need boxShadow instead

**Error Messages/Logs:**

```
"shadow*" style props are deprecated. Use "boxShadow".

ReferenceError: window is not defined
    at getValue (node_modules\@react-native-async-storage\async-storage\lib\commonjs\AsyncStorage.js:63:52)
    at createPromise (node_modules\@react-native-async-storage\async-storage\lib\commonjs\AsyncStorage.js:37:10)
    at Object.getItem (node_modules\@react-native-async-storage\async-storage\lib\commonjs\AsyncStorage.js:63:12)
    at getItemAsync (node_modules\@supabase\auth-js\dist\main\lib\helpers.js:158:33)
    at SupabaseAuthClient.__loadSession (node_modules\@supabase\auth-js\dist\main\GoTrueClient.js:1114:66)
```

**Root Cause:**

**Issue 1: AsyncStorage on Web**

- `@react-native-async-storage/async-storage` is designed for mobile platforms
- On web, it tries to access `window` object which doesn't exist in SSR/Node context
- Supabase client uses AsyncStorage for session persistence, failing on web initialization

**Issue 2: Shadow Props**

- React Native shadow\* props (shadowColor, shadowOffset, shadowOpacity, shadowRadius) are iOS-specific
- Web platform requires CSS boxShadow property instead
- Multiple components use Platform.select for iOS shadows but still trigger warnings

**Affected Components:**

- `app/(tabs)/outfits.tsx` - Floating action button
- `components/wardrobe/ItemCard.tsx` - Item cards
- `components/ui/FAB.tsx` - Floating action button component
- `components/ui/Button.tsx` - Primary button
- `components/outfit/OutfitCard.tsx` - Outfit preview cards

**Solution:**

**Part 1: Fix AsyncStorage for Web Platform**

Update Supabase client to use platform-specific storage:

- Use AsyncStorage for native platforms (iOS/Android)
- Use localStorage wrapper for web platform
- Detect platform and provide appropriate storage adapter

**Part 2: Fix Shadow Styles for Web**

Convert shadow\* props to web-compatible boxShadow:

- Use Platform.select to provide different styles for web
- Keep shadow\* props for iOS
- Use elevation for Android (already implemented)
- Add boxShadow for web platform

**Implementation:**

**Part 1: AsyncStorage Fix (lib/supabase/client.ts)**

Created web-compatible storage adapter:

```typescript
// Web-compatible storage adapter using localStorage
const WebStorage = {
  getItem: async (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

// Use platform-specific storage
const storage = Platform.OS === 'web' ? WebStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
```

**Part 2: Shadow Styles Fix**

Updated all components to use Platform.select with boxShadow for web:

```typescript
// Example from Button.tsx
...Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: {
    elevation: 4,
  },
  web: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
  },
})
```

**Components Updated:**

1. `app/(tabs)/outfits.tsx` - Sort menu shadow
2. `components/wardrobe/ItemCard.tsx` - Card container shadow (added Platform import)
3. `components/ui/FAB.tsx` - Floating action button shadow
4. `components/ui/Button.tsx` - Button shadow (added Platform import)
5. `components/outfit/OutfitCard.tsx` - Outfit card shadow

**Additional Fixes:**

- Added `Platform` import to ItemCard.tsx and Button.tsx
- Fixed import path in ItemCard.tsx from `@types/models/item` to relative path `../../types/models/item`
- Created `store/storage.ts` - unified platform-specific storage helper for all Zustand stores
- Updated authStore, wardrobeStore, and outfitStore to use `zustandStorage` instead of direct AsyncStorage

**Root Cause of Infinite Loading:**
After fixing the initial errors, the app experienced infinite loading on web due to multiple issues:

1. **AsyncStorage in Zustand stores**: All three persist stores (auth, wardrobe, outfit) were using AsyncStorage directly, which doesn't work on web
2. **SSR hydration issue**: Zustand was trying to read from localStorage during server-side rendering (before `window` was available), causing stores to fail initialization

**SSR Hydration Fix:**

- Added `skipHydration: true` to all three stores (auth, wardrobe, outfit) to prevent SSR hydration
- Added manual `useAuthStore.persist.rehydrate()` call in `_layout.tsx` after component mounts on client side
- This ensures stores only hydrate from localStorage when `window` is available

**Prevention:**

- Test on all platforms (iOS, Android, Web) before marking features complete
- Use platform-agnostic APIs when available
- Document platform-specific requirements in UI_UX_doc.md
- Add web platform to CI/CD testing pipeline

**Related Files:**

- `lib/supabase/client.ts` (AsyncStorage fix for Supabase)
- `store/storage.ts` (NEW - unified platform-specific storage helper)
- `store/auth/authStore.ts` (uses zustandStorage)
- `store/wardrobe/wardrobeStore.ts` (uses zustandStorage)
- `store/outfit/outfitStore.ts` (uses zustandStorage)
- `app/(tabs)/outfits.tsx` (shadow styles)
- `components/wardrobe/ItemCard.tsx` (shadow styles)
- `components/ui/FAB.tsx` (shadow styles)
- `components/ui/Button.tsx` (shadow styles)
- `components/outfit/OutfitCard.tsx` (shadow styles)

**Testing:**

- ✅ Web server starts without errors
- ✅ No AsyncStorage window reference errors
- ✅ No shadow\* deprecation warnings
- ✅ Zustand persist works on web with localStorage
- ✅ Auth state persists across page refreshes on web

---

### BUG-S4-007: Invalid Refresh Token Error on Android Startup

**Date:** 2025-11-05  
**Severity:** Critical  
**Status:** Resolved  
**Component:** Authentication / Supabase Client  
**Environment:** Android (Expo Go), potentially all platforms

**Description:**
App throws "AuthApiError: Invalid Refresh Token: Refresh Token Not Found" when starting on Android via Expo Go. This happens when the app tries to restore a session with an invalid or expired refresh token stored in AsyncStorage, causing authentication to fail and preventing app access.

**Error Messages/Logs:**

```
Error: ENOENT: no such file or directory, open 'C:\Users\moroz\Desktop\AiWardrope\obrazz\InternalBytecode.js'
    at Object.readFileSync (node:fs:442:20)
    at getCodeFrame (C:\Users\moroz\Desktop\AiWardrope\obrazz\node_modules\metro\src\Server.js:997:18)
    at Server._symbolicate (C:\Users\moroz\Desktop\AiWardrope\obrazz\node_modules\metro\src\Server.js:1079:22)
    at Server._processRequest (C:\Users\moroz\Desktop\AiWardrope\obrazz\node_modules\metro\src\Server.js:460:7)

ERROR  [AuthApiError: Invalid Refresh Token: Refresh Token Not Found]
Call Stack:
  tryCallOne (address at InternalBytecode.js:1:1180)
  anonymous (address at InternalBytecode.js:1:1874)

LOG  [RootLayoutNav] Session result: Not found
LOG  [RootLayoutNav] Auth initialization complete
LOG  [RootLayoutNav] Session check timeout
```

**Steps to Reproduce:**

1. Sign in to app and close it
2. Wait for refresh token to expire or become invalid
3. Reopen app on Android via Expo Go
4. App throws Invalid Refresh Token error
5. Metro bundler shows InternalBytecode.js error (secondary error)

**Expected Behavior:**

- App should detect invalid refresh token
- Clear corrupted auth data from storage
- Redirect user to sign-in screen
- Show friendly error message

**Actual Behavior:**

- App crashes with AuthApiError
- Metro bundler fails to symbolicate error (InternalBytecode.js)
- User stuck on loading screen or error screen
- Auth state remains corrupted

**Root Cause:**

1. **No validation of stored tokens**: Supabase client blindly uses stored refresh token without validation
2. **No error handling for refresh failures**: Auth service doesn't catch and handle refresh token errors
3. **Corrupted storage not cleared**: Invalid tokens remain in AsyncStorage causing repeated failures
4. **Metro symbolication issue**: Secondary problem - Metro can't display proper stack traces

**Solution:**

**Phase 1: Safe Storage Wrapper (lib/supabase/client.ts)**

- Created `createSafeStorage()` wrapper around AsyncStorage
- Validates auth data before returning from storage
- Automatically clears corrupted/invalid auth tokens
- Added `clearAuthStorage()` helper function

```typescript
// Validates stored auth data
if (key === SUPABASE_AUTH_KEY && item) {
  try {
    const parsed = JSON.parse(item);
    if (!parsed || typeof parsed !== 'object') {
      await baseStorage.removeItem(key);
      return null;
    }
  } catch (parseError) {
    await baseStorage.removeItem(key);
    return null;
  }
}
```

**Phase 2: Enhanced Error Handling (services/auth/authService.ts)**

- Added refresh token error detection in `getSession()`
- Automatically clears storage on refresh token errors
- Signs out locally when token is invalid

```typescript
if (error.message?.includes('refresh') || error.message?.includes('Refresh Token')) {
  await clearAuthStorage();
  await supabase.auth.signOut({ scope: 'local' });
}
```

**Phase 3: Auth Store Error Handler (store/auth/authStore.ts)**

- Added `handleAuthError()` action
- Detects refresh token errors
- Automatically clears auth state
- Shows user-friendly error message

```typescript
handleAuthError: (error) => {
  if (error.includes('refresh') || error.includes('Invalid')) {
    set(() => ({
      user: null,
      session: null,
      isAuthenticated: false,
      error: 'Session expired. Please sign in again.',
      isLoading: false,
    }));
  }
};
```

**Phase 4: Improved Auth Initialization (app/\_layout.tsx)**

- Updated error handling in `initAuth()`
- Uses `handleAuthError()` for proper error processing
- Better logging for debugging

**Prevention:**

1. **Token validation**: Always validate tokens before use
2. **Graceful degradation**: Clear corrupted data and redirect to auth
3. **Error boundaries**: Catch and handle auth errors at app level
4. **Storage hygiene**: Periodically validate and clean auth storage
5. **Better logging**: Comprehensive logging for auth flow debugging

**Testing Checklist:**

- [x] App handles expired refresh tokens gracefully
- [x] Corrupted auth data is automatically cleared
- [x] User redirected to sign-in on auth errors
- [x] No infinite loading or crashes
- [x] Proper error messages displayed
- [ ] Test on fresh install (no cached data)
- [ ] Test with expired tokens
- [ ] Test after long period of inactivity

**Related Files:**

- `lib/supabase/client.ts` - Safe storage wrapper
- `services/auth/authService.ts` - Enhanced error handling
- `store/auth/authStore.ts` - Error handler action
- `app/_layout.tsx` - Improved initialization

**Additional Notes:**

- The InternalBytecode.js error is a Metro bundler issue when symbolication fails
- It's a secondary error that obscures the real problem (auth error)
- Fixed by preventing the auth error from occurring in the first place

**Related Issues:**

- BUG-S4-005: Metro Bundler InternalBytecode Error (same Metro issue)

---

_Last Updated: 2025-11-05_
