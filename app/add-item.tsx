import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageCropper } from '@components/common/ImageCropper';
import { useAuthStore } from '@store/auth/authStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { itemService } from '@services/wardrobe/itemService';
import { backgroundRemoverService } from '@services/wardrobe/backgroundRemover';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { CategoryGridPicker } from '@components/wardrobe/CategoryGridPicker';
import { ColorPicker } from '@components/wardrobe/ColorPicker';
import { ItemCategory } from '../types/models/item';
import { Season, StyleTag } from '../types/models/user';

export default function AddItemScreen() {
  const { user } = useAuthStore();
  const { addItem } = useWardrobeStore();

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
  const [loading, setLoading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

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

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('Missing Image', 'Please add an image for your item');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (selectedColors.length === 0) {
      Alert.alert('Missing Color', 'Please select at least one color');
      return;
    }

    try {
      setLoading(true);

      const newItem = await itemService.createItem({
        userId: user.id,
        title: title || undefined,
        category,
        colors: selectedColors.map((hex) => ({ hex })),
        primaryColor: { hex: selectedColors[0] },
        styles: selectedStyles,
        seasons: selectedSeasons,
        imageUri,
        brand: brand || undefined,
        size: size || undefined,
      });

      addItem(newItem);
      router.back();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const STYLES: StyleTag[] = ['casual', 'formal', 'sporty', 'elegant', 'vintage'];
  const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Item</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={[styles.section, styles.firstSection]}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={32} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color="#CCC" />
              <Text style={styles.placeholderText}>Add a photo of your item</Text>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color="#000" />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
              <Ionicons name="images" size={24} color="#000" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
            {imageUri && backgroundRemoverService.isConfigured() && (
              <TouchableOpacity
                style={[styles.imageButton, removingBg && styles.imageButtonDisabled]}
                onPress={handleRemoveBackground}
                disabled={removingBg}
              >
                {removingBg ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="cut" size={24} color="#000" />
                )}
                <Text style={styles.imageButtonText}>Remove BG</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <Input placeholder="Item name (optional)" value={title} onChangeText={setTitle} />
          <Input placeholder="Brand (optional)" value={brand} onChangeText={setBrand} />
          <Input placeholder="Size (optional)" value={size} onChangeText={setSize} />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <CategoryGridPicker
            selectedCategories={[category]}
            onCategorySelect={handleCategorySelect}
            multiSelect={false}
          />
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors *</Text>
          <ColorPicker
            selectedColors={selectedColors}
            onColorSelect={handleColorSelect}
            multiSelect={true}
          />
        </View>

        {/* Styles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScrollContainer}
          >
            {STYLES.map((style) => {
              const selected = selectedStyles.includes(style);
              return (
                <TouchableOpacity
                  key={style}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() =>
                    setSelectedStyles((prev) =>
                      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
                    )
                  }
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Seasons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seasons (optional)</Text>
          <View style={styles.chipContainer}>
            {SEASONS.map((season) => {
              const selected = selectedSeasons.includes(season);
              return (
                <TouchableOpacity
                  key={season}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() =>
                    setSelectedSeasons((prev) =>
                      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season],
                    )
                  }
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {season}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button onPress={handleSave} loading={loading} disabled={loading || !imageUri}>
          Save to Wardrobe
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
  backButton: {
    padding: 8,
  },
  chip: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipScrollContainer: {
    paddingRight: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  chipText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  container: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  firstSection: {
    marginTop: 16,
  },
  footer: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 60,
    paddingVertical: 12,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageButton: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 16,
  },
  imageButtonDisabled: {
    opacity: 0.5,
  },
  imageButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePlaceholder: {
    alignItems: 'center',
    aspectRatio: 3 / 4,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  removeImageButton: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
