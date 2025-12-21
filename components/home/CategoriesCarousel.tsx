import { ItemCategory } from '@/types/models/item';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Square tiles for categories (like app icons on OZON)
const TILE_SIZE = 72;
const TILE_GAP = 12;

interface CategoryItem {
  id: ItemCategory;
  label: string;
  iconName: string;
  iconLibrary: 'Ionicons' | 'MaterialCommunityIcons';
}

const CATEGORY_DATA: CategoryItem[] = [
  {
    id: 'headwear',
    label: 'Головные уборы',
    iconName: 'hat-fedora',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'outerwear',
    label: 'Верхняя одежда',
    iconName: 'coat-rack',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'tops',
    label: 'Верх',
    iconName: 'tshirt-crew',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'bottoms',
    label: 'Низ',
    iconName: 'human-handsdown',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'footwear',
    label: 'Обувь',
    iconName: 'shoe-sneaker',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'accessories',
    label: 'Аксессуары',
    iconName: 'watch',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'fullbody',
    label: 'Полный образ',
    iconName: 'tshirt-crew-outline',
    iconLibrary: 'MaterialCommunityIcons',
  },
  {
    id: 'other',
    label: 'Другое',
    iconName: 'grid',
    iconLibrary: 'Ionicons',
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

  const renderIcon = (item: CategoryItem) => {
    const IconComponent = item.iconLibrary === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
    return <IconComponent name={item.iconName as any} size={32} color="#000" />;
  };

  return (
    <View style={styles.container}>
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
            <View style={styles.iconContainer}>{renderIcon(item)}</View>
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
    marginTop: 20,
    marginBottom: 16,
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
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
