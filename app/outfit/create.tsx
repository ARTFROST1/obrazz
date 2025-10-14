import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { OutfitCanvas } from '@components/outfit/OutfitCanvas';
import { CategoryCarousel } from '@components/outfit/CategoryCarousel';
import { BackgroundPicker } from '@components/outfit/BackgroundPicker';
import { WardrobeItem, ItemCategory } from '../../types/models/item';
import { OutfitItem } from '../../types/models/outfit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = (CANVAS_WIDTH / 3) * 4;

const CATEGORIES: ItemCategory[] = [
  'headwear',
  'outerwear',
  'tops',
  'bottoms',
  'footwear',
  'accessories',
  'bags',
];

export default function CreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { user } = useAuthStore();
  const { items: wardrobeItems } = useWardrobeStore();
  const {
    currentItems,
    currentBackground,
    canvasSettings,
    addItemToCanvas,
    updateItemTransform,
    removeItemFromCanvas,
    setBackground,
    setCurrentOutfit,
    resetCurrentOutfit,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useOutfitStore();

  // const [selectedCategory] = useState<ItemCategory>('tops');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [lockedCategories, setLockedCategories] = useState<Set<ItemCategory>>(new Set());
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load outfit if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadOutfitForEdit(id);
    }

    return () => {
      // Cleanup on unmount
      if (!isEditMode) {
        resetCurrentOutfit();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const loadOutfitForEdit = async (outfitId: string) => {
    try {
      const outfit = await outfitService.getOutfitById(outfitId);
      setCurrentOutfit(outfit);
      setOutfitTitle(outfit.title || '');
    } catch (error) {
      console.error('Error loading outfit:', error);
      Alert.alert('Error', 'Failed to load outfit for editing');
      router.back();
    }
  };

  // Get items for each category
  const getItemsByCategory = useCallback(
    (category: ItemCategory) => {
      return wardrobeItems.filter((item) => item.category === category);
    },
    [wardrobeItems],
  );

  // Get current outfit item for a category
  const getCategoryItem = useCallback(
    (category: ItemCategory) => {
      return currentItems.find((item) => item.category === category);
    },
    [currentItems],
  );

  // Handle item selection from carousel
  const handleItemSelect = useCallback(
    (category: ItemCategory, item: WardrobeItem | null) => {
      if (!item) {
        // Remove item from canvas
        const existingItem = getCategoryItem(category);
        if (existingItem) {
          removeItemFromCanvas(existingItem.itemId);
        }
        return;
      }

      // Calculate initial position based on category
      const categoryIndex = CATEGORIES.indexOf(category);
      const centerX = CANVAS_WIDTH / 2 - 50;
      const spacing = CANVAS_HEIGHT / (CATEGORIES.length + 1);
      const centerY = spacing * (categoryIndex + 1) - 50;

      const newOutfitItem: OutfitItem = {
        itemId: item.id,
        item,
        category,
        slot: categoryIndex,
        transform: {
          x: centerX,
          y: centerY,
          scale: 1,
          rotation: 0,
          zIndex: categoryIndex,
        },
        isVisible: true,
      };

      addItemToCanvas(newOutfitItem);
    },
    [getCategoryItem, addItemToCanvas, removeItemFromCanvas],
  );

  // Handle randomize
  const handleRandomize = useCallback(() => {
    CATEGORIES.forEach((category) => {
      // Skip locked categories
      if (lockedCategories.has(category)) return;

      const categoryItems = getItemsByCategory(category);
      if (categoryItems.length === 0) return;

      // Pick random item
      const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
      handleItemSelect(category, randomItem);
    });
  }, [lockedCategories, getItemsByCategory, handleItemSelect]);

  // Toggle category lock
  const toggleCategoryLock = useCallback((category: ItemCategory) => {
    setLockedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to save outfits');
      return;
    }

    if (currentItems.length === 0) {
      Alert.alert('Empty Outfit', 'Please add at least one item to your outfit');
      return;
    }

    setShowSaveModal(true);
  }, [user, currentItems]);

  const confirmSave = useCallback(async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      if (isEditMode && id) {
        // Update existing outfit
        await outfitService.updateOutfit(id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
        });

        Alert.alert('Success', 'Outfit updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowSaveModal(false);
              router.back(); // Go back to outfits screen
            },
          },
        ]);
      } else {
        // Create new outfit
        await outfitService.createOutfit(user.id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
          visibility: 'private',
        });

        Alert.alert('Success', 'Outfit saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowSaveModal(false);
              setOutfitTitle('');
              resetCurrentOutfit();
              router.back(); // Go back to outfits screen
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
      Alert.alert('Error', 'Failed to save outfit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, currentItems, currentBackground, outfitTitle, isEditMode, id, resetCurrentOutfit]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Outfit' : 'Create Outfit'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={currentItems.length === 0}
          >
            <Ionicons
              name="checkmark"
              size={24}
              color={currentItems.length > 0 ? '#007AFF' : '#CCC'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Canvas */}
        <View style={styles.canvasContainer}>
          <OutfitCanvas
            items={currentItems}
            background={currentBackground}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onItemTransformUpdate={updateItemTransform}
            onItemSelect={setSelectedItemId}
            selectedItemId={selectedItemId}
            showGrid={canvasSettings.showGrid}
            snapToGrid={canvasSettings.snapToGrid}
            gridSize={canvasSettings.gridSize}
          />

          {/* Canvas Controls */}
          <View style={styles.canvasControls}>
            <TouchableOpacity
              onPress={() => undo()}
              style={[styles.controlButton, !canUndo() && styles.controlButtonDisabled]}
              disabled={!canUndo()}
            >
              <Ionicons name="arrow-undo" size={20} color={canUndo() ? '#000' : '#CCC'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => redo()}
              style={[styles.controlButton, !canRedo() && styles.controlButtonDisabled]}
              disabled={!canRedo()}
            >
              <Ionicons name="arrow-redo" size={20} color={canRedo() ? '#000' : '#CCC'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowBackgroundPicker(true)}
              style={styles.controlButton}
            >
              <Ionicons name="color-palette-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearCanvas} style={styles.controlButton}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleRandomize}
            style={styles.randomButton}
            activeOpacity={0.7}
          >
            <Ionicons name="shuffle" size={20} color="#FFF" />
            <Text style={styles.randomButtonText}>Randomize</Text>
          </TouchableOpacity>
        </View>

        {/* Category Carousels */}
        <View style={styles.carouselsContainer}>
          {CATEGORIES.map((category) => {
            const categoryItems = getItemsByCategory(category);
            const currentCategoryItem = getCategoryItem(category);

            return (
              <CategoryCarousel
                key={category}
                category={category}
                items={categoryItems}
                selectedItemId={currentCategoryItem?.itemId}
                isLocked={lockedCategories.has(category)}
                onItemSelect={(item) => handleItemSelect(category, item)}
                onLockToggle={() => toggleCategoryLock(category)}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Background Picker */}
      <BackgroundPicker
        visible={showBackgroundPicker}
        currentBackground={currentBackground}
        onSelect={setBackground}
        onClose={() => setShowBackgroundPicker(false)}
      />

      {/* Save Modal */}
      {showSaveModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.modalTitle}>{isEditMode ? 'Update Outfit' : 'Save Outfit'}</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Outfit name (optional)"
              value={outfitTitle}
              onChangeText={setOutfitTitle}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowSaveModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSave}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                disabled={isSaving}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  canvasControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  carouselsContainer: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingVertical: 16,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  randomButton: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 26,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  randomButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH - 64,
  },
  scrollContent: {
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    color: '#000',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
