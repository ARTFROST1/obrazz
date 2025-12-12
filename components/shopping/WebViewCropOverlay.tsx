import { ResizableCropOverlay } from '@/components/common/ResizableCropOverlay';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_CROP_SIZE = {
  width: SCREEN_WIDTH * 0.7,
  height: SCREEN_WIDTH * 0.7 * (4 / 3), // 3:4 aspect ratio
};

interface WebViewCropOverlayProps {
  visible: boolean;
  viewShotRef: React.RefObject<View | null>;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

/**
 * Overlay component for capturing and cropping WebView content
 * 1. Takes screenshot of WebView container
 * 2. Shows screenshot with resizable crop overlay
 * 3. Crops selected area and returns result
 */
export default function WebViewCropOverlay({
  visible,
  viewShotRef,
  onCropComplete,
  onCancel,
}: WebViewCropOverlayProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [cropSize, setCropSize] = useState(DEFAULT_CROP_SIZE);

  // Capture screenshot when modal opens
  React.useEffect(() => {
    if (visible && !screenshot && viewShotRef.current) {
      captureWebViewScreenshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!visible) {
      setScreenshot(null);
      setCropSize(DEFAULT_CROP_SIZE);
    }
  }, [visible]);

  const captureWebViewScreenshot = async () => {
    if (!viewShotRef.current) {
      console.error('[WebViewCropOverlay] ViewShot ref is null');
      return;
    }

    try {
      setCapturing(true);
      console.log('[WebViewCropOverlay] Capturing screenshot...');

      // Capture screenshot using react-native-view-shot
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      console.log('[WebViewCropOverlay] Screenshot captured:', uri.substring(0, 50));
      setScreenshot(uri);
      setCapturing(false);
    } catch (error) {
      console.error('[WebViewCropOverlay] Error capturing screenshot:', error);
      setCapturing(false);
      alert('Не удалось сделать скриншот страницы');
      onCancel();
    }
  };

  const handleCrop = async () => {
    if (!screenshot) {
      console.error('[WebViewCropOverlay] No screenshot available');
      return;
    }

    try {
      setCropping(true);
      console.log('[WebViewCropOverlay] Starting crop with size:', cropSize);

      // Calculate crop position (centered)
      const cropX = (SCREEN_WIDTH - cropSize.width) / 2;
      const cropY = (SCREEN_HEIGHT - cropSize.height) / 2;

      // Get image dimensions
      const imageInfo = await new Promise<{ width: number; height: number }>((resolve) => {
        Image.getSize(
          screenshot,
          (width, height) => resolve({ width, height }),
          (error) => {
            console.error('[WebViewCropOverlay] Error getting image size:', error);
            resolve({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
          },
        );
      });

      console.log('[WebViewCropOverlay] Image dimensions:', imageInfo);

      // Calculate crop area in image coordinates
      const scaleX = imageInfo.width / SCREEN_WIDTH;
      const scaleY = imageInfo.height / SCREEN_HEIGHT;

      const cropConfig = {
        originX: cropX * scaleX,
        originY: cropY * scaleY,
        width: cropSize.width * scaleX,
        height: cropSize.height * scaleY,
      };

      console.log('[WebViewCropOverlay] Crop config:', cropConfig);

      // Perform crop
      const result = await ImageManipulator.manipulateAsync(
        screenshot,
        [
          {
            crop: cropConfig,
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      console.log('[WebViewCropOverlay] Crop complete:', result.uri);
      onCropComplete(result.uri);
    } catch (error) {
      console.error('[WebViewCropOverlay] Error cropping image:', error);
      alert('Ошибка при обрезке изображения');
    } finally {
      setCropping(false);
    }
  };

  const handleCancel = () => {
    setScreenshot(null);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Screenshot background */}
        {screenshot && (
          <Image source={{ uri: screenshot }} style={styles.screenshot} resizeMode="cover" />
        )}

        {/* Loading state */}
        {(capturing || cropping) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>{capturing ? 'Захват экрана...' : 'Обрезка...'}</Text>
          </View>
        )}

        {/* Crop overlay (only show when screenshot is ready) */}
        {screenshot && !capturing && !cropping && (
          <>
            <ResizableCropOverlay
              cropSize={cropSize}
              onCropChange={setCropSize}
              enabled={true}
              minSize={{ width: 150, height: 150 }}
              maxSize={{ width: SCREEN_WIDTH * 0.95, height: SCREEN_HEIGHT * 0.8 }}
            />

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Перетащите углы рамки, чтобы выбрать область
              </Text>
            </View>

            {/* Bottom buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cropButton} onPress={handleCrop}>
                <Text style={styles.cropButtonText}>Обрезать</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenshot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  instructionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cropButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#34C759',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cropButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
