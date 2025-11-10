import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ItemCard } from './ItemCard';
import { WardrobeItem } from '../../types/models/item';

interface ItemGridProps {
  items: WardrobeItem[];
  onItemPress: (item: WardrobeItem) => void;
  onFavoritePress?: (item: WardrobeItem) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
  isSelectable?: boolean;
  selectedItemIds?: Set<string>;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  onItemPress,
  onFavoritePress,
  onRefresh,
  refreshing = false,
  loading = false,
  emptyMessage = 'No items in your wardrobe yet',
  ListHeaderComponent,
  ListFooterComponent,
  isSelectable = false,
  selectedItemIds = new Set(),
}) => {
  const renderItem = ({ item }: { item: WardrobeItem }) => (
    <ItemCard
      item={item}
      onPress={onItemPress}
      onFavoritePress={onFavoritePress}
      isSelectable={isSelectable}
      isSelected={selectedItemIds.has(item.id)}
    />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👔</Text>
        <Text style={styles.emptyTitle}>Empty Wardrobe</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 20 : 80, // iOS NativeTabs handles spacing automatically
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyMessage: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#000',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
});
