import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import type { CartItem, DetectedImage } from '@/types/models/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MasonryGallery from './MasonryGallery';

export default function GalleryBottomSheet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    detectedImages,
    selectedImageIds,
    showGallerySheet,
    toggleImageSelection,
    clearSelection,
    showGallery,
    addToCart,
    tabs,
    activeTabId,
    setHasScanned,
    startBatchUpload,
  } = useShoppingBrowserStore();

  const selectedCount = selectedImageIds.size;
  const totalCount = detectedImages.length;

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Handle close
  const handleClose = useCallback(() => {
    showGallery(false);
    clearSelection();
    // Reset hasScanned so scan button can appear again
    setHasScanned(false);
  }, [showGallery, clearSelection, setHasScanned]);

  const handleImageSelect = useCallback(
    (image: DetectedImage) => {
      toggleImageSelection(image.id);
    },
    [toggleImageSelection],
  );

  const handleAddNow = async () => {
    if (selectedCount === 0) {
      Alert.alert('Выберите вещи', 'Выберите хотя бы одну вещь для добавления');
      return;
    }

    const selectedImages = detectedImages.filter((img) => selectedImageIds.has(img.id));
    const activeTab = tabs.find((t) => t.id === activeTabId);
    const sourceUrl = activeTab?.currentUrl || '';
    const sourceName = activeTab?.shopName || 'Магазин';

    console.log('[GalleryBottomSheet] 🚀 Add Now clicked:', {
      selectedCount: selectedImages.length,
      sourceUrl,
      sourceName,
      imagesWithProductUrl: selectedImages.filter((img) => img.productUrl).length,
    });
    selectedImages.forEach((img, idx) => {
      console.log(`[GalleryBottomSheet] Image ${idx + 1}:`, {
        hasProductUrl: !!img.productUrl,
        productUrl: img.productUrl?.substring(0, 60),
      });
    });

    // Convert to CartItems
    const cartItems: CartItem[] = selectedImages.map((image) => ({
      id: `${image.id}_${Date.now()}_${Math.random()}`,
      image,
      sourceUrl,
      sourceName,
      addedAt: Date.now(),
    }));

    // Close gallery
    handleClose();

    // Start batch upload
    startBatchUpload(cartItems);

    // Navigate to first item
    router.push({
      pathname: '/add-item',
      params: {
        source: 'web',
      },
    });
  };

  const handleAddToCart = async () => {
    if (selectedCount === 0) {
      Alert.alert('Выберите вещи', 'Выберите хотя бы одну вещь для добавления в корзину');
      return;
    }

    const selectedImages = detectedImages.filter((img) => selectedImageIds.has(img.id));
    const sourceUrl = activeTab?.currentUrl || '';
    const sourceName = activeTab?.shopName || 'Магазин';

    console.log('[GalleryBottomSheet] 🛒 Add to Cart clicked:', {
      selectedCount: selectedImages.length,
      sourceUrl,
      sourceName,
    });

    await addToCart(selectedImages, sourceUrl, sourceName);

    clearSelection();

    // Close modal after adding to cart
    handleClose();
  };

  return (
    <Modal
      visible={showGallerySheet && totalCount > 0}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" />

        {/* Fixed Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Найденные вещи</Text>
            <Text style={styles.subtitle}>
              {totalCount}{' '}
              {totalCount === 1 ? 'вещь' : totalCount > 1 && totalCount < 5 ? 'вещи' : 'вещей'}
              {selectedCount > 0 && (
                <Text style={styles.selectedText}> • Выбрано: {selectedCount}</Text>
              )}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#3C3C43" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Gallery */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MasonryGallery
            images={detectedImages}
            selectedIds={selectedImageIds}
            onImageSelect={handleImageSelect}
          />
        </ScrollView>

        {/* Fixed Action Buttons */}
        <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAddNow}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Добавить сейчас</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={20} color="#000000" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>В корзину</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  selectedText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 100, // Space for fixed buttons
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonIcon: {
    marginRight: 6,
  },
  primaryButton: {
    backgroundColor: '#000000',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
