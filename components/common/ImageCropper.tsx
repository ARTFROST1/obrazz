import { Ionicons } from '@expo/vector-icons';
import { resizeToMegapixels } from '@utils/image/imageCompression';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Image as RNImage,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CropZoom, useImageResolution, type CropZoomRefType } from 'react-native-zoom-toolkit';
import { CropOverlay } from './CropOverlay';
import { ResizableCropOverlay } from './ResizableCropOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_ASPECT_RATIO = 3 / 4; // width / height

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
  const cropRef = useRef<CropZoomRefType>(null);
  const [cropping, setCropping] = useState(false);
  const [customCropSize, setCustomCropSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  // Use the library's hook to get image resolution
  const { isFetching, resolution } = useImageResolution({ uri: imageUri });

  /**
   * Calculate adaptive crop size based on image aspect ratio
   * Frame adapts to image, ensuring it fits within screen bounds
   * This allows cropping with original aspect ratio preserved
   */
  const getAdaptiveCropSize = React.useCallback(() => {
    if (!resolution) {
      // Fallback to 3:4 while loading
      return {
        width: SCREEN_WIDTH * 0.9,
        height: (SCREEN_WIDTH * 0.9) / CROP_ASPECT_RATIO,
      };
    }

    const imageAspect = resolution.width / resolution.height;
    const maxCropWidth = SCREEN_WIDTH * 0.9;
    const maxCropHeight = SCREEN_WIDTH * 1.5; // Reasonable maximum height

    let cropWidth: number;
    let cropHeight: number;

    if (imageAspect >= 1) {
      // Landscape or square: constrain by width first
      cropWidth = maxCropWidth;
      cropHeight = cropWidth / imageAspect;

      // If height exceeds max, recalculate from height
      if (cropHeight > maxCropHeight) {
        cropHeight = maxCropHeight;
        cropWidth = cropHeight * imageAspect;
      }
    } else {
      // Portrait: constrain by height first
      cropHeight = maxCropHeight;
      cropWidth = cropHeight * imageAspect;

      // If width exceeds max, recalculate from width
      if (cropWidth > maxCropWidth) {
        cropWidth = maxCropWidth;
        cropHeight = cropWidth / imageAspect;
      }
    }

    const adaptiveCropSize = {
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    };

    console.log('[ImageCropper] Calculated adaptive crop size:', {
      imageResolution: resolution,
      imageAspect: imageAspect.toFixed(3),
      adaptiveCropSize,
      explanation: 'Frame adapts to image aspect ratio',
    });

    return adaptiveCropSize;
  }, [resolution]);

  // Use custom size if set, otherwise use adaptive size
  const cropSize = customCropSize || getAdaptiveCropSize();

  // Final output size - always 3:4 for consistency
  const FINAL_OUTPUT_SIZE = {
    width: SCREEN_WIDTH * 0.9,
    height: (SCREEN_WIDTH * 0.9) / CROP_ASPECT_RATIO,
  };

  /**
   * Calculate maxScale to allow sufficient zoom beyond COVER
   * Library default maxScale prevents pixelation, but we want more freedom
   */
  const calculateMaxScale = React.useCallback(() => {
    if (!resolution) return undefined;

    // Allow zooming up to 3x from the minimum (CONTAIN) position
    // This gives plenty of room for detail work while avoiding extreme pixelation
    const maxScale = 3.0;

    console.log('[ImageCropper] Calculated maxScale:', {
      resolution,
      maxScale,
    });

    return maxScale;
  }, [resolution]);

  const maxScale = calculateMaxScale();

  // Handle crop size change from resizable overlay
  const handleCropSizeChange = (newSize: { width: number; height: number }) => {
    console.log('[ImageCropper] Crop size changed:', newSize);
    setCustomCropSize(newSize);
  };

  // Render overlay function - only for CropZoom (static overlay)
  const renderOverlay = () => {
    // Always render static overlay for CropZoom
    return <CropOverlay cropSize={cropSize} />;
  };

  /**
   * Resize image to fit inside the crop frame using CONTAIN behavior
   * This ensures the image is never larger than the target size
   */
  const resizeToFitCropFrame = async (
    imageUri: string,
    targetSize: { width: number; height: number },
  ): Promise<string> => {
    try {
      console.log('[ImageCropper] Checking if resize is needed...');

      // Get actual cropped image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 1.0,
        format: ImageManipulator.SaveFormat.PNG,
      });

      const imageWidth = imageInfo.width;
      const imageHeight = imageInfo.height;
      const targetWidth = Math.round(targetSize.width);
      const targetHeight = Math.round(targetSize.height);

      console.log('[ImageCropper] Image dimensions:', { width: imageWidth, height: imageHeight });
      console.log('[ImageCropper] Target dimensions:', {
        width: targetWidth,
        height: targetHeight,
      });

      // Check if image is larger than target (needs to be scaled down)
      const needsResize = imageWidth > targetWidth || imageHeight > targetHeight;

      if (!needsResize) {
        console.log('[ImageCropper] No resize needed - image fits in target size');
        return imageUri;
      }

      // Calculate scale to fit inside target (CONTAIN behavior)
      const widthScale = targetWidth / imageWidth;
      const heightScale = targetHeight / imageHeight;
      const scale = Math.min(widthScale, heightScale); // Use min to ensure it fits

      const newWidth = Math.round(imageWidth * scale);
      const newHeight = Math.round(imageHeight * scale);

      console.log('[ImageCropper] Resizing image:', {
        originalSize: { width: imageWidth, height: imageHeight },
        scale,
        newSize: { width: newWidth, height: newHeight },
      });

      // Resize the image to fit inside target
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: newWidth,
              height: newHeight,
            },
          },
        ],
        {
          compress: 1.0,
          format: ImageManipulator.SaveFormat.PNG,
        },
      );

      console.log('[ImageCropper] Image resized successfully:', result.uri);
      return result.uri;
    } catch (error) {
      console.error('[ImageCropper] Error resizing image:', error);
      console.warn('[ImageCropper] Falling back to original cropped image');
      return imageUri;
    }
  };

  /**
   * Add white background to image if it doesn't fill the target size
   * This ensures all wardrobe items are exactly 3:4 aspect ratio without cropping content
   */
  const addWhiteBackgroundIfNeeded = async (
    imageUri: string,
    targetSize: { width: number; height: number },
  ): Promise<string> => {
    try {
      console.log('[ImageCropper] Checking if white background is needed...');

      // Get actual cropped image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 1.0,
        format: ImageManipulator.SaveFormat.PNG,
      });

      const imageWidth = imageInfo.width;
      const imageHeight = imageInfo.height;

      // Calculate target dimensions (3:4 aspect ratio)
      const targetWidth = Math.round(targetSize.width);
      const targetHeight = Math.round(targetSize.height);

      console.log('[ImageCropper] Image dimensions:', { width: imageWidth, height: imageHeight });
      console.log('[ImageCropper] Target dimensions:', {
        width: targetWidth,
        height: targetHeight,
      });

      // Check if letterboxing is needed
      const needsLetterboxing = imageWidth < targetWidth || imageHeight < targetHeight;

      if (!needsLetterboxing) {
        console.log('[ImageCropper] No letterboxing needed - image fills target size');
        return imageUri;
      }

      // Calculate centering offsets
      const originX = Math.max(0, Math.round((targetWidth - imageWidth) / 2));
      const originY = Math.max(0, Math.round((targetHeight - imageHeight) / 2));

      console.log('[ImageCropper] Adding white background letterboxing:', {
        imageSize: { width: imageWidth, height: imageHeight },
        targetSize: { width: targetWidth, height: targetHeight },
        offset: { x: originX, y: originY },
      });

      // Use extent action to add white background
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            extent: {
              originX: originX,
              originY: originY,
              width: targetWidth,
              height: targetHeight,
              backgroundColor: '#FFFFFF', // White background for letterboxing
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.PNG,
        },
      );

      console.log('[ImageCropper] White background added successfully:', result.uri);
      return result.uri;
    } catch (error) {
      console.error('[ImageCropper] Error adding white background:', error);
      console.warn('[ImageCropper] Falling back to original cropped image');
      // Return original image if letterboxing fails
      return imageUri;
    }
  };

  const handleCrop = async () => {
    if (!cropRef.current || !resolution) return;

    try {
      setCropping(true);

      // Get crop context from the library
      const cropResult = cropRef.current.crop();
      if (!cropResult) {
        Alert.alert('Error', 'Failed to get crop data');
        setCropping(false);
        return;
      }

      console.log('[ImageCropper] Crop result:', cropResult);

      // Build actions array following the required order
      const actions: ImageManipulator.Action[] = [];

      // 1. Resize (if needed)
      if (cropResult.resize) {
        actions.push({ resize: cropResult.resize });
      }

      // 2. Flip horizontal (if needed)
      if (cropResult.context.flipHorizontal) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      // 3. Flip vertical (if needed)
      if (cropResult.context.flipVertical) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }

      // 4. Rotate (if needed)
      if (cropResult.context.rotationAngle !== 0) {
        actions.push({ rotate: cropResult.context.rotationAngle });
      }

      // 5. Crop (always required)
      actions.push({ crop: cropResult.crop });

      console.log('[ImageCropper] Performing crop with actions:', actions.length);

      // Perform the crop with all transformations (use high quality for intermediate step)
      const croppedImage = await ImageManipulator.manipulateAsync(imageUri, actions, {
        compress: 1.0, // No compression for intermediate step
        format: ImageManipulator.SaveFormat.PNG,
      });

      console.log('[ImageCropper] Crop completed, resizing to fit if needed...');

      // Determine target size: use custom crop size if set, otherwise default to 3:4
      const targetSize = customCropSize || FINAL_OUTPUT_SIZE;

      console.log('[ImageCropper] Target output size:', targetSize);

      // Step 1: Resize image to fit inside target frame (CONTAIN behavior)
      // Cropped image has original aspect ratio, resize to fit target output
      const resizedImage = await resizeToFitCropFrame(croppedImage.uri, targetSize);

      console.log('[ImageCropper] Resize complete, adding white background if needed...');

      // Step 2: Add white background letterboxing to achieve target size
      // Resized image (with original aspect) is centered on target canvas
      const finalImage = await addWhiteBackgroundIfNeeded(resizedImage, targetSize);

      console.log('[ImageCropper] Final image ready, resizing to 1MP...');

      // Step 3: Resize to 1MP (megapixels) to optimize for quality and API costs
      // This ensures consistent quality regardless of image complexity or aspect ratio
      const resizeResult = await resizeToMegapixels(finalImage, {
        targetMegapixels: 1.0, // 1MP - optimal for wardrobe items
        quality: 0.85, // High quality JPEG
      });

      console.log('[ImageCropper] Resize to 1MP complete:', {
        dimensions: `${resizeResult.resizedWidth}x${resizeResult.resizedHeight}`,
        megapixels: resizeResult.resizedMegapixels.toFixed(2) + 'MP',
        fileSize: (resizeResult.compressedSize / 1024).toFixed(2) + 'KB',
      });

      setCropping(false);
      onCropComplete(resizeResult.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
      setCropping(false);
      Alert.alert('Error', 'Failed to crop image');
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  if (!visible) return null;

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
            style={[styles.headerButton, (cropping || isFetching) && styles.headerButtonDisabled]}
            disabled={cropping || isFetching}
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

        {/* Loading state */}
        {isFetching || !resolution ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Loading image...</Text>
          </View>
        ) : (
          /* CropZoom component with image */
          <View style={{ flex: 1 }}>
            {/* CropZoom layer - always active for zoom/pan */}
            <CropZoom
              ref={cropRef}
              cropSize={cropSize}
              resolution={resolution}
              maxScale={maxScale}
              OverlayComponent={renderOverlay}
              panMode="clamp"
              scaleMode="bounce"
            >
              <RNImage
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMethod="scale"
              />
            </CropZoom>

            {/* Resizable overlay - rendered as separate layer ABOVE CropZoom */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <ResizableCropOverlay
                cropSize={cropSize}
                onCropChange={handleCropSizeChange}
                enabled={true}
              />
            </View>
          </View>
        )}

        {/* Instructions */}
        {!isFetching && resolution && (
          <View style={styles.instructions}>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionIcon}>🤏</Text>
              <Text style={styles.instructionText}>Pinch to Zoom</Text>
              <View style={styles.instructionDivider} />
              <Text style={styles.instructionIcon}>✋</Text>
              <Text style={styles.instructionText}>Drag Corners</Text>
            </View>
          </View>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 60,
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
  instructions: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
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
