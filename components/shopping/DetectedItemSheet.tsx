import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DetectedItemSheet() {
  const router = useRouter();

  const { detectedImages, selectedImage, showDetectedSheet, selectImage, showDetectionSheet } =
    useShoppingBrowserStore();

  const imageToShow = selectedImage || detectedImages[0];

  const handleAddToWardrobe = async () => {
    if (!imageToShow) return;

    // Close sheet
    showDetectionSheet(false);

    // Navigate to add item screen with image URL
    router.push({
      pathname: '/add-item',
      params: {
        imageUrl: imageToShow.url,
        source: 'web',
      },
    });
  };

  const handleManualCrop = async () => {
    if (!imageToShow) return;

    // Close sheet
    showDetectionSheet(false);

    // Navigate to add item screen with manual crop mode
    router.push({
      pathname: '/add-item',
      params: {
        imageUrl: imageToShow.url,
        source: 'web',
        manualCrop: 'true',
      },
    });
  };

  if (!showDetectedSheet || !imageToShow) {
    return null;
  }

  return (
    <Modal
      visible={showDetectedSheet}
      transparent
      animationType="slide"
      onRequestClose={() => showDetectionSheet(false)}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => showDetectionSheet(false)}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.bottomSheet}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.title}>🎯 Обнаружена вещь</Text>

              {/* Image Preview & Info */}
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: imageToShow.url }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                <View style={styles.infoContainer}>
                  {imageToShow.category && (
                    <Text style={styles.categoryText}>{imageToShow.category}</Text>
                  )}

                  {imageToShow.confidence && (
                    <Text style={styles.confidenceText}>
                      Вероятность: {Math.round(imageToShow.confidence * 100)}%
                    </Text>
                  )}

                  <Text style={styles.dimensionsText}>
                    {imageToShow.width} × {imageToShow.height} px
                  </Text>
                </View>
              </View>

              {/* Additional Images */}
              {detectedImages.length > 1 && (
                <View style={styles.additionalImagesContainer}>
                  <Text style={styles.additionalImagesTitle}>
                    Найдено ещё {detectedImages.length - 1}{' '}
                    {detectedImages.length - 1 === 1 ? 'вещь' : 'вещи'}
                  </Text>
                  <View style={styles.thumbnailsContainer}>
                    {detectedImages.slice(1, 4).map((img, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => selectImage(img)}
                        style={styles.thumbnail}
                      >
                        <Image source={{ uri: img.url }} style={styles.thumbnailImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <TouchableOpacity style={styles.primaryButton} onPress={handleAddToWardrobe}>
                <Text style={styles.primaryButtonText}>➕ Добавить в гардероб</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleManualCrop}>
                <Text style={styles.secondaryButtonText}>✏️ Выбрать область вручную</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    backgroundColor: '#C4C4C4',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  previewImage: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 160,
    width: 120,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  categoryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  confidenceText: {
    color: '#666666',
    fontSize: 13,
    marginBottom: 4,
  },
  dimensionsText: {
    color: '#999999',
    fontSize: 12,
  },
  additionalImagesContainer: {
    marginBottom: 16,
  },
  additionalImagesTitle: {
    color: '#666666',
    fontSize: 13,
    marginBottom: 8,
  },
  thumbnailsContainer: {
    flexDirection: 'row',
  },
  thumbnail: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    height: 60,
    marginRight: 8,
    overflow: 'hidden',
    width: 60,
  },
  thumbnailImage: {
    height: 60,
    width: 60,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
});
