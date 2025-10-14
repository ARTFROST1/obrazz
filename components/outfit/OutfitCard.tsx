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
import { LinearGradient } from 'expo-linear-gradient';
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
 * Displays a preview card for a saved outfit.
 * Shows outfit image, title, visibility badge, and likes count.
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

  const getVisibilityBadge = () => {
    const badges = {
      private: { icon: 'lock-closed', color: '#666666', text: 'Private' },
      shared: { icon: 'people', color: '#007AFF', text: 'Shared' },
      public: { icon: 'globe', color: '#34C759', text: 'Public' },
    };
    return badges[outfit.visibility];
  };

  const badge = getVisibilityBadge();

  // Check if outfit has items to display
  const hasItems = outfit.items && outfit.items.length > 0;
  const hasValidItems =
    hasItems && outfit.items.some((item) => item.item?.imageLocalPath || item.item?.imageUrl);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isSelected ? '#000000' : 'transparent',
          borderWidth: isSelected ? 2 : 0,
        },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
      delayLongPress={500}
    >
      {/* Preview Image */}
      <View style={styles.imageContainer}>
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

        {/* Gradient Overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.gradient}>
          {/* Title and Badges */}
          <View style={styles.infoOverlay}>
            <Text style={styles.title} numberOfLines={2}>
              {outfit.title || 'Untitled Outfit'}
            </Text>

            <View style={styles.badgeContainer}>
              {/* Visibility Badge */}
              <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <Ionicons name={badge.icon as any} size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>{badge.text}</Text>
              </View>

              {/* Likes Count (if shared/public) */}
              {outfit.visibility !== 'private' && outfit.likesCount > 0 && (
                <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <Ionicons name="heart" size={12} color="#FF3B30" />
                  <Text style={styles.badgeText}>{outfit.likesCount}</Text>
                </View>
              )}

              {/* Favorite Star */}
              {outfit.isFavorite && <Ionicons name="star" size={16} color="#FFD60A" />}
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Menu */}
        {showActions && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Indicator */}
      {isSelectable && isSelected && (
        <View style={styles.selectionIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#000000" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  infoOverlay: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  menuIconContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});

export default OutfitCard;
