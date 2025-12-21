# OutfitHeader Component

Unified header component for the Outfit screen with automatic Liquid Glass support on iOS 26+.

## Architecture

The `OutfitHeader` automatically switches between implementations based on platform and iOS version:

- **iOS 26+** (when Liquid Glass is available): Uses native glass components (`GlassSearchBar`, `GlassDropdownMenu`)
- **iOS < 26 / Android**: Uses custom components that visually match the glass style (`SearchBar`, `DropdownMenu`)

## Features

- 🔍 **Search bar** with real-time filtering
- ⚙️ **Context menu** (3-dot menu) with custom actions
- 🎨 **Automatic styling** based on platform capabilities
- 📱 **Absolute positioning** for overlay effect
- 🌙 **Outfits is always dark**: fallback UI uses forced-dark styling to match the screen

## Props

```typescript
interface OutfitHeaderProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  menuItems: OutfitHeaderMenuItem[];
  liquidGlassEnabled?: boolean;
  style?: ViewStyle;
}

interface OutfitHeaderMenuItem {
  id: string;
  icon: Ionicons['name'];
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
}
```

## Usage Example

```tsx
import { OutfitHeader, OutfitHeaderMenuItem } from '@components/outfit/OutfitHeader';

// Define menu items
const menuItems: OutfitHeaderMenuItem[] = useMemo(
  () => [
    {
      id: 'select',
      icon: isSelectionMode ? 'close' : 'checkmark-circle-outline',
      label: isSelectionMode ? 'Cancel' : 'Select',
      onPress: handleToggleSelectionMode,
    },
    {
      id: 'filter',
      icon: 'filter',
      label: 'Filter',
      onPress: () => setShowFilterMenu(true),
      isActive: hasActiveFilters,
    },
  ],
  [isSelectionMode, hasActiveFilters, handleToggleSelectionMode],
);

// Render header
<OutfitHeader
  searchValue={searchQuery}
  onSearchChange={handleSearch}
  searchPlaceholder="Search outfits..."
  menuItems={menuItems}
  liquidGlassEnabled={supportsLiquidGlass}
/>;
```

## Integration with Outfit Screen

The header is designed to work seamlessly with the outfit screen layout:

1. **Absolute positioning**: Header overlays the content (z-index: 9999)
2. **Content padding**: Outfit grid uses `paddingTop` to account for header height
3. **Selection mode**: When selection mode is active, additional action buttons appear below the header

### Layout Pattern

```tsx
<DismissKeyboardView style={styles.container}>
  {/* Outfit Grid with padding for header */}
  <OutfitGrid contentContainerStyle={{ paddingTop: headerContentPadding }} {...otherProps} />

  {/* FAB */}
  <FAB liquidGlassEnabled={supportsLiquidGlass} />

  {/* Header (absolute positioned) */}
  <OutfitHeader liquidGlassEnabled={supportsLiquidGlass} />

  {/* Selection mode actions (absolute positioned below header) */}
  {isSelectionMode && <SelectionActions />}
</DismissKeyboardView>
```

## Platform Detection

The component uses `CAN_USE_LIQUID_GLASS` from `@utils/platform`:

- Checks iOS version (26+)
- Verifies `isLiquidGlassAvailable()` from `expo-glass-effect`
- Provides consistent behavior across the app

## Menu Items

### Standard Items

- **Select mode toggle**: Switches between selection and normal mode
- **Filter**: Opens filter modal, shows active state when filters applied
- **Grid columns** (if implemented): Toggles between 2/3 columns

### Item States

- `isActive`: Highlights the item (e.g., filter button when filters active)
- `isDestructive`: Red color for dangerous actions (delete, clear)
- `disabled`: Grays out and disables interaction

## Styling Notes

### iOS 26+ (Liquid Glass)

- Search bar: Native glass with system blur
- Dropdown trigger: 48×48px glass button with system colors
- Menu: Custom dropdown (white background, stable colors)

### iOS < 26 / Android (Custom)

- Search bar: Custom rounded component matching glass style
- Dropdown trigger: Custom 48×48px button with border
- Menu: Same custom dropdown implementation

**Важно:** экран Outfits намеренно всегда тёмный. Поэтому в fallback-ветке `OutfitHeader` передаёт `forceDark` в `SearchBar` и `DropdownMenu`, чтобы внешний вид не зависел от системной темы.

## Related Components

- `GlassSearchBar` (iOS 26+ only)
- `GlassDropdownMenu` (iOS 26+ only)
- `SearchBar` (fallback)
- `DropdownMenu` (fallback)
- `OutfitGrid` (content component)

## See Also

- [WardrobeHeader](../wardrobe/WardrobeHeader.tsx) - Same pattern for wardrobe screen
- [Liquid Glass Implementation Plan](../../Docs/Extra/LIQUID_GLASS_IMPLEMENTATION_PLAN.md)
- [Outfit Screen Refactoring](../../Docs/Extra/OUTFIT_LIQUID_GLASS_REFACTORING.md)
