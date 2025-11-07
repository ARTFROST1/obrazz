import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { itemService } from '@services/wardrobe/itemService';
import { WardrobeItem, ItemCategory } from '@types/models/item';
import { Season, StyleTag } from '@types/models/user';
import { CategoryPicker } from '@components/wardrobe/CategoryPicker';
import { ColorPicker } from '@components/wardrobe/ColorPicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STYLES: StyleTag[] = [
  'casual',
  'formal',
  'sporty',
  'elegant',
  'vintage',
  'minimalist',
  'bohemian',
  'streetwear',
  'preppy',
  'romantic',
];

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateItem, deleteItem: deleteItemFromStore } = useWardrobeStore();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('top');
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editStyles, setEditStyles] = useState<StyleTag[]>([]);
  const [editSeasons, setEditSeasons] = useState<Season[]>([]);

  useEffect(() => {
    loadItem();
  }, [id]);

  useEffect(() => {
    if (item) {
      setEditTitle(item.title || '');
      setEditBrand(item.brand || '');
      setEditSize(item.size || '');
      setEditCategory(item.category);
      setEditColors(item.colors?.map((c) => c.hex) || []);
      setEditStyles(item.styles || []);
      setEditSeasons(item.seasons || []);
    }
  }, [item]);

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
      Alert.alert('Success', 'Item deleted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!item) return;

    try {
      setIsUpdating(true);
      const colors = editColors.map((hex) => ({
        hex,
        name: hex,
      }));

      await itemService.updateItem(item.id, {
        title: editTitle || 'Untitled Item',
        brand: editBrand || undefined,
        size: editSize || undefined,
        category: editCategory,
        colors: colors.length > 0 ? colors : undefined,
        styles: editStyles.length > 0 ? editStyles : undefined,
        seasons: editSeasons.length > 0 ? editSeasons : undefined,
      });

      // Update local state
      const updatedItem = {
        ...item,
        title: editTitle,
        brand: editBrand || undefined,
        size: editSize || undefined,
        category: editCategory,
        colors: colors.length > 0 ? colors : undefined,
        styles: editStyles.length > 0 ? editStyles : undefined,
        seasons: editSeasons.length > 0 ? editSeasons : undefined,
      };

      setItem(updatedItem);
      updateItem(item.id, updatedItem);
      setShowUpdateModal(false);
      Alert.alert('Success', 'Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setEditColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const handleStyleToggle = (style: StyleTag) => {
    setEditStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const handleSeasonToggle = (season: Season) => {
    setEditSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season],
    );
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
            <TouchableOpacity onPress={() => setShowUpdateModal(true)} style={styles.editButton}>
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={[styles.infoValue, !item.brand && styles.notFilled]}>
                {item.brand || 'not filled in'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={[styles.infoValue, !item.size && styles.notFilled]}>
                {item.size || 'not filled in'}
              </Text>
            </View>
          </View>
        </View>

        {/* Styles */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.sectionTitle}>Styles:</Text>
            {item.styles && item.styles.length > 0 ? (
              <View style={styles.inlineTags}>
                {item.styles.map((style, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{style}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.notSelected}>not selected</Text>
            )}
          </View>
        </View>

        {/* Seasons */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.sectionTitle}>Seasons:</Text>
            {item.seasons && item.seasons.length > 0 ? (
              <View style={styles.inlineTags}>
                {item.seasons.map((season, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{season}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.notSelected}>not selected</Text>
            )}
          </View>
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.sectionTitle}>Colors:</Text>
            {item.colors && item.colors.length > 0 ? (
              <View style={styles.inlineColors}>
                {item.colors.map((color, index) => (
                  <View key={index} style={[styles.colorCircle, { backgroundColor: color.hex }]} />
                ))}
              </View>
            ) : (
              <Text style={styles.notSelected}>not selected</Text>
            )}
          </View>
          <View style={styles.divider} />
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.wearCount}</Text>
              <Text style={styles.statLabel}>Times Worn</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.statLabel}>Added</Text>
            </View>
          </View>
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

      {/* Update Item Modal */}
      {showUpdateModal && (
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.updateModal}>
              <Text style={styles.modalTitle}>Update Item</Text>

              {/* Title Input */}
              <TextInput
                style={styles.input}
                placeholder="Item name"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholderTextColor="#999"
              />

              {/* Brand Input */}
              <TextInput
                style={styles.input}
                placeholder="Brand (optional)"
                value={editBrand}
                onChangeText={setEditBrand}
                placeholderTextColor="#999"
              />

              {/* Size Input */}
              <TextInput
                style={styles.input}
                placeholder="Size (optional)"
                value={editSize}
                onChangeText={setEditSize}
                placeholderTextColor="#999"
              />

              {/* Category */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Category</Text>
                <CategoryPicker
                  selectedCategories={[editCategory]}
                  onCategorySelect={(cat) => setEditCategory(cat)}
                />
              </View>

              {/* Colors */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Colors (optional)</Text>
                <ColorPicker
                  selectedColors={editColors}
                  onColorSelect={handleColorSelect}
                  multiSelect={true}
                />
              </View>

              {/* Styles */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Style (optional)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipScrollContainer}
                >
                  {STYLES.map((style) => {
                    const selected = editStyles.includes(style);
                    return (
                      <TouchableOpacity
                        key={style}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => handleStyleToggle(style)}
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
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Seasons (optional)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipScrollContainer}
                >
                  {SEASONS.map((season) => {
                    const selected = editSeasons.includes(season);
                    return (
                      <TouchableOpacity
                        key={season}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => handleSeasonToggle(season)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {season}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowUpdateModal(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateItem}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  disabled={isUpdating}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    {isUpdating ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
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
  },
  inlineColors: {
    flexDirection: 'row',
    marginLeft: 8,
    flex: 1,
    alignItems: 'center',
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
    marginBottom: 16,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  updateModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 500,
    alignSelf: 'center',
  },
  modalTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    color: '#000',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  modalButtonPrimary: {
    backgroundColor: '#000',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
  },
});
