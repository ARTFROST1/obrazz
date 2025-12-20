# Fix: Invalid Refresh Token Error on Device Switch

**Date:** December 20, 2025  
**Issue:** `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`  
**Severity:** High - Prevented app from loading when switching devices

## Problem Description

When users logged in on one device and then opened the app on another device, they encountered a critical error:

```
ERROR  [AuthApiError: Invalid Refresh Token: Refresh Token Not Found]
```

This happened because:

1. Old/expired refresh tokens were stored in AsyncStorage
2. Supabase attempted to use these invalid tokens on app startup
3. The error wasn't properly caught, causing the app to crash or show error screens
4. The corrupted auth data persisted, requiring manual app data clearing

## Root Causes

1. **Insufficient validation in SafeStorage** - Only checked for basic JSON structure, didn't validate token fields or expiration
2. **Missing error handling in onAuthStateChange** - Auth state listener could throw unhandled exceptions
3. **No pre-initialization validation** - App attempted to use stored auth data without checking validity first
4. **Incomplete error detection** - Only checked for "refresh" and "Refresh Token" strings, missing "Not Found" errors

## Solution

### 1. Enhanced SafeStorage Validation (`lib/supabase/client.ts`)

Added comprehensive validation in `createSafeStorage()`:

```typescript
// Enhanced validation - check for required session/user fields
if (parsed.currentSession) {
  const session = parsed.currentSession;

  // Validate required fields
  if (!session.access_token || !session.refresh_token || !session.user) {
    console.warn('[SafeStorage] Corrupted auth data (missing tokens/user), clearing...');
    await baseStorage.removeItem(key);
    return null;
  }

  // Check expiration
  if (session.expires_at) {
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    if (expiresAt < now) {
      console.warn('[SafeStorage] Session expired, clearing...');
      await baseStorage.removeItem(key);
      return null;
    }
  }
}
```

**What it does:**

- Checks for `access_token`, `refresh_token`, and `user` fields
- Validates session expiration timestamp
- Automatically clears invalid data before Supabase tries to use it

### 2. Robust Auth State Listener (`services/auth/authService.ts`)

Wrapped `onAuthStateChange` in try-catch:

```typescript
initializeAuthListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      logger.info('Auth state changed:', event);

      if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
        useAuthStore.getState().clearAuth();
        return;
      }

      // Handle session update...
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error in auth state change handler:', errorMessage);

      // On any error, clear auth state to be safe
      if (
        errorMessage.includes('refresh') ||
        errorMessage.includes('Refresh Token') ||
        errorMessage.includes('Invalid')
      ) {
        logger.warn('Clearing auth due to error in state change');
        await clearAuthStorage();
        useAuthStore.getState().clearAuth();
      }
    }
  });
}
```

**What it does:**

- Catches any errors during auth state changes
- Logs specific auth events for debugging
- Clears auth data if refresh token errors occur
- Prevents uncaught exceptions from crashing the app

### 3. Enhanced getSession Error Handling

Improved error detection patterns:

```typescript
if (
  error.message?.includes('refresh') ||
  error.message?.includes('Refresh Token') ||
  error.message?.includes('Invalid Refresh Token') ||
  error.message?.includes('Not Found') // NEW: catches "Refresh Token Not Found"
) {
  logger.warn('Invalid/expired refresh token detected, clearing all auth data...');
  await clearAuthStorage();
  await supabase.auth.signOut({ scope: 'local' });
  useAuthStore.getState().clearAuth();
}
```

**What it does:**

- Expanded error detection to include "Not Found" errors
- Triple-layer cleanup: storage + Supabase + store
- Uses local signOut to avoid server requests with invalid tokens

### 4. Pre-initialization Validation (`lib/supabase/client.ts`)

Added new `validateAuthStorage()` function:

```typescript
export const validateAuthStorage = async () => {
  try {
    console.log('[Supabase] Validating auth storage...');
    const authData = await baseStorage.getItem('supabase.auth.token');

    if (!authData) {
      return true; // No data is valid state
    }

    const parsed = JSON.parse(authData);

    if (parsed?.currentSession) {
      const session = parsed.currentSession;

      // Validate required fields
      if (!session.access_token || !session.refresh_token || !session.user) {
        await clearAuthStorage();
        return false;
      }

      // Check expiration
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        if (expiresAt < now) {
          await clearAuthStorage();
          return false;
        }
      }

      return true;
    }

    await clearAuthStorage();
    return false;
  } catch (error) {
    await clearAuthStorage();
    return false;
  }
};
```

**What it does:**

- Runs BEFORE any Supabase auth operations
- Pre-validates stored auth data structure
- Clears invalid data proactively
- Returns boolean for easy early-exit

### 5. App Initialization Flow Update (`app/_layout.tsx`)

Added validation as first step in auth init:

```typescript
const initAuth = async () => {
  console.log('[RootLayoutNav] Starting auth initialization...');
  setLoading(true);

  try {
    // STEP 1: Validate auth storage before anything else
    const isValid = await validateAuthStorage();
    if (!isValid) {
      console.warn('[RootLayoutNav] Auth storage was invalid and has been cleared');
      useAuthStore.getState().clearAuth();
      setLoading(false);
      return; // Early exit - don't proceed with invalid data
    }

    // STEP 2: Initialize auth listener...
    // STEP 3: Get session...
  }
};
```

**What it does:**

- Validates storage before any auth operations
- Early-exits if validation fails
- Prevents Supabase from attempting to use invalid tokens
- Sets loading to false so app can continue

### 6. Improved clearAuthStorage Function

Enhanced to clear multiple storage keys:

```typescript
export const clearAuthStorage = async () => {
  const keys = [
    'supabase.auth.token',
    '@supabase.auth.token', // Old format
    'auth-store', // Zustand persist key
  ];

  for (const key of keys) {
    try {
      await baseStorage.removeItem(key);
      console.log('[Supabase] Cleared key:', key);
    } catch (keyError) {
      console.warn('[Supabase] Failed to clear key:', key, keyError);
    }
  }
};
```

**What it does:**

- Clears all possible auth-related keys
- Handles errors per-key (continues if one fails)
- Includes Zustand store persistence key
- Ensures complete cleanup

## Testing

### Test Case 1: Fresh Device Login

1. Log in on Device A
2. Open app on Device B without logging in first
3. **Expected:** App loads normally, shows welcome screen
4. **Result:** ✅ Pass - No errors, app continues

### Test Case 2: Expired Token

1. Manually set an expired session in AsyncStorage
2. Restart app
3. **Expected:** Token detected as expired, cleared, app shows login
4. **Result:** ✅ Pass - Validation catches expiration

### Test Case 3: Corrupted Session Data

1. Store malformed JSON in auth storage
2. Restart app
3. **Expected:** SafeStorage catches corruption, clears, app loads
4. **Result:** ✅ Pass - parseError caught, data cleared

### Test Case 4: Missing Refresh Token

1. Store session with missing refresh_token field
2. Restart app
3. **Expected:** Validation detects missing field, clears storage
4. **Result:** ✅ Pass - validateAuthStorage returns false

## Files Changed

1. **`lib/supabase/client.ts`**
   - Enhanced `createSafeStorage()` validation
   - Added `validateAuthStorage()` function
   - Improved `clearAuthStorage()` to handle multiple keys

2. **`services/auth/authService.ts`**
   - Wrapped `onAuthStateChange` in try-catch
   - Enhanced error detection in `getSession()`
   - Added "Not Found" to error patterns

3. **`app/_layout.tsx`**
   - Added `validateAuthStorage()` import
   - Added pre-validation step in auth initialization
   - Improved error handling for refresh token errors

## Prevention Strategy

### For Future Development:

1. **Always validate stored auth data** before using it
2. **Use comprehensive error patterns** when detecting auth errors
3. **Triple-layer cleanup** on auth errors: Storage + Supabase + Store
4. **Early-exit patterns** when validation fails
5. **Never assume stored data is valid** - always validate structure

### User Experience:

- ✅ App no longer crashes on invalid tokens
- ✅ Smooth degradation to login screen
- ✅ Clear console logs for debugging
- ✅ No manual intervention required (auto-cleanup)
- ✅ Works seamlessly across device switches

## Related Issues

- Metro bundler error `ENOENT: InternalBytecode.js` was a red herring - this file is internal to React Native and the error occurred because the auth error crashed before proper symbolication
- Once auth error is fixed, Metro symbolication works correctly

## Monitoring

Watch for these log patterns to detect similar issues:

```
[SafeStorage] Corrupted auth data detected
[SafeStorage] Session expired, clearing
[Supabase] Validating auth storage
[RootLayoutNav] Auth storage was invalid
[AuthService] Invalid/expired refresh token detected
```

## Success Criteria

- [x] No unhandled AuthApiError exceptions
- [x] App loads successfully with invalid stored tokens
- [x] Users can switch devices without manual data clearing
- [x] Console logs provide clear debugging info
- [x] Auth state properly cleared on errors
- [x] No infinite error loops or crashes

---

**Status:** ✅ Resolved  
**Impact:** All users switching devices or with expired tokens
**Priority:** High - Affects user retention and app stability
