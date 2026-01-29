import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import ru_auth from '@locales/ru/auth.json';
import ru_categories from '@locales/ru/categories.json';
import ru_common from '@locales/ru/common.json';
import ru_navigation from '@locales/ru/navigation.json';
import ru_outfit from '@locales/ru/outfit.json';
import ru_profile from '@locales/ru/profile.json';
import ru_settings from '@locales/ru/settings.json';
import ru_wardrobe from '@locales/ru/wardrobe.json';

import en_auth from '@locales/en/auth.json';
import en_categories from '@locales/en/categories.json';
import en_common from '@locales/en/common.json';
import en_navigation from '@locales/en/navigation.json';
import en_outfit from '@locales/en/outfit.json';
import en_profile from '@locales/en/profile.json';
import en_settings from '@locales/en/settings.json';
import en_wardrobe from '@locales/en/wardrobe.json';

/**
 * i18n Configuration
 * Initializes internationalization for the app
 */

const resources = {
  ru: {
    common: ru_common,
    auth: ru_auth,
    profile: ru_profile,
    settings: ru_settings,
    wardrobe: ru_wardrobe,
    outfit: ru_outfit,
    navigation: ru_navigation,
    categories: ru_categories,
  },
  en: {
    common: en_common,
    auth: en_auth,
    profile: en_profile,
    settings: en_settings,
    wardrobe: en_wardrobe,
    outfit: en_outfit,
    navigation: en_navigation,
    categories: en_categories,
  },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4', // For React Native compatibility
  resources,
  lng: 'ru', // Default language
  fallbackLng: 'ru',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Disable suspense for React Native
  },
});

export default i18n;
