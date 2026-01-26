import { getDisplayItemTitle } from '@/utils/item/displayItemTitle';
import { ContextMenuAction, ContextMenuView } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WardrobeItem } from '../../types/models/item';

interface ItemCardProps {
  item: WardrobeItem;
  onPress: (item: WardrobeItem) => void;
  onFavoritePress?: (item: WardrobeItem) => void;
  onEdit?: (item: WardrobeItem) => void;
  onDelete?: (item: WardrobeItem) => void;
  onHide?: (item: WardrobeItem) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  numColumns?: number;
  hasSourceUrl?: boolean; // Indicator for items imported from web with buy link
  /** Enable native iOS context menu on long press */
  enableContextMenu?: boolean;
}

const { width } = Dimensions.get('window');

// Calculate card width based on number of columns
const getCardWidth = (numColumns: number) => {
  const horizontalPadding = 32; // 16px on each side
  const gap = 8; // gap between cards
  const totalGaps = (numColumns - 1) * gap;
  return (width - horizontalPadding - totalGaps) / numColumns;
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  onFavoritePress,
  onEdit,
  onDelete,
  onHide,
  isSelectable = false,
  isSelected = false,
  numColumns = 2,
  hasSourceUrl = false,
  enableContextMenu = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardWidth = getCardWidth(numColumns);

  // Context menu actions for long press
  const contextMenuActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];

    if (onEdit) {
      actions.push({
        id: 'edit',
        title: 'Edit',
        icon: 'pencil',
      });
    }

    if (onHide) {
      actions.push({
        id: 'hide',
        title: 'Hide',
        icon: 'eye.slash',
      });
    }

    if (onDelete) {
      actions.push({
        id: 'delete',
        title: 'Delete',
        icon: 'trash',
        destructive: true,
      });
    }

    return actions;
  }, [onEdit, onDelete, onHide]);

  const handleContextMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'edit':
        onEdit?.(item);
        break;
      case 'delete':
        onDelete?.(item);
        break;
      case 'hide':
        onHide?.(item);
        break;
    }
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
      onFavoritePress(item);
    }
  };

  // Don't show context menu if in selection mode or no actions defined
  const showContextMenu = enableContextMenu && !isSelectable && contextMenuActions.length > 0;

  // Handle card press
  const handleCardPress = () => onPress(item);

  // Card inner content (without touch wrapper)
  const cardInnerContent = (
    <>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageLocalPath || item.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
        {onFavoritePress && !isSelectable && (
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

        {/* Selection Overlay (darkening effect) */}
        {isSelectable && isSelected && <View style={styles.selectionOverlay} />}

        {/* Selection Indicator */}
        {isSelectable && isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {getDisplayItemTitle(item, 'Untitled')}
        </Text>
      </View>
    </>
  );

  // Use ContextMenuView for all cards - it handles both tap and context menu
  // ContextMenuView uses Gesture API which works properly with ScrollView
  if (showContextMenu) {
    return (
      <ContextMenuView
        actions={contextMenuActions}
        onPressAction={handleContextMenuAction}
        onPress={handleCardPress}
      >
        <View
          style={[styles.container, { width: cardWidth }, isSelected && styles.containerSelected]}
        >
          {cardInnerContent}
        </View>
      </ContextMenuView>
    );
  }

  // Selection mode or no context menu - still use ContextMenuView for consistent gesture handling
  return (
    <ContextMenuView
      actions={[]}
      onPressAction={() => {}}
      onPress={handleCardPress}
      disabled={true}
    >
      <View
        style={[styles.container, { width: cardWidth }, isSelected && styles.containerSelected]}
      >
        {cardInnerContent}
      </View>
    </ContextMenuView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
    overflow: 'hidden',
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
  containerSelected: {
    borderColor: '#000000',
    borderWidth: 2,
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
  webSourceIndicator: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
