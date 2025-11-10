import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutfitItem } from '../../types/models/outfit';

interface ItemMiniPreviewBarProps {
  items: OutfitItem[];
  selectedItemId?: string | null;
  onItemSelect?: (itemId: string) => void;
  onItemRemove?: (itemId: string) => void;
}

const MINI_ITEM_SIZE = 100;

/**
 * ItemMiniPreviewBar - Bottom bar showing mini previews of selected items
 * Used in Step 2 for quick access to canvas items
 */
export function ItemMiniPreviewBar({
  items,
  selectedItemId,
  onItemSelect,
  onItemRemove,
}: ItemMiniPreviewBarProps) {
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.label}>Selected Items</Text>
          <Text style={styles.count}>0</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="albums-outline" size={32} color="#CCC" />
          <Text style={styles.emptyText}>No items on canvas</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item: outfitItem }: { item: OutfitItem }) => {
    const isSelected = outfitItem.itemId === selectedItemId;
    const imagePath = outfitItem.item?.imageLocalPath || outfitItem.item?.imageUrl;

    return (
      <TouchableOpacity
        style={[styles.miniItem, isSelected && styles.miniItemSelected]}
        onPress={() => onItemSelect?.(outfitItem.itemId)}
        activeOpacity={0.7}
      >
        {imagePath ? (
          <Image source={{ uri: imagePath }} style={styles.miniImage} resizeMode="contain" />
        ) : (
          <View style={styles.miniImagePlaceholder}>
            <Ionicons name="shirt-outline" size={24} color="#999" />
          </View>
        )}

        {/* Remove button - only show when selected */}
        {onItemRemove && isSelected && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onItemRemove(outfitItem.itemId)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="close" size={18} color="#000" />
          </TouchableOpacity>
        )}

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Selected Items</Text>
        <Text style={styles.count}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  count: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  separator: {
    width: 16,
  },
  miniItem: {
    width: MINI_ITEM_SIZE,
    height: MINI_ITEM_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#F8F8F8',
    position: 'relative',
    overflow: 'visible',
  },
  miniItemSelected: {
    borderColor: '#000',
    borderWidth: 2,
  },
  miniImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  miniImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
