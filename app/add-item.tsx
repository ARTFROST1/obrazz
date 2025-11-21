import { ImageCropper } from '@components/common/ImageCropper';
import { KeyboardAwareScrollView } from '@components/common/KeyboardAwareScrollView';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { CategoryGridPicker } from '@components/wardrobe/CategoryGridPicker';
import { ColorPicker } from '@components/wardrobe/ColorPicker';
import { SelectionGrid } from '@components/wardrobe/SelectionGrid';
import { Ionicons } from '@expo/vector-icons';
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
  const { id: itemId } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();
  const { addItem, updateItem } = useWardrobeStore();
  const isEditMode = !!itemId;

  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingItem, setLoadingItem] = useState(isEditMode);
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

  const STYLES: { label: string; value: StyleTag }[] = [
    { label: 'Casual', value: 'casual' },
    { label: 'Classic', value: 'classic' },
    { label: 'Sport', value: 'sport' },
    { label: 'Minimalism', value: 'minimalism' },
    { label: 'Old Money', value: 'old_money' },
    { label: 'Scandi', value: 'scandi' },
    { label: 'Indie', value: 'indie' },
    { label: 'Y2K', value: 'y2k' },
    { label: 'Star', value: 'star' },
    { label: 'Alt', value: 'alt' },
    { label: 'Cottagecore', value: 'cottagecore' },
    { label: 'Downtown', value: 'downtown' },
  ];

  const SEASONS: { label: string; value: Season }[] = [
    { label: 'Spring 🌱', value: 'spring' },
    { label: 'Summer ☀️', value: 'summer' },
    { label: 'Fall 🍂', value: 'fall' },
    { label: 'Winter ❄️', value: 'winter' },
  ];

  // Load item data if in edit mode
  useEffect(() => {
    if (isEditMode && itemId) {
      loadItemData();
    }
  }, [itemId]);

  const loadItemData = async () => {
    try {
      setLoadingItem(true);
      const item = await itemService.getItemById(itemId!);

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
      Alert.alert('Error', 'Failed to load item data');
      router.back();
    } finally {
      setLoadingItem(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to add items.',
      );
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
      Alert.alert('Error', 'Failed to take photo');
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleImageAction = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
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
      Alert.alert('Error', 'Failed to remove background');
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
      Alert.alert('Missing Image', 'Please add an image for your item');
      return;
    }
    if (selectedColors.length === 0) {
      Alert.alert('Missing Color', 'Please select at least one color');
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
        const updatedItem = await itemService.updateItem(itemId!, {
          title: title || undefined,
          category,
          colors: selectedColors.map((hex) => ({ hex })),
          primaryColor: { hex: selectedColors[0] },
          styles: selectedStyles,
          seasons: selectedSeasons,
          brand: brand || undefined,
          size: size || undefined,
          price: price ? parseFloat(price) : undefined,
        });

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
            <Text style={styles.addPhotoButtonText}>{imageUri ? 'Change' : 'Add Photo'}</Text>
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
                  <Text style={styles.addPhotoButtonText}>Remove BG</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <CategoryGridPicker
          selectedCategories={[category]}
          onCategorySelect={handleCategorySelect}
          multiSelect={false}
        />
      </View>

      {/* Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Colors</Text>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Input placeholder="Item Name" value={title} onChangeText={setTitle} />
        <Input placeholder="Brand" value={brand} onChangeText={setBrand} />
        <Input placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
      </View>

      {/* Styles */}
      <View style={[styles.section, styles.sectionTight]}>
        <Text style={styles.sectionTitle}>Style</Text>
        <SelectionGrid
          items={STYLES}
          selectedItems={selectedStyles}
          onSelect={handleStyleSelect}
          multiSelect={true}
        />
      </View>

      {/* Seasons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Season</Text>
        <SelectionGrid
          items={SEASONS}
          selectedItems={selectedSeasons}
          onSelect={handleSeasonSelect}
          multiSelect={true}
        />
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
              ? 'Edit Item'
              : 'Edit Details'
            : step === 1
              ? 'Add Item'
              : 'Details'}
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
          {step === 1 ? 'Next' : isEditMode ? 'Update Item' : 'Save to Wardrobe'}
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
});
