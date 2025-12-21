import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

export const IOS_MAJOR_VERSION: number = (() => {
  if (Platform.OS !== 'ios') return 0;
  const version = Platform.Version;
  return typeof version === 'string' ? parseInt(version.split('.')[0], 10) : version;
})();

export const IS_IOS = Platform.OS === 'ios';
export const IS_IOS_26_OR_NEWER = IS_IOS && IOS_MAJOR_VERSION >= 26;

// Computed once per JS bundle load.
export const CAN_USE_LIQUID_GLASS = IS_IOS_26_OR_NEWER && isLiquidGlassAvailable();
