import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom useTranslation hook
 * Wrapper around react-i18next with type safety
 */

export type Namespace =
  | 'common'
  | 'auth'
  | 'profile'
  | 'settings'
  | 'wardrobe'
  | 'outfit'
  | 'navigation'
  | 'categories'
  | 'errors';

export const useTranslation = (ns?: Namespace | Namespace[]) => {
  return useI18nTranslation(ns);
};

// Re-export for convenience
export { default as i18n } from '@lib/i18n/config';
