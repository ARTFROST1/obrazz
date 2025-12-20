import type { DetectedImage } from '@/types/models/store';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import GalleryImageItem from './GalleryImageItem';

interface MasonryGalleryProps {
  images: DetectedImage[];
  selectedIds: Set<string>;
  onImageSelect: (image: DetectedImage) => void;
  columns?: number;
  gap?: number;
}

interface MasonryItem {
  image: DetectedImage;
  column: number;
  width: number;
  height: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MasonryGallery({
  images,
  selectedIds,
  onImageSelect,
  columns = 2,
  gap = 8,
}: MasonryGalleryProps) {
  // Reverse images array so newest are at top
  const reversedImages = useMemo(() => [...images].reverse(), [images]);

  const layout = useMemo(() => {
    const containerWidth = SCREEN_WIDTH - 32; // Padding 16px each side
    const columnWidth = (containerWidth - (columns - 1) * gap) / columns;
    const columnHeights = new Array(columns).fill(0);
    const items: MasonryItem[] = [];

    reversedImages.forEach((image) => {
      // Find column with minimum height
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

      // Calculate item dimensions preserving aspect ratio
      const aspectRatio = image.width / image.height;
      const itemHeight = columnWidth / aspectRatio;

      items.push({
        image,
        column: shortestColumn,
        width: columnWidth,
        height: itemHeight,
      });

      // Update column height
      columnHeights[shortestColumn] += itemHeight + gap;
    });

    return { items, columnHeights };
  }, [reversedImages, columns, gap]);

  // Group items by column
  const columnItems = useMemo(() => {
    const cols: MasonryItem[][] = Array.from({ length: columns }, () => []);
    layout.items.forEach((item) => {
      cols[item.column].push(item);
    });
    return cols;
  }, [layout.items, columns]);

  return (
    <View style={[styles.columnsContainer, { gap, paddingHorizontal: 16 }]}>
      {columnItems.map((items, columnIndex) => (
        <View key={`column_${columnIndex}`} style={[styles.column, { gap }]}>
          {items.map((item, itemIndex) => (
            <GalleryImageItem
              key={`${item.image.id}_${columnIndex}_${itemIndex}`}
              image={item.image}
              isSelected={selectedIds.has(item.image.id)}
              onSelect={onImageSelect}
              width={item.width}
              height={item.height}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  columnsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
});
