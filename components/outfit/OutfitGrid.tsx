import React from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { Outfit } from '@types/models/outfit';
import { OutfitCard } from './OutfitCard';
import { OutfitEmptyState } from './OutfitEmptyState';

export interface OutfitGridProps {
  outfits: Outfit[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onOutfitPress?: (outfit: Outfit) => void;
  onOutfitEdit?: (outfit: Outfit) => void;
  onOutfitDelete?: (outfit: Outfit) => void;
  onOutfitDuplicate?: (outfit: Outfit) => void;
  onOutfitShare?: (outfit: Outfit) => void;
  EmptyComponent?: React.ComponentType<any>;
  numColumns?: number;
}

/**
 * OutfitGrid Component
 *
 * Displays a grid of outfit cards with pull-to-refresh and pagination.
 * Uses FlatList for performance with large datasets.
 *
 * @example
 * ```tsx
 * <OutfitGrid
 *   outfits={outfits}
 *   onOutfitPress={handlePress}
 *   onRefresh={handleRefresh}
 *   isRefreshing={isRefreshing}
 * />
 * ```
 */
export const OutfitGrid: React.FC<OutfitGridProps> = ({
  outfits,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  onOutfitPress,
  onOutfitEdit,
  onOutfitDelete,
  onOutfitDuplicate,
  onOutfitShare,
  EmptyComponent,
  numColumns = 2,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const renderItem = ({ item }: { item: Outfit }) => (
    <View style={styles.cardContainer}>
      <OutfitCard
        outfit={item}
        onPress={onOutfitPress}
        onLongPress={(outfit) => {
          // Could show context menu here
          console.log('Long press:', outfit.id);
        }}
        onEdit={onOutfitEdit}
        onDuplicate={onOutfitDuplicate}
        onDelete={onOutfitDelete}
        onShare={onOutfitShare}
      />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </View>
      );
    }

    if (EmptyComponent) {
      return <EmptyComponent />;
    }

    return <OutfitEmptyState />;
  };

  const renderFooter = () => {
    if (!isLoading || outfits.length === 0) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  };

  return (
    <FlatList
      data={outfits}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={[styles.container, outfits.length === 0 && styles.emptyContainer]}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90, // Extra padding for floating tab bar + FAB
  },
  emptyContainer: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    marginBottom: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default OutfitGrid;
