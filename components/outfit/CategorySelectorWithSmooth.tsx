import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { OutfitTabType } from '../../types/components/OutfitCreator';
import { ItemCategory, WardrobeItem } from '../../types/models/item';
import { SmoothCarousel } from './SmoothCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Calculate item dimensions maintaining 3:4 aspect ratio
 * Now supports different tab types with optimized sizing
 *
 * Strategy:
 * - basic/dress (3 carousels): Fill available space, no scroll
 * - custom (1-5 carousels): Fill available space proportionally, no scroll
 * - custom (6+ carousels) or all: Fixed small size with vertical scroll
 */
function calculateItemDimensions(
  numberOfCategories: number,
  availableHeight: number,
  tabType: OutfitTabType,
): {
  itemWidth: number;
  itemHeight: number;
  carouselHeight: number;
  needsVerticalScroll: boolean;
} {
  // Maximum carousels that fit on screen without scroll
  // Beyond this, we need scrolling to keep items usable
  const MAX_CAROUSELS_NO_SCROLL = 5;

  // For basic, dress tabs OR custom tab with few carousels - fill the space
  const shouldFillSpace =
    tabType === 'basic' ||
    tabType === 'dress' ||
    (tabType === 'custom' && numberOfCategories <= MAX_CAROUSELS_NO_SCROLL);

  if (shouldFillSpace) {
    // Distribute available height evenly among all carousels
    const carouselHeight = Math.floor(availableHeight / numberOfCategories);
    // Padding between items and carousel edges
    const itemPadding = numberOfCategories <= 3 ? 20 : 16;
    const itemHeight = Math.floor(carouselHeight - itemPadding);
    // Maintain 3:4 aspect ratio
    const itemWidth = Math.floor(itemHeight * 0.75);

    // Dynamic min/max based on number of carousels
    const minItemHeight = numberOfCategories <= 2 ? 200 : numberOfCategories <= 4 ? 140 : 100;
    const maxItemHeight = numberOfCategories <= 2 ? 300 : numberOfCategories <= 4 ? 240 : 200;
    const minItemWidth = numberOfCategories <= 2 ? 150 : numberOfCategories <= 4 ? 105 : 75;
    const maxItemWidth = numberOfCategories <= 2 ? 225 : numberOfCategories <= 4 ? 180 : 150;

    return {
      itemWidth: Math.max(minItemWidth, Math.min(maxItemWidth, itemWidth)),
      itemHeight: Math.max(minItemHeight, Math.min(maxItemHeight, itemHeight)),
      carouselHeight,
      needsVerticalScroll: false,
    };
  }

  // For 'all' tab or custom with many carousels - use fixed size with scroll
  const MIN_CAROUSEL_HEIGHT = 100;
  const MAX_CAROUSEL_HEIGHT = 140;
  const calculatedHeight = Math.floor(availableHeight / numberOfCategories);
  const carouselHeight = Math.max(
    MIN_CAROUSEL_HEIGHT,
    Math.min(MAX_CAROUSEL_HEIGHT, calculatedHeight),
  );

  // Check if vertical scroll is needed
  const totalHeight = carouselHeight * numberOfCategories;
  const needsVerticalScroll = totalHeight > availableHeight;

  // Item dimensions for scrollable mode
  const itemHeight = Math.floor(carouselHeight - 16);
  const itemWidth = Math.floor(itemHeight * 0.75);

  return {
    itemWidth: Math.max(70, Math.min(120, itemWidth)),
    itemHeight: Math.max(90, Math.min(160, itemHeight)),
    carouselHeight,
    needsVerticalScroll,
  };
}

interface CategorySelectorWithSmoothProps {
  categories: ItemCategory[];
  wardrobeItems: WardrobeItem[];
  selectedItems: (WardrobeItem | null)[];
  tabType: OutfitTabType;
  onItemSelect: (slotIndex: number, item: WardrobeItem | null) => void;
  outfitId?: string; // ✅ FIX: Isolate scroll cache per outfit
}

/**
 * CategorySelectorWithSmooth - Container for smooth carousels
 * Full-width edge-to-edge design with tab-based filtering
 */
export function CategorySelectorWithSmooth({
  categories,
  wardrobeItems,
  selectedItems,
  tabType,
  onItemSelect,
  outfitId, // ✅ FIX: Accept outfit ID for cache isolation
}: CategorySelectorWithSmoothProps) {
  const [containerHeight, setContainerHeight] = useState(0);
  // ✅ Cache scroll positions: "tab-category-slot" → scrollIndex
  // This prevents conflicts between tabs and preserves positions
  const [scrollCache, setScrollCache] = useState<Record<string, number>>({});
  // ✅ Track previous selectedItems to detect changes and clear cache
  const prevSelectedItemsRef = useRef<(WardrobeItem | null)[]>([]);
  // ✅ Track outfitId changes to clear cache when entering edit mode
  const prevOutfitIdRef = useRef<string | undefined>(outfitId);

  // Categories are already filtered by parent based on tab
  const visibleCategories = categories;

  // Calculate dimensions with tab-specific sizing
  const { itemWidth, itemHeight, carouselHeight, needsVerticalScroll } = useMemo(() => {
    if (containerHeight === 0) {
      return {
        itemWidth: 120,
        itemHeight: 160,
        carouselHeight: 180,
        needsVerticalScroll: false,
      };
    }
    return calculateItemDimensions(visibleCategories.length, containerHeight, tabType);
  }, [visibleCategories.length, containerHeight, tabType]);

  // Get items for a specific category
  const getItemsByCategory = useCallback(
    (category: ItemCategory): WardrobeItem[] => {
      return wardrobeItems.filter((item) => item.category === category);
    },
    [wardrobeItems],
  );

  // Get initial scroll index based on selected item at slotIndex
  const getInitialScrollIndex = useCallback(
    (slotIndex: number, categoryItems: WardrobeItem[]): number => {
      const selectedItem = selectedItems[slotIndex];
      if (!selectedItem || categoryItems.length === 0) return 0;

      const index = categoryItems.findIndex((item) => item.id === selectedItem.id);

      // Debug: Log scroll index calculation
      console.log(`🔍 [CategorySelector] Initial scroll for slot ${slotIndex}:`, {
        selectedItemId: selectedItem?.id,
        foundAtIndex: index,
        totalItems: categoryItems.length,
      });

      return index >= 0 ? index : 0;
    },
    [selectedItems],
  );

  // ✅ FIX: Clear scroll cache when outfitId changes (entering edit mode)
  useEffect(() => {
    if (prevOutfitIdRef.current !== outfitId) {
      console.log('🔄 [CategorySelector] outfitId changed, clearing ALL scroll cache:', {
        prevOutfitId: prevOutfitIdRef.current,
        newOutfitId: outfitId,
      });
      setScrollCache({});
      prevOutfitIdRef.current = outfitId;
    }
  }, [outfitId]);

  // ✅ FIX: Track selectedItems changes and reset scroll cache for changed slots
  // This ensures carousels scroll to correct items when editing an outfit
  useEffect(() => {
    const changedSlots: number[] = [];

    selectedItems.forEach((item, slotIndex) => {
      const prevItem = prevSelectedItemsRef.current[slotIndex];

      // Check if item ID changed (handles null -> item and item1 -> item2)
      const prevId = prevItem?.id;
      const currentId = item?.id;
      const itemChanged = prevId !== currentId;

      // If item changed and is not null, mark slot for cache reset
      if (itemChanged && item !== null) {
        changedSlots.push(slotIndex);
      }
    });

    if (changedSlots.length > 0) {
      console.log(
        '🔄 [CategorySelector] Selected items changed, clearing cache for:',
        changedSlots,
      );

      // Clear cache only for changed slots with unique keys
      setScrollCache((prev) => {
        const next = { ...prev };
        changedSlots.forEach((slot) => {
          const category = categories[slot];
          const cacheKey = `${outfitId || 'new'}-${tabType}-${category}-${slot}`;
          const itemTitle = selectedItems[slot]?.title || 'item';
          console.log(`  ↪️ Clearing cache for ${cacheKey}: ${itemTitle}`);
          delete next[cacheKey];
        });
        return next;
      });
    }

    // Update ref for next comparison
    prevSelectedItemsRef.current = [...selectedItems];
  }, [selectedItems, categories, tabType, outfitId]);

  // Handle scroll index change - now with unique cache keys per outfit+tab+category+slot
  const handleScrollIndexChange = useCallback(
    (slotIndex: number, index: number, category: ItemCategory) => {
      const cacheKey = `${outfitId || 'new'}-${tabType}-${category}-${slotIndex}`;
      console.log(`💾 [CategorySelector] Caching scroll position:`, {
        key: cacheKey,
        index,
        outfitId: outfitId || 'new',
      });

      setScrollCache((prev) => ({
        ...prev,
        [cacheKey]: index,
      }));
    },
    [tabType, outfitId],
  );

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

  const totalHeight = carouselHeight * visibleCategories.length + VERTICAL_PADDING * 2;
  const CarouselsContent = (
    <View style={[styles.carouselsContainer, { height: totalHeight }]}>
      {visibleCategories.map((category, slotIndex) => {
        const categoryItems = getItemsByCategory(category);
        const selectedItem = selectedItems[slotIndex];

        // ✅ FIX: In edit mode (when outfitId exists), prioritize selectedItem over cache
        // This ensures correct scroll position when entering edit mode
        const cacheKey = `${outfitId || 'new'}-${tabType}-${category}-${slotIndex}`;
        const calculatedIndex = getInitialScrollIndex(slotIndex, categoryItems);

        // Use calculated index if:
        // 1. In edit mode (outfitId exists) - always use selectedItem
        // 2. No cache exists
        // 3. selectedItem exists (user has made a selection)
        const shouldUseCalculated =
          outfitId || scrollCache[cacheKey] === undefined || selectedItem !== null;
        const initialIndex = shouldUseCalculated ? calculatedIndex : scrollCache[cacheKey];

        console.log(`📍 [CategorySelector] Scroll index for ${cacheKey}:`, {
          cached: scrollCache[cacheKey],
          calculated: calculatedIndex,
          willUse: initialIndex,
          selectedItemTitle: selectedItem?.title || 'null',
          isEditMode: !!outfitId,
          category,
          tabType,
          outfitId: outfitId || 'new',
        });

        return (
          <View
            key={`carousel-${tabType}-${category}-${slotIndex}`}
            style={[styles.carouselWrapper, { height: carouselHeight }]}
          >
            <SmoothCarousel
              category={category}
              items={categoryItems}
              itemWidth={itemWidth}
              itemHeight={itemHeight}
              selectedItemId={selectedItem?.id || null}
              onItemSelect={(item) => onItemSelect(slotIndex, item)}
              onScrollIndexChange={(index) => handleScrollIndexChange(slotIndex, index, category)}
              initialScrollIndex={initialIndex}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {needsVerticalScroll ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
          {CarouselsContent}
        </ScrollView>
      ) : (
        CarouselsContent
      )}
    </View>
  );
}

const VERTICAL_PADDING = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  carouselsContainer: {
    width: SCREEN_WIDTH,
    paddingTop: VERTICAL_PADDING,
    paddingBottom: VERTICAL_PADDING,
    // Removed overflow: 'hidden' - conflicts with Android rendering
  },
  carouselWrapper: {
    width: SCREEN_WIDTH,
    // Removed overflow: 'hidden' - not needed, SmoothCarousel handles its own overflow
  },
});
