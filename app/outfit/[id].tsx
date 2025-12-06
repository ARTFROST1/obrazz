import { OutfitCanvas } from '@components/outfit/OutfitCanvas';
import { Ionicons } from '@expo/vector-icons';
import { outfitService } from '@services/outfit/outfitService';
import { useAuthStore } from '@store/auth/authStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { OccasionTag, Outfit } from '../../types/models/outfit';
import { Season, StyleTag } from '../../types/models/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = (CANVAS_WIDTH / 3) * 4;

// Helper function to get occasion icon
const getOccasionIcon = (occasion?: string): keyof typeof Ionicons.glyphMap => {
  switch (occasion) {
    case 'casual':
      return 'cafe-outline';
    case 'work':
      return 'briefcase-outline';
    case 'party':
      return 'musical-notes-outline';
    case 'date':
      return 'heart-outline';
    case 'sport':
      return 'fitness-outline';
    case 'beach':
      return 'sunny-outline';
    case 'wedding':
      return 'flower-outline';
    case 'travel':
      return 'airplane-outline';
    case 'home':
      return 'home-outline';
    case 'special':
      return 'sparkles-outline';
    default:
      return 'ellipse-outline';
  }
};

// Helper function to get season icon
const getSeasonIcon = (season?: string): keyof typeof Ionicons.glyphMap => {
  switch (season) {
    case 'spring':
      return 'flower-outline';
    case 'summer':
      return 'sunny-outline';
    case 'fall':
      return 'leaf-outline';
    case 'winter':
      return 'snow-outline';
    default:
      return 'ellipse-outline';
  }
};

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { updateOutfit: updateOutfitInStore, deleteOutfit: deleteOutfitFromStore } =
    useOutfitStore();

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag | ''>('');
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | ''>('');
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Inline editing states
  const [activeMetadataCard, setActiveMetadataCard] = useState<
    'occasion' | 'style' | 'season' | null
  >(null);

  useEffect(() => {
    loadOutfit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOutfit = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const outfitData = await outfitService.getOutfitById(id);
      setOutfit(outfitData);
      setIsFavorite(outfitData.isFavorite);
      // Set initial values for update modal
      setOutfitTitle(outfitData.title || '');
      setSelectedOccasion(outfitData.occasions?.[0] || '');
      setSelectedStyles(outfitData.styles && outfitData.styles.length > 0 ? outfitData.styles : []);
      setSelectedSeason(outfitData.seasons?.[0] || '');
    } catch (error) {
      console.error('Error loading outfit:', error);
      Alert.alert('Error', 'Failed to load outfit');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback(() => {
    if (!outfit) return;
    // Navigate to create screen in edit mode with outfit ID as query param
    router.push(`/outfit/create?id=${outfit.id}`);
  }, [outfit]);

  const handleToggleFavorite = useCallback(async () => {
    if (!outfit?.id) return;

    try {
      const newFavoriteStatus = !isFavorite;
      await outfitService.toggleFavorite(outfit.id, newFavoriteStatus);
      setIsFavorite(newFavoriteStatus);
      updateOutfitInStore(outfit.id, { isFavorite: newFavoriteStatus });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [outfit?.id, isFavorite, updateOutfitInStore]);

  const handleDelete = useCallback(() => {
    if (!outfit) return;

    Alert.alert('Delete Outfit', 'Are you sure you want to delete this outfit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await outfitService.deleteOutfit(outfit.id);
            deleteOutfitFromStore(outfit.id);
            router.back();
          } catch (error) {
            console.error('Error deleting outfit:', error);
            Alert.alert('Error', 'Failed to delete outfit');
          }
        },
      },
    ]);
  }, [outfit, deleteOutfitFromStore]);

  const handleUpdateMetadata = async () => {
    if (!outfit) return;

    try {
      setIsUpdating(true);
      await outfitService.updateOutfit(outfit.id, {
        title: outfitTitle || 'My Outfit',
        occasions: selectedOccasion ? [selectedOccasion] : undefined,
        styles: selectedStyles.length > 0 ? selectedStyles : undefined,
        seasons: selectedSeason ? [selectedSeason] : undefined,
      });

      // Update local state
      setOutfit({
        ...outfit,
        title: outfitTitle,
        occasions: selectedOccasion ? [selectedOccasion] : undefined,
        styles: selectedStyles.length > 0 ? selectedStyles : [],
        seasons: selectedSeason ? [selectedSeason] : [],
      });

      updateOutfitInStore(outfit.id, {
        title: outfitTitle,
        occasions: selectedOccasion ? [selectedOccasion] : undefined,
        styles: selectedStyles.length > 0 ? selectedStyles : undefined,
        seasons: selectedSeason ? [selectedSeason] : undefined,
      });

      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating outfit:', error);
      Alert.alert('Error', 'Failed to update outfit information');
    } finally {
      setIsUpdating(false);
    }
  };

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

  // Handle inline metadata card tap - opens inline picker
  const handleMetadataCardTap = (type: 'occasion' | 'style' | 'season') => {
    setActiveMetadataCard(activeMetadataCard === type ? null : type);
  };

  // Handle inline occasion selection
  const handleInlineOccasionSelect = async (occasion: OccasionTag) => {
    if (!outfit) return;

    try {
      await outfitService.updateOutfit(outfit.id, {
        occasions: [occasion],
      });

      setOutfit({
        ...outfit,
        occasions: [occasion],
      });
      setSelectedOccasion(occasion);
      updateOutfitInStore(outfit.id, { occasions: [occasion] });
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating occasion:', error);
      Alert.alert('Error', 'Failed to update occasion');
    }
  };

  // Handle inline style selection
  const handleInlineStyleSelect = async (style: StyleTag) => {
    if (!outfit) return;

    // Toggle style - add if not present, remove if present
    const currentStyles = outfit.styles || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter((s) => s !== style)
      : [...currentStyles, style];

    try {
      await outfitService.updateOutfit(outfit.id, {
        styles: newStyles.length > 0 ? newStyles : undefined,
      });

      setOutfit({
        ...outfit,
        styles: newStyles,
      });
      setSelectedStyles(newStyles);
      updateOutfitInStore(outfit.id, { styles: newStyles.length > 0 ? newStyles : undefined });
    } catch (error) {
      console.error('Error updating style:', error);
      Alert.alert('Error', 'Failed to update style');
    }
  };

  // Handle inline season selection
  const handleInlineSeasonSelect = async (season: Season) => {
    if (!outfit) return;

    try {
      await outfitService.updateOutfit(outfit.id, {
        seasons: [season],
      });

      setOutfit({
        ...outfit,
        seasons: [season],
      });
      setSelectedSeason(season);
      updateOutfitInStore(outfit.id, { seasons: [season] });
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating season:', error);
      Alert.alert('Error', 'Failed to update season');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!outfit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Outfit not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {outfit.title || 'Outfit'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconButton}>
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? '#FFD700' : '#000'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Canvas Preview */}
        <View style={styles.canvasContainer}>
          <OutfitCanvas
            items={outfit.items}
            background={outfit.background}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onItemTransformUpdate={() => {}}
            showGrid={false}
            snapToGrid={false}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Title Row with Edit Icon */}
          <View style={styles.titleRow}>
            <Text style={styles.outfitTitle}>{outfit.title || 'Untitled Outfit'}</Text>
            <TouchableOpacity onPress={() => setShowUpdateModal(true)} style={styles.editIcon}>
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Metadata Cards in Row */}
          <View style={styles.metadataRow}>
            {/* Occasion Card - Tappable for inline editing */}
            <TouchableOpacity
              style={[
                styles.metadataCard,
                activeMetadataCard === 'occasion' && styles.metadataCardActive,
              ]}
              onPress={() => handleMetadataCardTap('occasion')}
              activeOpacity={0.7}
            >
              <View style={styles.metadataIconContainer}>
                <Ionicons name={getOccasionIcon(outfit.occasions?.[0])} size={24} color="#000" />
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {outfit.occasions && outfit.occasions.length > 0
                    ? outfit.occasions[0].charAt(0).toUpperCase() + outfit.occasions[0].slice(1)
                    : '—'}
                </Text>
              </View>
              <Text style={styles.metadataLabel}>Occasion</Text>
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
              <View style={styles.metadataIconContainer}>
                <Ionicons name="shirt-outline" size={24} color="#000" />
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {outfit.styles && outfit.styles.length > 0
                    ? outfit.styles[0].charAt(0).toUpperCase() + outfit.styles[0].slice(1)
                    : '—'}
                </Text>
              </View>
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
              <View style={styles.metadataIconContainer}>
                <Ionicons name={getSeasonIcon(outfit.seasons?.[0])} size={24} color="#000" />
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {outfit.seasons && outfit.seasons.length > 0
                    ? outfit.seasons[0].charAt(0).toUpperCase() + outfit.seasons[0].slice(1)
                    : '—'}
                </Text>
              </View>
              <Text style={styles.metadataLabel}>Season</Text>
            </TouchableOpacity>

            {/* Date Card - Not editable */}
            <View style={styles.metadataCard}>
              <View style={styles.metadataIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#000" />
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {new Date(outfit.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.metadataLabel}>Created</Text>
            </View>
          </View>

          {/* Inline Occasion Picker */}
          {activeMetadataCard === 'occasion' && (
            <View style={styles.inlinePickerContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlinePickerScroll}
              >
                {(
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
                  ] as OccasionTag[]
                ).map((occasion) => (
                  <TouchableOpacity
                    key={occasion}
                    style={[
                      styles.inlinePickerItem,
                      outfit.occasions?.[0] === occasion && styles.inlinePickerItemActive,
                    ]}
                    onPress={() => handleInlineOccasionSelect(occasion)}
                  >
                    <Ionicons
                      name={getOccasionIcon(occasion)}
                      size={20}
                      color={outfit.occasions?.[0] === occasion ? '#FFF' : '#000'}
                    />
                    <Text
                      style={[
                        styles.inlinePickerItemText,
                        outfit.occasions?.[0] === occasion && styles.inlinePickerItemTextActive,
                      ]}
                    >
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
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
                    'formal',
                    'sporty',
                    'elegant',
                    'vintage',
                    'minimalist',
                    'bohemian',
                    'streetwear',
                    'preppy',
                    'romantic',
                  ] as StyleTag[]
                ).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.inlinePickerItem,
                      outfit.styles?.includes(style) && styles.inlinePickerItemActive,
                    ]}
                    onPress={() => handleInlineStyleSelect(style)}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={outfit.styles?.includes(style) ? '#FFF' : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.inlinePickerItemText,
                        outfit.styles?.includes(style) && styles.inlinePickerItemTextActive,
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
                      outfit.seasons?.[0] === season && styles.inlinePickerItemActive,
                    ]}
                    onPress={() => handleInlineSeasonSelect(season)}
                  >
                    <Ionicons
                      name={getSeasonIcon(season)}
                      size={20}
                      color={outfit.seasons?.[0] === season ? '#FFF' : '#000'}
                    />
                    <Text
                      style={[
                        styles.inlinePickerItemText,
                        outfit.seasons?.[0] === season && styles.inlinePickerItemTextActive,
                      ]}
                    >
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {outfit.description && <Text style={styles.description}>{outfit.description}</Text>}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Edit Outfit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Outfit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Update Outfit Modal */}
      {showUpdateModal && (
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
              <View style={styles.updateModal}>
                <Text style={styles.modalTitle}>Update Outfit</Text>

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
                        ? selectedStyles
                            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                            .join(', ')
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
                    onPress={() => setShowUpdateModal(false)}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpdateMetadata}
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
                  style={styles.pickerItem}
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
                  {selectedStyles.includes(style as StyleTag) && (
                    <Ionicons name="checkmark" size={24} color="#000" />
                  )}
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
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  actionButtonSecondary: {
    backgroundColor: '#F8F8F8',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#000',
  },
  actionsSection: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backButton: {
    padding: 8,
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF3B30',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: '#999',
    fontSize: 16,
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
  headerTitle: {
    color: '#000',
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outfitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  editIcon: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metadataCard: {
    flex: 1,
    alignItems: 'center',
  },
  metadataIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 4,
  },
  metadataValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  metadataLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
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
  updateModal: {
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
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
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
  },
  pickerItemText: {
    fontSize: 16,
    color: '#000',
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
  // Inline Picker Styles
  metadataCardActive: {
    borderColor: '#000',
    borderWidth: 2,
    backgroundColor: '#F8F8F8',
  },
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 4,
  },
  inlinePickerItemActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  inlinePickerItemText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  inlinePickerItemTextActive: {
    color: '#FFF',
  },
});
