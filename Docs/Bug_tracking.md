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
**Severity:** Critical  
**Status:** Resolved  
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

**Additional Notes:**

- If you have existing items with categories 'shoes', 'hats', 'jewelry', or 'other', migrate them before applying this fix
- Consider adding a data migration script if production database has affected records

---

_Last Updated: 2025-10-14_
