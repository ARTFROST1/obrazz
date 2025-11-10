import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ItemCategory } from '../../types/models/item';
import { getAllCategoriesInfo } from '@constants/categories';

interface CategoryGridPickerProps {
  selectedCategories: ItemCategory[];
  onCategorySelect: (category: ItemCategory) => void;
  multiSelect?: boolean;
}

const CATEGORIES = getAllCategoriesInfo('en');

export const CategoryGridPicker: React.FC<CategoryGridPickerProps> = ({
  selectedCategories,
  onCategorySelect,
  multiSelect = true,
}) => {
  const isSelected = (category: ItemCategory) => selectedCategories.includes(category);

  const handlePress = (category: ItemCategory) => {
    onCategorySelect(category);
  };

  return (
    <View style={styles.container}>
      {CATEGORIES.map((categoryInfo) => {
        const selected = isSelected(categoryInfo.value);
        return (
          <TouchableOpacity
            key={categoryInfo.value}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => handlePress(categoryInfo.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{categoryInfo.icon}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {categoryInfo.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  cardSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  labelSelected: {
    color: '#FFF',
  },
});
