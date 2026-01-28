/**
 * ContextMenuView - iOS-first context menus for cards
 *
 * iOS: Uses a tiny native Expo view that attaches `UIContextMenuInteraction` (Photos-like behavior).
 * Android/Web: Keeps the existing RNGH Gesture-based tap/long-press handling.
 *
 * @example
 * ```tsx
 * <ContextMenuView
 *   actions={[
 *     { id: 'edit', title: 'Edit', icon: 'pencil' },
 *     { id: 'delete', title: 'Delete', destructive: true },
 *   ]}
 *   onPressAction={(actionId) => handleAction(actionId)}
 *   onPress={() => navigate()}
 * >
 *   <View style={styles.card}>...</View>
 * </ContextMenuView>
 * ```
 */
import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ObrazzContextMenuView, type ObrazzContextMenuAction } from 'obrazz-context-menu';

export interface ContextMenuAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuViewProps {
  children: React.ReactNode;
  actions: ContextMenuAction[];
  onPressAction: (actionId: string) => void;
  /** Called when tapped (not long press) */
  onPress?: () => void;
  /** Called on long press (Android only, iOS uses native menu) */
  onLongPress?: () => void;
  /** Disable context menu */
  disabled?: boolean;
}

/**
 * ContextMenuView - Wraps children with native iOS context menu
 *
 * On iOS: MenuView handles everything natively - long press shows menu with haptic,
 *         tap detected via simple touch tracking (no GestureDetector to avoid conflicts)
 * On Android: Uses Gesture API for tap/long press
 */
export const ContextMenuView: React.FC<ContextMenuViewProps> = ({
  children,
  actions,
  onPressAction,
  onPress,
  onLongPress,
  disabled = false,
}) => {
  // For Android gesture handling
  const scale = useSharedValue(1);

  // Callbacks for gesture handlers
  const handleTap = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleLongPressCallback = useCallback(() => {
    onLongPress?.();
  }, [onLongPress]);

  // Animated style for press feedback (Android)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // === iOS native (UIContextMenuInteraction) ===
  // This keeps tap handling in RN (Pressable) and long-press fully native.
  if (Platform.OS === 'ios' && !disabled) {
    const menuActions: ObrazzContextMenuAction[] = actions.map((action) => ({
      id: action.id,
      title: action.title,
      systemIcon: action.icon,
      destructive: action.destructive,
      disabled: action.disabled,
    }));

    return (
      <ObrazzContextMenuView
        actions={menuActions}
        enabled={!disabled}
        onAction={(event: { nativeEvent: { id: string } }) => {
          onPressAction(event.nativeEvent.id);
        }}
        style={styles.menuView}
      >
        <Pressable onPress={onPress} disabled={!onPress}>
          {children}
        </Pressable>
      </ObrazzContextMenuView>
    );
  }

  // === Android/Web or disabled ===
  // Use gesture handler for both tap and long press
  const tapGesture = Gesture.Tap()
    .maxDuration(200)
    .maxDistance(10) // If finger moves more than 10 points, cancel tap (allow scroll)
    .onStart(() => {
      scale.value = withTiming(0.97, { duration: 50 });
    })
    .onEnd((_e, success) => {
      scale.value = withTiming(1, { duration: 100 });
      if (success) {
        runOnJS(handleTap)();
      }
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 100 });
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(10) // If finger moves more than 10 points, cancel (allow scroll)
    .onStart(() => {
      scale.value = withTiming(0.95, { duration: 100 });
      runOnJS(handleLongPressCallback)();
    })
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 100 });
    });

  // Race: first gesture to activate wins, others are cancelled
  // This allows scroll to win if finger moves
  const composedGesture = Gesture.Race(longPressGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  menuView: {
    // MenuView needs no special styling
  },
});

export default ContextMenuView;
