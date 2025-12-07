import { ImageCropper } from '@components/common/ImageCropper';
import { KeyboardAwareScrollView } from '@components/common/KeyboardAwareScrollView';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { CategoryGridPicker } from '@components/wardrobe/CategoryGridPicker';
import { ColorPicker } from '@components/wardrobe/ColorPicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { backgroundRemoverService } from '@services/wardrobe/backgroundRemover';
import { itemService } from '@services/wardrobe/itemService';
import { useAuthStore } from '@store/auth/authStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { ItemCategory } from '../types/models/item';
import { Season, StyleTag } from '../types/models/user';

export default function AddItemScreen() {
  const { t } = useTranslation('wardrobe');
  const { id: itemId } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();
  const { addItem, updateItem } = useWardrobeStore();
  const isEditMode = !!itemId;

  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingItem, setLoadingItem] = useState(isEditMode);
  const [originalItem, setOriginalItem] = useState<any>(null); // Store original item for comparison
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
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

  // Load item data if in edit mode
  useEffect(() => {
    if (isEditMode && itemId) {
      loadItemData();
    }
  }, [itemId, isEditMode, loadItemData]);

  const loadItemData = async () => {
    try {
      setLoadingItem(true);
      const item = await itemService.getItemById(itemId!);
      setOriginalItem(item); // Store original item

      // Pre-fill form with existing data
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
      router.back();
    } finally {
      setLoadingItem(false);
    }
  };

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

    if (!backgroundRemoverService.isConfigured()) {
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

    try {
      setLoading(true);

      if (isEditMode) {
        // Update existing item
        const updateData: any = {
          title: title || undefined,
          category,
          colors: selectedColors.map((hex) => ({ hex })),
          primaryColor: { hex: selectedColors[0] },
          styles: selectedStyles,
          seasons: selectedSeasons,
          brand: brand || undefined,
          size: size || undefined,
          price: price ? parseFloat(price) : undefined,
        };

        // Only include imageUri if it has changed
        if (
          imageUri &&
          imageUri !== originalItem?.imageLocalPath &&
          imageUri !== originalItem?.imageUrl
        ) {
          updateData.imageUri = imageUri;
        }

        const updatedItem = await itemService.updateItem(itemId!, updateData);
        updateItem(itemId!, updatedItem);
      } else {
        // Create new item
        if (!user?.id) {
          Alert.alert('Error', 'User not found');
          return;
        }

        const newItem = await itemService.createItem({
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
        });

        addItem(newItem);
      }

      router.back();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'save'} item`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      {/* Image Section */}
      <View style={styles.imageSection}>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              key={imageUri}
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#CCC" />
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleImageAction}>
            <Ionicons name={imageUri ? 'camera-reverse' : 'camera'} size={20} color="#FFF" />
            <Text style={styles.addPhotoButtonText}>
              {imageUri ? t('common:buttons.edit') : t('addItem.selectPhoto')}
            </Text>
          </TouchableOpacity>

          {imageUri && backgroundRemoverService.isConfigured() && (
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
                  <Text style={styles.addPhotoButtonText}>{t('addItem.removeBg')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('addItem.categoryLabel')}</Text>
        <CategoryGridPicker
          selectedCategories={[category]}
          onCategorySelect={handleCategorySelect}
          multiSelect={false}
        />
      </View>

      {/* Colors */}
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
      {/* Details */}
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

      {/* Styles - Square containers with stickers */}
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

      {/* Seasons - Square containers */}
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
        <TouchableOpacity
          onPress={() => (step === 1 ? router.back() : setStep(1))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode
            ? step === 1
              ? t('addItem.editItemTitle')
              : t('addItem.editDetailsTitle')
            : step === 1
              ? t('addItem.addItemTitle')
              : t('addItem.detailsTitle')}
        </Text>
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

      {/* Image Cropper Modal */}
      {tempImageUri && (
        <ImageCropper
          visible={showCropper}
          imageUri={tempImageUri}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
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
  sectionTight: {
    marginBottom: Platform.OS === 'android' ? 8 : 12,
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
  // Seasons square containers
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
  // Styles square containers
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
