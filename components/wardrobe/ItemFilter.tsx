import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ItemCategory } from '../../types/models/item';
import { Season, StyleTag } from '../../types/models/user';
import { CategoryGridPicker } from './CategoryGridPicker';
import { ColorPicker } from './ColorPicker';

interface ItemFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export interface FilterState {
  categories: ItemCategory[];
  colors: string[];
  styles: StyleTag[];
  seasons: Season[];
  isFavorite?: boolean;
}

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

export const ItemFilter: React.FC<ItemFilterProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const handleCategorySelect = (category: ItemCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleColorSelect = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
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
      categories: [],
      colors: [],
      styles: [],
      seasons: [],
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
          <Text style={styles.title}>Filter Items</Text>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <CategoryGridPicker
              selectedCategories={filters.categories}
              onCategorySelect={handleCategorySelect}
            />
          </View>

          {/* Colors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colors</Text>
            <ColorPicker selectedColors={filters.colors} onColorSelect={handleColorSelect} />
          </View>

          {/* Styles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Styles</Text>
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
                      {style}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Seasons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seasons</Text>
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
                      {season}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
                  name={filters.isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={filters.isFavorite ? '#FF3B30' : '#000'}
                />
                <Text style={styles.favoriteText}>Favorites only</Text>
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
            <Text style={styles.applyButtonText}>Apply Filters</Text>
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
  title: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
