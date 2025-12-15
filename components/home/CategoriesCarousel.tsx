import { ItemCategory } from '@/types/models/item';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Square tiles for categories (like app icons on OZON)
const TILE_SIZE = 72;
const TILE_GAP = 12;

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
      >
        {CATEGORY_DATA.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.tile, index === 0 && styles.firstTile]}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.7}
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollContent: {
    paddingRight: 16,
  },
  firstTile: {
    marginLeft: 16,
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginLeft: TILE_GAP,
  },
  iconContainer: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    fontSize: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
});
