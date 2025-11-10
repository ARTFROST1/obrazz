import React, { useRef, useCallback, useEffect, useMemo, useState, memo } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem, ItemCategory } from '../../types/models/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Physics configuration for smooth scrolling
const PHYSICS_CONFIG = {
  deceleration: 0.985, // Natural deceleration rate
  snapVelocityThreshold: 0.5, // Velocity below which snapping occurs
  snapDuration: 250, // Smooth snap animation duration
  friction: 0.02, // Friction coefficient
};

interface CarouselItemProps {
  item: WardrobeItem;
  index: number;
  itemWidth: number;
  itemHeight: number;
  isCenterItem: boolean;
}

// Memoized carousel item component for performance
const CarouselItem = memo(function CarouselItem({
  item,
  index,
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
          { width: itemWidth, height: itemHeight },
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
 * SmoothCarousel - Ultra-smooth carousel with realistic physics
 * Edge-to-edge design with center focus (no flag buttons)
 */
export function SmoothCarousel({
  category,
  items,
  itemWidth,
  itemHeight,
  selectedItemId,
  onItemSelect,
  onScrollIndexChange,
  initialScrollIndex = 0,
}: SmoothCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  const velocityRef = useRef(0);
  const isScrollingRef = useRef(false);
  const isAdjustingRef = useRef(false);
  const lastNotifiedIndexRef = useRef(-1);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use state for center index to trigger re-renders
  const [centerIndex, setCenterIndex] = useState(initialScrollIndex);

  // Calculate spacing to center items properly
  const spacing = 0; // No spacing for perfect alignment
  const sidePadding = (SCREEN_WIDTH - itemWidth) / 2;

  // Create infinite loop with proper circular buffer
  // For small arrays (like 4 items), we need careful duplicate count
  const DUPLICATE_COUNT = useMemo(() => {
    if (items.length === 0) return 0;
    // Use multiple of items.length for perfect alignment
    const minCopies = Math.ceil(20 / items.length); // At least 20 items
    return minCopies * items.length; // Always multiple of items.length
  }, [items.length]);

  const carouselItems = useMemo(() => {
    if (items.length === 0) return [];

    // Build array with duplicates for seamless infinite loop
    const result: WardrobeItem[] = [];

    // Calculate offset so duplicates end with last item before originals
    // This ensures: [...C, D, A, B, C, D (originals), A, B, C, D...]
    const totalCopies = DUPLICATE_COUNT * 2 + items.length; // Total items in carousel

    // Fill entire array in circular fashion
    for (let i = 0; i < totalCopies; i++) {
      result.push(items[i % items.length]);
    }

    return result;
  }, [items, DUPLICATE_COUNT]);

  const indexOffset = DUPLICATE_COUNT;

  // Calculate center index from scroll offset
  const getCenterIndex = useCallback(
    (offsetX: number) => {
      return Math.round(offsetX / (itemWidth + spacing));
    },
    [itemWidth, spacing],
  );

  // Notify about selection change
  const notifyItemSelection = useCallback(
    (index: number) => {
      if (items.length === 0) return;

      // Map to original item index
      const originalIndex = (((index - indexOffset) % items.length) + items.length) % items.length;

      if (lastNotifiedIndexRef.current !== originalIndex) {
        lastNotifiedIndexRef.current = originalIndex;
        onScrollIndexChange?.(originalIndex);

        const item = items[originalIndex];
        if (item) {
          onItemSelect(item);
        }
      }
    },
    [items, onItemSelect, onScrollIndexChange, indexOffset],
  );

  // Handle scroll with anti-flickering protection
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Skip if adjusting for infinite loop
      if (isAdjustingRef.current) return;

      const { contentOffset, velocity } = event.nativeEvent;
      scrollOffsetRef.current = contentOffset.x;
      velocityRef.current = velocity?.x || 0;

      // Clear any pending scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Update center index only if significantly changed (anti-flickering)
      const newCenterIndex = getCenterIndex(contentOffset.x);
      const indexDiff = Math.abs(newCenterIndex - centerIndex);

      if (indexDiff >= 1) {
        setCenterIndex(newCenterIndex);
      }
    },
    [getCenterIndex, centerIndex],
  );

  // Handle scroll end with smooth snapping and anti-flickering
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isAdjustingRef.current) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const centerIndex = getCenterIndex(offsetX);

      // Smooth snap to center
      const targetOffset = centerIndex * (itemWidth + spacing);
      const offsetDiff = Math.abs(offsetX - targetOffset);

      if (offsetDiff > 1) {
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }

      // Notify selection
      notifyItemSelection(centerIndex);

      // Check for infinite loop adjustment - keep in center zone
      // Safe zone is the middle section (original items)
      const safeZoneStart = indexOffset;
      const safeZoneEnd = indexOffset + items.length;
      const needsAdjustment = centerIndex < safeZoneStart || centerIndex >= safeZoneEnd;

      if (needsAdjustment && items.length > 0) {
        isAdjustingRef.current = true;

        // Map current position to equivalent position in safe zone
        const relativeIndex = ((centerIndex % items.length) + items.length) % items.length;
        const adjustedIndex = indexOffset + relativeIndex;

        // Wait for snap animation to complete before adjusting
        setTimeout(
          () => {
            if (flatListRef.current) {
              flatListRef.current?.scrollToOffset({
                offset: adjustedIndex * (itemWidth + spacing),
                animated: false,
              });
              setCenterIndex(adjustedIndex);
            }

            // Re-enable scrolling after adjustment
            setTimeout(() => {
              isAdjustingRef.current = false;
              isScrollingRef.current = false;
            }, 50);
          },
          offsetDiff > 1 ? 300 : 100,
        );
      }

      isScrollingRef.current = false;
    },
    [getCenterIndex, itemWidth, spacing, notifyItemSelection, indexOffset, items.length],
  );

  // Handle drag end with velocity check
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isAdjustingRef.current) return;

      const { contentOffset, velocity } = event.nativeEvent;
      const velocityX = velocity?.x || 0;

      // If velocity is low, snap immediately
      if (Math.abs(velocityX) < PHYSICS_CONFIG.snapVelocityThreshold) {
        const centerIndex = getCenterIndex(contentOffset.x);
        const targetOffset = centerIndex * (itemWidth + spacing);

        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });

        notifyItemSelection(centerIndex);
      }
    },
    [getCenterIndex, itemWidth, spacing, notifyItemSelection],
  );

  // Render item with memoization for performance
  const renderItem = useCallback(
    ({ item, index }: { item: WardrobeItem; index: number }) => {
      const isCenterItem = index === centerIndex;

      return (
        <CarouselItem
          item={item}
          index={index}
          itemWidth={itemWidth}
          itemHeight={itemHeight}
          isCenterItem={isCenterItem}
        />
      );
    },
    [itemWidth, itemHeight, centerIndex],
  );

  // Initialize scroll position
  useEffect(() => {
    if (flatListRef.current && carouselItems.length > 0) {
      const initialIndex = indexOffset + (initialScrollIndex % items.length);

      // Debug: Log carousel initialization
      console.log(`🔍 [SmoothCarousel] Initializing ${category}:`, {
        initialScrollIndex,
        calculatedIndex: initialIndex,
        itemsCount: items.length,
        selectedItemId,
      });

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialIndex * (itemWidth + spacing),
          animated: false,
        });
        setCenterIndex(initialIndex);
      }, 50);
    }

    // Cleanup on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [
    category,
    initialScrollIndex,
    itemWidth,
    spacing,
    indexOffset,
    items.length,
    carouselItems.length,
  ]);

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: sidePadding,
    }),
    [sidePadding],
  );

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
        // Smooth physics configuration
        decelerationRate={PHYSICS_CONFIG.deceleration}
        snapToInterval={itemWidth + spacing}
        snapToAlignment="start"
        disableIntervalMomentum={false}
        // Event handlers
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        // Performance optimizations
        getItemLayout={(data, index) => ({
          length: itemWidth + spacing,
          offset: (itemWidth + spacing) * index,
          index,
        })}
        removeClippedSubviews={true}
        initialNumToRender={7}
        maxToRenderPerBatch={5}
        windowSize={11}
        updateCellsBatchingPeriod={50}
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
    paddingHorizontal: 4,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemCardCenter: {
    // Subtle highlight for center item
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
});
