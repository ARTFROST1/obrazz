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
import { WardrobeItem } from '@types/models/item';

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
    router.push(`/item/${item.id}`);
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

      {/* Filter Bar */}
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

        <View style={styles.filterBarCenter}>
          <Text style={styles.itemCount}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.filterBarRight}>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={handleClearFilter}>
              <Text style={styles.clearFilterText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Items Grid */}
      <ItemGrid
        items={filteredItems}
        onItemPress={handleItemPress}
        onFavoritePress={handleFavoritePress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        loading={isLoading}
        emptyMessage={
          hasActiveFilters ? 'No items match your filters' : 'Add your first item to get started!'
        }
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
      <FAB
        icon="add"
        onPress={handleAddItem}
        backgroundColor="#000000"
        iconColor="#FFFFFF"
        accessibilityLabel="Add new item"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clearFilterButton: {},
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBarCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBarRight: {
    minWidth: 80,
    alignItems: 'flex-end',
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
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
});
