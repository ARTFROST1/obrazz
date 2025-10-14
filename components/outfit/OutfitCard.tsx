import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Platform,
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
  isSelectable = false,
  isSelected = false,
  showActions = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showMenu, setShowMenu] = useState(false);

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

        {/* Favorite Star - Top Right */}
        {outfit.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Ionicons name="star" size={16} color="#FFD60A" />
          </View>
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
    }),
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
