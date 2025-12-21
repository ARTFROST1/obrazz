import { Ionicons } from '@expo/vector-icons';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import {
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface GlassIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  iconColor?: string;
  accessibilityLabel?: string;
}

/**
 * GlassIconButton - Circular icon button with liquid glass effect on iOS 26+
 *
 * Features:
 * - iOS 26+: Native liquid glass effect with translucency (no wrapper)
 * - iOS < 26 / Android: Semi-transparent fallback
 * - Auto-adapts to light/dark mode
 * - Three sizes: small (36), medium (44), large (56)
 * - Customizable icon from Ionicons
 *
 * Usage:
 * ```tsx
 * import { GlassIconButton } from '@components/ui/glass';
 *
 * <GlassIconButton
 *   icon="heart"
 *   onPress={() => toggleFavorite()}
 *   size="medium"
 *   iconColor="#FF3B30"
 * />
 * ```
 */
export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon,
  onPress,
  style,
  size = 'medium',
  iconColor,
  accessibilityLabel,
}) => {
  const supportsLiquidGlass = CAN_USE_LIQUID_GLASS;

  // Size configurations
  const sizeConfig = {
    small: { container: 36, icon: 20 },
    medium: { container: 44, icon: 24 },
    large: { container: 56, icon: 28 },
  }[size];

  const containerStyle: ViewStyle = {
    width: sizeConfig.container,
    height: sizeConfig.container,
    borderRadius: sizeConfig.container / 2,
  };

  // iOS 26+: use dynamic label color by default; older iOS/Android keep current black.
  const defaultIconColor =
    iconColor ??
    (supportsLiquidGlass && Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : '#000000');

  // iOS 26+: Native Liquid Glass with Pressable
  if (supportsLiquidGlass) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        <GlassView
          style={[styles.glassContainer, containerStyle]}
          glassEffectStyle="regular"
          isInteractive
        >
          <Ionicons name={icon} size={sizeConfig.icon} color={defaultIconColor} />
        </GlassView>
      </Pressable>
    );
  }

  // Fallback: Semi-transparent button for iOS < 26 and Android
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fallbackContainer, containerStyle, style]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={sizeConfig.icon} color={defaultIconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
