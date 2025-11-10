import React, { useRef, useState } from 'react';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { CropZoom, useImageResolution, type CropZoomRefType } from 'react-native-zoom-toolkit';
import { CropOverlay } from './CropOverlay';

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

  // Use the library's hook to get image resolution
  const { isFetching, resolution } = useImageResolution({ uri: imageUri });

  // Calculate crop size (3:4 aspect ratio, 90% of screen width)
  const cropSize = {
    width: SCREEN_WIDTH * 0.9,
    height: (SCREEN_WIDTH * 0.9) / CROP_ASPECT_RATIO,
  };

  // Render overlay function
  const renderOverlay = () => <CropOverlay cropSize={cropSize} />;

  const handleCrop = async () => {
    if (!cropRef.current) return;

    try {
      setCropping(true);

      // Get crop context from the library
      const cropResult = cropRef.current.crop();
      if (!cropResult) {
        Alert.alert('Error', 'Failed to get crop data');
        setCropping(false);
        return;
      }

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

      // Perform the crop with all transformations
      const manipulatedImage = await ImageManipulator.manipulateAsync(imageUri, actions, {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.PNG,
      });

      setCropping(false);
      onCropComplete(manipulatedImage.uri);
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
          <CropZoom
            ref={cropRef}
            cropSize={cropSize}
            resolution={resolution}
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
        )}

        {/* Instructions */}
        {!isFetching && resolution && (
          <View style={styles.instructions}>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionIcon}>✋</Text>
              <Text style={styles.instructionText}>Drag</Text>
              <View style={styles.instructionDivider} />
              <Text style={styles.instructionIcon}>🤏</Text>
              <Text style={styles.instructionText}>Pinch to Zoom</Text>
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
