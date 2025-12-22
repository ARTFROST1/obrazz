import Constants from 'expo-constants';

/**
 * Environment configuration file
 * Provides type-safe access to environment variables
 */

interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;

  // APIs
  pixianApiId: string;
  pixianApiSecret: string;
  pixianTestMode: boolean;
  railsApiUrl: string;

  // RevenueCat
  revenueCatApiKey: string;
  revenueCatIosKey: string;
  revenueCatAndroidKey: string;

  // Monitoring
  sentryDsn: string;
  sentryOrg: string;
  sentryProject: string;

  // Analytics
  amplitudeApiKey: string;
  mixpanelToken: string;

  // Environment
  environment: 'development' | 'staging' | 'production';

  // Feature Flags
  enableAi: boolean;
  enableSubscription: boolean;
  enableCommunity: boolean;
  enableWebCapture: boolean;

  // Image Processing
  maxImageSize: number;
  imageQuality: number;

  // API Timeouts
  apiTimeout: number;
  aiTimeout: number;

  // Cache
  cacheTime: number;

  // Payment Providers
  yookassaShopId: string;
  paymasterMerchantId: string;
}

const toCamelCase = (input: string): string =>
  input
    .toLowerCase()
    .split('_')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');

const getEnvValue = (key: string, defaultValue: string = ''): string => {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;

  // 1) Direct access by key
  const direct = extra?.[key];
  if (typeof direct === 'string' && direct.length > 0) return direct;

  // 2) Expo config uses camelCase keys in app.config.js (e.g. supabaseUrl)
  // Map EXPO_PUBLIC_SUPABASE_URL -> supabaseUrl
  if (key.startsWith('EXPO_PUBLIC_')) {
    const withoutPrefix = key.replace(/^EXPO_PUBLIC_/, '');
    const camelKey = toCamelCase(withoutPrefix);
    const camelValue = extra?.[camelKey];
    if (typeof camelValue === 'string' && camelValue.length > 0) return camelValue;
  }

  // 3) Fallback to process.env (dev)
  // Avoid dynamic access to satisfy expo/no-dynamic-env-var
  const envValue =
    typeof process !== 'undefined' && process.env
      ? key === 'EXPO_PUBLIC_SUPABASE_URL'
        ? process.env.EXPO_PUBLIC_SUPABASE_URL
        : key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
          ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
          : key === 'EXPO_PUBLIC_PIXIAN_API_ID'
            ? process.env.EXPO_PUBLIC_PIXIAN_API_ID
            : key === 'EXPO_PUBLIC_PIXIAN_API_SECRET'
              ? process.env.EXPO_PUBLIC_PIXIAN_API_SECRET
              : key === 'EXPO_PUBLIC_RAILS_API_URL'
                ? process.env.EXPO_PUBLIC_RAILS_API_URL
                : undefined
      : undefined;
  return envValue || defaultValue;
};

const getBooleanEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvValue(key);
  if (value === '') return defaultValue;
  return value.toLowerCase() === 'true';
};

const getNumberEnv = (key: string, defaultValue: number = 0): number => {
  const value = getEnvValue(key);
  if (value === '') return defaultValue;
  return parseInt(value, 10) || defaultValue;
};

export const env: EnvConfig = {
  // Supabase
  supabaseUrl: getEnvValue('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvValue('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  // APIs
  pixianApiId: getEnvValue('EXPO_PUBLIC_PIXIAN_API_ID'),
  pixianApiSecret: getEnvValue('EXPO_PUBLIC_PIXIAN_API_SECRET'),
  pixianTestMode: getBooleanEnv('EXPO_PUBLIC_PIXIAN_TEST_MODE', true),
  railsApiUrl: getEnvValue('EXPO_PUBLIC_RAILS_API_URL', 'http://localhost:3000'),

  // RevenueCat
  revenueCatApiKey: getEnvValue('EXPO_PUBLIC_REVENUECAT_API_KEY'),
  revenueCatIosKey: getEnvValue('EXPO_PUBLIC_REVENUECAT_IOS_KEY'),
  revenueCatAndroidKey: getEnvValue('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'),

  // Monitoring
  sentryDsn: getEnvValue('EXPO_PUBLIC_SENTRY_DSN'),
  sentryOrg: getEnvValue('EXPO_PUBLIC_SENTRY_ORG'),
  sentryProject: getEnvValue('EXPO_PUBLIC_SENTRY_PROJECT'),

  // Analytics
  amplitudeApiKey: getEnvValue('EXPO_PUBLIC_AMPLITUDE_API_KEY'),
  mixpanelToken: getEnvValue('EXPO_PUBLIC_MIXPANEL_TOKEN'),

  // Environment
  environment: getEnvValue('EXPO_PUBLIC_ENVIRONMENT', 'development') as EnvConfig['environment'],

  // Feature Flags
  enableAi: getBooleanEnv('EXPO_PUBLIC_ENABLE_AI', true),
  enableSubscription: getBooleanEnv('EXPO_PUBLIC_ENABLE_SUBSCRIPTION', true),
  enableCommunity: getBooleanEnv('EXPO_PUBLIC_ENABLE_COMMUNITY', true),
  enableWebCapture: getBooleanEnv('EXPO_PUBLIC_ENABLE_WEB_CAPTURE', true),

  // Image Processing
  maxImageSize: getNumberEnv('EXPO_PUBLIC_MAX_IMAGE_SIZE', 5242880),
  imageQuality: parseFloat(getEnvValue('EXPO_PUBLIC_IMAGE_QUALITY', '0.8')),

  // API Timeouts
  apiTimeout: getNumberEnv('EXPO_PUBLIC_API_TIMEOUT', 30000),
  aiTimeout: getNumberEnv('EXPO_PUBLIC_AI_TIMEOUT', 60000),

  // Cache
  cacheTime: getNumberEnv('EXPO_PUBLIC_CACHE_TIME', 3600000),

  // Payment Providers
  yookassaShopId: getEnvValue('EXPO_PUBLIC_YOOKASSA_SHOP_ID'),
  paymasterMerchantId: getEnvValue('EXPO_PUBLIC_PAYMASTER_MERCHANT_ID'),
};

// Validate critical environment variables
export const validateEnv = (): void => {
  const criticalVars = {
    EXPO_PUBLIC_SUPABASE_URL: env.supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: env.supabaseAnonKey,
  };

  const missing = Object.entries(criticalVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      `[ENV] Missing critical environment variables: ${missing.join(', ')}\n` +
        'Please configure them in your .env file.',
    );
  }
};

// Run validation on import
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

// Export individual values for convenience
export const PIXIAN_API_ID = env.pixianApiId;
export const PIXIAN_API_SECRET = env.pixianApiSecret;
export const PIXIAN_TEST_MODE = env.pixianTestMode;
export const SUPABASE_URL = env.supabaseUrl;
export const SUPABASE_ANON_KEY = env.supabaseAnonKey;

export default env;
