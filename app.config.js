import 'dotenv/config';

export default {
  expo: {
    name: 'obrazz',
    slug: 'obrazz',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'obrazz',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0b0b0d',
    },
    ios: {
      supportsTablet: true,
      icon: './assets/images/icon.png',
      infoPlist: {
        NSCameraUsageDescription:
          'Obrazz needs access to your camera to take photos of clothing items for your wardrobe.',
        NSPhotoLibraryUsageDescription:
          'Obrazz needs access to your photo library to select clothing images for your wardrobe.',
        NSPhotoLibraryAddUsageDescription:
          'Obrazz needs permission to save processed images to your photo library.',
        ITSAppUsesNonExemptEncryption: false,
      },
      bundleIdentifier: 'com.artfrost.obrazz',
    },
    android: {
      package: 'com.artfrost.obrazz',
      versionCode: 1,
      icon: './assets/images/adaptive-icon.png',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon-foreground.png',
        backgroundImage: './assets/images/adaptive-icon-background.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.RECORD_AUDIO',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', 'expo-camera', 'expo-image-picker', 'expo-web-browser'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '9d046cfa-467c-49e4-9098-9c864d1295c6',
      },
      // Supabase configuration
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      // Rails Backend API (proxy for AI + billing)
      railsApiUrl: process.env.EXPO_PUBLIC_RAILS_API_URL,
      // Feature flags
      enableAi: process.env.EXPO_PUBLIC_ENABLE_AI,
      enableSubscription: process.env.EXPO_PUBLIC_ENABLE_SUBSCRIPTION,
      enableCommunity: process.env.EXPO_PUBLIC_ENABLE_COMMUNITY,
      enableWebCapture: process.env.EXPO_PUBLIC_ENABLE_WEB_CAPTURE,
      // Environment
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
    },
    owner: 'artfrost',
  },
};
