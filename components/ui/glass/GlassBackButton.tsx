import { Ionicons } from '@expo/vector-icons';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import {
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface GlassBackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  iconColor?: string;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * GlassBackButton - Circular back button with liquid glass effect on iOS 26+
 *
 * Features:
 * - iOS 26+: Native liquid glass effect with translucency (no wrapper)
 * - iOS < 26 / Android: Material Design 3 style with subtle shadow
 * - Auto-adapts to light/dark mode
 * - Three sizes: small (36), medium (44), large (56)
 * - Press animation on all platforms
 *
 * Usage:
 * ```tsx
 * import { GlassBackButton } from '@components/ui/glass';
 *
 * <GlassBackButton
 *   onPress={() => router.back()}
 *   size="medium"
 * />
 * ```
 */
export const GlassBackButton: React.FC<GlassBackButtonProps> = ({
  onPress,
  style,
  size = 'medium',
  iconColor,
  accessibilityLabel = 'Go back',
}) => {
  const supportsLiquidGlass = CAN_USE_LIQUID_GLASS;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);

  // Size configurations
  const sizeConfig = {
    small: { container: 36, icon: 20 },
    medium: { container: 44, icon: 22 },
    large: { container: 56, icon: 24 },
  }[size];

  const containerStyle: ViewStyle = {
    width: sizeConfig.container,
    height: sizeConfig.container,
    borderRadius: sizeConfig.container / 2,
  };

  // iOS 26+: use dynamic label color by default; older iOS/Android keep theme-aware color.
  const defaultIconColor =
    iconColor ??
    (supportsLiquidGlass && Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : isDark
        ? '#FFFFFF'
        : '#000000');

  // Use arrow-back for Android (Material Design), chevron-back for iOS
  const backIcon = Platform.OS === 'android' ? 'arrow-back' : 'chevron-back';

  // Press animation handlers
  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // iOS 26+: Native Liquid Glass with Pressable
  if (supportsLiquidGlass) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[animatedStyle, style]}
      >
        <GlassView
          style={[styles.glassContainer, containerStyle]}
          glassEffectStyle="regular"
          isInteractive
        >
          <Ionicons name={backIcon} size={sizeConfig.icon} color={defaultIconColor} />
        </GlassView>
      </AnimatedPressable>
    );
  }

  // Fallback: Material Design 3 style button for iOS < 26 and Android
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fallbackContainer,
        containerStyle,
        isDark ? styles.fallbackContainerDark : styles.fallbackContainerLight,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{
        color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderless: true,
        radius: sizeConfig.container / 2,
      }}
    >
      <Ionicons name={backIcon} size={sizeConfig.icon} color={defaultIconColor} />
    </AnimatedPressable>
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
    overflow: 'hidden',
  },
  fallbackContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  fallbackContainerDark: {
    backgroundColor: 'rgba(45, 45, 47, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
