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
  removeBgApiKey: string;
  openAiApiKey: string;
  aiServiceUrl: string;

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

const getEnvValue = (key: string, defaultValue: string = ''): string => {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key];
  return value || defaultValue;
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
  removeBgApiKey: getEnvValue('EXPO_PUBLIC_REMOVE_BG_API_KEY'),
  openAiApiKey: getEnvValue('EXPO_PUBLIC_OPENAI_API_KEY'),
  aiServiceUrl: getEnvValue('EXPO_PUBLIC_AI_SERVICE_URL', 'http://localhost:3001'),

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
export const REMOVE_BG_API_KEY = env.removeBgApiKey;
export const SUPABASE_URL = env.supabaseUrl;
export const SUPABASE_ANON_KEY = env.supabaseAnonKey;

export default env;
