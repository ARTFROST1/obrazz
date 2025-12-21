import { TAB_BAR_TOTAL_HEIGHT } from '@constants/Layout';
import { Ionicons } from '@expo/vector-icons';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import {
  Platform,
  PlatformColor,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export interface FABProps {
  icon: string;
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
  hideOnScroll?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  /**
   * Optional override to control when Liquid Glass is enabled.
   * Useful to delay GlassView mount until after first layout.
   */
  liquidGlassEnabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

/**
 * Floating Action Button (FAB)
 *
 * Reusable FAB component following Material Design principles.
 * Uses native iOS 26 Liquid Glass on supported devices, with graceful fallback.
 * Used for primary actions like creating new content.
 *
 * @example
 * ```tsx
 * <FAB
 *   icon="add"
 *   onPress={() => router.push('/outfit/create')}
 *   accessibilityLabel="Create new outfit"
 * />
 * ```
 */
export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  iconColor = '#FFFFFF',
  backgroundColor = '#000000',
  size = 64,
  hideOnScroll = false,
  style,
  accessibilityLabel = 'Floating action button',
  testID = 'fab',
  liquidGlassEnabled,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Check iOS 26+ support for native liquid glass
  const supportsLiquidGlass = liquidGlassEnabled ?? CAN_USE_LIQUID_GLASS;

  // CRITICAL: Delay mounting GlassView until component is stable
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (supportsLiquidGlass) {
      // Small delay to ensure proper initialization
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [supportsLiquidGlass]);

  // Dynamic icon color based on theme
  const dynamicIconColor =
    Platform.OS === 'ios' && supportsLiquidGlass ? PlatformColor('label') : iconColor;

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const fabStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // iOS 26+: Native Liquid Glass Button
  if (supportsLiquidGlass && mounted) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={testID}
        style={[styles.container, style]}
      >
        <AnimatedGlassView
          style={[styles.fab, fabStyle, animatedStyle]}
          glassEffectStyle="regular"
          isInteractive
        >
          <Ionicons name={icon as any} size={28} color={dynamicIconColor} />
        </AnimatedGlassView>
      </TouchableOpacity>
    );
  }

  // Fallback: Standard button for iOS < 26, Android, or during mount delay
  return (
    <AnimatedTouchable
      style={[styles.container, styles.fab, fabStyle, animatedStyle, { backgroundColor }, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
    >
      <Ionicons name={icon as any} size={28} color={dynamicIconColor} />
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : TAB_BAR_TOTAL_HEIGHT + 16,
    right: 16,
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
});

export default FAB;
