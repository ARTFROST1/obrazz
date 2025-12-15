import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { OutfitBackground, OutfitItem } from '../../types/models/outfit';

// Default item size constant
const ITEM_SIZE = 100;

interface OutfitPreviewProps {
  items: OutfitItem[];
  background: OutfitBackground;
  width: number;
  height: number;
  /**
   * If true, positions will be scaled to fit the preview size
   * Useful when showing thumbnails that are smaller than the original canvas
   */
  scaleToFit?: boolean;
}

/**
 * OutfitPreview Component
 *
 * Static (non-interactive) preview of an outfit composition.
 * Renders items with their saved transforms on a background.
 * Used in OutfitCard for displaying outfit thumbnails.
 *
 * Features:
 * - Automatically calculates bounding box of all items
 * - Scales content to fit entire composition without cropping
 * - Centers content in the preview container
 * - Maintains item positions, scales, rotations, and z-index
 *
 * @example
 * ```tsx
 * <OutfitPreview
 *   items={outfit.items}
 *   background={outfit.background}
 *   width={150}
 *   height={200}
 *   scaleToFit={true}
 * />
 * ```
 */
export function OutfitPreview({
  items,
  background,
  width,
  height,
  scaleToFit = true,
}: OutfitPreviewProps) {
  const getBackgroundStyle = () => {
    switch (background.type) {
      case 'color':
        return {
          backgroundColor: background.value,
          opacity: background.opacity || 1,
        };
      case 'image':
        return { backgroundColor: '#F8F8F8' };
      case 'pattern':
        return { backgroundColor: '#FFFFFF' };
      default:
        return { backgroundColor: '#FFFFFF' };
    }
  };

  const renderBackground = () => {
    if (background.type === 'gradient') {
      try {
        const colors = JSON.parse(background.value) as [string, string, ...string[]];
        if (colors.length < 2) {
          return null; // Invalid gradient
        }
        return (
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: background.opacity || 1 }]}
          />
        );
      } catch {
        // Fallback if JSON parse fails
        return null;
      }
    }
    return null;
  };

  // Memoize sorted items and layout calculations to prevent expensive recalculation
  const { sortedItems, scaleFactor, offsetX, offsetY } = useMemo(() => {
    // Sort items by zIndex
    const sorted = [...items]
      .filter((item) => item.isVisible && item.item)
      .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

    if (sorted.length === 0) {
      return { sortedItems: sorted, scaleFactor: 1, offsetX: 0, offsetY: 0 };
    }

    // Calculate bounding box of all items to fit entire content
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    sorted.forEach((outfitItem) => {
      const { transform } = outfitItem;
      const itemSize = ITEM_SIZE * transform.scale;

      // Calculate item bounds (considering center point)
      const itemLeft = transform.x;
      const itemTop = transform.y;
      const itemRight = itemLeft + itemSize;
      const itemBottom = itemTop + itemSize;

      minX = Math.min(minX, itemLeft);
      minY = Math.min(minY, itemTop);
      maxX = Math.max(maxX, itemRight);
      maxY = Math.max(maxY, itemBottom);
    });

    // Add padding to bounds
    const PADDING = 20;
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate scale to fit content in preview container
    const scale = scaleToFit ? Math.min(width / contentWidth, height / contentHeight) : 1;

    // Calculate offset to center content
    const offX = (width - contentWidth * scale) / 2 - minX * scale;
    const offY = (height - contentHeight * scale) / 2 - minY * scale;

    return { sortedItems: sorted, scaleFactor: scale, offsetX: offX, offsetY: offY };
  }, [items, width, height, scaleToFit]);

  if (sortedItems.length === 0) {
    return (
      <View style={[styles.container, { width, height }, getBackgroundStyle()]}>
        {renderBackground()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, getBackgroundStyle()]}>
      {renderBackground()}
      {sortedItems.map((outfitItem) => {
        const { item, transform, itemId } = outfitItem;
        if (!item) return null;

        const imagePath = item.imageLocalPath || item.imageUrl;
        if (!imagePath) return null;

        // Apply transforms with scaling and offset for centering
        const scaledX = transform.x * scaleFactor + offsetX;
        const scaledY = transform.y * scaleFactor + offsetY;
        const scaledSize = ITEM_SIZE * scaleFactor * transform.scale;

        return (
          <View
            key={itemId}
            style={[
              styles.item,
              {
                left: scaledX,
                top: scaledY,
                width: scaledSize,
                height: scaledSize,
                transform: [{ rotate: `${transform.rotation}deg` }],
              },
            ]}
          >
            <Image source={{ uri: imagePath }} style={styles.itemImage} resizeMode="contain" />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  item: {
    position: 'absolute',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
});

export default OutfitPreview;
