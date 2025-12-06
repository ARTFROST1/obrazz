import { getCategoryLabel } from '@constants/categories';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ItemCategory, WardrobeItem } from '../../types/models/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Optimized physics for smooth natural scrolling
const PHYSICS_CONFIG = {
  deceleration: 0.98, // Lower = more momentum, smoother deceleration
  momentumSnapDelay: 100, // Minimal delay after momentum - trust native snap
  dragSnapDelay: 200, // Quick snap after manual drag
  adjustmentDelay: 500, // Delay for infinite scroll adjustment
  safeZoneBuffer: 3,
};

interface CarouselItemProps {
  item: WardrobeItem;
  itemWidth: number;
  itemHeight: number;
  isCenterItem: boolean;
}

const CarouselItem = memo(function CarouselItem({
  item,
  itemWidth,
  itemHeight,
  isCenterItem,
}: CarouselItemProps) {
  const imagePath = item.imageLocalPath || item.imageUrl;

  return (
    <View style={[styles.itemContainer, { width: itemWidth }]}>
      <View
        style={[
          styles.itemCard,
          { width: itemWidth - 8, height: itemHeight }, // Account for margins
          isCenterItem && styles.itemCardCenter,
        ]}
      >
        {imagePath ? (
          <Image source={{ uri: imagePath }} style={styles.itemImage} resizeMode="contain" />
        ) : (
          <View style={styles.emptyImage}>
            <Ionicons name="shirt-outline" size={50} color="#E5E5E5" />
          </View>
        )}
      </View>
    </View>
  );
});

interface SmoothCarouselProps {
  category: ItemCategory;
  items: WardrobeItem[];
  itemWidth: number;
  itemHeight: number;
  selectedItemId: string | null;
  onItemSelect: (item: WardrobeItem) => void;
  onScrollIndexChange?: (index: number) => void;
  initialScrollIndex?: number;
}

/**
 * SmoothCarousel V5 - SIMPLIFIED & RELIABLE
 * Key changes:
 * - Fixed spacing issue: itemContainer width matches snapToInterval exactly
 * - Removed competing snap mechanisms
 * - Trust native FlatList snap behavior
 * - Only verify and correct after scroll completes
 */
export function SmoothCarousel({
  category,
  items,
  itemWidth,
  itemHeight,
  onItemSelect,
  onScrollIndexChange,
  initialScrollIndex = 0,
}: SmoothCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  const lastNotifiedIndexRef = useRef(-1);
  const isAdjustingRef = useRef(false);
  const snapCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  const [centerIndex, setCenterIndex] = useState(initialScrollIndex);

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (snapCheckTimeoutRef.current) {
        clearTimeout(snapCheckTimeoutRef.current);
      }
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current);
      }
    };
  }, []);

  // Padding to center first/last items
  const sidePadding = (SCREEN_WIDTH - itemWidth) / 2;

  // Calculate duplicate copies for infinite scroll
  const DUPLICATE_COUNT = useMemo(() => {
    if (items.length === 0) return 0;
    const minCopies = Math.ceil(20 / items.length);
    return minCopies * items.length;
  }, [items.length]);

  // Create infinite scroll array
  const carouselItems = useMemo(() => {
    if (items.length === 0) return [];
    const result: WardrobeItem[] = [];
    const totalCopies = DUPLICATE_COUNT * 2 + items.length;
    for (let i = 0; i < totalCopies; i++) {
      result.push(items[i % items.length]);
    }
    return result;
  }, [items, DUPLICATE_COUNT]);

  const indexOffset = DUPLICATE_COUNT;

  // Get center index from scroll offset
  const getCenterIndex = useCallback(
    (offsetX: number) => {
      return Math.round(offsetX / itemWidth);
    },
    [itemWidth],
  );

  // Notify item selection
  const notifyItemSelection = useCallback(
    (index: number) => {
      if (items.length === 0) return;

      const originalIndex = (((index - indexOffset) % items.length) + items.length) % items.length;

      if (lastNotifiedIndexRef.current === originalIndex) {
        return;
      }

      lastNotifiedIndexRef.current = originalIndex;

      if (onScrollIndexChange) {
        onScrollIndexChange(originalIndex);
      }

      const item = items[originalIndex];
      if (item) {
        onItemSelect(item);
      }
    },
    [items, onItemSelect, onScrollIndexChange, indexOffset],
  );

  // Verify snap position and correct if needed (only for significant misalignment)
  const verifyAndCorrectSnap = useCallback(() => {
    if (isProgrammaticScrollRef.current || isAdjustingRef.current) {
      return;
    }

    const currentOffset = scrollOffsetRef.current;
    const expectedIndex = getCenterIndex(currentOffset);
    const expectedOffset = expectedIndex * itemWidth;
    const offsetDiff = Math.abs(currentOffset - expectedOffset);

    // Only correct if significantly misaligned (tolerance of 3px)
    // This prevents interrupting natural settling
    if (offsetDiff > 3 && flatListRef.current) {
      console.log('[SmoothCarousel] 🔧 Correcting snap', {
        currentOffset,
        expectedOffset,
        diff: offsetDiff,
      });

      isProgrammaticScrollRef.current = true;

      flatListRef.current.scrollToOffset({
        offset: expectedOffset,
        animated: true,
      });

      setCenterIndex(expectedIndex);
      notifyItemSelection(expectedIndex);

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300);
    }
  }, [getCenterIndex, itemWidth, notifyItemSelection]);

  // Handle scroll
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScrollRef.current) {
        return;
      }

      const { contentOffset } = event.nativeEvent;
      scrollOffsetRef.current = contentOffset.x;

      // Update center index for visual feedback
      const newCenterIndex = getCenterIndex(contentOffset.x);
      if (newCenterIndex !== centerIndex) {
        setCenterIndex(newCenterIndex);
      }
    },
    [getCenterIndex, centerIndex],
  );

  // Handle momentum scroll end (fast swipes - trust native snap)
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScrollRef.current || isAdjustingRef.current) {
        return;
      }

      const offsetX = event.nativeEvent.contentOffset.x;
      const targetIndex = getCenterIndex(offsetX);

      setCenterIndex(targetIndex);
      notifyItemSelection(targetIndex);

      // For momentum scrolls, trust native snap and verify minimally
      if (snapCheckTimeoutRef.current) {
        clearTimeout(snapCheckTimeoutRef.current);
      }

      snapCheckTimeoutRef.current = setTimeout(() => {
        verifyAndCorrectSnap();
      }, PHYSICS_CONFIG.momentumSnapDelay);

      // Check infinite scroll adjustment
      const buffer = Math.min(PHYSICS_CONFIG.safeZoneBuffer, Math.floor(items.length / 3));
      const safeZoneStart = indexOffset - buffer;
      const safeZoneEnd = indexOffset + items.length + buffer;
      const needsAdjustment = targetIndex < safeZoneStart || targetIndex >= safeZoneEnd;

      if (needsAdjustment && items.length > 0 && !isAdjustingRef.current) {
        isAdjustingRef.current = true;

        if (adjustmentTimeoutRef.current) {
          clearTimeout(adjustmentTimeoutRef.current);
        }

        adjustmentTimeoutRef.current = setTimeout(() => {
          if (!flatListRef.current || isProgrammaticScrollRef.current) {
            isAdjustingRef.current = false;
            return;
          }

          const relativeIndex = ((targetIndex % items.length) + items.length) % items.length;
          const adjustedIndex = indexOffset + relativeIndex;

          console.log('[SmoothCarousel] ♻️ Adjusting infinite scroll', {
            from: targetIndex,
            to: adjustedIndex,
          });

          isProgrammaticScrollRef.current = true;

          flatListRef.current.scrollToOffset({
            offset: adjustedIndex * itemWidth,
            animated: false,
          });

          setCenterIndex(adjustedIndex);
          scrollOffsetRef.current = adjustedIndex * itemWidth;

          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
            isAdjustingRef.current = false;
          }, 100);
        }, PHYSICS_CONFIG.adjustmentDelay);
      }
    },
    [
      getCenterIndex,
      notifyItemSelection,
      verifyAndCorrectSnap,
      items.length,
      indexOffset,
      itemWidth,
    ],
  );

  // Handle drag end (slow dragging - may need correction)
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScrollRef.current || isAdjustingRef.current) {
        return;
      }

      const offsetX = event.nativeEvent.contentOffset.x;
      const velocity = event.nativeEvent.velocity?.x || 0;

      // If low velocity, snap immediately
      if (Math.abs(velocity) < 0.3) {
        const targetIndex = getCenterIndex(offsetX);

        setCenterIndex(targetIndex);
        notifyItemSelection(targetIndex);

        if (snapCheckTimeoutRef.current) {
          clearTimeout(snapCheckTimeoutRef.current);
        }

        snapCheckTimeoutRef.current = setTimeout(() => {
          verifyAndCorrectSnap();
        }, PHYSICS_CONFIG.dragSnapDelay);
      }
      // If has momentum, let handleMomentumScrollEnd take over
    },
    [getCenterIndex, notifyItemSelection, verifyAndCorrectSnap],
  );

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: WardrobeItem; index: number }) => {
      const isCenterItem = index === centerIndex;

      return (
        <CarouselItem
          item={item}
          itemWidth={itemWidth}
          itemHeight={itemHeight}
          isCenterItem={isCenterItem}
        />
      );
    },
    [itemWidth, itemHeight, centerIndex],
  );

  // Initialize scroll position AND notify initial selection
  useEffect(() => {
    if (flatListRef.current && carouselItems.length > 0 && items.length > 0) {
      const initialIndex = indexOffset + (initialScrollIndex % items.length);

      console.log(`🔍 [SmoothCarousel] Initializing ${category}:`, {
        initialScrollIndex,
        calculatedIndex: initialIndex,
        itemsCount: items.length,
      });

      const timer = setTimeout(() => {
        isProgrammaticScrollRef.current = true;

        flatListRef.current?.scrollToOffset({
          offset: initialIndex * itemWidth,
          animated: false,
        });

        setCenterIndex(initialIndex);
        scrollOffsetRef.current = initialIndex * itemWidth;

        // ✅ FIX: Notify initial item selection so untouched carousels pass their value
        // This ensures the first/initial item is always selected even without user scroll
        notifyItemSelection(initialIndex);

        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 100);
      }, 50);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    category,
    initialScrollIndex,
    itemWidth,
    indexOffset,
    items.length,
    carouselItems.length,
    notifyItemSelection,
  ]);

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: sidePadding,
    }),
    [sidePadding],
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateCard, { width: itemWidth, height: itemHeight }]}>
            <Ionicons name="alert-circle-outline" size={40} color="#999" />
            <Text style={styles.emptyStateTitle}>No Items</Text>
            <Text style={styles.emptyStateSubtitle}>{getCategoryLabel(category)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={carouselItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        decelerationRate={PHYSICS_CONFIG.deceleration}
        snapToInterval={itemWidth}
        snapToAlignment="start"
        disableIntervalMomentum={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        getItemLayout={(_data, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        removeClippedSubviews={false} // Disabled for Android - was hiding visible items
        initialNumToRender={7}
        maxToRenderPerBatch={5}
        windowSize={11}
        updateCellsBatchingPeriod={50}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // NO paddingHorizontal - this was causing snap misalignment!
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    // Removed elevation - it conflicts with parent overflow:hidden on Android
    // Using border for subtle depth on all platforms
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemCardCenter: {
    borderWidth: 2,
    borderColor: '#000',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  emptyImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  emptyStateContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#999',
  },
});
