import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem } from '../../types/models/item';

interface ItemCardProps {
  item: WardrobeItem;
  onPress: (item: WardrobeItem) => void;
  onFavoritePress?: (item: WardrobeItem) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with margins

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  onFavoritePress,
  isSelectable = false,
  isSelected = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onFavoritePress) {
      onFavoritePress(item);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View
        style={[
          styles.imageContainer,
          {
            borderColor: isSelected ? '#000000' : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
      >
        <Image
          source={{ uri: item.imageLocalPath || item.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={item.isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={item.isFavorite ? '#FF3B30' : '#FFFFFF'}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
        {/* Selection Indicator */}
        {isSelectable && isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#000000" />
          </View>
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
    width: CARD_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
      },
    }),
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
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
});
