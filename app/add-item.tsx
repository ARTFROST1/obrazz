import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { CategoryPicker } from '@components/wardrobe/CategoryPicker';
import { ColorPicker } from '@components/wardrobe/ColorPicker';
import { Ionicons } from '@expo/vector-icons';
import { backgroundRemoverService } from '@services/wardrobe/backgroundRemover';
import { itemService } from '@services/wardrobe/itemService';
import { useAuthStore } from '@store/auth/authStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ItemCategory } from '../types/models/item';
import { Season, StyleTag } from '../types/models/user';

export default function AddItemScreen() {
  const { user } = useAuthStore();
  const { addItem } = useWardrobeStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('tops');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setOriginalImageUri(uri);
        setImageUri(uri);
        setBgRemoved(false);
        // Auto remove background
        await autoRemoveBackground(uri);
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setOriginalImageUri(uri);
        setImageUri(uri);
        setBgRemoved(false);
        // Auto remove background
        await autoRemoveBackground(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
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
      setBgRemoved(true);
      Alert.alert('Success', 'Background removed successfully!');
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

      Alert.alert('Success', 'Item added to your wardrobe!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const STYLES: StyleTag[] = ['casual', 'formal', 'sporty', 'elegant', 'vintage'];
  const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

  const handleSelectAgain = () => {
    setImageUri(null);
    setOriginalImageUri(null);
    setBgRemoved(false);
  };

  const autoRemoveBackground = async (uri: string) => {
    if (!backgroundRemoverService.isConfigured()) {
      // Skip if not configured
      setBgRemoved(true);
      return;
    }

    try {
      setRemovingBg(true);
      const processedUri = await backgroundRemoverService.removeBackground(uri);
      setImageUri(processedUri);
      setBgRemoved(true);
    } catch (error) {
      console.error('Error removing background:', error);
      setBgRemoved(true);
      Alert.alert('Info', 'Background removal failed, but you can continue without it.');
    } finally {
      setRemovingBg(false);
    }
  };

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
        {/* Loading Screen */}
        {removingBg && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Background is being removed, please wait</Text>
          </View>
        )}

        {/* Image Section */}
        {!removingBg && (
          <View style={styles.section}>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <View style={styles.imageInnerContainer}>
                  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                </View>
                <TouchableOpacity style={styles.removeImageButton} onPress={handleSelectAgain}>
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
              {!imageUri ? (
                <>
                  <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
                    <Ionicons name="camera" size={24} color="#000" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                    <Ionicons name="images" size={24} color="#000" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.imageButtonFull} onPress={handleSelectAgain}>
                  <Ionicons name="refresh" size={24} color="#000" />
                  <Text style={styles.imageButtonText}>Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Basic Info */}
        {!removingBg && bgRemoved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            <Input placeholder="Item name (optional)" value={title} onChangeText={setTitle} />
            <Input placeholder="Brand (optional)" value={brand} onChangeText={setBrand} />
            <Input placeholder="Size (optional)" value={size} onChangeText={setSize} />
          </View>
        )}

        {/* Category */}
        {!removingBg && bgRemoved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <CategoryPicker
              selectedCategories={[category]}
              onCategorySelect={handleCategorySelect}
              multiSelect={false}
            />
          </View>
        )}

        {/* Colors */}
        {!removingBg && bgRemoved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colors *</Text>
            <ColorPicker
              selectedColors={selectedColors}
              onColorSelect={handleColorSelect}
              multiSelect={true}
            />
          </View>
        )}

        {/* Styles */}
        {!removingBg && bgRemoved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Style (optional)</Text>
            <View style={styles.chipContainer}>
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
            </View>
          </View>
        )}

        {/* Seasons */}
        {!removingBg && bgRemoved && (
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
                        prev.includes(season)
                          ? prev.filter((s) => s !== season)
                          : [...prev, season],
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
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button onPress={handleSave} loading={loading} disabled={loading || !imageUri}>
          Save to Wardrobe
        </Button>
      </View>
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
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    height: '80%',
    width: '80%',
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
  imageInnerContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  imageButtonFull: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 16,
  },
});
