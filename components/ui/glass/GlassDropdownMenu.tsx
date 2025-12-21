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
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// 🔧 НАСТРОЙКА: Переключение между временным и нативным решением
// Установите USE_NATIVE_MENU = true после установки нативного модуля @react-native-menu/menu
const USE_NATIVE_MENU = false; // false = временный custom dropdown (работает сейчас)
// true = нативный UIMenu (требует нативную сборку)

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

/**
 * GlassDropdownMenu - Context menu with liquid glass trigger button on iOS 26+
 *
 * Features:
 * - Temporary: Custom dropdown menu (works NOW, no native modules needed)
 * - Future: Native UIMenu when USE_NATIVE_MENU = true (requires native build)
 * - iOS 26+: Glass trigger button
 * - Auto-adapts to light/dark mode on iOS 26+
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
  const [showCustomMenu, setShowCustomMenu] = useState(false);

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
            <GlassView style={styles.triggerButton} glassEffectStyle="regular" isInteractive>
              <Ionicons name={triggerIcon} size={22} color={iconColor} />
            </GlassView>
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
          <TouchableOpacity style={styles.triggerButtonFallback} activeOpacity={0.7}>
            <Ionicons name={triggerIcon} size={22} color="#000" />
          </TouchableOpacity>
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
        />
      </>
    );
  }

  // iOS < 26 or Android: Standard button with custom dropdown
  return (
    <>
      <View style={style}>
        <TouchableOpacity
          style={styles.triggerButtonFallback}
          activeOpacity={0.7}
          onPress={() => setShowCustomMenu(true)}
        >
          <Ionicons name={triggerIcon} size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <CustomDropdownModal
        visible={showCustomMenu}
        items={items}
        onClose={() => setShowCustomMenu(false)}
        onItemPress={handleItemPress}
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
}

const CustomDropdownModal: React.FC<CustomDropdownModalProps> = ({
  visible,
  items,
  onClose,
  onItemPress,
}) => {
  if (!visible) return null;

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
        <View style={styles.dropdown}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  item.disabled && styles.dropdownItemDisabled,
                  item.isActive && styles.dropdownItemActive,
                ]}
                onPress={() => onItemPress(item)}
                disabled={item.disabled}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.isDestructive ? '#FF3B30' : item.disabled ? '#CCC' : '#000'}
                  style={styles.dropdownItemIcon}
                />
                <Text
                  style={[
                    styles.dropdownItemText,
                    item.isDestructive && styles.dropdownItemTextDestructive,
                    item.disabled && styles.dropdownItemTextDisabled,
                  ]}
                >
                  {item.label}
                </Text>
                {item.isActive && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" style={styles.checkmark} />
                )}
              </TouchableOpacity>
              {index < items.length - 1 && <View style={styles.separator} />}
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
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  // Custom Dropdown Modal Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60, // Position below header
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
    marginLeft: 48, // Align with text after icon
  },
});
