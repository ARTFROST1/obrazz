/**
 * Store Logos Mapping
 * Maps store IDs to their local logo assets
 */

// Type-safe logo imports
export const STORE_LOGOS = {
  '1': require('@/assets/images/stores/zara.png'),
  '2': require('@/assets/images/stores/hm.png'),
  '3': require('@/assets/images/stores/asos.png'),
  '4': require('@/assets/images/stores/nike.png'),
  '5': require('@/assets/images/stores/adidas.png'),
  '6': require('@/assets/images/stores/gap.png'),
  '7': require('@/assets/images/stores/mango.png'),
  '8': require('@/assets/images/stores/pullandbear.png'),
  '9': require('@/assets/images/stores/bershka.png'),
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
