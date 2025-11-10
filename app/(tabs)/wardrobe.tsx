import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { useAuthStore } from '@store/auth/authStore';
import { itemService } from '@services/wardrobe/itemService';
import { ItemGrid } from '@components/wardrobe/ItemGrid';
import { ItemFilter, FilterState } from '@components/wardrobe/ItemFilter';
import { FAB } from '@components/ui';
import type { WardrobeItem } from '../../types/models';

export default function WardrobeScreen() {
  const { user } = useAuthStore();
  const {
    items,
    filter,
    setItems,
    setFilter,
    clearFilter,
    updateItem,
    getFilteredItems,
    isLoading,
    setLoading,
    setError,
  } = useWardrobeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, []);

  // Update StatusBar when screen is focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF', true);
      }
    }, []),
  );

  const loadItems = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userItems = await itemService.getUserItems(user.id);
      setItems(userItems);
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Failed to load items');
      Alert.alert('Error', 'Failed to load your wardrobe items');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [user?.id]);

  const handleItemPress = (item: WardrobeItem) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedItemIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      router.push(`/item/${item.id}`);
    }
  };

  const handleFavoritePress = async (item: WardrobeItem) => {
    try {
      const newFavoriteStatus = !item.isFavorite;
      await itemService.toggleFavorite(item.id, newFavoriteStatus);
      updateItem(item.id, { isFavorite: newFavoriteStatus });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleAddItem = () => {
    router.push('/add-item');
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItemIds(new Set()); // Clear selection when toggling
  };

  const handleDeleteSelected = async () => {
    if (selectedItemIds.size === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedItemIds.size} ${selectedItemIds.size === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Delete items one by one
              const deletePromises = Array.from(selectedItemIds).map((itemId) =>
                itemService.deleteItem(itemId),
              );
              await Promise.all(deletePromises);
              // Reload items
              await loadItems();
              // Exit selection mode
              setIsSelectionMode(false);
              setSelectedItemIds(new Set());
            } catch (error) {
              console.error('Error deleting items:', error);
              Alert.alert('Error', 'Failed to delete some items');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ searchQuery: query || undefined });
  };

  const handleApplyFilter = (filters: FilterState) => {
    setFilter({
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      colors: filters.colors.length > 0 ? filters.colors : undefined,
      styles: filters.styles.length > 0 ? filters.styles : undefined,
      seasons: filters.seasons.length > 0 ? filters.seasons : undefined,
      isFavorite: filters.isFavorite,
    });
  };

  const handleClearFilter = () => {
    clearFilter();
    setSearchQuery('');
  };

  const filteredItems = getFilteredItems();
  const hasActiveFilters =
    filter.categories?.length ||
    filter.colors?.length ||
    filter.styles?.length ||
    filter.seasons?.length ||
    filter.isFavorite ||
    filter.searchQuery;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Wardrobe</Text>
            {!isSelectionMode ? (
              <TouchableOpacity onPress={handleToggleSelectionMode} style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleToggleSelectionMode} style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Selection Actions Bar */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity
            onPress={() => {
              // Select all
              const allIds = new Set(filteredItems.map((item) => item.id));
              setSelectedItemIds(allIds);
            }}
            style={styles.selectAllButton}
          >
            <Text style={styles.selectAllButtonText}>Select All</Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>
            {selectedItemIds.size} {selectedItemIds.size === 1 ? 'item' : 'items'} selected
          </Text>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            disabled={selectedItemIds.size === 0}
            style={[styles.deleteButton, selectedItemIds.size === 0 && styles.deleteButtonDisabled]}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Bar */}
      {!isSelectionMode && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters ? styles.filterButtonActive : null]}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="filter" size={20} color={hasActiveFilters ? '#FFF' : '#000'} />
            <Text
              style={[
                styles.filterButtonText,
                hasActiveFilters ? styles.filterButtonTextActive : null,
              ]}
            >
              Filter
            </Text>
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>•</Text>
              </View>
            )}
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={handleClearFilter}>
              <Text style={styles.clearFilterText}>Clear All</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.itemCount}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      )}

      {/* Items Grid */}
      <ItemGrid
        items={filteredItems}
        onItemPress={handleItemPress}
        onFavoritePress={!isSelectionMode ? handleFavoritePress : undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        loading={isLoading}
        emptyMessage={
          hasActiveFilters ? 'No items match your filters' : 'Add your first item to get started!'
        }
        isSelectable={isSelectionMode}
        selectedItemIds={selectedItemIds}
      />

      {/* Filter Modal */}
      <ItemFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilter}
        initialFilters={{
          categories: filter.categories || [],
          colors: filter.colors || [],
          styles: filter.styles || [],
          seasons: filter.seasons || [],
          isFavorite: filter.isFavorite,
        }}
      />

      {/* FAB - Add New Item */}
      {!isSelectionMode && (
        <FAB
          icon="add"
          onPress={handleAddItem}
          backgroundColor="#000000"
          iconColor="#FFFFFF"
          accessibilityLabel="Add new item"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clearFilterButton: {
    marginLeft: 12,
  },
  clearFilterText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
  },
  filterBadge: {
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 20,
  },
  filterBar: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  itemCount: {
    color: '#666',
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: '#000',
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectAllButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonDisabled: {
    backgroundColor: '#CCC',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
