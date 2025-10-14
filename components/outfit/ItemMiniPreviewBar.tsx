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

const MINI_ITEM_SIZE = 56;

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
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No items selected</Text>
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

        {/* Remove button */}
        {onItemRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onItemRemove(outfitItem.itemId)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="close-circle" size={16} color="#FF3B30" />
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
        <Text style={styles.label}>Selected items</Text>
        <Text style={styles.count}>{items.length}</Text>
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
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  count: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
  miniItem: {
    width: MINI_ITEM_SIZE,
    height: MINI_ITEM_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
    overflow: 'hidden',
    position: 'relative',
  },
  miniItemSelected: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  miniImage: {
    width: '100%',
    height: '100%',
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
    top: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 8,
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
    backgroundColor: '#007AFF',
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
});
