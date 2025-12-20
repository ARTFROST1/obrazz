import { Loader } from '@components/ui';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { i18n } from '@hooks/useTranslation';
import '@lib/i18n/config'; // Initialize i18n
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { authService } from '@services/auth/authService';
import { useAuthStore } from '@store/auth/authStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useSettingsStore } from '@store/settings/settingsStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

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
        // Initialize auth state listener first (non-blocking)
        console.log('[RootLayoutNav] Initializing auth listener...');
        authService.initializeAuthListener();

        // Check for existing session with shorter timeout
        console.log('[RootLayoutNav] Getting session...');
        const sessionPromise = authService.getSession();
        const timeoutPromise = new Promise<null>(
          (resolve) =>
            setTimeout(() => {
              console.log('[RootLayoutNav] Session check timeout - continuing without session');
              resolve(null);
            }, 3000), // Reduced from 5000ms to 3000ms
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

        // Clear auth on error but continue app execution
        useAuthStore.getState().clearAuth();
      } finally {
        console.log('[RootLayoutNav] Auth initialization complete');
        // Always set loading to false to unblock UI
        setLoading(false);
      }
    };

    // Run async without blocking render
    initAuth().catch((err) => {
      console.error('[RootLayoutNav] Unhandled auth init error:', err);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
