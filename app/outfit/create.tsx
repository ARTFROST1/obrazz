import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, TextInput, Dimensions, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { ItemSelectionStepNew, CompositionStep } from '@components/outfit';
import { Text, TouchableOpacity } from 'react-native';
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
        <ItemSelectionStepNew onNext={handleNextToComposition} onBack={handleBackFromStep1} />
      ) : (
        <CompositionStep onSave={handleSave} onBack={handleBackToSelection} />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.saveModal}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Update Outfit' : 'Save Outfit'}</Text>

              <TextInput
                style={styles.titleInput}
                placeholder="Outfit name (optional)"
                value={outfitTitle}
                onChangeText={setOutfitTitle}
                placeholderTextColor="#999"
              />

              {/* Occasion Selector */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Occasion</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagsContainer}
                >
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
                      style={[styles.tag, selectedOccasion === occasion && styles.tagSelected]}
                      onPress={() =>
                        setSelectedOccasion(
                          selectedOccasion === occasion ? null : (occasion as OccasionTag),
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.tagText,
                          selectedOccasion === occasion && styles.tagTextSelected,
                        ]}
                      >
                        {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Style Selector */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Style</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagsContainer}
                >
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
                        styles.tag,
                        selectedStyles.includes(style as StyleTag) && styles.tagSelected,
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
                      <Text
                        style={[
                          styles.tagText,
                          selectedStyles.includes(style as StyleTag) && styles.tagTextSelected,
                        ]}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Season Selector */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Season</Text>
                <View style={styles.seasonsRow}>
                  {['spring', 'summer', 'fall', 'winter'].map((season) => (
                    <TouchableOpacity
                      key={season}
                      style={[
                        styles.seasonTag,
                        selectedSeasons.includes(season as Season) && styles.tagSelected,
                      ]}
                      onPress={() => {
                        const seasonTag = season as Season;
                        setSelectedSeasons((prev) =>
                          prev.includes(seasonTag)
                            ? prev.filter((s) => s !== seasonTag)
                            : [...prev, seasonTag],
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          selectedSeasons.includes(season as Season) && styles.tagTextSelected,
                        ]}
                      >
                        {season.charAt(0).toUpperCase() + season.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
  },
  saveModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: SCREEN_WIDTH - 64,
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
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tagSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFF',
  },
  seasonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  seasonTag: {
    flex: 1,
    minWidth: '22%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
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
