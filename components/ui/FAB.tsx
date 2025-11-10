import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Floating Action Button (FAB)
 *
 * Reusable FAB component following Material Design principles.
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
  size = 56,
  hideOnScroll = false,
  style,
  accessibilityLabel = 'Floating action button',
  testID = 'fab',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

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
    backgroundColor,
  };

  return (
    <AnimatedTouchable
      style={[styles.fab, fabStyle, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
    >
      <Ionicons name={icon as any} size={24} color={iconColor} />
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 110, // Raised 30% higher on both platforms
    right: 16,
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
