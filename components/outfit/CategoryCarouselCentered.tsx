import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem, ItemCategory } from '../../types/models/item';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Category display modes for filtering categories
export type CategoryDisplayMode = 'all' | 'main' | 'extra';

// Category groups
export const CATEGORY_GROUPS = {
  main: ['outerwear', 'tops', 'bottoms', 'footwear'] as const,
  extra: ['headwear', 'accessories', 'bags'] as const,
};

/**
 * Calculate item dimensions based on number of categories and available height
 * Maintains 3:4 aspect ratio (width:height)
 */
export function calculateItemDimensions(
  numberOfCategories: number,
  availableHeight: number,
): { itemWidth: number; itemHeight: number; spacing: number; carouselHeight: number } {
  // Height per category (carousel height) - NO GAPS between carousels
  const carouselHeight = Math.floor(availableHeight / numberOfCategories);

  // Item spacing inside carousel
  const spacing = 4;

  // Item height (slightly less than carousel to prevent overflow)
  const itemHeight = Math.floor(carouselHeight - spacing * 2);

  // Calculate width maintaining 3:4 aspect ratio
  const itemWidth = Math.floor(itemHeight * 0.75);

  return {
    itemWidth: Math.max(80, Math.min(250, itemWidth)),
    itemHeight: Math.max(100, Math.min(330, itemHeight)),
    spacing: Math.floor(spacing),
    carouselHeight: carouselHeight,
  };
}

interface CategoryCarouselCenteredProps {
  category: ItemCategory;
  items: WardrobeItem[];
  selectedItemId: string | null;
  isLocked: boolean;
  itemWidth: number;
  itemHeight: number;
  spacing: number;
  initialScrollIndex?: number;
  onItemSelect: (item: WardrobeItem | null) => void;
  onLockToggle: () => void;
  onScrollIndexChange?: (index: number) => void;
}

/**
 * CategoryCarouselCentered - Pure minimalist carousel
 * Only items, no labels or buttons. Center item is selected.
 */
export function CategoryCarouselCentered({
  category,
  items,
  selectedItemId,
  isLocked,
  itemWidth,
  itemHeight,
  spacing,
  initialScrollIndex = 0,
  onItemSelect,
  onLockToggle,
  onScrollIndexChange,
}: CategoryCarouselCenteredProps) {
  const flatListRef = useRef<FlatList>(null);
  const [centerIndex, setCenterIndex] = useState(initialScrollIndex);

  const sidePadding = (SCREEN_WIDTH - itemWidth) / 2;

  // Add "None" item as first element
  const carouselItems = [{ id: 'none', isNone: true } as any, ...items];

  // Update centerIndex when initialScrollIndex changes (mode switch)
  useEffect(() => {
    const maxIndex = carouselItems.length - 1;
    const safeIndex = Math.min(initialScrollIndex, maxIndex);
    setCenterIndex(safeIndex);
  }, [initialScrollIndex, carouselItems.length]);

  // Scroll to initial position on mount or when initialScrollIndex changes
  useEffect(() => {
    if (flatListRef.current && initialScrollIndex >= 0) {
      // Ensure index is within bounds (carouselItems includes "None" + actual items)
      const maxIndex = carouselItems.length - 1;
      const safeIndex = Math.min(initialScrollIndex, maxIndex);

      // Small delay to ensure list is rendered
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: safeIndex,
            animated: false,
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          console.warn('ScrollToIndex failed, using offset instead');
          flatListRef.current?.scrollToOffset({
            offset: safeIndex * (itemWidth + spacing),
            animated: false,
          });
        }
      }, 50);
    }
  }, [initialScrollIndex, itemWidth, carouselItems.length, spacing]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (itemWidth + spacing));

      if (index !== centerIndex) {
        setCenterIndex(index);
        onScrollIndexChange?.(index);

        // Auto-select center item
        if (index === 0) {
          // "None" selected
          onItemSelect(null);
        } else if (index > 0 && index <= items.length) {
          const item = items[index - 1];
          if (item) {
            onItemSelect(item);
          }
        }
      }
    },
    [centerIndex, items, onItemSelect, onScrollIndexChange, itemWidth, spacing],
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isCentered = index === centerIndex;
    const isNone = item.isNone;

    if (isNone) {
      return (
        <View
          style={[
            styles.itemContainer,
            itemContainerStyle,
            isCentered && styles.itemContainerCentered,
          ]}
        >
          <View style={[styles.itemCard, itemCardStyle, styles.noneCard]}>
            <Ionicons name="close" size={60} color="#C4C4C4" />
          </View>
        </View>
      );
    }

    const imagePath = item.imageLocalPath || item.imageUrl;

    return (
      <View
        style={[
          styles.itemContainer,
          itemContainerStyle,
          isCentered && styles.itemContainerCentered,
        ]}
      >
        <View style={[styles.itemCard, itemCardStyle]}>
          {imagePath ? (
            <Image source={{ uri: imagePath }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={styles.emptyImage}>
              <Ionicons name="shirt-outline" size={60} color="#E5E5E5" />
            </View>
          )}
        </View>
      </View>
    );
  };

  const containerStyle = {
    height: itemHeight,
  };

  const itemContainerStyle = {
    width: itemWidth,
    marginRight: spacing,
  };

  const itemCardStyle = {
    width: itemWidth,
    height: itemHeight,
  };

  const listContentStyle = {
    paddingLeft: sidePadding,
    paddingRight: sidePadding,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Pure minimalist carousel - no labels, no buttons */}
      <FlatList
        ref={flatListRef}
        data={carouselItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `item-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        snapToInterval={itemWidth + spacing}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        pagingEnabled={false}
        getItemLayout={(data, index) => ({
          length: itemWidth + spacing,
          offset: (itemWidth + spacing) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Pure minimalist - no padding, no margin
    margin: 0,
    padding: 0,
  },
  itemContainer: {
    // No padding or margin
  },
  itemContainerCentered: {
    transform: [{ scale: 1.05 }],
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 0,
    overflow: 'hidden',
  },
  noneCard: {
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 0,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  emptyImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
