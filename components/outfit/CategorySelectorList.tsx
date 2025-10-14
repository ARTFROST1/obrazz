import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CategoryCarouselCentered, CarouselViewMode } from './CategoryCarouselCentered';
import { WardrobeItem, ItemCategory } from '../../types/models/item';

interface CategorySelectorListProps {
  categories: ItemCategory[];
  wardrobeItems: WardrobeItem[];
  selectedItems: Record<ItemCategory, WardrobeItem | null>;
  lockedCategories: Set<ItemCategory>;
  viewMode?: CarouselViewMode;
  onItemSelect: (category: ItemCategory, item: WardrobeItem | null) => void;
  onLockToggle: (category: ItemCategory) => void;
}

/**
 * CategorySelectorList - Seamless vertical list of centered carousels
 * Uses center-based selection like in the reference app
 */
export function CategorySelectorList({
  categories,
  wardrobeItems,
  selectedItems,
  lockedCategories,
  viewMode = 'medium',
  onItemSelect,
  onLockToggle,
}: CategorySelectorListProps) {
  const getItemsByCategory = (category: ItemCategory): WardrobeItem[] => {
    return wardrobeItems.filter((item) => item.category === category);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {categories.map((category) => {
        const categoryItems = getItemsByCategory(category);
        const selectedItem = selectedItems[category];

        return (
          <CategoryCarouselCentered
            key={category}
            category={category}
            items={categoryItems}
            selectedItemId={selectedItem?.id || null}
            isLocked={lockedCategories.has(category)}
            viewMode={viewMode}
            onItemSelect={(item) => onItemSelect(category, item)}
            onLockToggle={() => onLockToggle(category)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentContainer: {
    paddingTop: 0,
    paddingBottom: 24,
  },
});
