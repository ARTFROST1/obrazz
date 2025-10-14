import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { OutfitItem, OutfitBackground } from '../../types/models/outfit';

interface OutfitCanvasProps {
  items: OutfitItem[];
  background: OutfitBackground;
  width: number;
  height: number;
  onItemTransformUpdate: (itemId: string, transform: Partial<OutfitItem['transform']>) => void;
  onItemSelect?: (itemId: string | null) => void;
  selectedItemId?: string | null;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export function OutfitCanvas({
  items,
  background,
  width,
  height,
  onItemTransformUpdate,
  onItemSelect,
  selectedItemId,
  showGrid = false,
  snapToGrid = false,
  gridSize = 20,
}: OutfitCanvasProps) {
  const getBackgroundStyle = () => {
    switch (background.type) {
      case 'color':
        return { backgroundColor: background.value };
      case 'gradient':
        // For gradient, we'll need to use a library like react-native-linear-gradient
        // For now, fallback to solid color
        return { backgroundColor: background.value };
      case 'image':
        return { backgroundColor: '#F8F8F8' };
      case 'pattern':
        return { backgroundColor: '#FFFFFF' };
      default:
        return { backgroundColor: '#FFFFFF' };
    }
  };

  return (
    <View
      style={[
        styles.canvas,
        { width, height },
        getBackgroundStyle(),
        { opacity: background.opacity || 1 },
      ]}
    >
      {showGrid && (
        <View style={styles.gridContainer}>
          {/* Render grid lines */}
          {Array.from({ length: Math.floor(height / gridSize) }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLine,
                {
                  top: i * gridSize,
                  width: width,
                  height: 1,
                },
              ]}
            />
          ))}
          {Array.from({ length: Math.floor(width / gridSize) }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLine,
                {
                  left: i * gridSize,
                  height: height,
                  width: 1,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Render items sorted by zIndex */}
      {[...items]
        .sort((a, b) => a.transform.zIndex - b.transform.zIndex)
        .filter((item) => item.isVisible && item.item)
        .map((outfitItem) => (
          <CanvasItem
            key={outfitItem.itemId}
            outfitItem={outfitItem}
            isSelected={selectedItemId === outfitItem.itemId}
            onTransformUpdate={onItemTransformUpdate}
            onSelect={onItemSelect}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            canvasWidth={width}
            canvasHeight={height}
          />
        ))}
    </View>
  );
}

interface CanvasItemProps {
  outfitItem: OutfitItem;
  isSelected: boolean;
  onTransformUpdate: (itemId: string, transform: Partial<OutfitItem['transform']>) => void;
  onSelect?: (itemId: string | null) => void;
  snapToGrid: boolean;
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

function CanvasItem({
  outfitItem,
  isSelected,
  onTransformUpdate,
  onSelect,
  snapToGrid,
  gridSize,
  canvasWidth,
  canvasHeight,
}: CanvasItemProps) {
  const { item, transform, itemId } = outfitItem;

  // Initialize ALL hooks BEFORE any conditional returns
  const translateX = useSharedValue(transform.x);
  const translateY = useSharedValue(transform.y);
  const scale = useSharedValue(transform.scale);
  const rotation = useSharedValue(transform.rotation);

  // Use shared values for start positions
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  if (!item) return null;

  const snapToGridValue = (value: number, gridSize: number) => {
    'worklet';
    return Math.round(value / gridSize) * gridSize;
  };

  const updateTransform = (x: number, y: number, s: number, r: number) => {
    onTransformUpdate(itemId, {
      x: snapToGrid ? snapToGridValue(x, gridSize) : x,
      y: snapToGrid ? snapToGridValue(y, gridSize) : y,
      scale: s,
      rotation: r,
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      runOnJS(updateTransform)(translateX.value, translateY.value, scale.value, rotation.value);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      const newScale = startScale.value * event.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    })
    .onEnd(() => {
      runOnJS(updateTransform)(translateX.value, translateY.value, scale.value, rotation.value);
    });

  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      startRotation.value = rotation.value;
    })
    .onUpdate((event) => {
      rotation.value = startRotation.value + (event.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(updateTransform)(translateX.value, translateY.value, scale.value, rotation.value);
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (onSelect) {
        runOnJS(onSelect)(itemId);
      }
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture),
    tapGesture,
  );

  const imagePath = item.imageLocalPath || item.imageUrl;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.canvasItem, animatedStyle, isSelected && styles.selectedItem]}>
        {imagePath && (
          <Image source={{ uri: imagePath }} style={styles.itemImage} resizeMode="contain" />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasItem: {
    height: 100,
    position: 'absolute',
    width: 100,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  gridLine: {
    backgroundColor: '#E0E0E0',
    opacity: 0.3,
    position: 'absolute',
  },
  itemImage: {
    height: '100%',
    width: '100%',
  },
  selectedItem: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
});
