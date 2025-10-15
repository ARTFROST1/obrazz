import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem } from '@types/models/item';

interface ItemCardProps {
  item: WardrobeItem;
  onPress: (item: WardrobeItem) => void;
  onFavoritePress?: (item: WardrobeItem) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with margins

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress, onFavoritePress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageLocalPath || item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onFavoritePress(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isFavorite ? '#FF3B30' : '#FFFFFF'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {item.category}
        </Text>
        {item.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  brand: {
    color: '#999',
    fontSize: 11,
  },
  category: {
    color: '#666',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    width: CARD_WIDTH,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 30,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: '#F8F8F8',
    position: 'relative',
    width: '100%',
  },
  infoContainer: {
    padding: 8,
  },
  title: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
});
