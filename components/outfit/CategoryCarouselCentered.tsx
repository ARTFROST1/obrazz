import React, { useRef, useState, useCallback } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// View modes for different item sizes
export type CarouselViewMode = 'large' | 'medium' | 'small';

const VIEW_MODE_SIZES: Record<
  CarouselViewMode,
  { itemWidth: number; itemHeight: number; spacing: number }
> = {
  large: { itemWidth: 220, itemHeight: 290, spacing: 6 },
  medium: { itemWidth: 170, itemHeight: 226, spacing: 5 },
  small: { itemWidth: 130, itemHeight: 173, spacing: 4 },
};

interface CategoryCarouselCenteredProps {
  category: ItemCategory;
  items: WardrobeItem[];
  selectedItemId: string | null;
  isLocked: boolean;
  viewMode?: CarouselViewMode;
  onItemSelect: (item: WardrobeItem | null) => void;
  onLockToggle: () => void;
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
  viewMode = 'medium',
  onItemSelect,
  onLockToggle,
}: CategoryCarouselCenteredProps) {
  const flatListRef = useRef<FlatList>(null);
  const [centerIndex, setCenterIndex] = useState(0);

  const { itemWidth, itemHeight, spacing } = VIEW_MODE_SIZES[viewMode];
  const sidePadding = (SCREEN_WIDTH - itemWidth) / 2;

  // Add "None" item as first element
  const carouselItems = [{ id: 'none', isNone: true } as any, ...items];

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (itemWidth + spacing));

      if (index !== centerIndex) {
        setCenterIndex(index);

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
    [centerIndex, items, onItemSelect, itemWidth, spacing],
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
    height: itemHeight, // Only item height, no extra space
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
    // Pure minimalist - no padding at all
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
