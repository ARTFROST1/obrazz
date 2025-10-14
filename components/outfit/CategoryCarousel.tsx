import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem, ItemCategory } from '../../types/models/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = 180; // Larger items for better visibility
const ITEM_SPACING = 16;
const SIDE_PADDING = (SCREEN_WIDTH - ITEM_SIZE) / 2; // Center the middle item

interface CategoryCarouselProps {
  category: ItemCategory;
  items: WardrobeItem[];
  selectedItemId: string | null;
  isLocked: boolean;
  onItemSelect: (item: WardrobeItem | null) => void;
  onLockToggle: () => void;
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  headwear: 'Headwear',
  outerwear: 'Outerwear',
  tops: 'Tops',
  bottoms: 'Bottoms',
  footwear: 'Shoes',
  accessories: 'Accessories',
  dresses: 'Dresses',
  suits: 'Suits',
  bags: 'Bags',
};

export function CategoryCarousel({
  category,
  items,
  selectedItemId,
  isLocked = false,
  onItemSelect,
  onLockToggle,
}: CategoryCarouselProps) {
  const flatListRef = useRef<FlatList>(null);

  // Scroll to selected item when it changes
  useEffect(() => {
    if (selectedItemId && items.length > 0) {
      const index = items.findIndex((item) => item.id === selectedItemId);
      if (index >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    }
  }, [selectedItemId, items]);

  const renderItem = ({ item }: { item: WardrobeItem }) => {
    const isSelected = item.id === selectedItemId;
    const imagePath = item.imageLocalPath || item.imageUrl;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.selectedCard]}
        onPress={() => onItemSelect(item)}
        activeOpacity={0.7}
      >
        {imagePath ? (
          <Image source={{ uri: imagePath }} style={styles.itemImage} resizeMode="contain" />
        ) : (
          <View style={styles.emptyImage}>
            <Ionicons name="shirt-outline" size={32} color="#999" />
          </View>
        )}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <TouchableOpacity style={styles.emptyCard} onPress={() => onItemSelect(null)}>
      <Ionicons name="add" size={32} color="#999" />
      <Text style={styles.emptyText}>No items</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
          <Text style={styles.itemCount}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.lockButton, isLocked && styles.lockButtonActive]}
          onPress={onLockToggle}
        >
          <Ionicons
            name={isLocked ? 'lock-closed' : 'lock-open-outline'}
            size={20}
            color={isLocked ? '#007AFF' : '#666'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.carouselContainer}>
        {items.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={ITEM_SIZE + ITEM_SPACING}
            decelerationRate="fast"
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                });
              }, 100);
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>{renderEmpty()}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    height: ITEM_SIZE + 16,
  },
  categoryTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: 'rgba(248, 248, 248, 0.9)',
    borderRadius: 16,
    marginBottom: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: ITEM_SIZE,
    justifyContent: 'center',
    width: ITEM_SIZE,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyImage: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 2,
    height: ITEM_SIZE,
    marginRight: ITEM_SPACING,
    overflow: 'hidden',
    width: ITEM_SIZE,
  },
  itemCount: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  itemImage: {
    height: '100%',
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 8,
  },
  lockButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5E5',
    borderRadius: 20,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  lockButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  selectionIndicator: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    bottom: 4,
    position: 'absolute',
    right: 4,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
