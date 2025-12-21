import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface DropdownMenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  style?: ViewStyle;
  triggerIcon?: keyof typeof Ionicons.glyphMap;
  /**
   * Position of the dropdown relative to the trigger button
   * - 'right': Dropdown appears below and to the right (default)
   * - 'left': Dropdown appears below and to the left
   */
  position?: 'right' | 'left';
  /**
   * Force dark theme styling regardless of system color scheme.
   * Used on screens that are always dark (e.g., Outfits).
   */
  forceDark?: boolean;
}

/**
 * DropdownMenu - Cross-platform context menu component
 *
 * Features:
 * - Matches iOS 26+ GlassDropdownMenu visual style & animations
 * - Uses same fade animation as temporary iOS 26 solution
 * - Smooth fade transitions (no slide)
 * - Adapts to light/dark mode
 * - Support for destructive and active items
 * - Works on Android and iOS < 26
 *
 * Usage:
 * ```tsx
 * import { DropdownMenu, DropdownMenuItem } from '@components/ui';
 *
 * const items: DropdownMenuItem[] = [
 *   { id: 'edit', icon: 'pencil', label: 'Edit', onPress: handleEdit },
 *   { id: 'delete', icon: 'trash', label: 'Delete', onPress: handleDelete, isDestructive: true },
 * ];
 *
 * <DropdownMenu items={items} />
 * ```
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  style,
  triggerIcon = 'ellipsis-horizontal',
  position = 'right',
  forceDark,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = forceDark ?? colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Theme colors
  const triggerBgColor = isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(248, 248, 248, 0.95)';
  const triggerBorderColor = isDark ? 'rgba(84, 84, 88, 0.65)' : 'rgba(229, 229, 229, 1)';
  const triggerIconColor = isDark ? '#FFFFFF' : '#000000';
  const menuBgColor = isDark ? '#2C2C2E' : '#FFFFFF';
  const menuTextColor = isDark ? '#FFFFFF' : '#000000';
  const separatorColor = isDark ? '#48484A' : '#E5E5E5';
  const activeItemBg = isDark ? '#3A3A3C' : '#F8F8F8';
  const backdropColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';

  const handleItemPress = useCallback((item: DropdownMenuItem) => {
    if (!item.disabled) {
      setShowMenu(false);
      // Small delay to let modal close before action
      setTimeout(() => item.onPress(), 100);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setShowMenu(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowMenu(false);
  }, []);

  return (
    <>
      <View style={style}>
        <TouchableOpacity
          style={[
            styles.triggerButton,
            { backgroundColor: triggerBgColor, borderColor: triggerBorderColor },
          ]}
          activeOpacity={0.7}
          onPress={handleOpen}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={triggerIcon} size={22} color={triggerIconColor} />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={showMenu}
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {/* Backdrop with fade animation */}
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            <View style={[styles.backdropOverlay, { backgroundColor: backdropColor }]} />
          </Animated.View>
        </Pressable>

        {/* Dropdown Menu - matches GlassDropdownMenu temporary solution */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.dropdownContainer,
            {
              top: insets.top + 60,
              [position === 'right' ? 'right' : 'left']: 16,
            },
          ]}
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: menuBgColor,
                shadowColor: isDark ? '#000' : '#000',
              },
            ]}
          >
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.disabled && styles.dropdownItemDisabled,
                    item.isActive && { backgroundColor: activeItemBg },
                  ]}
                  onPress={() => handleItemPress(item)}
                  disabled={item.disabled}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={
                      item.isDestructive
                        ? '#FF3B30'
                        : item.disabled
                          ? isDark
                            ? '#48484A'
                            : '#C7C7CC'
                          : menuTextColor
                    }
                    style={styles.dropdownItemIcon}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: menuTextColor },
                      item.isDestructive && styles.dropdownItemTextDestructive,
                      item.disabled && {
                        color: isDark ? '#48484A' : '#C7C7CC',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.isActive && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" style={styles.checkmark} />
                  )}
                </TouchableOpacity>
                {index < items.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    // Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backdrop: {
    flex: 1,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownContainer: {
    position: 'absolute',
    minWidth: 200,
    maxWidth: 280,
  },
  dropdown: {
    borderRadius: 14,
    overflow: 'hidden',
    // Shadow
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
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
    fontWeight: '400',
  },
  dropdownItemTextDestructive: {
    color: '#FF3B30',
  },
  checkmark: {
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48, // Align with text after icon
  },
});
