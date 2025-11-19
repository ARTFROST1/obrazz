import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TextInput,
  Dimensions,
  ScrollView,
  Keyboard,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { outfitService } from '@services/outfit/outfitService';
import { itemService } from '@services/wardrobe/itemService';
import { ItemSelectionStepNew, CompositionStep } from '@components/outfit';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OccasionTag } from '../../types/models/outfit';
import { Season, StyleTag } from '../../types/models/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * CreateScreen - Two-step outfit creation process
 * Step 1: Select items from wardrobe by category
 * Step 2: Compose items on canvas with drag & drop
 */
export default function CreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { user } = useAuthStore();
  const {
    creationStep,
    currentItems,
    setCurrentOutfit,
    resetCurrentOutfit,
    setCreationStep,
    goBackToSelection,
  } = useOutfitStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag | ''>('');
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | ''>('');
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [isLoadingOutfit, setIsLoadingOutfit] = useState(isEditMode);

  // ✅ Load wardrobe items on mount (Fix #2)
  useEffect(() => {
    const loadWardrobeItems = async () => {
      if (!user?.id) return;

      try {
        console.log('📦 [create.tsx] Loading wardrobe items from DB...');
        const items = await itemService.getUserItems(user.id);
        console.log(`✅ [create.tsx] Loaded ${items.length} wardrobe items`);

        const { setItems } = useWardrobeStore.getState();
        setItems(items);
      } catch (error) {
        console.error('❌ [create.tsx] Failed to load wardrobe items:', error);
      }
    };

    loadWardrobeItems();
  }, [user?.id]);

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
      setIsLoadingOutfit(true);
      const outfit = await outfitService.getOutfitById(outfitId);
      setCurrentOutfit(outfit);
      setOutfitTitle(outfit.title || '');
      setSelectedOccasion(outfit.occasions?.[0] || '');
      setSelectedStyles(outfit.styles && outfit.styles.length > 0 ? outfit.styles : []);
      setSelectedSeason(outfit.seasons?.[0] || '');
      // Start at Step 1 for editing to allow item changes
      setCreationStep(1);
    } catch (error) {
      console.error('Error loading outfit:', error);
      Alert.alert('Error', 'Failed to load outfit for editing');
      router.back();
    } finally {
      setIsLoadingOutfit(false);
    }
  };

  // Navigation handlers
  const handleBackFromStep1 = () => {
    if (isEditMode) {
      router.back();
    } else {
      // Confirm if user has selected items
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to go back? Your selections will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetCurrentOutfit();
              router.back();
            },
          },
        ],
      );
    }
  };

  const handleNextToComposition = () => {
    // Store handles the transition
    setCreationStep(2);
  };

  const handleBackToSelection = () => {
    goBackToSelection();
  };

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
      const { currentBackground, canvasSettings } = useOutfitStore.getState(); // ✅ Get canvasSettings

      if (isEditMode && id) {
        // Update existing outfit
        await outfitService.updateOutfit(id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
          canvasSettings, // ✅ Include canvasSettings with customTabCategories
          occasions: selectedOccasion ? [selectedOccasion] : undefined,
          styles: selectedStyles.length > 0 ? selectedStyles : undefined,
          seasons: selectedSeason ? [selectedSeason] : undefined,
        });

        setShowSaveModal(false);
        resetCurrentOutfit();
        router.back();
      } else {
        // Create new outfit
        await outfitService.createOutfit(user.id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
          canvasSettings, // ✅ Include canvasSettings with customTabCategories
          visibility: 'private',
          occasions: selectedOccasion ? [selectedOccasion] : undefined,
          styles: selectedStyles.length > 0 ? selectedStyles : undefined,
          seasons: selectedSeason ? [selectedSeason] : undefined,
        });

        setShowSaveModal(false);
        setOutfitTitle('');
        resetCurrentOutfit();
        router.back();
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
      Alert.alert('Error', 'Failed to save outfit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    currentItems,
    outfitTitle,
    selectedOccasion,
    selectedStyles,
    selectedSeason,
    isEditMode,
    id,
    resetCurrentOutfit,
  ]);

  const openPicker = (pickerType: 'occasion' | 'style' | 'season') => {
    Keyboard.dismiss();
    switch (pickerType) {
      case 'occasion':
        setShowOccasionPicker(true);
        break;
      case 'style':
        setShowStylePicker(true);
        break;
      case 'season':
        setShowSeasonPicker(true);
        break;
    }
  };

  // Show loading state while outfit is being loaded in edit mode
  if (isLoadingOutfit) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading outfit...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Render appropriate step */}
      {creationStep === 1 ? (
        <ItemSelectionStepNew onNext={handleNextToComposition} onBack={handleBackFromStep1} />
      ) : (
        <CompositionStep onSave={handleSave} onBack={handleBackToSelection} />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.saveModal}>
                <Text style={styles.modalTitle}>{isEditMode ? 'Update Outfit' : 'Save Outfit'}</Text>

                <TextInput
                  style={styles.titleInput}
                  placeholder="Outfit name (optional)"
                  value={outfitTitle}
                  onChangeText={setOutfitTitle}
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

              {/* Occasion Dropdown */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Occasion</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('occasion')}>
                  <Text style={styles.dropdownText}>
                    {selectedOccasion
                      ? selectedOccasion.charAt(0).toUpperCase() + selectedOccasion.slice(1)
                      : 'Not selected'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Style Dropdown */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Style (multiple)</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('style')}>
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {selectedStyles.length > 0
                      ? selectedStyles.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
                      : 'Not selected'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Season Dropdown */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Season</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('season')}>
                  <Text style={styles.dropdownText}>
                    {selectedSeason
                      ? selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)
                      : 'Not selected'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowSaveModal(false)}
                  style={styles.modalButton}
                >
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      )}

      {/* Occasion Picker Modal */}
      <Modal visible={showOccasionPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowOccasionPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Occasion</Text>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {[
                'casual',
                'work',
                'party',
                'date',
                'sport',
                'beach',
                'wedding',
                'travel',
                'home',
                'special',
              ].map((occasion) => (
                <TouchableOpacity
                  key={occasion}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedOccasion(occasion as OccasionTag);
                    setShowOccasionPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>
                    {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                  </Text>
                  {selectedOccasion === occasion && (
                    <Ionicons name="checkmark" size={24} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Style Picker Modal */}
      <Modal visible={showStylePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStylePicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Styles (Multiple)</Text>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {[
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
              ].map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.pickerItem,
                    selectedStyles.includes(style as StyleTag) && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    const styleTag = style as StyleTag;
                    setSelectedStyles((prev) =>
                      prev.includes(styleTag)
                        ? prev.filter((s) => s !== styleTag)
                        : [...prev, styleTag],
                    );
                  }}
                >
                  <Text style={styles.pickerItemText}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                  <View style={styles.checkmarkContainer}>
                    {selectedStyles.includes(style as StyleTag) && (
                      <Ionicons name="checkmark" size={20} color="#000" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.pickerFooter}>
              <TouchableOpacity
                style={styles.pickerDoneButton}
                onPress={() => setShowStylePicker(false)}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Season Picker Modal */}
      <Modal visible={showSeasonPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowSeasonPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Season</Text>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {['spring', 'summer', 'fall', 'winter'].map((season) => (
                <TouchableOpacity
                  key={season}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSeason(season as Season);
                    setShowSeasonPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </Text>
                  {selectedSeason === season && (
                    <Ionicons name="checkmark" size={24} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
  },
  saveModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 500,
  },
  modalTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  titleInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    color: '#000',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectorSection: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 500,
    maxHeight: 500,
    overflow: 'hidden',
  },
  pickerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 56,
    backgroundColor: '#FFF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  pickerItemSelected: {
    backgroundColor: '#F0F0F0',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  pickerDoneButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerDoneText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
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
