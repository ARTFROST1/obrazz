import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import type { CartItem, DetectedImage } from '@/types/models/store';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MasonryGallery from './MasonryGallery';

export default function GalleryBottomSheet() {
  const bottomSheetRef = useRef<BottomSheet>(null);
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

  // Snap points: 35%, 65%, 85% экрана (не перекрываем верх)
  const snapPoints = useMemo(() => ['35%', '65%', '85%'], []);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Handle backdrop press to close
  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    showGallery(false);
    clearSelection();
    // Reset hasScanned so scan button can appear again
    setHasScanned(false);
  }, [showGallery, clearSelection, setHasScanned]);

  // Custom backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Custom handle component - включает indicator + header
  const renderHandle = useCallback(
    (props: any) => (
      <View>
        {/* Indicator */}
        <View style={styles.handleContainer}>
          <View style={styles.indicator} />
        </View>
        {/* Header - draggable area */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>🎯 Найденные вещи</Text>
            <Text style={styles.subtitle}>
              Выбрано: {selectedCount} из {totalCount}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [selectedCount, totalCount, handleClose],
  );

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

    await addToCart(selectedImages, sourceUrl, sourceName);

    clearSelection();

    Alert.alert(
      'Добавлено в корзину',
      `${selectedCount} ${selectedCount === 1 ? 'вещь добавлена' : 'вещи добавлено'} в корзину`,
    );
  };

  // Open sheet when showGallerySheet becomes true
  React.useEffect(() => {
    if (showGallerySheet && totalCount > 0) {
      bottomSheetRef.current?.snapToIndex(1); // Open to 65%
    } else if (!showGallerySheet) {
      // Only close when explicitly hidden, not when waiting for images
      bottomSheetRef.current?.close();
    }
  }, [showGallerySheet, totalCount]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // Start closed
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      onClose={handleClose}
      backgroundStyle={styles.background}
      bottomInset={insets.bottom}
      topInset={insets.top + 60} // Отступ сверху чтобы не перекрывать элементы
      detached={false}
      enableContentPanningGesture={false} // Отключаем закрытие при скролле контента
      activeOffsetY={[-5, 5]} // Только handle может закрыть
    >
      <View style={styles.container}>
        {/* Scrollable Gallery */}
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 80 + Math.max(insets.bottom, 16) }, // Space for fixed buttons
          ]}
          showsVerticalScrollIndicator={false}
        >
          <MasonryGallery
            images={detectedImages}
            selectedIds={selectedImageIds}
            onImageSelect={handleImageSelect}
          />
        </BottomSheetScrollView>

        {/* Fixed Action Buttons */}
        <View
          style={[
            styles.actionsContainer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAddNow}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Добавить сейчас</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>В корзину</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  indicator: {
    backgroundColor: '#D1D1D6',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    marginLeft: 12,
  },
  closeIcon: {
    fontSize: 20,
    color: '#3C3C43',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#000000',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
