import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import {
  CategoryCarouselCentered,
  CategoryDisplayMode,
  CATEGORY_GROUPS,
  calculateItemDimensions,
} from './CategoryCarouselCentered';
import { WardrobeItem, ItemCategory } from '../../types/models/item';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CategorySelectorListProps {
  categories: ItemCategory[];
  wardrobeItems: WardrobeItem[];
  selectedItems: Record<ItemCategory, WardrobeItem | null>;
  lockedCategories: Set<ItemCategory>;
  displayMode: CategoryDisplayMode;
  onItemSelect: (category: ItemCategory, item: WardrobeItem | null) => void;
  onLockToggle: (category: ItemCategory) => void;
}

/**
 * CategorySelectorList - Seamless vertical list of centered carousels
 * Filters categories based on display mode and auto-scales items to fit perfectly
 */
export function CategorySelectorList({
  categories,
  wardrobeItems,
  selectedItems,
  lockedCategories,
  displayMode,
  onItemSelect,
  onLockToggle,
}: CategorySelectorListProps) {
  const [containerHeight, setContainerHeight] = useState(0);
  // Store scroll index for each category to preserve position when switching modes
  const [categoryScrollIndexes, setCategoryScrollIndexes] = useState<Record<ItemCategory, number>>(
    {} as Record<ItemCategory, number>,
  );

  // Filter categories based on display mode
  const visibleCategories = useMemo(() => {
    if (displayMode === 'main') {
      return categories.filter((cat) => CATEGORY_GROUPS.main.includes(cat as any));
    } else if (displayMode === 'extra') {
      return categories.filter((cat) => CATEGORY_GROUPS.extra.includes(cat as any));
    }
    // 'all' mode - show all categories
    return categories;
  }, [categories, displayMode]);

  // Handle scroll index change for a category
  const handleScrollIndexChange = useCallback((category: ItemCategory, index: number) => {
    setCategoryScrollIndexes((prev) => ({
      ...prev,
      [category]: index,
    }));
  }, []);

  // Calculate item dimensions based on number of visible categories and actual container height
  const { itemWidth, itemHeight, spacing, carouselHeight } = useMemo(() => {
    if (containerHeight === 0) {
      // Return minimal sizes during initial render
      return { itemWidth: 100, itemHeight: 130, spacing: 4, carouselHeight: 150 };
    }
    return calculateItemDimensions(visibleCategories.length, containerHeight);
  }, [visibleCategories.length, containerHeight]);

  const getItemsByCategory = (category: ItemCategory): WardrobeItem[] => {
    return wardrobeItems.filter((item) => item.category === category);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && Math.abs(height - containerHeight) > 5) {
      setContainerHeight(height);
    }
  };

  // Calculate total height needed for all carousels
  const totalCarouselsHeight = carouselHeight * visibleCategories.length;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* All categories must fit without scroll */}
      <View style={[styles.categoriesContainer, { height: totalCarouselsHeight }]}>
        {visibleCategories.map((category, index) => {
          const categoryItems = getItemsByCategory(category);
          const selectedItem = selectedItems[category];

          return (
            <View key={category} style={[styles.carouselWrapper, { height: carouselHeight }]}>
              <CategoryCarouselCentered
                category={category}
                items={categoryItems}
                selectedItemId={selectedItem?.id || null}
                isLocked={lockedCategories.has(category)}
                itemWidth={itemWidth}
                itemHeight={itemHeight}
                spacing={spacing}
                initialScrollIndex={categoryScrollIndexes[category] || 0}
                onItemSelect={(item) => onItemSelect(category, item)}
                onLockToggle={() => onLockToggle(category)}
                onScrollIndexChange={(index) => handleScrollIndexChange(category, index)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  categoriesContainer: {
    // Height is set dynamically based on number of carousels
    overflow: 'hidden', // Strict boundary - carousels cannot go beyond this
    margin: 0,
    padding: 0,
  },
  carouselWrapper: {
    overflow: 'hidden', // Prevent carousel from exceeding its bounds
    margin: 0,
    padding: 0,
  },
});
