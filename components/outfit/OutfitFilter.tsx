import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { OccasionTag, Season, StyleTag } from '../../types/models';

interface OutfitFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: OutfitFilterState) => void;
  initialFilters: OutfitFilterState;
}

export interface OutfitFilterState {
  occasions: OccasionTag[];
  styles: StyleTag[];
  seasons: Season[];
  sortBy: 'newest' | 'alphabetical' | 'favorites';
  isFavorite?: boolean;
}

const OCCASIONS: OccasionTag[] = [
  'casual',
  'work',
  'party',
  'date',
  'sport',
  'beach',
  'wedding',
  'travel',
  'home',
  'special',
];

const STYLES: StyleTag[] = [
  'casual',
  'classic',
  'sport',
  'minimalism',
  'old_money',
  'scandi',
  'indie',
  'y2k',
  'star',
  'alt',
  'cottagecore',
  'downtown',
];

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

export const OutfitFilter: React.FC<OutfitFilterProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { t } = useTranslation('outfit');
  const [filters, setFilters] = useState<OutfitFilterState>(initialFilters);

  const handleOccasionSelect = (occasion: OccasionTag) => {
    setFilters((prev) => ({
      ...prev,
      occasions: prev.occasions.includes(occasion)
        ? prev.occasions.filter((o) => o !== occasion)
        : [...prev.occasions, occasion],
    }));
  };

  const handleStyleSelect = (style: StyleTag) => {
    setFilters((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }));
  };

  const handleSeasonSelect = (season: Season) => {
    setFilters((prev) => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter((s) => s !== season)
        : [...prev.seasons, season],
    }));
  };

  const handleClearAll = () => {
    setFilters({
      occasions: [],
      styles: [],
      seasons: [],
      sortBy: 'newest',
      isFavorite: undefined,
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('filter.filterButton')}</Text>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearText}>{t('filter.clearFilters')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Occasions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('filter.occasions')}</Text>
            <View style={styles.chipContainer}>
              {OCCASIONS.map((occasion) => {
                const selected = filters.occasions.includes(occasion);
                return (
                  <TouchableOpacity
                    key={occasion}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => handleOccasionSelect(occasion)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t(`categories:occasions.${occasion}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Styles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('filter.styles')}</Text>
            <View style={styles.chipContainer}>
              {STYLES.map((style) => {
                const selected = filters.styles.includes(style);
                return (
                  <TouchableOpacity
                    key={style}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => handleStyleSelect(style)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t(`categories:styles.${style}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Seasons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('filter.seasons')}</Text>
            <View style={styles.chipContainer}>
              {SEASONS.map((season) => {
                const selected = filters.seasons.includes(season);
                return (
                  <TouchableOpacity
                    key={season}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => handleSeasonSelect(season)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t(`categories:seasons.${season}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('filter.sortBy')}</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  filters.sortBy === 'newest' && styles.sortOptionSelected,
                ]}
                onPress={() => setFilters((prev) => ({ ...prev, sortBy: 'newest' }))}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    filters.sortBy === 'newest' && styles.sortOptionTextSelected,
                  ]}
                >
                  {t('filter.newest')}
                </Text>
                {filters.sortBy === 'newest' && (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  filters.sortBy === 'alphabetical' && styles.sortOptionSelected,
                ]}
                onPress={() => setFilters((prev) => ({ ...prev, sortBy: 'alphabetical' }))}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    filters.sortBy === 'alphabetical' && styles.sortOptionTextSelected,
                  ]}
                >
                  {t('filter.alphabetical')}
                </Text>
                {filters.sortBy === 'alphabetical' && (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  filters.sortBy === 'favorites' && styles.sortOptionSelected,
                ]}
                onPress={() => setFilters((prev) => ({ ...prev, sortBy: 'favorites' }))}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    filters.sortBy === 'favorites' && styles.sortOptionTextSelected,
                  ]}
                >
                  {t('filter.favorites')}
                </Text>
                {filters.sortBy === 'favorites' && (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Favorites */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.favoriteRow}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  isFavorite: prev.isFavorite ? undefined : true,
                }))
              }
            >
              <View style={styles.favoriteLeft}>
                <Ionicons
                  name={filters.isFavorite ? 'star' : 'star-outline'}
                  size={24}
                  color={filters.isFavorite ? '#FFD700' : '#000'}
                />
                <Text style={styles.favoriteText}>{t('filter.favoritesOnly')}</Text>
              </View>
              <Ionicons
                name={filters.isFavorite ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={filters.isFavorite ? '#000' : '#CCC'}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>{t('filter.applyFilters')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  chip: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  chipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  chipText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  container: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  favoriteLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  favoriteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  favoriteText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  footer: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
    marginTop: 16,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sortContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortOption: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortOptionSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sortOptionText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: '#FFF',
  },
  title: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
