import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { OutfitGrid } from '@components/outfit/OutfitGrid';
import { OutfitEmptyState } from '@components/outfit/OutfitEmptyState';
import { FAB } from '@components/ui';
import { Outfit } from '../../types/models/outfit';

/**
 * Outfits Screen
 *
 * Main screen for viewing and managing saved outfits collection.
 * Features:
 * - Grid display of outfits
 * - Search functionality
 * - Filter by visibility (all/private/shared)
 * - Sort options (newest, favorite, most used)
 * - FAB for creating new outfits
 * - Pull-to-refresh
 */
export default function OutfitsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const {
    outfits,
    setOutfits,
    deleteOutfit: removeOutfitFromStore,
    isLoading,
    setLoading,
    setError,
  } = useOutfitStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'private' | 'shared' | 'public'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'favorite' | 'most_used'>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadOutfits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update StatusBar when screen is focused or theme changes
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(isDark ? '#000000' : '#FFFFFF', true);
      }
    }, [isDark]),
  );

  const loadOutfits = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userOutfits = await outfitService.getUserOutfits(user.id);
      setOutfits(userOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
      setError('Failed to load outfits');
      Alert.alert('Error', 'Failed to load your outfits');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOutfits();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOutfitPress = (outfit: Outfit) => {
    router.push(`/outfit/${outfit.id}`);
  };

  const handleCreateOutfit = () => {
    router.push('/outfit/create');
  };

  const handleEditOutfit = (outfit: Outfit) => {
    router.push(`/outfit/create?id=${outfit.id}`);
  };

  const handleDuplicateOutfit = async (outfit: Outfit) => {
    if (!user?.id) return;

    try {
      Alert.alert('Duplicate Outfit', 'Create a copy of this outfit?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              setLoading(true);
              await outfitService.duplicateOutfit(outfit.id, user.id);
              await loadOutfits();
              Alert.alert('Success', 'Outfit duplicated successfully');
            } catch (error) {
              console.error('Error duplicating outfit:', error);
              Alert.alert('Error', 'Failed to duplicate outfit');
            } finally {
              setLoading(false);
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error in duplicate flow:', error);
    }
  };

  const handleDeleteOutfit = (outfit: Outfit) => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfit.title || 'Untitled'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await outfitService.deleteOutfit(outfit.id);
              removeOutfitFromStore(outfit.id);
              Alert.alert('Success', 'Outfit deleted successfully');
            } catch (error) {
              console.error('Error deleting outfit:', error);
              Alert.alert('Error', 'Failed to delete outfit');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleShareOutfit = (outfit: Outfit) => {
    // TODO: Implement share functionality in future phase
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleFavoritePress = async (outfit: Outfit) => {
    try {
      const newFavoriteStatus = !outfit.isFavorite;
      await outfitService.toggleFavorite(outfit.id, newFavoriteStatus);
      // Update local state
      const updatedOutfits = outfits.map((o) =>
        o.id === outfit.id ? { ...o, isFavorite: newFavoriteStatus } : o,
      );
      setOutfits(updatedOutfits);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: typeof filterBy) => {
    setFilterBy(filter);
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
    setShowSortMenu(false);
  };

  // Filter and sort outfits
  const getFilteredAndSortedOutfits = (): Outfit[] => {
    let filtered = [...outfits];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (outfit) =>
          outfit.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          outfit.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply visibility filter
    if (filterBy !== 'all') {
      filtered = filtered.filter((outfit) => outfit.visibility === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'favorite':
          if (a.isFavorite === b.isFavorite) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isFavorite ? -1 : 1;
        case 'most_used':
          if (a.wearCount === b.wearCount) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return b.wearCount - a.wearCount;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredOutfits = getFilteredAndSortedOutfits();
  const hasActiveFilters = filterBy !== 'all' || searchQuery.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
        translucent={false}
        animated={true}
      />
      {/* Header */}
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.header}>
          <View
            style={[styles.headerContent, { borderBottomColor: isDark ? '#38383A' : '#E5E5E5' }]}
          >
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              My Outfits
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8' }]}>
        <Ionicons name="search" size={20} color={isDark ? '#8E8E93' : '#666666'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
          placeholder="Search outfits..."
          placeholderTextColor={isDark ? '#8E8E93' : '#C4C4C4'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={isDark ? '#8E8E93' : '#666666'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterBy === 'all' && styles.filterChipActive,
            {
              backgroundColor:
                filterBy === 'all'
                  ? isDark
                    ? '#FFFFFF'
                    : '#000000'
                  : isDark
                    ? '#2C2C2E'
                    : '#F8F8F8',
            },
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filterBy === 'all'
                    ? isDark
                      ? '#000000'
                      : '#FFFFFF'
                    : isDark
                      ? '#FFFFFF'
                      : '#000000',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterBy === 'private' && styles.filterChipActive,
            {
              backgroundColor:
                filterBy === 'private'
                  ? isDark
                    ? '#FFFFFF'
                    : '#000000'
                  : isDark
                    ? '#2C2C2E'
                    : '#F8F8F8',
            },
          ]}
          onPress={() => handleFilterChange('private')}
        >
          <Ionicons
            name="lock-closed"
            size={14}
            color={
              filterBy === 'private'
                ? isDark
                  ? '#000000'
                  : '#FFFFFF'
                : isDark
                  ? '#FFFFFF'
                  : '#000000'
            }
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filterBy === 'private'
                    ? isDark
                      ? '#000000'
                      : '#FFFFFF'
                    : isDark
                      ? '#FFFFFF'
                      : '#000000',
              },
            ]}
          >
            Private
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterBy === 'shared' && styles.filterChipActive,
            {
              backgroundColor:
                filterBy === 'shared'
                  ? isDark
                    ? '#FFFFFF'
                    : '#000000'
                  : isDark
                    ? '#2C2C2E'
                    : '#F8F8F8',
            },
          ]}
          onPress={() => handleFilterChange('shared')}
        >
          <Ionicons
            name="people"
            size={14}
            color={
              filterBy === 'shared'
                ? isDark
                  ? '#000000'
                  : '#FFFFFF'
                : isDark
                  ? '#FFFFFF'
                  : '#000000'
            }
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filterBy === 'shared'
                    ? isDark
                      ? '#000000'
                      : '#FFFFFF'
                    : isDark
                      ? '#FFFFFF'
                      : '#000000',
              },
            ]}
          >
            Shared
          </Text>
        </TouchableOpacity>

        {/* Sort Button */}
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8' }]}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={[styles.sortButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Sort
          </Text>
          <Ionicons name="chevron-down" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <TouchableOpacity style={styles.sortMenuItem} onPress={() => handleSortChange('newest')}>
            <Text style={[styles.sortMenuText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Newest First
            </Text>
            {sortBy === 'newest' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortMenuItem}
            onPress={() => handleSortChange('favorite')}
          >
            <Text style={[styles.sortMenuText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Favorites
            </Text>
            {sortBy === 'favorite' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortMenuItem}
            onPress={() => handleSortChange('most_used')}
          >
            <Text style={[styles.sortMenuText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Most Worn
            </Text>
            {sortBy === 'most_used' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsText, { color: isDark ? '#8E8E93' : '#666666' }]}>
            {filteredOutfits.length} {filteredOutfits.length === 1 ? 'outfit' : 'outfits'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setFilterBy('all');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Outfit Grid */}
      <OutfitGrid
        outfits={filteredOutfits}
        isLoading={isLoading}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onOutfitPress={handleOutfitPress}
        onOutfitEdit={handleEditOutfit}
        onOutfitDelete={handleDeleteOutfit}
        onOutfitDuplicate={handleDuplicateOutfit}
        onOutfitShare={handleShareOutfit}
        onFavoritePress={handleFavoritePress}
        EmptyComponent={() => <OutfitEmptyState onCreatePress={handleCreateOutfit} />}
      />

      {/* FAB - Create New Outfit */}
      <FAB
        icon="add"
        onPress={handleCreateOutfit}
        backgroundColor={isDark ? '#FFFFFF' : '#000000'}
        iconColor={isDark ? '#000000' : '#FFFFFF'}
        accessibilityLabel="Create new outfit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    // backgroundColor set dynamically
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    // borderBottomColor set dynamically
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color set dynamically
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  filterChipActive: {
    // Active style applied via backgroundColor in component
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
    marginLeft: 'auto',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortMenu: {
    position: 'absolute',
    top: 185,
    right: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
    zIndex: 1000,
    minWidth: 160,
  },
  sortMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortMenuText: {
    fontSize: 15,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 13,
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});
