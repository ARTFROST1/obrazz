import { OutfitCanvas } from '@components/outfit/OutfitCanvas';
import { Ionicons } from '@expo/vector-icons';
import { outfitServiceOffline } from '@services/outfit/outfitServiceOffline';
import { useNetworkStatus } from '@services/sync';
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

// Helper function to get occasion sticker (emoji)
const getOccasionSticker = (occasion?: string): string => {
  switch (occasion) {
    case 'casual':
      return '☕';
    case 'work':
      return '💼';
    case 'party':
      return '🎉';
    case 'date':
      return '❤️';
    case 'sport':
      return '🏃';
    case 'beach':
      return '🏖️';
    case 'wedding':
      return '💒';
    case 'travel':
      return '✈️';
    case 'home':
      return '🏠';
    case 'special':
      return '✨';
    default:
      return '📍';
  }
};

// Helper function to get style sticker (emoji)
const getStyleSticker = (style?: string): string => {
  switch (style) {
    case 'casual':
      return '👕';
    case 'formal':
      return '🎩';
    case 'classic':
      return '🎩'; // Alias for formal
    case 'sporty':
      return '⚽';
    case 'sport':
      return '⚽'; // Alias for sporty
    case 'elegant':
      return '💎';
    case 'vintage':
      return '🎸'; // Changed to match indie style
    case 'minimalist':
      return '⬜';
    case 'bohemian':
      return '🌻'; // Matches cottagecore
    case 'streetwear':
      return '🏙️'; // Matches downtown
    case 'preppy':
      return '🎓';
    case 'romantic':
      return '🌹';
    // Add missing styles from unified list
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
      return '👔';
  }
};

// Helper function to get season sticker (emoji)
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

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    outfits,
    updateOutfit: updateOutfitInStore,
    deleteOutfit: deleteOutfitFromStore,
  } = useOutfitStore();
  const { isOnline } = useNetworkStatus();

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

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const titleInputRef = React.useRef<TextInput>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const titleRowRef = React.useRef<View>(null);
  const [titleRowY, setTitleRowY] = useState(0);

  useEffect(() => {
    loadOutfit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Offline-first: Load from cache immediately, refresh in background
  const loadOutfit = async () => {
    if (!id) return;

    // First, try to get from store cache (instant)
    const cachedOutfit = outfits.find((o) => o.id === id);
    if (cachedOutfit) {
      setOutfit(cachedOutfit);
      setIsFavorite(cachedOutfit.isFavorite);
      setOutfitTitle(cachedOutfit.title || '');
      setSelectedOccasion(cachedOutfit.occasions?.[0] || '');
      setSelectedStyles(
        cachedOutfit.styles && cachedOutfit.styles.length > 0 ? cachedOutfit.styles : [],
      );
      setSelectedSeason(cachedOutfit.seasons?.[0] || '');
      setIsLoading(false);
      console.log('[OutfitDetail] Loaded from cache instantly');
      return;
    }

    // Not in cache - try to fetch from server
    if (!isOnline) {
      setIsLoading(false);
      Alert.alert('Offline', 'Outfit not available offline');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const outfitData = await outfitServiceOffline.getOutfitById(id);
      if (outfitData) {
        setOutfit(outfitData);
        setIsFavorite(outfitData.isFavorite);
        setOutfitTitle(outfitData.title || '');
        setSelectedOccasion(outfitData.occasions?.[0] || '');
        setSelectedStyles(
          outfitData.styles && outfitData.styles.length > 0 ? outfitData.styles : [],
        );
        setSelectedSeason(outfitData.seasons?.[0] || '');
      } else {
        Alert.alert('Error', 'Outfit not found');
        router.back();
      }
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
      // Offline-first: updates locally immediately, syncs in background
      await outfitServiceOffline.toggleFavorite(outfit.id, newFavoriteStatus);
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (isOnline) Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [outfit?.id, isFavorite, isOnline]);

  const handleDelete = useCallback(() => {
    if (!outfit) return;

    Alert.alert('Delete Outfit', 'Are you sure you want to delete this outfit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Offline-first: deletes locally immediately, syncs in background
            await outfitServiceOffline.deleteOutfit(outfit.id);
            router.back();
          } catch (error) {
            console.error('Error deleting outfit:', error);
            if (isOnline) Alert.alert('Error', 'Failed to delete outfit');
          }
        },
      },
    ]);
  }, [outfit, isOnline]);

  const handleUpdateMetadata = async () => {
    if (!outfit) return;

    try {
      setIsUpdating(true);
      // Offline-first: updates locally immediately, syncs in background
      // The service handles store updates automatically
      await outfitServiceOffline.updateOutfit(outfit.id, {
        title: outfitTitle || 'My Outfit',
        occasions: selectedOccasion ? [selectedOccasion] : undefined,
        styles: selectedStyles.length > 0 ? selectedStyles : undefined,
        seasons: selectedSeason ? [selectedSeason] : undefined,
      });

      // Update local component state
      setOutfit({
        ...outfit,
        title: outfitTitle,
        occasions: selectedOccasion ? [selectedOccasion] : undefined,
        styles: selectedStyles.length > 0 ? selectedStyles : [],
        seasons: selectedSeason ? [selectedSeason] : [],
      });

      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating outfit:', error);
      if (isOnline) Alert.alert('Error', 'Failed to update outfit information');
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

  // Start inline title editing
  const handleStartTitleEdit = useCallback(() => {
    if (!outfit) return;
    setEditingTitleValue(outfit.title || '');
    setIsEditingTitle(true);
    // Focus the input and scroll to title after state update
    setTimeout(() => {
      titleInputRef.current?.focus();
      // Scroll to title row to ensure it's visible above keyboard
      if (scrollViewRef.current && titleRowY > 0) {
        scrollViewRef.current.scrollTo({ y: titleRowY - 100, animated: true });
      }
    }, 100);
  }, [outfit, titleRowY]);

  // Save inline title
  const handleSaveTitle = useCallback(async () => {
    if (!outfit) return;

    const newTitle = editingTitleValue.trim() || 'My Outfit';

    try {
      // Offline-first: updates locally immediately, syncs in background
      await outfitServiceOffline.updateOutfit(outfit.id, { title: newTitle });
      setOutfit({ ...outfit, title: newTitle });
      setOutfitTitle(newTitle);
      setIsEditingTitle(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error updating title:', error);
      if (isOnline) Alert.alert('Error', 'Failed to update title');
    }
  }, [outfit, editingTitleValue, isOnline]);

  // Handle inline occasion selection
  const handleInlineOccasionSelect = async (occasion: OccasionTag) => {
    if (!outfit) return;

    try {
      // Offline-first: updates locally immediately, syncs in background
      await outfitServiceOffline.updateOutfit(outfit.id, {
        occasions: [occasion],
      });

      setOutfit({
        ...outfit,
        occasions: [occasion],
      });
      setSelectedOccasion(occasion);
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating occasion:', error);
      if (isOnline) Alert.alert('Error', 'Failed to update occasion');
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
      // Offline-first: updates locally immediately, syncs in background
      await outfitServiceOffline.updateOutfit(outfit.id, {
        styles: newStyles.length > 0 ? newStyles : undefined,
      });

      setOutfit({
        ...outfit,
        styles: newStyles,
      });
      setSelectedStyles(newStyles);
    } catch (error) {
      console.error('Error updating style:', error);
      if (isOnline) Alert.alert('Error', 'Failed to update style');
    }
  };

  // Handle inline season selection
  const handleInlineSeasonSelect = async (season: Season) => {
    if (!outfit) return;

    try {
      // Offline-first: updates locally immediately, syncs in background
      await outfitServiceOffline.updateOutfit(outfit.id, {
        seasons: [season],
      });

      setOutfit({
        ...outfit,
        seasons: [season],
      });
      setSelectedSeason(season);
      setActiveMetadataCard(null);
    } catch (error) {
      console.error('Error updating season:', error);
      if (isOnline) Alert.alert('Error', 'Failed to update season');
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
          <View
            style={styles.infoSection}
            onLayout={(event) => {
              // Capture position of info section (includes title) relative to scroll content
              setTitleRowY(event.nativeEvent.layout.y);
            }}
          >
            {/* Title Row with Inline Edit */}
            <View style={styles.titleRow} ref={titleRowRef}>
              {isEditingTitle ? (
                <TextInput
                  ref={titleInputRef}
                  style={styles.titleInputInline}
                  value={editingTitleValue}
                  onChangeText={setEditingTitleValue}
                  onSubmitEditing={handleSaveTitle}
                  onBlur={handleSaveTitle}
                  placeholder="Outfit name"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  autoFocus
                />
              ) : (
                <Text style={styles.outfitTitle}>{outfit.title || 'Untitled Outfit'}</Text>
              )}
              <TouchableOpacity
                onPress={isEditingTitle ? handleSaveTitle : handleStartTitleEdit}
                style={styles.editIcon}
              >
                <Ionicons
                  name={isEditingTitle ? 'checkmark' : 'create-outline'}
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Metadata Cards in Row */}
            <View style={styles.metadataRow}>
              {/* Occasion Card - Tappable for inline editing */}
              <TouchableOpacity
                style={styles.metadataCard}
                onPress={() => handleMetadataCardTap('occasion')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.metadataIconContainer,
                    activeMetadataCard === 'occasion' && styles.metadataIconContainerActive,
                  ]}
                >
                  <Text style={styles.metadataSticker}>
                    {getOccasionSticker(outfit.occasions?.[0])}
                  </Text>
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
                style={styles.metadataCard}
                onPress={() => handleMetadataCardTap('style')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.metadataIconContainer,
                    activeMetadataCard === 'style' && styles.metadataIconContainerActive,
                  ]}
                >
                  <Text style={styles.metadataSticker}>{getStyleSticker(outfit.styles?.[0])}</Text>
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
                style={styles.metadataCard}
                onPress={() => handleMetadataCardTap('season')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.metadataIconContainer,
                    activeMetadataCard === 'season' && styles.metadataIconContainerActive,
                  ]}
                >
                  <Text style={styles.metadataSticker}>
                    {getSeasonSticker(outfit.seasons?.[0])}
                  </Text>
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
                  <Text style={styles.metadataSticker}>📅</Text>
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
                      <Text style={styles.inlinePickerSticker}>{getOccasionSticker(occasion)}</Text>
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
                      <Text style={styles.inlinePickerSticker}>{getStyleSticker(style)}</Text>
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
                      <Text style={styles.inlinePickerSticker}>{getSeasonSticker(season)}</Text>
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
      </KeyboardAvoidingView>

      {/* Update Outfit Modal */}
      {showUpdateModal && (
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
  titleInputInline: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 0,
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
  metadataSticker: {
    fontSize: 22,
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
    // No border, just darken the background
  },
  metadataIconContainerActive: {
    backgroundColor: '#E8E8E8',
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
    justifyContent: 'center',
    gap: 4,
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 4,
  },
  inlinePickerSticker: {
    fontSize: 16,
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
