import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Outfit } from '../../types/models/outfit';
import { OutfitPreview } from './OutfitPreview';

export interface OutfitCardProps {
  outfit: Outfit;
  onPress?: (outfit: Outfit) => void;
  onLongPress?: (outfit: Outfit) => void;
  onEdit?: (outfit: Outfit) => void;
  onDuplicate?: (outfit: Outfit) => void;
  onDelete?: (outfit: Outfit) => void;
  onShare?: (outfit: Outfit) => void;
  onFavoritePress?: (outfit: Outfit) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  showActions?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px margins

/**
 * OutfitCard Component
 *
 * Minimalist Pinterest-style card for saved outfits.
 * Clean preview with title below the image.
 *
 * @example
 * ```tsx
 * <OutfitCard
 *   outfit={outfit}
 *   onPress={handlePress}
 *   onLongPress={handleLongPress}
 * />
 * ```
 */
export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onPress,
  onLongPress,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
  onFavoritePress,
  isSelectable = false,
  isSelected = false,
  showActions = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showMenu, setShowMenu] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isSelectable) {
      // Handle selection mode
      onPress?.(outfit);
    } else {
      onPress?.(outfit);
    }
  };

  const handleLongPress = () => {
    onLongPress?.(outfit);
  };

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
      onFavoritePress(outfit);
    }
  };

  // Check if outfit has items to display
  const hasItems = outfit.items && outfit.items.length > 0;
  const hasValidItems =
    hasItems && outfit.items.some((item) => item.item?.imageLocalPath || item.item?.imageUrl);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {/* Preview Image */}
      <View
        style={[
          styles.imageContainer,
          {
            borderColor: isSelected ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
      >
        {hasValidItems ? (
          <OutfitPreview
            items={outfit.items}
            background={outfit.background}
            width={CARD_WIDTH}
            height={CARD_WIDTH * (4 / 3)} // 3:4 aspect ratio
            scaleToFit={true}
          />
        ) : (
          <View
            style={[styles.placeholderImage, { backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8' }]}
          >
            <Ionicons name="shirt-outline" size={48} color={isDark ? '#48484A' : '#C4C4C4'} />
          </View>
        )}

        {/* Favorite Star Button - Top Right */}
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={outfit.isFavorite ? 'star' : 'star-outline'}
                size={18}
                color={outfit.isFavorite ? '#FFD60A' : '#FFFFFF'}
              />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Selection Indicator */}
        {isSelectable && isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </View>
        )}
      </View>

      {/* Title Below Image */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
          {outfit.title || 'Untitled Outfit'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
    position: 'relative',
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
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  infoContainer: {
    paddingTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OutfitCard;
