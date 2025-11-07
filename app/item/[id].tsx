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
  Dimensions,
  TextInput,
  Modal,
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

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateItem, deleteItem: deleteItemFromStore } = useWardrobeStore();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('tops');
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editStyles, setEditStyles] = useState<StyleTag[]>([]);
  const [editSeasons, setEditSeasons] = useState<Season[]>([]);

  useEffect(() => {
    loadItem();
  }, [id]);

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

  const handleEdit = () => {
    if (!item) return;
    setEditTitle(item.title || '');
    setEditBrand(item.brand || '');
    setEditSize(item.size || '');
    setEditCategory(item.category);
    setEditColors(item.colors?.map((c) => c.hex) || []);
    setEditStyles(item.styles || []);
    setEditSeasons(item.seasons || []);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!item) return;

    try {
      setIsSaving(true);
      await itemService.updateItem(item.id, {
        title: editTitle || undefined,
        brand: editBrand || undefined,
        size: editSize || undefined,
        category: editCategory,
        colors: editColors.map((hex) => ({ hex })),
        primaryColor: editColors.length > 0 ? { hex: editColors[0] } : undefined,
        styles: editStyles,
        seasons: editSeasons,
      });

      const updatedItem = {
        ...item,
        title: editTitle || item.title,
        brand: editBrand || item.brand,
        size: editSize || item.size,
        category: editCategory,
        colors: editColors.map((hex) => ({ hex })),
        primaryColor: editColors.length > 0 ? { hex: editColors[0] } : item.primaryColor,
        styles: editStyles,
        seasons: editSeasons,
      };

      setItem(updatedItem);
      updateItem(item.id, updatedItem);
      Alert.alert('Success', 'Item updated successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setIsSaving(false);
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
          <View style={styles.titleSection}>
            <Text style={styles.itemTitle}>{item.title || 'Untitled Item'}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={[styles.infoValue, !item.brand && styles.infoValuePlaceholder]}>
                {item.brand || 'not filled in'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={[styles.infoValue, !item.size && styles.infoValuePlaceholder]}>
                {item.size || 'not filled in'}
              </Text>
            </View>
          </View>
        </View>

        {/* Styles and Seasons in one row */}
        <View style={styles.section}>
          <View style={styles.doubleRow}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Styles</Text>
              {item.styles && item.styles.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {item.styles.map((style, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{style}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.placeholderValue}>not selected</Text>
              )}
            </View>

            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Seasons</Text>
              {item.seasons && item.seasons.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {item.seasons.map((season, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{season}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.placeholderValue}>not selected</Text>
              )}
            </View>
          </View>
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          {item.colors && item.colors.length > 0 ? (
            <View style={styles.colorsContainer}>
              {item.colors.map((color, index) => (
                <View key={index} style={[styles.colorCircle, { backgroundColor: color.hex }]} />
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderValue}>not selected</Text>
          )}
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

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="pencil-outline" size={20} color="#FFF" />
            <Text style={styles.editButtonText}>Edit Item</Text>
          </TouchableOpacity>

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

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Item Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Item name (optional)"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Brand</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Brand (optional)"
                  value={editBrand}
                  onChangeText={setEditBrand}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Size</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Size (optional)"
                  value={editSize}
                  onChangeText={setEditSize}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Category *</Text>
                <CategoryPicker
                  selectedCategories={[editCategory]}
                  onCategorySelect={(cat) => setEditCategory(cat)}
                  multiSelect={false}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Colors *</Text>
                <ColorPicker
                  selectedColors={editColors}
                  onColorSelect={(color) =>
                    setEditColors((prev) =>
                      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
                    )
                  }
                  multiSelect={true}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Style</Text>
                <View style={styles.chipContainer}>
                  {(['casual', 'formal', 'sporty', 'elegant', 'vintage'] as StyleTag[]).map(
                    (style) => {
                      const selected = editStyles.includes(style);
                      return (
                        <TouchableOpacity
                          key={style}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() =>
                            setEditStyles((prev) =>
                              prev.includes(style)
                                ? prev.filter((s) => s !== style)
                                : [...prev, style],
                            )
                          }
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {style}
                          </Text>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Seasons</Text>
                <View style={styles.chipContainer}>
                  {(['spring', 'summer', 'fall', 'winter'] as Season[]).map((season) => {
                    const selected = editSeasons.includes(season);
                    return (
                      <TouchableOpacity
                        key={season}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() =>
                          setEditSeasons((prev) =>
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
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                disabled={isSaving || editColors.length === 0}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
  colorCircle: {
    borderColor: '#E5E5E5',
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    marginRight: 12,
    width: 40,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  container: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  content: {
    flex: 1,
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
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#FF3B30',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 16,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  infoValuePlaceholder: {
    color: '#999',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  placeholderValue: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  itemTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleSection: {
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 12,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfSection: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
    marginBottom: 8,
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
  editModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    height: '90%',
    paddingBottom: 16,
    width: SCREEN_WIDTH - 32,
  },
  modalButtons: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    color: '#000',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
