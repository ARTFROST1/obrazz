import { DropdownMenu, DropdownMenuItem } from '@components/ui/DropdownMenu';
import { SearchBar } from '@components/ui/SearchBar';
import { GlassDropdownItem, GlassDropdownMenu, GlassSearchBar } from '@components/ui/glass';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface OutfitHeaderMenuItem {
  id: string;
  icon: React.ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
}

interface OutfitHeaderProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  menuItems: OutfitHeaderMenuItem[];
  /**
   * Enable liquid glass styling (only works on iOS 26+)
   * When true and on iOS 26+, uses GlassSearchBar and GlassDropdownMenu
   * When false or on other platforms, uses custom SearchBar and DropdownMenu
   */
  liquidGlassEnabled?: boolean;
  style?: ViewStyle;
}

/**
 * OutfitHeader - Unified header component for outfit screen
 *
 * Automatically selects the appropriate implementation:
 * - iOS 26+: Native liquid glass components (GlassSearchBar, GlassDropdownMenu)
 * - iOS < 26 / Android: Custom components that visually match the glass style
 *
 * Features:
 * - Search bar + context menu in a single row
 * - Consistent styling across platforms
 * - Absolute positioning for overlay effect
 * - Dark/light mode support
 *
 * Usage:
 * ```tsx
 * import { OutfitHeader, OutfitHeaderMenuItem } from '@components/outfit/OutfitHeader';
 *
 * const menuItems: OutfitHeaderMenuItem[] = [
 *   { id: 'filter', icon: 'filter', label: 'Filter', onPress: handleFilter },
 *   { id: 'select', icon: 'checkmark-circle', label: 'Select', onPress: handleSelect },
 * ];
 *
 * <OutfitHeader
 *   searchValue={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   searchPlaceholder="Search outfits..."
 *   menuItems={menuItems}
 * />
 * ```
 */
export const OutfitHeader: React.FC<OutfitHeaderProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  menuItems,
  liquidGlassEnabled = true,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const useLiquidGlass = liquidGlassEnabled && CAN_USE_LIQUID_GLASS;

  // Convert menu items to Glass format (same structure, just typed differently)
  const glassMenuItems: GlassDropdownItem[] = menuItems.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    onPress: item.onPress,
    isActive: item.isActive,
    isDestructive: item.isDestructive,
    disabled: item.disabled,
  }));

  // Convert menu items to DropdownMenu format
  const dropdownMenuItems: DropdownMenuItem[] = menuItems.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    onPress: item.onPress,
    isActive: item.isActive,
    isDestructive: item.isDestructive,
    disabled: item.disabled,
  }));

  // iOS 26+ Liquid Glass version
  if (useLiquidGlass) {
    return (
      <View style={[styles.glassContainer, { top: insets.top + 8 }, style]}>
        <GlassSearchBar
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          style={styles.glassSearchBar}
        />
        <GlassDropdownMenu items={glassMenuItems} style={styles.glassMenu} />
      </View>
    );
  }

  // Standard version for Android and iOS < 26
  return (
    <View
      style={[
        styles.standardContainer,
        {
          top: insets.top + (Platform.OS === 'android' ? 8 : 8),
        },
        style,
      ]}
    >
      <SearchBar
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        style={styles.standardSearchBar}
        variant="rounded"
        forceDark
      />
      <DropdownMenu
        items={dropdownMenuItems}
        style={styles.standardMenu}
        position="right"
        forceDark
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // iOS 26+ Glass styles (absolute positioned, no container)
  glassContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      android: {
        elevation: 9999,
      },
    }),
  },
  glassSearchBar: {
    flex: 1,
    marginRight: 12,
  },
  glassMenu: {
    // GlassDropdownMenu has its own sizing
  },

  // Standard (non-glass) styles - iOS < 26 + Android
  standardContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      android: {
        elevation: 9999,
      },
    }),
  },
  standardSearchBar: {
    flex: 1,
    marginRight: 12,
  },
  standardMenu: {
    // DropdownMenu has its own sizing
  },
});
