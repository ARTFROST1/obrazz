import { getAllCategoriesInfo } from '@constants/categories';
import { useTranslation } from '@hooks/useTranslation';
import { useSettingsStore } from '@store/settings/settingsStore';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ItemCategory } from '../../types/models/item';

interface CategoryGridPickerProps {
  selectedCategories: ItemCategory[];
  onCategorySelect: (category: ItemCategory) => void;
  multiSelect?: boolean;
}

export const CategoryGridPicker: React.FC<CategoryGridPickerProps> = ({
  selectedCategories,
  onCategorySelect,
  multiSelect = true,
}) => {
  const { t } = useTranslation('categories');
  const { language } = useSettingsStore();
  const CATEGORIES = getAllCategoriesInfo(language);

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
    gap: 8,
    paddingHorizontal: 0,
  },
  card: {
    flexBasis: '23%',
    maxWidth: '23%',
    aspectRatio: Platform.OS === 'android' ? 0.9 : 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: Platform.OS === 'android' ? 12 : 16,
    borderWidth: 1,
    padding: Platform.OS === 'android' ? 6 : 4,
  },
  cardSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  icon: {
    fontSize: Platform.OS === 'android' ? 28 : 34,
    marginBottom: Platform.OS === 'android' ? 4 : 8,
  },
  label: {
    color: '#000',
    fontSize: Platform.OS === 'android' ? 10 : 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  labelSelected: {
    color: '#FFF',
  },
});
