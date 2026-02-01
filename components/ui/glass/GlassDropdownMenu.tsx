import { Ionicons } from '@expo/vector-icons';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import { GlassView } from 'expo-glass-effect';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// 🔧 НАСТРОЙКА: Переключение между временным и нативным решением
// Установите USE_NATIVE_MENU = true после установки нативного модуля @react-native-menu/menu
// ✅ Включено после development build с нативными модулями (Stage 7.3)
const USE_NATIVE_MENU = Platform.OS === 'ios'; // Нативный UIMenu только для iOS
// false = временный custom dropdown (для Android и тестов)
// true = нативный UIMenu (требует development build)

// Условный импорт MenuView (только если USE_NATIVE_MENU = true)
let MenuView: any = null;
if (USE_NATIVE_MENU) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const menuModule = require('@react-native-menu/menu');
    MenuView = menuModule.MenuView;
  } catch {
    console.warn(
      '[GlassDropdownMenu] Native MenuView not available, falling back to custom dropdown',
    );
  }
}

export interface GlassDropdownItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
}

interface GlassDropdownMenuProps {
  items: GlassDropdownItem[];
  style?: ViewStyle;
  triggerIcon?: keyof typeof Ionicons.glyphMap;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * GlassDropdownMenu - Context menu with liquid glass trigger button on iOS 26+
 *
 * Features:
 * - iOS: Native UIMenu when USE_NATIVE_MENU = true
 * - Android: Material Design 3 bottom sheet menu
 * - iOS 26+: Glass trigger button
 * - Auto-adapts to light/dark mode
 *
 * 🔧 To switch to native UIMenu:
 * 1. Build native app with @react-native-menu/menu
 * 2. Change USE_NATIVE_MENU = true at the top of this file
 *
 * Usage:
 * ```tsx
 * import { GlassDropdownMenu, GlassDropdownItem } from '@components/ui/glass';
 *
 * const items: GlassDropdownItem[] = [
 *   { id: 'edit', icon: 'pencil', label: 'Edit', onPress: handleEdit },
 *   { id: 'delete', icon: 'trash', label: 'Delete', onPress: handleDelete, isDestructive: true },
 * ];
 *
 * <GlassDropdownMenu items={items} />
 * ```
 */
export const GlassDropdownMenu: React.FC<GlassDropdownMenuProps> = ({
  items,
  style,
  triggerIcon = 'ellipsis-horizontal',
}) => {
  const supportsLiquidGlass = CAN_USE_LIQUID_GLASS;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // CRITICAL: Delay mounting GlassView until component is stable
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    if (supportsLiquidGlass) {
      // Small delay to ensure proper initialization
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [supportsLiquidGlass]);

  // Dynamic icon color for glass button
  const iconColor = Platform.OS === 'ios' && supportsLiquidGlass ? PlatformColor('label') : '#000';

  // === NATIVE MENU (UIMenu) - Requires native build ===
  if (USE_NATIVE_MENU && MenuView) {
    const menuActions = items.map((item) => ({
      id: item.id,
      title: item.label,
      attributes: {
        destructive: item.isDestructive,
        disabled: item.disabled,
      },
    }));

    const handlePressAction = ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      const item = items.find((i) => i.id === nativeEvent.event);
      if (item && !item.disabled) {
        item.onPress();
      }
      setIsMenuOpen(false);
    };

    // iOS 26+: Glass button with native UIMenu
    if (supportsLiquidGlass && mounted) {
      return (
        <View style={style}>
          <MenuView
            actions={menuActions}
            onPressAction={handlePressAction}
            shouldOpenOnLongPress={false}
          >
            <Animated.View
              style={[
                { opacity: isMenuOpen ? 0 : 1 },
                { transform: [{ scale: isMenuOpen ? 0.8 : 1 }] },
              ]}
            >
              <GlassView style={styles.triggerButton} glassEffectStyle="regular" isInteractive>
                <Ionicons name={triggerIcon} size={22} color={iconColor} />
              </GlassView>
            </Animated.View>
          </MenuView>
        </View>
      );
    }

    // Fallback: Standard button with native UIMenu
    return (
      <View style={style}>
        <MenuView
          actions={menuActions}
          onPressAction={handlePressAction}
          shouldOpenOnLongPress={false}
        >
          <Animated.View
            style={[
              { opacity: isMenuOpen ? 0 : 1 },
              { transform: [{ scale: isMenuOpen ? 0.8 : 1 }] },
            ]}
          >
            <TouchableOpacity style={styles.triggerButtonFallback} activeOpacity={0.7}>
              <Ionicons name={triggerIcon} size={22} color="#000" />
            </TouchableOpacity>
          </Animated.View>
        </MenuView>
      </View>
    );
  }

  // === CUSTOM DROPDOWN MENU (TEMPORARY) - Works now, no native modules ===
  const handleItemPress = (item: GlassDropdownItem) => {
    if (!item.disabled) {
      setShowCustomMenu(false);
      // Small delay to let modal close before action
      setTimeout(() => item.onPress(), 100);
    }
  };

  // iOS 26+: Glass button with custom dropdown
  if (supportsLiquidGlass && mounted) {
    return (
      <>
        <View style={style}>
          <Pressable onPress={() => setShowCustomMenu(true)}>
            <GlassView style={styles.triggerButton} glassEffectStyle="regular" isInteractive>
              <Ionicons name={triggerIcon} size={22} color={iconColor} />
            </GlassView>
          </Pressable>
        </View>
        <CustomDropdownModal
          visible={showCustomMenu}
          items={items}
          onClose={() => setShowCustomMenu(false)}
          onItemPress={handleItemPress}
          isDark={isDark}
        />
      </>
    );
  }

  // iOS < 26 or Android: Standard button with Material bottom sheet (Android) or dropdown (iOS)
  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <>
      <View style={style}>
        <AnimatedPressable
          style={[
            styles.triggerButtonFallback,
            isDark ? styles.triggerButtonFallbackDark : styles.triggerButtonFallbackLight,
            animatedButtonStyle,
          ]}
          onPress={() => setShowCustomMenu(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{
            color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            borderless: true,
            radius: 24,
          }}
        >
          <Ionicons name={triggerIcon} size={22} color={isDark ? '#FFFFFF' : '#000000'} />
        </AnimatedPressable>
      </View>
      <CustomDropdownModal
        visible={showCustomMenu}
        items={items}
        onClose={() => setShowCustomMenu(false)}
        onItemPress={handleItemPress}
        isDark={isDark}
      />
    </>
  );
};

// === CUSTOM DROPDOWN MODAL COMPONENT ===
interface CustomDropdownModalProps {
  visible: boolean;
  items: GlassDropdownItem[];
  onClose: () => void;
  onItemPress: (item: GlassDropdownItem) => void;
  isDark: boolean;
}

const CustomDropdownModal: React.FC<CustomDropdownModalProps> = ({
  visible,
  items,
  onClose,
  onItemPress,
  isDark,
}) => {
  if (!visible) return null;

  // Android: Material Design 3 bottom sheet
  if (Platform.OS === 'android') {
    return (
      <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.backdropOverlay}
          />
        </Pressable>

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.androidBottomSheet,
            isDark ? styles.androidBottomSheetDark : styles.androidBottomSheetLight,
          ]}
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

          {items.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.androidMenuItem,
                index === items.length - 1 && styles.androidMenuItemLast,
                item.disabled && styles.dropdownItemDisabled,
              ]}
              onPress={() => !item.disabled && onItemPress(item)}
              android_ripple={{
                color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={
                  item.isDestructive
                    ? '#FF3B30'
                    : item.disabled
                      ? isDark
                        ? '#48484A'
                        : '#C7C7CC'
                      : isDark
                        ? '#FFFFFF'
                        : '#000000'
                }
                style={styles.androidMenuItemIcon}
              />
              <Text
                style={[
                  styles.androidMenuItemText,
                  item.isDestructive && styles.dropdownItemTextDestructive,
                  item.disabled && styles.dropdownItemTextDisabled,
                  isDark && !item.isDestructive && !item.disabled && styles.androidMenuItemTextDark,
                ]}
              >
                {item.label}
              </Text>
              {item.isActive && <Ionicons name="checkmark" size={24} color="#007AFF" />}
            </Pressable>
          ))}

          {/* Cancel button */}
          <View style={styles.androidCancelContainer}>
            <Pressable
              onPress={onClose}
              style={[
                styles.androidCancelButton,
                isDark ? styles.androidCancelButtonDark : styles.androidCancelButtonLight,
              ]}
              android_ripple={{
                color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <Text style={styles.androidCancelText}>Отмена</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    );
  }

  // iOS: Dropdown menu
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <View style={styles.backdropOverlay} />
        </Animated.View>
      </Pressable>

      {/* Dropdown Menu */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.dropdownContainer}
      >
        <View style={[styles.dropdown, isDark && styles.dropdownDark]}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  item.disabled && styles.dropdownItemDisabled,
                  item.isActive &&
                    (isDark ? styles.dropdownItemActiveDark : styles.dropdownItemActive),
                ]}
                onPress={() => onItemPress(item)}
                disabled={item.disabled}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={
                    item.isDestructive
                      ? '#FF3B30'
                      : item.disabled
                        ? '#CCC'
                        : isDark
                          ? '#FFFFFF'
                          : '#000'
                  }
                  style={styles.dropdownItemIcon}
                />
                <Text
                  style={[
                    styles.dropdownItemText,
                    item.isDestructive && styles.dropdownItemTextDestructive,
                    item.disabled && styles.dropdownItemTextDisabled,
                    isDark && !item.isDestructive && !item.disabled && styles.dropdownItemTextDark,
                  ]}
                >
                  {item.label}
                </Text>
                {item.isActive && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" style={styles.checkmark} />
                )}
              </TouchableOpacity>
              {index < items.length - 1 && (
                <View style={[styles.separator, isDark && styles.separatorDark]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  triggerButtonFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  triggerButtonFallbackLight: {
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
  triggerButtonFallbackDark: {
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
  // Custom Dropdown Modal Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    minWidth: 200,
    maxWidth: 280,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownDark: {
    backgroundColor: '#1C1C1E',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  dropdownItemActive: {
    backgroundColor: '#F8F8F8',
  },
  dropdownItemActiveDark: {
    backgroundColor: '#2C2C2E',
  },
  dropdownItemDisabled: {
    opacity: 0.4,
  },
  dropdownItemIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  dropdownItemTextDark: {
    color: '#FFFFFF',
  },
  dropdownItemTextDestructive: {
    color: '#FF3B30',
  },
  dropdownItemTextDisabled: {
    color: '#CCC',
  },
  checkmark: {
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
    marginLeft: 48,
  },
  separatorDark: {
    backgroundColor: '#38383A',
  },
  // Android Bottom Sheet Styles
  androidBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  androidBottomSheetLight: {
    backgroundColor: '#FFFFFF',
  },
  androidBottomSheetDark: {
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
  androidMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  androidMenuItemLast: {
    borderBottomWidth: 0,
  },
  androidMenuItemIcon: {
    marginRight: 16,
  },
  androidMenuItemText: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
  },
  androidMenuItemTextDark: {
    color: '#FFFFFF',
  },
  androidCancelContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  androidCancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  androidCancelButtonLight: {
    backgroundColor: '#F2F2F7',
  },
  androidCancelButtonDark: {
    backgroundColor: '#2C2C2E',
  },
  androidCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});
