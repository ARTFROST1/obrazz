import { Platform } from 'react-native';

/**
 * Layout constants for the app
 */

// Bottom tab bar dimensions
export const TAB_BAR_HEIGHT = Platform.select({
  ios: 0, // iOS uses native tab bar, no extra padding needed
  android: 68, // Height of the floating tab bar (M3 style)
  default: 0,
});

export const TAB_BAR_MARGIN_BOTTOM = Platform.select({
  ios: 0,
  android: 20, // Bottom margin for floating effect (M3 style)
  default: 0,
});

// Total space taken by tab bar on Android (height + bottom margin)
export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM;

/**
 * Get the padding bottom needed for screens to avoid tab bar overlap
 * Use this in your screen containers on Android
 */
export const getTabBarPadding = (): number => {
  return Platform.OS === 'android' ? TAB_BAR_TOTAL_HEIGHT : 0;
};

export default {
  TAB_BAR_HEIGHT,
  TAB_BAR_MARGIN_BOTTOM,
  TAB_BAR_TOTAL_HEIGHT,
  getTabBarPadding,
};
