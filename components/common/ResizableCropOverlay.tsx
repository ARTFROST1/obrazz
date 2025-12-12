import React, { useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type HandleType =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

interface ResizableCropOverlayProps {
  cropSize: { width: number; height: number };
  onCropChange: (size: { width: number; height: number }) => void;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  enabled?: boolean; // Включить/выключить изменение размера
}

/**
 * Resizable crop overlay with draggable handles
 * Allows user to adjust crop frame size by dragging corners and edges
 */
export const ResizableCropOverlay: React.FC<ResizableCropOverlayProps> = ({
  cropSize,
  onCropChange,
  minSize = { width: 100, height: 100 },
  maxSize = { width: SCREEN_WIDTH * 0.95, height: SCREEN_HEIGHT * 0.8 },
  enabled = true,
}) => {
  // Shared values for animated crop size
  const width = useSharedValue(cropSize.width);
  const height = useSharedValue(cropSize.height);

  // Store initial values for gesture
  const startWidth = useRef(cropSize.width);
  const startHeight = useRef(cropSize.height);

  // Update shared values when props change
  React.useEffect(() => {
    width.value = cropSize.width;
    height.value = cropSize.height;
  }, [cropSize.width, cropSize.height, width, height]);

  /**
   * Clamp value between min and max
   */
  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.max(min, Math.min(max, value));
  };

  /**
   * Create gesture handler for a specific handle
   */
  const createHandleGesture = (handleType: HandleType) => {
    return Gesture.Pan()
      .onStart(() => {
        startWidth.current = width.value;
        startHeight.current = height.value;
      })
      .onUpdate((event) => {
        const { translationX, translationY } = event;

        let newWidth = startWidth.current;
        let newHeight = startHeight.current;

        // Calculate new dimensions based on handle type
        switch (handleType) {
          case 'top-left':
            newWidth = startWidth.current - translationX * 2;
            newHeight = startHeight.current - translationY * 2;
            break;
          case 'top-right':
            newWidth = startWidth.current + translationX * 2;
            newHeight = startHeight.current - translationY * 2;
            break;
          case 'bottom-left':
            newWidth = startWidth.current - translationX * 2;
            newHeight = startHeight.current + translationY * 2;
            break;
          case 'bottom-right':
            newWidth = startWidth.current + translationX * 2;
            newHeight = startHeight.current + translationY * 2;
            break;
          case 'top':
            newHeight = startHeight.current - translationY * 2;
            break;
          case 'bottom':
            newHeight = startHeight.current + translationY * 2;
            break;
          case 'left':
            newWidth = startWidth.current - translationX * 2;
            break;
          case 'right':
            newWidth = startWidth.current + translationX * 2;
            break;
        }

        // Clamp dimensions
        width.value = clamp(newWidth, minSize.width, maxSize.width);
        height.value = clamp(newHeight, minSize.height, maxSize.height);
      })
      .onEnd(() => {
        // Report final size to parent
        runOnJS(onCropChange)({
          width: width.value,
          height: height.value,
        });
      })
      .enabled(enabled);
  };

  // Animated style for crop frame
  const cropFrameStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
  }));

  return (
    <View style={styles.container} pointerEvents={enabled ? 'box-none' : 'none'}>
      {/* Top dark bar */}
      <View style={styles.darkBar} pointerEvents="none" />

      {/* Middle section with left bar, crop frame, right bar */}
      <View style={styles.middleSection} pointerEvents="box-none">
        <View style={styles.darkBar} pointerEvents="none" />

        {/* Crop frame - transparent area with white border */}
        <Animated.View
          style={[styles.cropFrame, cropFrameStyle]}
          pointerEvents={enabled ? 'box-none' : 'none'}
        >
          {/* Corner handles (only visible when enabled) */}
          {enabled && (
            <>
              <GestureDetector gesture={createHandleGesture('top-left')}>
                <Animated.View style={[styles.cornerHandle, styles.cornerTopLeft]}>
                  <View
                    style={[styles.cornerVisual, { borderRightWidth: 0, borderBottomWidth: 0 }]}
                  />
                </Animated.View>
              </GestureDetector>

              <GestureDetector gesture={createHandleGesture('top-right')}>
                <Animated.View style={[styles.cornerHandle, styles.cornerTopRight]}>
                  <View
                    style={[styles.cornerVisual, { borderLeftWidth: 0, borderBottomWidth: 0 }]}
                  />
                </Animated.View>
              </GestureDetector>

              <GestureDetector gesture={createHandleGesture('bottom-left')}>
                <Animated.View style={[styles.cornerHandle, styles.cornerBottomLeft]}>
                  <View style={[styles.cornerVisual, { borderRightWidth: 0, borderTopWidth: 0 }]} />
                </Animated.View>
              </GestureDetector>

              <GestureDetector gesture={createHandleGesture('bottom-right')}>
                <Animated.View style={[styles.cornerHandle, styles.cornerBottomRight]}>
                  <View style={[styles.cornerVisual, { borderLeftWidth: 0, borderTopWidth: 0 }]} />
                </Animated.View>
              </GestureDetector>

              {/* Edge handles */}
              <GestureDetector gesture={createHandleGesture('top')}>
                <Animated.View style={[styles.edgeHandle, styles.edgeHandleTop]}>
                  <View style={styles.edgeVisualHorizontal} />
                </Animated.View>
              </GestureDetector>

              <GestureDetector gesture={createHandleGesture('bottom')}>
                <Animated.View style={[styles.edgeHandle, styles.edgeHandleBottom]}>
                  <View style={styles.edgeVisualHorizontal} />
                </Animated.View>
              </GestureDetector>

              <GestureDetector gesture={createHandleGesture('left')}>
                <Animated.View style={[styles.edgeHandle, styles.edgeHandleLeft]}>
                  <View style={styles.edgeVisualVertical} />
                </Animated.View>
              </GestureDetector>

              <GestureDetector gesture={createHandleGesture('right')}>
                <Animated.View style={[styles.edgeHandle, styles.edgeHandleRight]}>
                  <View style={styles.edgeVisualVertical} />
                </Animated.View>
              </GestureDetector>
            </>
          )}
        </Animated.View>

        <View style={styles.darkBar} pointerEvents="none" />
      </View>

      {/* Bottom dark bar */}
      <View style={styles.darkBar} pointerEvents="none" />
    </View>
  );
};

const HANDLE_SIZE = 28;
const HANDLE_LINE_LENGTH = 24;
const EDGE_HANDLE_WIDTH = 50;
const EDGE_HANDLE_THICKNESS = 4;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkBar: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  cropFrame: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  // Corner handles (minimalist L-shapes with touch area)
  cornerHandle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  cornerTopLeft: {
    top: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
  },
  cornerTopRight: {
    top: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
  },
  cornerBottomLeft: {
    bottom: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
  },
  cornerBottomRight: {
    bottom: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
  },
  // Edge handles (minimalist lines with touch area)
  edgeHandle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  edgeHandleTop: {
    top: -HANDLE_SIZE / 2,
    left: '50%',
    marginLeft: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  edgeHandleBottom: {
    bottom: -HANDLE_SIZE / 2,
    left: '50%',
    marginLeft: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  edgeHandleLeft: {
    left: -HANDLE_SIZE / 2,
    top: '50%',
    marginTop: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  edgeHandleRight: {
    right: -HANDLE_SIZE / 2,
    top: '50%',
    marginTop: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  // Visual elements for handles
  handleVisual: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
  },
  cornerVisual: {
    width: HANDLE_LINE_LENGTH,
    height: HANDLE_LINE_LENGTH,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  edgeVisualHorizontal: {
    width: EDGE_HANDLE_WIDTH,
    height: EDGE_HANDLE_THICKNESS,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  edgeVisualVertical: {
    width: EDGE_HANDLE_THICKNESS,
    height: EDGE_HANDLE_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
});
