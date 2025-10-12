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
]
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
  }
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

*Last Updated: 2025-01-13*
