// App Configuration Constants

export const APP_CONFIG = {
  name: 'Obrazz',
  version: '1.0.0',
  buildNumber: 1,
  bundleId: 'com.obrazz.app',
  scheme: 'obrazz',
} as const;

// API Configuration
export const API_CONFIG = {
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  aiTimeout: parseInt(process.env.EXPO_PUBLIC_AI_TIMEOUT || '60000', 10),
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@obrazz:auth_token',
  REFRESH_TOKEN: '@obrazz:refresh_token',
  USER_DATA: '@obrazz:user_data',
  THEME: '@obrazz:theme',
  LANGUAGE: '@obrazz:language',
  ONBOARDING_COMPLETED: '@obrazz:onboarding_completed',
  CACHED_ITEMS: '@obrazz:cached_items',
  CACHED_OUTFITS: '@obrazz:cached_outfits',
  DRAFT_OUTFIT: '@obrazz:draft_outfit',
  LAST_SYNC: '@obrazz:last_sync',
} as const;

// Image Configuration
export const IMAGE_CONFIG = {
  maxSize: parseInt(process.env.EXPO_PUBLIC_MAX_IMAGE_SIZE || '5242880', 10), // 5MB
  quality: parseFloat(process.env.EXPO_PUBLIC_IMAGE_QUALITY || '0.8'),
  thumbnailSize: {
    width: 200,
    height: 200,
  },
  previewSize: {
    width: 800,
    height: 800,
  },
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  backgroundRemoval: {
    enabled: true,
    apiEndpoint: 'https://api.remove.bg/v1.0/removebg',
  },
} as const;

// Canvas Configuration
export const CANVAS_CONFIG = {
  defaultWidth: 1080,
  defaultHeight: 1440,
  aspectRatio: '3:4',
  gridSize: 20,
  snapThreshold: 10,
  minScale: 0.5,
  maxScale: 3.0,
  rotationStep: 15, // degrees
  defaultBackground: {
    type: 'gradient' as const,
    value: 'linear-gradient(180deg, #F8F8F8 0%, #FFFFFF 100%)',
  },
} as const;

// Subscription Limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxOutfits: 3,
    maxAiGenerations: 3,
    maxWardrobeItems: 50,
    maxImageSize: 3145728, // 3MB
    backgroundOptions: ['color', 'gradient'],
  },
  premium: {
    maxOutfits: 'unlimited' as const,
    maxAiGenerations: 'unlimited' as const,
    maxWardrobeItems: 'unlimited' as const,
    maxImageSize: 10485760, // 10MB
    backgroundOptions: ['color', 'gradient', 'pattern', 'image'],
  },
} as const;

// UI Configuration
export const UI_CONFIG = {
  tabBarHeight: 83,
  headerHeight: 44,
  itemCardAspectRatio: 0.75, // 3:4
  outfitCardAspectRatio: 1, // 1:1
  animationDuration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  toastDuration: 3000,
  refreshThreshold: 100,
  infiniteScrollThreshold: 200,
} as const;

// Pagination
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  initialPage: 1,
} as const;

// Categories Configuration - 8 categories
export const CATEGORIES = [
  { id: 'headwear', name: 'Головной убор', icon: 'hat', order: 1 },
  { id: 'outerwear', name: 'Верхняя одежда', icon: 'coat', order: 2 },
  { id: 'tops', name: 'Верх', icon: 'shirt', order: 3 },
  { id: 'bottoms', name: 'Низ', icon: 'pants', order: 4 },
  { id: 'footwear', name: 'Обувь', icon: 'shoe', order: 5 },
  { id: 'accessories', name: 'Аксессуары', icon: 'accessories', order: 6 },
  { id: 'fullbody', name: 'Платья/костюмы', icon: 'dress', order: 7 },
  { id: 'other', name: 'Другое', icon: 'box', order: 8 },
] as const;

// Styles Configuration
export const STYLES = [
  { id: 'casual', name: 'Повседневный' },
  { id: 'formal', name: 'Формальный' },
  { id: 'sporty', name: 'Спортивный' },
  { id: 'street', name: 'Уличный' },
  { id: 'boho', name: 'Бохо' },
  { id: 'minimalist', name: 'Минималистичный' },
  { id: 'vintage', name: 'Винтаж' },
  { id: 'elegant', name: 'Элегантный' },
  { id: 'business', name: 'Деловой' },
  { id: 'romantic', name: 'Романтичный' },
] as const;

// Seasons Configuration
export const SEASONS = [
  { id: 'spring', name: 'Весна', icon: '🌸' },
  { id: 'summer', name: 'Лето', icon: '☀️' },
  { id: 'autumn', name: 'Осень', icon: '🍂' },
  { id: 'winter', name: 'Зима', icon: '❄️' },
] as const;

// Occasions Configuration
export const OCCASIONS = [
  { id: 'casual', name: 'Повседневное' },
  { id: 'work', name: 'Работа' },
  { id: 'party', name: 'Вечеринка' },
  { id: 'date', name: 'Свидание' },
  { id: 'sport', name: 'Спорт' },
  { id: 'beach', name: 'Пляж' },
  { id: 'wedding', name: 'Свадьба' },
  { id: 'travel', name: 'Путешествие' },
  { id: 'home', name: 'Дом' },
  { id: 'special', name: 'Особый случай' },
] as const;

// Color Palette
export const COLOR_PALETTE = [
  { hex: '#000000', name: 'Черный' },
  { hex: '#FFFFFF', name: 'Белый' },
  { hex: '#808080', name: 'Серый' },
  { hex: '#8B4513', name: 'Коричневый' },
  { hex: '#F5DEB3', name: 'Бежевый' },
  { hex: '#000080', name: 'Темно-синий' },
  { hex: '#4169E1', name: 'Синий' },
  { hex: '#87CEEB', name: 'Голубой' },
  { hex: '#008000', name: 'Зеленый' },
  { hex: '#90EE90', name: 'Светло-зеленый' },
  { hex: '#FF0000', name: 'Красный' },
  { hex: '#FFC0CB', name: 'Розовый' },
  { hex: '#FFA500', name: 'Оранжевый' },
  { hex: '#FFFF00', name: 'Желтый' },
  { hex: '#800080', name: 'Фиолетовый' },
  { hex: '#FFD700', name: 'Золотой' },
  { hex: '#C0C0C0', name: 'Серебряный' },
] as const;

// Background Options
export const BACKGROUND_OPTIONS = {
  colors: ['#FFFFFF', '#F8F8F8', '#E5E5E5', '#000000', '#1C1C1E', '#FFE4E1', '#E6E6FA', '#F0FFFF'],
  gradients: [
    'linear-gradient(180deg, #F8F8F8 0%, #FFFFFF 100%)',
    'linear-gradient(180deg, #FFE4E1 0%, #FFFFFF 100%)',
    'linear-gradient(180deg, #E6E6FA 0%, #FFFFFF 100%)',
    'linear-gradient(180deg, #87CEEB 0%, #FFFFFF 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ],
  patterns: ['dots', 'stripes', 'grid', 'zigzag'],
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enableAI: process.env.EXPO_PUBLIC_ENABLE_AI === 'true',
  enableSubscription: process.env.EXPO_PUBLIC_ENABLE_SUBSCRIPTION === 'true',
  enableCommunity: process.env.EXPO_PUBLIC_ENABLE_COMMUNITY === 'true',
  enableWebCapture: process.env.EXPO_PUBLIC_ENABLE_WEB_CAPTURE === 'true',
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Проверьте подключение к интернету',
  AUTH_ERROR: 'Ошибка авторизации. Попробуйте войти снова',
  VALIDATION_ERROR: 'Проверьте введенные данные',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
  SUBSCRIPTION_REQUIRED: 'Эта функция доступна только в премиум версии',
  QUOTA_EXCEEDED: 'Вы достигли лимита. Обновите подписку',
} as const;
