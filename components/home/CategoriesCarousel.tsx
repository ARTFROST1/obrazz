import { ItemCategory } from '@/types/models/item';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Smaller square tiles for categories
const TILE_SIZE = 100;
const TILE_MARGIN = 8;

interface CategoryItem {
  id: ItemCategory;
  label: string;
  icon: string;
  color: string;
}

const CATEGORY_DATA: CategoryItem[] = [
  {
    id: 'headwear',
    label: 'Головные уборы',
    icon: '🎩',
    color: '#FF6B6B',
  },
  {
    id: 'outerwear',
    label: 'Верхняя одежда',
    icon: '🧥',
    color: '#4ECDC4',
  },
  {
    id: 'tops',
    label: 'Верх',
    icon: '👕',
    color: '#45B7D1',
  },
  {
    id: 'bottoms',
    label: 'Низ',
    icon: '👖',
    color: '#96CEB4',
  },
  {
    id: 'footwear',
    label: 'Обувь',
    icon: '👟',
    color: '#FFEAA7',
  },
  {
    id: 'accessories',
    label: 'Аксессуары',
    icon: '⌚',
    color: '#DDA0DD',
  },
  {
    id: 'fullbody',
    label: 'Полный образ',
    icon: '👗',
    color: '#F8B500',
  },
  {
    id: 'other',
    label: 'Другое',
    icon: '📦',
    color: '#A0A0A0',
  },
];

interface CategoriesCarouselProps {
  onCategoryPress?: (category: ItemCategory) => void;
}

export default function CategoriesCarousel({ onCategoryPress }: CategoriesCarouselProps) {
  const handleCategoryPress = (category: ItemCategory) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Категории</Text>
        <Text style={styles.sectionSubtitle}>Быстрый доступ к гардеробу</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={TILE_SIZE + TILE_MARGIN * 2}
      >
        {CATEGORY_DATA.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.tile}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginHorizontal: TILE_MARGIN,
  },
  iconContainer: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
