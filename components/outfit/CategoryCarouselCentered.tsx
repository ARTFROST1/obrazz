import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { ItemCategory, WardrobeItem } from '../../types/models/item';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Category display modes for filtering categories
export type CategoryDisplayMode = 'all' | 'main' | 'extra';

// Category groups
export const CATEGORY_GROUPS = {
  main: ['outerwear', 'tops', 'bottoms', 'footwear'] as const,
  extra: ['headwear', 'accessories', 'fullbody', 'other'] as const,
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
  const isAdjustingRef = useRef(false);
  const lastNotifiedIndexRef = useRef(-1);

  const sidePadding = (SCREEN_WIDTH - itemWidth) / 2;

  // Add "None" item as first element
  const baseItems = [{ id: 'none', isNone: true } as any, ...items];

  // Create infinite loop by duplicating items
  // Add copies at start and end for seamless infinite scrolling
  // Use many duplicates for ultra-smooth fast scrolling without hitting edges
  const DUPLICATE_COUNT = Math.min(64, baseItems.length);
  const duplicatedStart = baseItems.slice(-DUPLICATE_COUNT);
  const duplicatedEnd = baseItems.slice(0, DUPLICATE_COUNT);
  const carouselItems = [...duplicatedStart, ...baseItems, ...duplicatedEnd];

  // Offset index to account for duplicated items at start
  const indexOffset = DUPLICATE_COUNT;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lastNotifiedIndexRef.current = -1;
    };
  }, []);

  // Scroll to initial position on mount or when initialScrollIndex changes
  useEffect(() => {
    if (flatListRef.current && initialScrollIndex >= 0) {
      // Map initialScrollIndex to the actual position in duplicated array
      const targetIndex = indexOffset + initialScrollIndex;

      // Small delay to ensure list is rendered
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: false,
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          console.warn('ScrollToIndex failed, using offset instead');
          flatListRef.current?.scrollToOffset({
            offset: targetIndex * (itemWidth + spacing),
            animated: false,
          });
        }
      }, 50);
    }
  }, [initialScrollIndex, itemWidth, spacing, indexOffset]);

  // Notify about item selection - called ONLY when needed
  const notifyItemSelection = useCallback(
    (index: number) => {
      // Map back to original index (without duplicates)
      const originalIndex =
        (((index - indexOffset) % baseItems.length) + baseItems.length) % baseItems.length;

      // Only notify if index actually changed
      if (lastNotifiedIndexRef.current !== originalIndex) {
        lastNotifiedIndexRef.current = originalIndex;
        onScrollIndexChange?.(originalIndex);

        // Auto-select center item based on original index
        if (originalIndex === 0) {
          onItemSelect(null);
        } else if (originalIndex > 0 && originalIndex <= items.length) {
          const item = items[originalIndex - 1];
          if (item) {
            onItemSelect(item);
          }
        }
      }
    },
    [items, onItemSelect, onScrollIndexChange, indexOffset, baseItems.length],
  );

  // Check if index is in duplicate zone and needs adjustment
  const needsInfiniteLoopAdjustment = useCallback(
    (index: number) => {
      return index < indexOffset || index >= indexOffset + baseItems.length;
    },
    [indexOffset, baseItems.length],
  );

  // Get adjusted index for infinite loop
  const getAdjustedIndex = useCallback(
    (index: number) => {
      if (index < indexOffset) {
        return baseItems.length + index;
      } else if (index >= indexOffset + baseItems.length) {
        return index - baseItems.length;
      }
      return index;
    },
    [indexOffset, baseItems.length],
  );

  // Handle scroll end - notify selection only
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isAdjustingRef.current) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (itemWidth + spacing));
      notifyItemSelection(index);
    },
    [itemWidth, spacing, notifyItemSelection],
  );

  // Handle momentum scroll end - notify and check infinite loop
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isAdjustingRef.current) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(offsetX / (itemWidth + spacing));

      // Notify about selection
      notifyItemSelection(currentIndex);

      // Check if we're in duplicate zone for seamless loop
      if (needsInfiniteLoopAdjustment(currentIndex)) {
        isAdjustingRef.current = true;
        const adjustedIndex = getAdjustedIndex(currentIndex);

        // Small delay to ensure snap has completed
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: adjustedIndex * (itemWidth + spacing),
            animated: false,
          });

          setTimeout(() => {
            isAdjustingRef.current = false;
          }, 50);
        }, 100);
      }
    },
    [itemWidth, spacing, needsInfiniteLoopAdjustment, getAdjustedIndex, notifyItemSelection],
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isNone = item.isNone;

    if (isNone) {
      return (
        <View style={[styles.itemContainer, itemContainerStyle]}>
          <View style={[styles.itemCard, itemCardStyle, styles.noneCard]}>
            <Ionicons name="close" size={60} color="#C4C4C4" />
          </View>
        </View>
      );
    }

    const imagePath = item.imageLocalPath || item.imageUrl;

    return (
      <View style={[styles.itemContainer, itemContainerStyle]}>
        <View style={[styles.itemCard, itemCardStyle]}>
          {imagePath ? (
            <Image source={{ uri: imagePath }} style={styles.itemImage} resizeMode="contain" />
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
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        snapToInterval={itemWidth + spacing}
        snapToAlignment="center"
        decelerationRate={0.98}
        disableIntervalMomentum={false}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        pagingEnabled={false}
        getItemLayout={(data, index) => ({
          length: itemWidth + spacing,
          offset: (itemWidth + spacing) * index,
          index,
        })}
        removeClippedSubviews={false}
        initialNumToRender={carouselItems.length}
        maxToRenderPerBatch={carouselItems.length}
        windowSize={carouselItems.length}
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
