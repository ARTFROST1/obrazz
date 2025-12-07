import { Ionicons } from '@expo/vector-icons';
import { itemService } from '@services/wardrobe/itemService';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WardrobeItem } from '../../types/models/item';
import { Season, StyleTag } from '../../types/models/user';
import { ItemCategory } from '../../types/models/item';

// Helper function for category stickers
const getCategorySticker = (category?: string): string => {
  switch (category) {
    case 'tops':
      return '👕';
    case 'bottoms':
      return '👖';
    case 'outerwear':
      return '🧥';
    case 'footwear':
      return '👟';
    case 'accessories':
      return '👜';
    case 'fullbody':
      return '👗';
    case 'headwear':
      return '🧢';
    case 'other':
      return '📦';
    default:
      return '👔';
  }
};

// Helper function for season stickers
const getSeasonSticker = (season?: string): string => {
  switch (season) {
    case 'spring':
      return '🌸';
    case 'summer':
      return '☀️';
    case 'fall':
      return '🍂';
    case 'winter':
      return '❄️';
    default:
      return '🌍';
  }
};

// Helper function for style stickers
const getStyleSticker = (style?: string): string => {
  switch (style) {
    case 'casual':
      return '👕';
    case 'classic':
      return '🎩';
    case 'sport':
      return '⚽';
    case 'minimalism':
      return '⬜';
    case 'old_money':
      return '💎';
    case 'scandi':
      return '🌿';
    case 'indie':
      return '🎸';
    case 'y2k':
      return '💿';
    case 'star':
      return '⭐';
    case 'alt':
      return '🖤';
    case 'cottagecore':
      return '🌻';
    case 'downtown':
      return '🏙️';
    default:
      return '✨';
  }
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateItem, deleteItem: deleteItemFromStore } = useWardrobeStore();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Inline editing states
  const [activeMetadataCard, setActiveMetadataCard] = useState<
    'category' | 'brand' | 'size' | 'colors' | 'style' | 'season' | null
  >(null);

  // Text input states for brand and size
  const [editingBrand, setEditingBrand] = useState('');
  const [editingSize, setEditingSize] = useState('');

  useEffect(() => {
    loadItem();
  }, [id, loadItem]);

  const loadItem = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const itemData = await itemService.getItemById(id);
      setItem(itemData);
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert('Error', 'Failed to load item details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!item) return;

    try {
      const newStatus = !item.isFavorite;
      await itemService.toggleFavorite(item.id, newStatus);
      updateItem(item.id, { isFavorite: newStatus });
      setItem({ ...item, isFavorite: newStatus });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!item) return;

    try {
      setDeleting(true);
      await itemService.deleteItem(item.id);
      deleteItemFromStore(item.id);
      router.back();
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  // Handle inline metadata card tap - opens inline picker
  const handleMetadataCardTap = (
    type: 'category' | 'brand' | 'size' | 'colors' | 'style' | 'season',
  ) => {
    if (type === 'brand') {
      if (activeMetadataCard === 'brand') {
        setActiveMetadataCard(null);
      } else {
        setEditingBrand(item?.brand || '');
        setActiveMetadataCard('brand');
      }
    } else if (type === 'size') {
      if (activeMetadataCard === 'size') {
        setActiveMetadataCard(null);
      } else {
        setEditingSize(item?.size || '');
        setActiveMetadataCard('size');
      }
    } else {
      setActiveMetadataCard(activeMetadataCard === type ? null : type);
    }
  };

  // Handle inline category selection
  const handleInlineCategorySelect = async (category: ItemCategory) => {
    if (!item) return;

    try {
      const updatedItem = await itemService.updateItem(item.id, { category });
      setItem({ ...item, category });
      updateItem(item.id, updatedItem);
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  // Handle inline style selection
  const handleInlineStyleSelect = async (style: StyleTag) => {
    if (!item) return;

    const currentStyles = item.styles || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter((s) => s !== style)
      : [...currentStyles, style];

    try {
      const updatedItem = await itemService.updateItem(item.id, {
        styles: newStyles.length > 0 ? newStyles : undefined,
      });
      setItem({ ...item, styles: newStyles });
      updateItem(item.id, updatedItem);
    } catch (error) {
      console.error('Error updating style:', error);
      Alert.alert('Error', 'Failed to update style');
    }
  };

  // Handle inline season selection
  const handleInlineSeasonSelect = async (season: Season) => {
    if (!item) return;

    const currentSeasons = item.seasons || [];
    const newSeasons = currentSeasons.includes(season)
      ? currentSeasons.filter((s) => s !== season)
      : [...currentSeasons, season];

    try {
      const updatedItem = await itemService.updateItem(item.id, {
        seasons: newSeasons.length > 0 ? newSeasons : undefined,
      });
      setItem({ ...item, seasons: newSeasons });
      updateItem(item.id, updatedItem);
    } catch (error) {
      console.error('Error updating season:', error);
      Alert.alert('Error', 'Failed to update season');
    }
  };

  // Handle inline brand update
  const handleInlineBrandSave = async () => {
    if (!item) return;

    try {
      const updatedItem = await itemService.updateItem(item.id, {
        brand: editingBrand.trim() || undefined,
      });
      setItem({ ...item, brand: editingBrand.trim() || undefined });
      updateItem(item.id, updatedItem);
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating brand:', error);
      Alert.alert('Error', 'Failed to update brand');
    }
  };

  // Handle inline size update
  const handleInlineSizeSave = async () => {
    if (!item) return;

    try {
      const updatedItem = await itemService.updateItem(item.id, {
        size: editingSize.trim() || undefined,
      });
      setItem({ ...item, size: editingSize.trim() || undefined });
      updateItem(item.id, updatedItem);
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating size:', error);
      Alert.alert('Error', 'Failed to update size');
    }
  };

  // Handle inline color selection
  const handleInlineColorSelect = async (colorHex: string) => {
    if (!item) return;

    const currentColors = item.colors || [];
    const colorExists = currentColors.some((c) => c.hex === colorHex);
    const newColors = colorExists
      ? currentColors.filter((c) => c.hex !== colorHex)
      : [...currentColors, { hex: colorHex }];

    try {
      const updatedItem = await itemService.updateItem(item.id, {
        colors: newColors.length > 0 ? newColors : undefined,
        primaryColor: newColors.length > 0 ? { hex: newColors[0].hex } : undefined,
      });
      setItem({
        ...item,
        colors: newColors,
        primaryColor: newColors.length > 0 ? { hex: newColors[0].hex } : { hex: '#CCCCCC' },
      });
      updateItem(item.id, updatedItem);
    } catch (error) {
      console.error('Error updating colors:', error);
      Alert.alert('Error', 'Failed to update colors');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Item Details</Text>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={item.isFavorite ? '#FF3B30' : '#000'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageLocalPath || item.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.title || 'Untitled Item'}</Text>
            <TouchableOpacity
              onPress={() => router.push(`/add-item?id=${item.id}`)}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Added date below title */}
          <View style={styles.addedDateRow}>
            <Text style={styles.addedSticker}>📅</Text>
            <Text style={styles.addedText}>
              Added {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* 6 Metadata Cards - 2 rows x 3 columns */}
          <View style={styles.metadataGrid}>
            {/* Row 1 */}
            <View style={styles.metadataRow}>
              {/* Category Card - Tappable for inline editing */}
              <TouchableOpacity
                style={[
                  styles.metadataCard,
                  activeMetadataCard === 'category' && styles.metadataCardActive,
                ]}
                onPress={() => handleMetadataCardTap('category')}
                activeOpacity={0.7}
              >
                <Text style={styles.metadataSticker}>{getCategorySticker(item.category)}</Text>
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {item.category || '—'}
                </Text>
                <Text style={styles.metadataLabel}>Category</Text>
              </TouchableOpacity>

              {/* Brand Card - Tappable for inline editing */}
              <TouchableOpacity
                style={[
                  styles.metadataCard,
                  activeMetadataCard === 'brand' && styles.metadataCardActive,
                ]}
                onPress={() => handleMetadataCardTap('brand')}
                activeOpacity={0.7}
              >
                <Text style={styles.metadataSticker}>🏷️</Text>
                <Text
                  style={[styles.metadataValue, !item.brand && styles.metadataNotFilled]}
                  numberOfLines={1}
                >
                  {item.brand || '—'}
                </Text>
                <Text style={styles.metadataLabel}>Brand</Text>
              </TouchableOpacity>

              {/* Size Card - Tappable for inline editing */}
              <TouchableOpacity
                style={[
                  styles.metadataCard,
                  activeMetadataCard === 'size' && styles.metadataCardActive,
                ]}
                onPress={() => handleMetadataCardTap('size')}
                activeOpacity={0.7}
              >
                <Text style={styles.metadataSticker}>📐</Text>
                <Text
                  style={[styles.metadataValue, !item.size && styles.metadataNotFilled]}
                  numberOfLines={1}
                >
                  {item.size || '—'}
                </Text>
                <Text style={styles.metadataLabel}>Size</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.metadataRow}>
              {/* Colors Card - Tappable for inline editing */}
              <TouchableOpacity
                style={[
                  styles.metadataCard,
                  activeMetadataCard === 'colors' && styles.metadataCardActive,
                ]}
                onPress={() => handleMetadataCardTap('colors')}
                activeOpacity={0.7}
              >
                <View style={styles.colorPreview}>
                  {item.colors && item.colors.length > 0 ? (
                    item.colors
                      .slice(0, 3)
                      .map((color, index) => (
                        <View
                          key={index}
                          style={[styles.colorDot, { backgroundColor: color.hex }]}
                        />
                      ))
                  ) : (
                    <Text style={styles.metadataSticker}>🎨</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.metadataValue,
                    (!item.colors || item.colors.length === 0) && styles.metadataNotFilled,
                  ]}
                  numberOfLines={1}
                >
                  {item.colors && item.colors.length > 0
                    ? item.colors.length > 3
                      ? `+${item.colors.length - 3}`
                      : `${item.colors.length} color${item.colors.length > 1 ? 's' : ''}`
                    : '—'}
                </Text>
                <Text style={styles.metadataLabel}>Colors</Text>
              </TouchableOpacity>

              {/* Style Card - Tappable for inline editing */}
              <TouchableOpacity
                style={[
                  styles.metadataCard,
                  activeMetadataCard === 'style' && styles.metadataCardActive,
                ]}
                onPress={() => handleMetadataCardTap('style')}
                activeOpacity={0.7}
              >
                <Text style={styles.metadataSticker}>{getStyleSticker(item.styles?.[0])}</Text>
                <Text
                  style={[
                    styles.metadataValue,
                    (!item.styles || item.styles.length === 0) && styles.metadataNotFilled,
                  ]}
                  numberOfLines={1}
                >
                  {item.styles && item.styles.length > 0 ? item.styles[0] : '—'}
                </Text>
                <Text style={styles.metadataLabel}>Style</Text>
              </TouchableOpacity>

              {/* Season Card - Tappable for inline editing */}
              <TouchableOpacity
                style={[
                  styles.metadataCard,
                  activeMetadataCard === 'season' && styles.metadataCardActive,
                ]}
                onPress={() => handleMetadataCardTap('season')}
                activeOpacity={0.7}
              >
                <Text style={styles.metadataSticker}>{getSeasonSticker(item.seasons?.[0])}</Text>
                <Text
                  style={[
                    styles.metadataValue,
                    (!item.seasons || item.seasons.length === 0) && styles.metadataNotFilled,
                  ]}
                  numberOfLines={1}
                >
                  {item.seasons && item.seasons.length > 0 ? item.seasons[0] : '—'}
                </Text>
                <Text style={styles.metadataLabel}>Season</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Inline Category Picker */}
          {activeMetadataCard === 'category' && (
            <View style={styles.inlinePickerContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlinePickerScroll}
              >
                {(
                  [
                    'headwear',
                    'outerwear',
                    'tops',
                    'bottoms',
                    'footwear',
                    'accessories',
                    'fullbody',
                    'other',
                  ] as ItemCategory[]
                ).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.inlinePickerItem,
                      item.category === category && styles.inlinePickerItemActive,
                    ]}
                    onPress={() => handleInlineCategorySelect(category)}
                  >
                    <Text style={styles.inlinePickerSticker}>{getCategorySticker(category)}</Text>
                    <Text
                      style={[
                        styles.inlinePickerItemText,
                        item.category === category && styles.inlinePickerItemTextActive,
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Inline Style Picker */}
          {activeMetadataCard === 'style' && (
            <View style={styles.inlinePickerContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlinePickerScroll}
              >
                {(
                  [
                    'casual',
                    'classic',
                    'sport',
                    'minimalism',
                    'old_money',
                    'scandi',
                    'indie',
                    'y2k',
                    'star',
                    'alt',
                    'cottagecore',
                    'downtown',
                  ] as StyleTag[]
                ).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.inlinePickerItem,
                      item.styles?.includes(style) && styles.inlinePickerItemActive,
                    ]}
                    onPress={() => handleInlineStyleSelect(style)}
                  >
                    <Text style={styles.inlinePickerSticker}>{getStyleSticker(style)}</Text>
                    <Text
                      style={[
                        styles.inlinePickerItemText,
                        item.styles?.includes(style) && styles.inlinePickerItemTextActive,
                      ]}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Inline Season Picker */}
          {activeMetadataCard === 'season' && (
            <View style={styles.inlinePickerContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlinePickerScroll}
              >
                {(['spring', 'summer', 'fall', 'winter'] as Season[]).map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.inlinePickerItem,
                      item.seasons?.includes(season) && styles.inlinePickerItemActive,
                    ]}
                    onPress={() => handleInlineSeasonSelect(season)}
                  >
                    <Text style={styles.inlinePickerSticker}>{getSeasonSticker(season)}</Text>
                    <Text
                      style={[
                        styles.inlinePickerItemText,
                        item.seasons?.includes(season) && styles.inlinePickerItemTextActive,
                      ]}
                    >
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Inline Brand Editor */}
          {activeMetadataCard === 'brand' && (
            <View style={styles.inlinePickerContainer}>
              <View style={styles.inlineInputRow}>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editingBrand}
                  onChangeText={setEditingBrand}
                  placeholder="Enter brand name..."
                  placeholderTextColor="#999"
                  autoFocus
                />
                <TouchableOpacity style={styles.inlineSaveButton} onPress={handleInlineBrandSave}>
                  <Text style={styles.inlineSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Inline Size Editor */}
          {activeMetadataCard === 'size' && (
            <View style={styles.inlinePickerContainer}>
              <View style={styles.inlineInputRow}>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editingSize}
                  onChangeText={setEditingSize}
                  placeholder="Enter size (e.g., M, L, 42)..."
                  placeholderTextColor="#999"
                  autoFocus
                />
                <TouchableOpacity style={styles.inlineSaveButton} onPress={handleInlineSizeSave}>
                  <Text style={styles.inlineSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Inline Color Picker */}
          {activeMetadataCard === 'colors' && (
            <View style={styles.inlinePickerContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlinePickerScroll}
              >
                {[
                  '#000000',
                  '#FFFFFF',
                  '#808080',
                  '#C0C0C0',
                  '#FF0000',
                  '#FF6B6B',
                  '#FFA500',
                  '#FFD700',
                  '#FFFF00',
                  '#90EE90',
                  '#008000',
                  '#00CED1',
                  '#0000FF',
                  '#4169E1',
                  '#800080',
                  '#FF1493',
                  '#8B4513',
                  '#D2691E',
                  '#F5DEB3',
                  '#FFC0CB',
                ].map((colorHex) => {
                  const isSelected = item.colors?.some((c) => c.hex === colorHex);
                  return (
                    <TouchableOpacity
                      key={colorHex}
                      style={[
                        styles.colorPickerItem,
                        { backgroundColor: colorHex },
                        isSelected && styles.colorPickerItemSelected,
                      ]}
                      onPress={() => handleInlineColorSelect(colorHex)}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={
                            colorHex === '#FFFFFF' ||
                            colorHex === '#FFFF00' ||
                            colorHex === '#FFD700' ||
                            colorHex === '#F5DEB3' ||
                            colorHex === '#FFC0CB'
                              ? '#000'
                              : '#FFF'
                          }
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete Item</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  colorCircle: {
    borderColor: '#E5E5E5',
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    marginRight: 8,
    width: 28,
  },
  container: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#FF3B30',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  favoriteButton: {
    padding: 8,
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
  imageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: '#F8F8F8',
    marginBottom: 24,
    width: '100%',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
    maxWidth: 120,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  // Added date row below title
  addedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addedSticker: {
    fontSize: 16,
    marginRight: 6,
  },
  addedText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: 32,
  },
  inlineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 8,
    flex: 1,
    alignItems: 'center',
    rowGap: 8,
  },
  inlineColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 8,
    flex: 1,
    alignItems: 'center',
    maxWidth: 280,
    rowGap: 8,
  },
  notFilled: {
    color: '#999',
    fontStyle: 'italic',
    textTransform: 'none',
  },
  notSelected: {
    color: '#999',
    fontSize: 16,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginTop: 8,
    marginBottom: 16,
  },
  // Metadata Grid Styles - 6 cards (2 rows x 3 columns)
  metadataGrid: {
    gap: 10,
    paddingHorizontal: 0,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metadataCard: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    minHeight: 90,
  },
  metadataSticker: {
    fontSize: 24,
    marginBottom: 6,
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  metadataNotFilled: {
    color: '#999',
  },
  metadataLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    justifyContent: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  // Active states
  metadataCardActive: {
    backgroundColor: '#E8E8E8',
  },
  // Inline Picker Styles
  inlinePickerContainer: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 0,
  },
  inlinePickerScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  inlinePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inlinePickerItemActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  inlinePickerSticker: {
    fontSize: 16,
  },
  inlinePickerItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  inlinePickerItemTextActive: {
    color: '#FFF',
  },
  // Inline text input styles
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  inlineTextInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#000',
  },
  inlineSaveButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  inlineSaveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Color picker styles
  colorPickerItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPickerItemSelected: {
    borderColor: '#000',
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  statValue: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  tag: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#000',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
