/**
 * ContextMenuView - iOS-first context menus for cards
 *
 * iOS: Uses a tiny native Expo view that attaches `UIContextMenuInteraction` (Photos-like behavior).
 * Android: Material Design 3 bottom sheet modal menu.
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
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInDown,
  SlideOutDown,
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
 * ContextMenuView - Wraps children with native iOS context menu / Android bottom sheet
 *
 * On iOS: MenuView handles everything natively - long press shows menu with haptic,
 *         tap detected via simple touch tracking (no GestureDetector to avoid conflicts)
 * On Android: Uses Gesture API for tap/long press + Material Design bottom sheet menu
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
  // Android bottom sheet state
  const [showAndroidMenu, setShowAndroidMenu] = useState(false);

  // Callbacks for gesture handlers
  const handleTap = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleLongPressCallback = useCallback(() => {
    if (Platform.OS === 'android') {
      setShowAndroidMenu(true);
    }
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

  // === Android: Material Design Bottom Sheet Menu ===
  const handleAndroidAction = (actionId: string) => {
    setShowAndroidMenu(false);
    setTimeout(() => onPressAction(actionId), 100);
  };

  const tapGesture = Gesture.Tap()
    .maxDuration(200)
    .maxDistance(10)
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
    .maxDistance(10)
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

  const composedGesture = Gesture.Race(longPressGesture, tapGesture);

  return (
    <>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>

      {/* Android Material Bottom Sheet Menu */}
      <AndroidBottomSheetMenu
        visible={showAndroidMenu}
        actions={actions}
        onAction={handleAndroidAction}
        onClose={() => setShowAndroidMenu(false)}
      />
    </>
  );
};

// Android Material Design 3 Bottom Sheet Menu
interface AndroidBottomSheetMenuProps {
  visible: boolean;
  actions: ContextMenuAction[];
  onAction: (actionId: string) => void;
  onClose: () => void;
}

const AndroidBottomSheetMenu: React.FC<AndroidBottomSheetMenuProps> = ({
  visible,
  actions,
  onAction,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
        />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(200)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.bottomSheet, isDark ? styles.bottomSheetDark : styles.bottomSheetLight]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandle}>
          <View
            style={[
              styles.dragHandleBar,
              isDark ? styles.dragHandleBarDark : styles.dragHandleBarLight,
            ]}
          />
        </View>

        {/* Menu items */}
        {actions.map((action, index) => (
          <Pressable
            key={action.id}
            onPress={() => !action.disabled && onAction(action.id)}
            style={[
              styles.menuItem,
              index === actions.length - 1 && styles.menuItemLast,
              action.disabled && styles.menuItemDisabled,
            ]}
            android_ripple={{
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {action.icon && (
              <Ionicons
                name={action.icon as any}
                size={24}
                color={
                  action.destructive
                    ? '#FF3B30'
                    : action.disabled
                      ? isDark
                        ? '#48484A'
                        : '#C7C7CC'
                      : isDark
                        ? '#FFFFFF'
                        : '#000000'
                }
                style={styles.menuItemIcon}
              />
            )}
            <Text
              style={[
                styles.menuItemText,
                action.destructive && styles.menuItemTextDestructive,
                action.disabled && styles.menuItemTextDisabled,
                isDark && !action.destructive && !action.disabled && styles.menuItemTextDark,
              ]}
            >
              {action.title}
            </Text>
          </Pressable>
        ))}

        {/* Cancel button */}
        <View style={styles.cancelContainer}>
          <Pressable
            onPress={onClose}
            style={[
              styles.cancelButton,
              isDark ? styles.cancelButtonDark : styles.cancelButtonLight,
            ]}
            android_ripple={{
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>
              Отмена
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuView: {
    // MenuView needs no special styling
  },
  // Android Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
    maxHeight: '70%',
  },
  bottomSheetLight: {
    backgroundColor: '#FFFFFF',
  },
  bottomSheetDark: {
    backgroundColor: '#1C1C1E',
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  dragHandleBarLight: {
    backgroundColor: '#C7C7CC',
  },
  dragHandleBarDark: {
    backgroundColor: '#48484A',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 17,
    color: '#000000',
  },
  menuItemTextDark: {
    color: '#FFFFFF',
  },
  menuItemTextDestructive: {
    color: '#FF3B30',
  },
  menuItemTextDisabled: {
    color: '#8E8E93',
  },
  cancelContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  cancelButtonLight: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonDark: {
    backgroundColor: '#2C2C2E',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButtonTextDark: {
    color: '#0A84FF',
  },
});

export default ContextMenuView;
