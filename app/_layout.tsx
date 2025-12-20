import { OfflineBanner } from '@components/sync';
import { Loader } from '@components/ui';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { i18n } from '@hooks/useTranslation';
import '@lib/i18n/config'; // Initialize i18n
import { validateAuthStorage } from '@lib/supabase/client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { authService } from '@services/auth/authService';
import { initNetworkMonitor } from '@services/sync/networkMonitor';
import { syncService } from '@services/sync/syncService';
import { itemServiceOffline } from '@services/wardrobe/itemServiceOffline';
import { useAuthStore } from '@store/auth/authStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useSettingsStore } from '@store/settings/settingsStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import diagnostics (only in DEV mode)
if (__DEV__) {
  import('../scripts/wardrobeDiagnostics').catch(() => {
    console.log('[Dev] Wardrobe diagnostics not available');
  });
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { language } = useSettingsStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize network monitor and sync services
  useEffect(() => {
    console.log('[RootLayoutNav] Initializing offline-first services...');

    // Initialize network monitoring
    const unsubscribeNetwork = initNetworkMonitor();

    // Initialize sync service
    syncService
      .init()
      .then(() => {
        console.log('[RootLayoutNav] ✓ Sync service initialized');
      })
      .catch((error) => {
        console.error('[RootLayoutNav] Failed to initialize sync service:', error);
      });

    // Initialize offline item service
    itemServiceOffline
      .init()
      .then(() => {
        console.log('[RootLayoutNav] ✓ Offline item service initialized');
      })
      .catch((error) => {
        console.error('[RootLayoutNav] Failed to initialize item service:', error);
      });

    return () => {
      unsubscribeNetwork();
    };
  }, []);

  // Rehydrate stores on client side
  useEffect(() => {
    // Only on client side (not SSR)
    if (typeof window !== 'undefined') {
      console.log('[RootLayoutNav] Rehydrating stores...');
      try {
        useAuthStore.persist.rehydrate();
        console.log('[RootLayoutNav] ✓ Auth store rehydrated');

        useSettingsStore.persist.rehydrate();
        console.log('[RootLayoutNav] ✓ Settings store rehydrated');

        useWardrobeStore.persist.rehydrate();
        console.log('[RootLayoutNav] ✓ Wardrobe store rehydrated');

        useOutfitStore.persist.rehydrate();
        console.log('[RootLayoutNav] ✓ Outfit store rehydrated');

        console.log('[RootLayoutNav] All stores rehydrated successfully');
      } catch (error) {
        console.error('[RootLayoutNav] Error during store rehydration:', error);
      }
    }
  }, []);

  // Sync language with i18n
  useEffect(() => {
    console.log('[RootLayoutNav] Setting i18n language:', language);
    i18n.changeLanguage(language);
  }, [language]);

  // Initialize auth listener and session check
  useEffect(() => {
    const initAuth = async () => {
      console.log('[RootLayoutNav] Starting auth initialization...');
      setLoading(true);

      try {
        // STEP 1: Validate auth storage before anything else
        console.log('[RootLayoutNav] Validating auth storage...');
        const isValid = await validateAuthStorage();
        if (!isValid) {
          console.warn('[RootLayoutNav] Auth storage was invalid and has been cleared');
          useAuthStore.getState().clearAuth();
          setLoading(false);
          return;
        }

        // STEP 2: Initialize auth state listener (non-blocking)
        console.log('[RootLayoutNav] Initializing auth listener...');
        authService.initializeAuthListener();

        // STEP 3: Check for existing session with timeout
        console.log('[RootLayoutNav] Getting session...');
        const sessionPromise = authService.getSession();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => {
            console.log('[RootLayoutNav] Session check timeout - continuing without session');
            resolve(null);
          }, 3000),
        );

        const session = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('[RootLayoutNav] Session result:', session ? 'Found' : 'Not found');

        if (session && typeof session === 'object' && 'user' in session) {
          useAuthStore.getState().initialize(session.user, session);
        } else {
          // Clear auth but don't treat as error - app can work without auth
          useAuthStore.getState().clearAuth();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown auth error';
        console.error('[RootLayoutNav] Auth initialization error:', errorMessage);

        // For refresh token errors, explicitly clear everything
        if (
          errorMessage.includes('refresh') ||
          errorMessage.includes('Refresh Token') ||
          errorMessage.includes('Invalid') ||
          errorMessage.includes('Not Found')
        ) {
          console.warn('[RootLayoutNav] Refresh token error detected, clearing auth...');
          useAuthStore.getState().clearAuth();
        } else {
          // Clear auth on any other error but continue app execution
          useAuthStore.getState().clearAuth();
        }
      } finally {
        console.log('[RootLayoutNav] Auth initialization complete');
        // Always set loading to false to unblock UI
        setLoading(false);
      }
    };

    // Run async without blocking render
    initAuth().catch((err) => {
      console.error('[RootLayoutNav] Unhandled auth init error:', err);
      useAuthStore.getState().clearAuth();
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to auth if not authenticated
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and in auth screen
      router.replace('/(tabs)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
