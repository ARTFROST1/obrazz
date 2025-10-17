import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ItemCategory } from '@types/models/item';

interface CategoryPickerProps {
  selectedCategories: ItemCategory[];
  onCategorySelect: (category: ItemCategory) => void;
  multiSelect?: boolean;
}

const CATEGORIES: Array<{ value: ItemCategory; label: string; icon: string }> = [
  { value: 'headwear', label: 'Headwear', icon: '🎩' },
  { value: 'outerwear', label: 'Outerwear', icon: '🧥' },
  { value: 'tops', label: 'Tops', icon: '👕' },
  { value: 'bottoms', label: 'Bottoms', icon: '👖' },
  { value: 'footwear', label: 'Footwear', icon: '👟' },
  { value: 'accessories', label: 'Accessories', icon: '⌚' },
  { value: 'fullbody', label: 'Dresses & Suits', icon: '👗' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategories,
  onCategorySelect,
  multiSelect = true,
}) => {
  const isSelected = (category: ItemCategory) => selectedCategories.includes(category);

  const handlePress = (category: ItemCategory) => {
    onCategorySelect(category);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((category) => {
        const selected = isSelected(category.value);
        return (
          <TouchableOpacity
            key={category.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => handlePress(category.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{category.icon}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{category.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  label: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  labelSelected: {
    color: '#FFF',
  },
});
