/**
 * AddItemContent - Reusable component for adding/editing wardrobe items
 *
 * This component contains all the logic from add-item.tsx but accepts
 * an optional returnRoute prop for custom navigation behavior.
 *
 * Used by:
 * - app/add-item.tsx (standalone route)
 * - app/(tabs)/add.tsx (embedded in tab navigation)
 */

import { ItemCategory } from '@/types/models/item';
import { Season, StyleTag } from '@/types/models/user';
import { ImageCropper } from '@components/common/ImageCropper';
import { KeyboardAwareScrollView } from '@components/common/KeyboardAwareScrollView';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { CategoryGridPicker } from '@components/wardrobe/CategoryGridPicker';
import { ColorPicker } from '@components/wardrobe/ColorPicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { backgroundRemoverService } from '@services/wardrobe/backgroundRemover';
import { itemServiceOffline } from '@services/wardrobe/itemServiceOffline';
import { useAuthStore } from '@store/auth/authStore';
import { useShoppingBrowserStore } from '@store/shoppingBrowserStore';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface AddItemContentProps {
  // Route params (passed from parent or useLocalSearchParams)
  itemId?: string;
  webImageUrl?: string;
  webSourceUrl?: string;
  webSourceName?: string;
  imageSource?: 'web' | 'web_capture_manual' | 'camera' | 'gallery';
  manualCrop?: string;
  // Custom navigation
  returnRoute?: string;
}

export function AddItemContent({
  itemId,
  webImageUrl,
  webSourceUrl,
  webSourceName,
  imageSource,
  manualCrop: manualCropParam,
  returnRoute,
}: AddItemContentProps) {
  const { t } = useTranslation('wardrobe');
  const { user } = useAuthStore();

  // Navigation helper - uses returnRoute if provided, otherwise router.back()
  const navigateBack = useCallback(() => {
    if (returnRoute) {
      router.navigate(returnRoute as any);
    } else {
      router.back();
    }
  }, [returnRoute]);

  // Batch processing state
  const {
    isBatchMode,
    batchQueue,
    currentBatchIndex,
    getNextBatchItem,
    completeBatchItem,
    cancelBatchUpload,
  } = useShoppingBrowserStore();

  const isEditMode = !!itemId;
  const isWebSource = imageSource === 'web' || imageSource === 'web_capture_manual' || isBatchMode;
  const isFromWeb = isWebSource && !!webImageUrl;

  const isHttpUrl = (url?: string) => (typeof url === 'string' ? /^https?:\/\//i.test(url) : false);

  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingItem, setLoadingItem] = useState(isEditMode);
  const [originalItem, setOriginalItem] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showEditCropper, setShowEditCropper] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('tops');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemovalMethod, setBgRemovalMethod] = useState<'apple-vision' | 'pixian' | null>(null);
  const [currentBatchItemId, setCurrentBatchItemId] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);

  const STYLES: { label: string; value: StyleTag; sticker: string }[] = [
    { label: t('categories:styles.casual'), value: 'casual', sticker: '👕' },
    { label: t('categories:styles.classic'), value: 'classic', sticker: '🎩' },
    { label: t('categories:styles.sport'), value: 'sport', sticker: '⚽' },
    { label: t('categories:styles.minimalism'), value: 'minimalism', sticker: '⬜' },
    { label: t('categories:styles.old_money'), value: 'old_money', sticker: '💎' },
    { label: t('categories:styles.scandi'), value: 'scandi', sticker: '🌿' },
    { label: t('categories:styles.indie'), value: 'indie', sticker: '🎸' },
    { label: t('categories:styles.y2k'), value: 'y2k', sticker: '💿' },
    { label: t('categories:styles.star'), value: 'star', sticker: '⭐' },
    { label: t('categories:styles.alt'), value: 'alt', sticker: '🖤' },
    { label: t('categories:styles.cottagecore'), value: 'cottagecore', sticker: '🌻' },
    { label: t('categories:styles.downtown'), value: 'downtown', sticker: '🏙️' },
  ];

  const SEASONS: { label: string; value: Season; sticker: string }[] = [
    { label: t('categories:seasons.spring'), value: 'spring', sticker: '🌸' },
    { label: t('categories:seasons.summer'), value: 'summer', sticker: '☀️' },
    { label: t('categories:seasons.fall'), value: 'fall', sticker: '🍂' },
    { label: t('categories:seasons.winter'), value: 'winter', sticker: '❄️' },
  ];

  const loadItemData = useCallback(async () => {
    try {
      setLoadingItem(true);
      const item = await itemServiceOffline.getItemById(itemId!);

      if (!item) {
        Alert.alert(t('common:states.error'), t('addItem.loadItemError'));
        navigateBack();
        return;
      }

      setOriginalItem(item);
      setImageUri(item.imageLocalPath || item.imageUrl || null);
      setTitle(item.title || '');
      setCategory(item.category);
      setSelectedColors(item.colors?.map((c) => c.hex) || []);
      setSelectedStyles(item.styles || []);
      setSelectedSeasons(item.seasons || []);
      setBrand(item.brand || '');
      setSize(item.size || '');
      setPrice(item.price ? String(item.price) : '');
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert(t('common:states.error'), t('addItem.loadItemError'));
      navigateBack();
    } finally {
      setLoadingItem(false);
    }
  }, [itemId, t, navigateBack]);

  const handleWebCaptureImage = useCallback(
    async (imageUrl: string, needsCropping: boolean) => {
      try {
        setDownloadingImage(true);
        setLoading(true);

        const { downloadImageFromUrl } = await import('@/services/shopping/webCaptureService');
        const localUri = await downloadImageFromUrl(imageUrl);

        console.log('[AddItemContent] Web image downloaded and compressed:', localUri);

        if (needsCropping) {
          setTempImageUri(localUri);
          setShowCropper(true);
          setLoading(false);
          setDownloadingImage(false);
        } else {
          setImageUri(localUri);
          setLoading(false);
          setDownloadingImage(false);
        }
      } catch (error) {
        console.error('[AddItemContent] Error handling web capture image:', error);
        Alert.alert(t('common:states.error'), 'Не удалось загрузить изображение из браузера');
        setLoading(false);
        setDownloadingImage(false);
      }
    },
    [t],
  );

  useEffect(() => {
    console.log(
      '[AddItemContent] Mount - isEditMode:',
      isEditMode,
      'isFromWeb:',
      isFromWeb,
      'isBatchMode:',
      isBatchMode,
    );

    if (isEditMode && itemId) {
      loadItemData();
    } else if (isFromWeb && webImageUrl) {
      if (webSourceName && !brand) {
        setBrand(webSourceName);
      }
      handleWebCaptureImage(webImageUrl, manualCropParam === 'true');
    } else if (!webImageUrl && isBatchMode) {
      const batchItem = getNextBatchItem();
      if (batchItem) {
        setStep(1);
        setImageUri(null);
        setTitle('');
        setCategory('tops');
        setSelectedColors([]);
        setSelectedStyles([]);
        setSelectedSeasons([]);
        setBrand(batchItem.sourceName || '');
        setSize('');
        setPrice('');

        let cleanUrl = batchItem.image.url;
        if (typeof cleanUrl === 'string') {
          cleanUrl = cleanUrl.replace(/^Optional\(["'](.+)["']\)$/, '$1');
          cleanUrl = cleanUrl.replace(/^["']|["']$/g, '');
        }

        handleWebCaptureImage(cleanUrl, false);
        setCurrentBatchItemId(batchItem.id);
      }
    }
  }, [
    isEditMode,
    itemId,
    loadItemData,
    isFromWeb,
    webImageUrl,
    manualCropParam,
    handleWebCaptureImage,
    isBatchMode,
    getNextBatchItem,
    batchQueue.length,
    currentBatchIndex,
    brand,
    webSourceName,
  ]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(t('addItem.permissionsRequired'), t('addItem.permissionsMessage'));
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        setTempImageUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common:states.error'), t('addItem.photoError'));
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        setTempImageUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common:states.error'), t('addItem.pickImageError'));
    }
  };

  const handleImageAction = () => {
    Alert.alert(
      t('addItem.selectPhoto'),
      t('addItem.chooseOption'),
      [
        { text: t('addItem.takePhoto'), onPress: handleTakePhoto },
        { text: t('addItem.chooseFromGallery'), onPress: handlePickImage },
        { text: t('common:buttons.cancel'), style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  const handleCropComplete = (croppedUri: string) => {
    setImageUri(croppedUri);
    setShowCropper(false);
    setTempImageUri(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUri(null);
  };

  const handleRemoveBackground = async () => {
    if (!imageUri) return;

    const method = await backgroundRemoverService.getRemovalMethod();
    setBgRemovalMethod(method);

    if (method === 'pixian' && !backgroundRemoverService.isConfigured()) {
      Alert.alert(
        'Feature Not Available',
        'Background removal requires an API key. This feature will be available soon.',
      );
      return;
    }

    try {
      setRemovingBg(true);
      const processedUri = await backgroundRemoverService.removeBackground(imageUri);
      console.log('Background removed, updating URI:', processedUri);
      setImageUri(processedUri);
    } catch (error) {
      console.error('Error removing background:', error);
      Alert.alert(t('common:states.error'), t('addItem.bgRemovalError'));
    } finally {
      setRemovingBg(false);
    }
  };

  const handleCropImage = () => {
    if (!imageUri) return;
    setShowEditCropper(true);
  };

  const handleEditCropComplete = (croppedUri: string) => {
    setImageUri(croppedUri);
    setShowEditCropper(false);
  };

  const handleEditCropCancel = () => {
    setShowEditCropper(false);
  };

  const handleCategorySelect = (selectedCategory: ItemCategory) => {
    setCategory(selectedCategory);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const handleStyleSelect = (style: StyleTag) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const handleSeasonSelect = (season: Season) => {
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season],
    );
  };

  const handleNext = () => {
    if (!imageUri) {
      Alert.alert(t('common:states.error'), t('addItem.imageRequired'));
      return;
    }
    if (selectedColors.length === 0) {
      Alert.alert(
        t('common:states.error'),
        t('addItem.colorLabel') + ' ' + t('common:states.error'),
      );
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!user?.id && !isEditMode) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (selectedColors.length === 0) {
      Alert.alert(t('common:states.error'), 'Please select at least one color for this item', [
        { text: 'OK' },
      ]);
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        const titleTrimmed = title.trim();
        const originalTitleTrimmed = String(originalItem?.title ?? '').trim();
        const isTitleChanged = titleTrimmed !== originalTitleTrimmed;

        const updateData: any = {
          category,
          colors: selectedColors.map((hex) => ({ hex })),
          primaryColor: { hex: selectedColors[0] },
          styles: selectedStyles,
          seasons: selectedSeasons,
          brand: brand || undefined,
          size: size || undefined,
          price: price ? parseFloat(price) : undefined,
        };

        if (isTitleChanged) {
          updateData.title = titleTrimmed.length > 0 ? titleTrimmed : undefined;
        }

        if (
          imageUri &&
          imageUri !== originalItem?.imageLocalPath &&
          imageUri !== originalItem?.imageUrl
        ) {
          updateData.imageUri = imageUri;
        }

        await itemServiceOffline.updateItem(itemId!, updateData);
      } else {
        if (!user?.id) {
          Alert.alert('Error', 'User not found');
          return;
        }

        let finalSourceUrl: string | undefined = undefined;

        if (isHttpUrl(webSourceUrl)) {
          finalSourceUrl = webSourceUrl;
        } else if (isHttpUrl(webImageUrl)) {
          finalSourceUrl = webImageUrl;
        }

        if (isBatchMode) {
          const batchItem = batchQueue[currentBatchIndex];
          if (batchItem?.image?.productUrl) {
            finalSourceUrl = batchItem.image.productUrl;
          } else if (batchItem?.sourceUrl) {
            finalSourceUrl = batchItem.sourceUrl;
          }
        }

        const itemMetadata = {
          source: imageSource || 'camera',
          sourceUrl: isWebSource ? finalSourceUrl : undefined,
        };

        await itemServiceOffline.createItem({
          userId: user.id,
          title: title || undefined,
          category,
          colors: selectedColors.map((hex) => ({ hex })),
          primaryColor: { hex: selectedColors[0] },
          styles: selectedStyles,
          seasons: selectedSeasons,
          imageUri: imageUri!,
          brand: brand || undefined,
          size: size || undefined,
          price: price ? parseFloat(price) : undefined,
          metadata: itemMetadata,
        });
      }

      if (isBatchMode && currentBatchItemId) {
        await completeBatchItem(currentBatchItemId);
        const nextItem = getNextBatchItem();

        if (nextItem) {
          router.replace({
            pathname: '/add-item',
            params: { source: 'web' },
          });
          return;
        }
      }

      navigateBack();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'save'} item`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (step === 1) {
      if (isBatchMode && batchQueue.length > 1) {
        Alert.alert(
          'Выйти из добавления?',
          `Осталось ${batchQueue.length - currentBatchIndex} вещей. Вы уверены?`,
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Выйти',
              style: 'destructive',
              onPress: () => {
                cancelBatchUpload();
                navigateBack();
              },
            },
          ],
        );
      } else {
        navigateBack();
      }
    } else {
      setStep(1);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.imageSection}>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              key={imageUri}
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : downloadingImage ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.downloadingText}>Загрузка изображения...</Text>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#CCC" />
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          {!isBatchMode && !isFromWeb && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleImageAction}>
              <Ionicons name={imageUri ? 'camera-reverse' : 'camera'} size={20} color="#FFF" />
              <Text style={styles.addPhotoButtonText}>
                {imageUri ? t('common:buttons.edit') : t('addItem.selectPhoto')}
              </Text>
            </TouchableOpacity>
          )}

          {imageUri && (
            <TouchableOpacity
              style={[styles.addPhotoButton, removingBg && styles.disabledButton]}
              onPress={handleRemoveBackground}
              disabled={removingBg}
            >
              {removingBg ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                  <Text style={styles.addPhotoButtonText}>
                    {t('addItem.removeBg')}
                    {bgRemovalMethod === 'apple-vision' && ' ✨'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {imageUri && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleCropImage}>
              <Ionicons name="crop" size={18} color="#FFF" />
              <Text style={styles.addPhotoButtonText}>Обрезать</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('addItem.categoryLabel')}</Text>
        <CategoryGridPicker
          selectedCategories={[category]}
          onCategorySelect={handleCategorySelect}
          multiSelect={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('addItem.colorsLabel')}</Text>
        <ColorPicker
          selectedColors={selectedColors}
          onColorSelect={handleColorSelect}
          multiSelect={true}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={[styles.section, styles.sectionFirstTop]}>
        <Text style={styles.sectionTitleLarge}>{t('addItem.detailsLabel')}</Text>
        <Input placeholder={t('addItem.namePlaceholder')} value={title} onChangeText={setTitle} />
        <Input placeholder={t('addItem.brandPlaceholder')} value={brand} onChangeText={setBrand} />
        <Input
          placeholder={t('addItem.pricePlaceholder')}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitleLarge}>{t('addItem.styleLabel')}</Text>
        <View style={styles.stylesContainer}>
          {STYLES.map((style) => {
            const selected = selectedStyles.includes(style.value);
            return (
              <TouchableOpacity
                key={style.value}
                style={[styles.styleCard, selected && styles.styleCardSelected]}
                onPress={() => handleStyleSelect(style.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.styleSticker}>{style.sticker}</Text>
                <Text
                  style={[styles.styleText, selected && styles.styleTextSelected]}
                  numberOfLines={1}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitleLarge}>{t('addItem.seasonLabel')}</Text>
        <View style={styles.seasonsContainer}>
          {SEASONS.map((season) => {
            const selected = selectedSeasons.includes(season.value);
            return (
              <TouchableOpacity
                key={season.value}
                style={[styles.seasonCard, selected && styles.seasonCardSelected]}
                onPress={() => handleSeasonSelect(season.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.seasonSticker}>{season.sticker}</Text>
                <Text style={[styles.seasonText, selected && styles.seasonTextSelected]}>
                  {season.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );

  if (loadingItem) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>
            {isEditMode
              ? step === 1
                ? t('addItem.editItemTitle')
                : t('addItem.editDetailsTitle')
              : step === 1
                ? t('addItem.addItemTitle')
                : t('addItem.detailsTitle')}
          </Text>
          {isBatchMode && batchQueue.length > 1 && (
            <Text style={styles.batchIndicator}>
              {currentBatchIndex + 1} / {batchQueue.length}
            </Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <Button onPress={step === 1 ? handleNext : handleSave} loading={loading} disabled={loading}>
          {step === 1
            ? t('common:buttons.next')
            : isEditMode
              ? t('addItem.updateButton')
              : t('addItem.saveButton')}
        </Button>
      </View>

      {tempImageUri && (
        <ImageCropper
          visible={showCropper}
          imageUri={tempImageUri}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {imageUri && (
        <ImageCropper
          visible={showEditCropper}
          imageUri={imageUri}
          onCropComplete={handleEditCropComplete}
          onCancel={handleEditCropCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 60,
    paddingBottom: Platform.OS === 'android' ? 10 : 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  batchIndicator: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: Platform.OS === 'android' ? 18 : 24,
    paddingHorizontal: 16,
  },
  sectionFirstTop: {
    paddingTop: 16,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleLarge: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 16 : 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: Platform.OS === 'android' ? 12 : 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imageContainer: {
    width: Platform.OS === 'android' ? 130 : 150,
    aspectRatio: 3 / 4,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Platform.OS === 'android' ? 12 : 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  addPhotoButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  footer: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seasonCard: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
  },
  seasonCardSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  seasonSticker: {
    fontSize: 28,
    marginBottom: 4,
  },
  seasonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    textTransform: 'capitalize',
  },
  seasonTextSelected: {
    color: '#FFF',
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  styleCard: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  styleCardSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  styleSticker: {
    fontSize: 24,
    marginBottom: 2,
  },
  styleText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#000',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  styleTextSelected: {
    color: '#FFF',
  },
});
