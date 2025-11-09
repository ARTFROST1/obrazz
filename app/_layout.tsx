import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { useAuthStore } from '@store/auth/authStore';
import { authService } from '@services/auth/authService';
import { Loader } from '@components/ui';

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
  const segments = useSegments();
  const router = useRouter();

  // Rehydrate stores on client side
  useEffect(() => {
    // Only on client side (not SSR)
    if (typeof window !== 'undefined') {
      console.log('[RootLayoutNav] Rehydrating stores...');
      useAuthStore.persist.rehydrate();
    }
  }, []);

  // Initialize auth listener and session check
  useEffect(() => {
    const initAuth = async () => {
      console.log('[RootLayoutNav] Starting auth initialization...');
      setLoading(true);

      try {
        // Initialize auth state listener
        console.log('[RootLayoutNav] Initializing auth listener...');
        authService.initializeAuthListener();

        // Check for existing session with timeout
        console.log('[RootLayoutNav] Getting session...');
        const sessionPromise = authService.getSession();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => {
            console.log('[RootLayoutNav] Session check timeout');
            resolve(null);
          }, 5000),
        );

        const session = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('[RootLayoutNav] Session result:', session ? 'Found' : 'Not found');

        if (session && typeof session === 'object' && 'user' in session) {
          useAuthStore.getState().initialize(session.user, session);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch (error: any) {
        console.error('[RootLayoutNav] Auth initialization error:', error?.message || error);

        // Handle auth errors properly
        const errorMessage = error?.message || 'Unknown auth error';
        useAuthStore.getState().handleAuthError(errorMessage);
      } finally {
        console.log('[RootLayoutNav] Auth initialization complete');
        setLoading(false);
      }
    };

    initAuth();
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
