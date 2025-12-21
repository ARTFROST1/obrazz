/**
 * Store Logos Mapping
 * Maps store IDs to their local logo assets
 * Updated for Russian market stores
 */

// Type-safe logo imports
export const STORE_LOGOS = {
  '1': require('@/assets/images/stores/1.png'),
  '2': require('@/assets/images/stores/2.png'),
  '3': require('@/assets/images/stores/3.png'),
  '4': require('@/assets/images/stores/4.png'),
  '5': require('@/assets/images/stores/5.png'),
  '6': require('@/assets/images/stores/6.png'),
  '7': require('@/assets/images/stores/7.png'),
  '8': require('@/assets/images/stores/8.png'),
  '9': require('@/assets/images/stores/9.png'),
  '10': require('@/assets/images/stores/10.png'),
  '11': require('@/assets/images/stores/11.png'),
} as const;

/**
 * Get local logo for default store
 */
export function getLocalStoreLogo(storeId: string) {
  return STORE_LOGOS[storeId as keyof typeof STORE_LOGOS];
}

/**
 * Check if store has local logo
 */
export function hasLocalLogo(storeId: string): boolean {
  return storeId in STORE_LOGOS;
}
