import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, TextInput, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { ItemSelectionStep, CompositionStep } from '@components/outfit';
import { Text, TouchableOpacity } from 'react-native';
import { OccasionTag, Season, StyleTag } from '@types/models/outfit';
import { Dropdown } from '@components/common/Dropdown';

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
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);

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
      setSelectedOccasion(outfit.occasions?.[0] || null);
      setSelectedStyles(outfit.styles || []);
      setSelectedSeasons(outfit.seasons || []);
      // Skip Step 1 when editing - go straight to composition
      setCreationStep(2);
    } catch (error) {
      console.error('Error loading outfit:', error);
      Alert.alert('Error', 'Failed to load outfit for editing');
      router.back();
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
      const { currentBackground } = useOutfitStore.getState();

      if (isEditMode && id) {
        // Update existing outfit
        await outfitService.updateOutfit(id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
          occasions: selectedOccasion ? [selectedOccasion] : undefined,
          styles: selectedStyles.length > 0 ? selectedStyles : undefined,
          seasons: selectedSeasons.length > 0 ? selectedSeasons : undefined,
        });

        Alert.alert('Success', 'Outfit updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowSaveModal(false);
              resetCurrentOutfit();
              router.back();
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
          occasions: selectedOccasion ? [selectedOccasion] : undefined,
          styles: selectedStyles.length > 0 ? selectedStyles : undefined,
          seasons: selectedSeasons.length > 0 ? selectedSeasons : undefined,
        });

        Alert.alert('Success', 'Outfit saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowSaveModal(false);
              setOutfitTitle('');
              resetCurrentOutfit();
              router.back();
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
  }, [user, currentItems, outfitTitle, isEditMode, id, resetCurrentOutfit]);

  return (
    <View style={styles.container}>
      {/* Render appropriate step */}
      {creationStep === 1 ? (
        <ItemSelectionStep onNext={handleNextToComposition} onBack={handleBackFromStep1} />
      ) : (
        <CompositionStep onSave={handleSave} onBack={handleBackToSelection} />
      )}

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

            {/* Occasion Dropdown */}
            <Dropdown
              label="Occasion"
              value={selectedOccasion}
              options={
                [
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
                ] as const
              }
              onSelect={(value) => setSelectedOccasion(value as OccasionTag | null)}
              placeholder="Select occasion"
            />

            {/* Style Dropdown */}
            <Dropdown
              label="Style"
              value={selectedStyles}
              options={
                [
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
                ] as const
              }
              onSelect={(value) => setSelectedStyles((value as StyleTag[]) || [])}
              multiple
              placeholder="Select styles"
            />

            {/* Season Dropdown */}
            <Dropdown
              label="Season"
              value={selectedSeasons}
              options={['spring', 'summer', 'fall', 'winter'] as const}
              onSelect={(value) => setSelectedSeasons((value as Season[]) || [])}
              multiple
              placeholder="Select seasons"
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
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    zIndex: 1000,
  },
  saveModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH - 64,
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
