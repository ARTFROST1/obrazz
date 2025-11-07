import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { SmoothCarousel } from './SmoothCarousel';
import { WardrobeItem, ItemCategory } from '../../types/models/item';
import { CATEGORY_GROUPS as IMPORTED_CATEGORY_GROUPS } from '@constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category display modes
export type CategoryDisplayMode = 'all' | 'main' | 'extra';

// Category groups (re-export from constants)
export const CATEGORY_GROUPS = IMPORTED_CATEGORY_GROUPS;

/**
 * Calculate item dimensions maintaining 3:4 aspect ratio
 */
function calculateItemDimensions(
  numberOfCategories: number,
  availableHeight: number,
): { itemWidth: number; itemHeight: number; carouselHeight: number } {
  // Height per carousel
  const carouselHeight = Math.floor(availableHeight / numberOfCategories);

  // Item height (leave some space for padding)
  const itemHeight = Math.floor(carouselHeight - 16);

  // Calculate width maintaining 3:4 aspect ratio
  const itemWidth = Math.floor(itemHeight * 0.75);

  return {
    itemWidth: Math.max(100, Math.min(200, itemWidth)),
    itemHeight: Math.max(133, Math.min(266, itemHeight)),
    carouselHeight,
  };
}

interface CategorySelectorWithSmoothProps {
  categories: ItemCategory[];
  wardrobeItems: WardrobeItem[];
  selectedItems: Record<ItemCategory, WardrobeItem | null>;
  activeCategories: Set<ItemCategory>;
  displayMode: CategoryDisplayMode;
  onItemSelect: (category: ItemCategory, item: WardrobeItem | null) => void;
  onCategoryToggle: (category: ItemCategory) => void;
}

/**
 * CategorySelectorWithSmooth - Container for smooth carousels
 * Full-width edge-to-edge design with category toggles
 */
export function CategorySelectorWithSmooth({
  categories,
  wardrobeItems,
  selectedItems,
  activeCategories,
  displayMode,
  onItemSelect,
  onCategoryToggle,
}: CategorySelectorWithSmoothProps) {
  const [containerHeight, setContainerHeight] = useState(0);
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
    return categories;
  }, [categories, displayMode]);

  // Calculate dimensions
  const { itemWidth, itemHeight, carouselHeight } = useMemo(() => {
    if (containerHeight === 0) {
      return { itemWidth: 120, itemHeight: 160, carouselHeight: 180 };
    }
    return calculateItemDimensions(visibleCategories.length, containerHeight);
  }, [visibleCategories.length, containerHeight]);

  // Get items for a specific category
  const getItemsByCategory = useCallback(
    (category: ItemCategory): WardrobeItem[] => {
      return wardrobeItems.filter((item) => item.category === category);
    },
    [wardrobeItems],
  );

  // Handle scroll index change
  const handleScrollIndexChange = useCallback((category: ItemCategory, index: number) => {
    setCategoryScrollIndexes((prev) => ({
      ...prev,
      [category]: index,
    }));
  }, []);

  // Handle layout measurement
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (height > 0 && Math.abs(height - containerHeight) > 5) {
        setContainerHeight(height);
      }
    },
    [containerHeight],
  );

  const totalHeight = carouselHeight * visibleCategories.length;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={[styles.carouselsContainer, { height: totalHeight }]}>
        {visibleCategories.map((category) => {
          const categoryItems = getItemsByCategory(category);
          const selectedItem = selectedItems[category];
          const isCategoryActive = activeCategories.has(category);

          return (
            <View key={category} style={[styles.carouselWrapper, { height: carouselHeight }]}>
              <SmoothCarousel
                category={category}
                items={categoryItems}
                itemWidth={itemWidth}
                itemHeight={itemHeight}
                selectedItemId={selectedItem?.id || null}
                isCategoryActive={isCategoryActive}
                onItemSelect={(item) => {
                  onItemSelect(category, item);
                  // If category is inactive, activate it
                  if (!isCategoryActive) {
                    onCategoryToggle(category);
                  }
                }}
                onCategoryToggle={() => {
                  onCategoryToggle(category);
                }}
                onScrollIndexChange={(index) => handleScrollIndexChange(category, index)}
                initialScrollIndex={categoryScrollIndexes[category] || 0}
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
  carouselsContainer: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  carouselWrapper: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
});
