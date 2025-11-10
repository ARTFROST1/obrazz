import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Image as RNImage,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_ASPECT_RATIO = 3 / 4; // width / height
const MAX_SCALE = 5;
const TOP_INSET = 80;
const BOTTOM_INSET = 80;

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [cropping, setCropping] = useState(false);

  // Core transform values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Saved values for gesture continuity
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Image and crop dimensions
  const imageW = useSharedValue(0);
  const imageH = useSharedValue(0);
  const minScale = useSharedValue(1);
  const cropW = useSharedValue(0);
  const cropH = useSharedValue(0);

  // Load image dimensions
  React.useEffect(() => {
    if (visible && imageUri) {
      setLoading(true);
      RNImage.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
          setLoading(false);

          // Calculate crop area and initial scale
          const cropAreaWidth = SCREEN_WIDTH * 0.9;
          const cropAreaHeight = cropAreaWidth / CROP_ASPECT_RATIO;

          const scaleWidth = cropAreaWidth / width;
          const scaleHeight = cropAreaHeight / height;
          const initialScale = Math.max(scaleWidth, scaleHeight);

          // Store dimensions
          imageW.value = width;
          imageH.value = height;
          cropW.value = cropAreaWidth;
          cropH.value = cropAreaHeight;
          minScale.value = initialScale;

          // Reset transforms
          scale.value = initialScale;
          savedScale.value = initialScale;
          translateX.value = 0;
          translateY.value = 0;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        },
        (error) => {
          console.error('Error getting image size:', error);
          setLoading(false);
          Alert.alert('Error', 'Failed to load image');
        },
      );
    }
  }, [visible, imageUri]);

  // Simple clamp - no animations
  const clampTranslation = (s: number, tx: number, ty: number) => {
    'worklet';
    const scaledW = imageW.value * s;
    const scaledH = imageH.value * s;

    // Bounds: allow crop to reach image edges
    const minTx = (cropW.value - scaledW) / 2;
    const maxTx = (scaledW - cropW.value) / 2;
    const minTy = (cropH.value - scaledH) / 2;
    const maxTy = (scaledH - cropH.value) / 2;

    return {
      tx: Math.min(Math.max(tx, minTx), maxTx),
      ty: Math.min(Math.max(ty, minTy), maxTy),
    };
  };

  // Pan gesture - simple drag
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newTx = savedTranslateX.value + e.translationX;
      const newTy = savedTranslateY.value + e.translationY;
      const clamped = clampTranslation(scale.value, newTx, newTy);
      translateX.value = clamped.tx;
      translateY.value = clamped.ty;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture - simple zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      // Scale
      const newScale = savedScale.value * e.scale;
      scale.value = Math.max(minScale.value, Math.min(newScale, MAX_SCALE));

      // Focal point adjustment
      const focalX = e.focalX;
      const focalY = e.focalY - TOP_INSET;
      const centerX = SCREEN_WIDTH / 2;
      const centerY = (SCREEN_HEIGHT - TOP_INSET - BOTTOM_INSET) / 2;

      // Keep focal point fixed
      const pointX = (focalX - centerX - savedTranslateX.value) / savedScale.value;
      const pointY = (focalY - centerY - savedTranslateY.value) / savedScale.value;
      const newTx = focalX - centerX - pointX * scale.value;
      const newTy = focalY - centerY - pointY * scale.value;

      // Apply bounds instantly
      const clamped = clampTranslation(scale.value, newTx, newTy);
      translateX.value = clamped.tx;
      translateY.value = clamped.ty;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap to zoom - instant, no animation
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const targetScale =
        scale.value > minScale.value * 1.5
          ? minScale.value
          : Math.min(minScale.value * 2.5, MAX_SCALE);

      const tapX = e.x;
      const tapY = e.y - TOP_INSET;
      const centerX = SCREEN_WIDTH / 2;
      const centerY = (SCREEN_HEIGHT - TOP_INSET - BOTTOM_INSET) / 2;

      const pointX = (tapX - centerX - translateX.value) / scale.value;
      const pointY = (tapY - centerY - translateY.value) / scale.value;
      const newTx = tapX - centerX - pointX * targetScale;
      const newTy = tapY - centerY - pointY * targetScale;

      const clamped = clampTranslation(targetScale, newTx, newTy);
      scale.value = targetScale;
      translateX.value = clamped.tx;
      translateY.value = clamped.ty;
      savedScale.value = targetScale;
      savedTranslateX.value = clamped.tx;
      savedTranslateY.value = clamped.ty;
    });

  // Compose gestures - simultaneous pan and pinch, with double tap
  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const handleCrop = async () => {
    try {
      setCropping(true);

      // Calculate crop area dimensions
      const cropAreaWidth = SCREEN_WIDTH * 0.9;
      const cropAreaHeight = cropAreaWidth / CROP_ASPECT_RATIO;

      // Calculate the crop region in the original image coordinates
      const imageDisplayWidth = imageSize.width * scale.value;
      const imageDisplayHeight = imageSize.height * scale.value;

      // Center of crop area (account for top/bottom insets)
      const screenCenterX = SCREEN_WIDTH / 2;
      const screenCenterY = (SCREEN_HEIGHT - (TOP_INSET + BOTTOM_INSET)) / 2 + TOP_INSET;

      // Center of image (after transformations)
      const imageCenterX = screenCenterX + translateX.value;
      const imageCenterY = screenCenterY + translateY.value;

      // Top-left corner of crop area
      const cropAreaLeft = screenCenterX - cropAreaWidth / 2;
      const cropAreaTop = screenCenterY - cropAreaHeight / 2;

      // Top-left corner of image
      const imageLeft = imageCenterX - imageDisplayWidth / 2;
      const imageTop = imageCenterY - imageDisplayHeight / 2;

      // Calculate crop in original image coordinates
      const cropX = (cropAreaLeft - imageLeft) / scale.value;
      const cropY = (cropAreaTop - imageTop) / scale.value;
      const cropWidth = cropAreaWidth / scale.value;
      const cropHeight = cropAreaHeight / scale.value;

      // Ensure crop area is within image bounds
      const finalCropX = Math.max(0, Math.min(cropX, imageSize.width - cropWidth));
      const finalCropY = Math.max(0, Math.min(cropY, imageSize.height - cropHeight));
      const finalCropWidth = Math.min(cropWidth, imageSize.width - finalCropX);
      const finalCropHeight = Math.min(cropHeight, imageSize.height - finalCropY);

      // Perform crop
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: finalCropX,
              originY: finalCropY,
              width: finalCropWidth,
              height: finalCropHeight,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.PNG },
      );

      setCropping(false);
      onCropComplete(manipulatedImage.uri);
      resetTransforms();
    } catch (error) {
      console.error('Error cropping image:', error);
      setCropping(false);
      Alert.alert('Error', 'Failed to crop image');
    }
  };

  const handleCancel = () => {
    resetTransforms();
    onCancel();
  };

  const resetTransforms = () => {
    scale.value = minScale.value;
    savedScale.value = minScale.value;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  if (!visible) return null;

  const cropAreaWidth = SCREEN_WIDTH * 0.9;
  const cropAreaHeight = cropAreaWidth / CROP_ASPECT_RATIO;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <GestureHandlerRootView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
            <Text style={styles.headerButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Image</Text>
          <TouchableOpacity
            onPress={handleCrop}
            style={[styles.headerButton, (cropping || loading) && styles.headerButtonDisabled]}
            disabled={cropping || loading}
          >
            {cropping ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.headerButtonText}>Done</Text>
                <Ionicons name="checkmark" size={28} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Loading image...</Text>
          </View>
        ) : (
          <>
            {/* Image with gestures */}
            <View style={styles.imageContainer}>
              <GestureDetector gesture={composedGesture}>
                <Animated.Image
                  source={{ uri: imageUri }}
                  style={[
                    {
                      width: imageSize.width,
                      height: imageSize.height,
                    },
                    animatedStyle,
                  ]}
                  resizeMode="contain"
                />
              </GestureDetector>
            </View>

            {/* Dark overlay with crop area cutout */}
            <View style={styles.overlayContainer} pointerEvents="none">
              {/* Top overlay */}
              <View
                style={[
                  styles.darkOverlay,
                  { height: (SCREEN_HEIGHT - 80 - cropAreaHeight - 80) / 2 },
                ]}
              />

              <View style={{ flexDirection: 'row', height: cropAreaHeight }}>
                {/* Left overlay */}
                <View style={[styles.darkOverlay, { width: (SCREEN_WIDTH - cropAreaWidth) / 2 }]} />

                {/* Crop area - transparent with white border */}
                <View
                  style={{
                    width: cropAreaWidth,
                    height: cropAreaHeight,
                    borderWidth: 2,
                    borderColor: '#FFF',
                  }}
                >
                  {/* Corner indicators */}
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                </View>

                {/* Right overlay */}
                <View style={[styles.darkOverlay, { flex: 1 }]} />
              </View>

              {/* Bottom overlay */}
              <View style={[styles.darkOverlay, { flex: 1 }]} />
            </View>

            {/* Minimal instructions */}
            <View style={styles.instructions}>
              <View style={styles.instructionRow}>
                <Text style={styles.instructionIcon}>✋</Text>
                <Text style={styles.instructionText}>Drag</Text>
                <View style={styles.instructionDivider} />
                <Text style={styles.instructionIcon}>🤏</Text>
                <Text style={styles.instructionText}>Pinch</Text>
              </View>
            </View>
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 60,
    paddingBottom: 16,
    backgroundColor: '#000',
    zIndex: 10,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 80,
    gap: 4,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: 80,
    bottom: 80,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: 80,
    bottom: 80,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFF',
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFF',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFF',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFF',
  },
  instructions: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  instructionIcon: {
    fontSize: 20,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  instructionDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
});
