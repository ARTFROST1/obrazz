import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { OutfitCanvas } from '@components/outfit/OutfitCanvas';
import { Dropdown } from '@components/common/Dropdown';
import { Outfit, OccasionTag, Season, StyleTag } from '../../types/models/outfit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = (CANVAS_WIDTH / 3) * 4;

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { updateOutfit: updateOutfitInStore, deleteOutfit: deleteOutfitFromStore } =
    useOutfitStore();

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editOccasion, setEditOccasion] = useState<OccasionTag | null>(null);
  const [editStyles, setEditStyles] = useState<StyleTag[]>([]);
  const [editSeason, setEditSeason] = useState<Season | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!outfit) return;

    try {
      const newFavoriteStatus = !isFavorite;
      await outfitService.toggleFavorite(outfit.id, newFavoriteStatus);
      setIsFavorite(newFavoriteStatus);
      updateOutfitInStore(outfit.id, { isFavorite: newFavoriteStatus });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [outfit, isFavorite, updateOutfitInStore]);

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
            Alert.alert('Success', 'Outfit deleted successfully');
            router.back();
          } catch (error) {
            console.error('Error deleting outfit:', error);
            Alert.alert('Error', 'Failed to delete outfit');
          }
        },
      },
    ]);
  }, [outfit, deleteOutfitFromStore]);

  const handleDuplicate = useCallback(async () => {
    if (!outfit || !user?.id) return;

    try {
      await outfitService.duplicateOutfit(outfit.id, user.id);
      Alert.alert('Success', 'Outfit duplicated successfully!');
      router.back();
    } catch (error) {
      console.error('Error duplicating outfit:', error);
      Alert.alert('Error', 'Failed to duplicate outfit');
    }
  }, [outfit, user]);

  const handleEditInfo = useCallback(() => {
    if (!outfit) return;
    setEditTitle(outfit.title || '');
    setEditOccasion(outfit.occasions?.[0] || null);
    setEditStyles(outfit.styles || []);
    setEditSeason(outfit.seasons?.[0] || null);
    setShowEditInfoModal(true);
  }, [outfit]);

  const handleSaveInfo = useCallback(async () => {
    if (!outfit) return;

    setIsSaving(true);
    try {
      await outfitService.updateOutfit(outfit.id, {
        title: editTitle || outfit.title,
        occasions: editOccasion ? [editOccasion] : undefined,
        styles: editStyles.length > 0 ? editStyles : undefined,
        seasons: editSeason ? [editSeason] : undefined,
      });

      // Update local state
      const updatedOutfit = {
        ...outfit,
        title: editTitle || outfit.title,
        occasions: editOccasion ? [editOccasion] : undefined,
        styles: editStyles.length > 0 ? editStyles : undefined,
        seasons: editSeason ? [editSeason] : undefined,
      };
      setOutfit(updatedOutfit);
      updateOutfitInStore(outfit.id, updatedOutfit);

      Alert.alert('Success', 'Outfit information updated!');
      setShowEditInfoModal(false);
    } catch (error) {
      console.error('Error updating outfit info:', error);
      Alert.alert('Error', 'Failed to update outfit information');
    } finally {
      setIsSaving(false);
    }
  }, [outfit, editTitle, editOccasion, editStyles, editSeason, updateOutfitInStore]);

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
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FF3B30' : '#000'}
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
          {/* Outfit Title */}
          <View style={styles.titleSection}>
            <Text style={styles.outfitTitle}>{outfit.title || 'Outfit'}</Text>
            <TouchableOpacity onPress={handleEditInfo} style={styles.editIconButton}>
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {outfit.description && (
            <View style={styles.infoRow}>
              <Text style={styles.description}>{outfit.description}</Text>
            </View>
          )}

          {/* Metadata Section */}
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Occasion: </Text>
            <Text
              style={[
                styles.metadataValue,
                (!outfit.occasions || outfit.occasions.length === 0) && styles.metadataPlaceholder,
              ]}
            >
              {outfit.occasions && outfit.occasions.length > 0
                ? outfit.occasions.map((o) => o.charAt(0).toUpperCase() + o.slice(1)).join(', ')
                : 'not selected'}
            </Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Style: </Text>
            <Text
              style={[
                styles.metadataValue,
                (!outfit.styles || outfit.styles.length === 0) && styles.metadataPlaceholder,
              ]}
            >
              {outfit.styles && outfit.styles.length > 0
                ? outfit.styles.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
                : 'not selected'}
            </Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Season: </Text>
            <Text
              style={[
                styles.metadataValue,
                (!outfit.seasons || outfit.seasons.length === 0) && styles.metadataPlaceholder,
              ]}
            >
              {outfit.seasons && outfit.seasons.length > 0
                ? outfit.seasons.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
                : 'not selected'}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>{new Date(outfit.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Edit Outfit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.actionButton, styles.actionButtonSecondary]}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Outfit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Info Modal */}
      {showEditInfoModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.modalTitle}>Edit Outfit Info</Text>

            <TextInput
              style={styles.titleInput}
              placeholder="Outfit name"
              value={editTitle}
              onChangeText={setEditTitle}
              placeholderTextColor="#999"
            />

            {/* Occasion Dropdown */}
            <Dropdown
              label="Occasion"
              value={editOccasion}
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
              onSelect={(value) => setEditOccasion(value as OccasionTag | null)}
              placeholder="Select occasion"
            />

            {/* Style Dropdown */}
            <Dropdown
              label="Style"
              value={editStyles}
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
              onSelect={(value) => setEditStyles((value as StyleTag[]) || [])}
              multiple
              placeholder="Select styles"
            />

            {/* Season Dropdown */}
            <Dropdown
              label="Season"
              value={editSeason}
              options={['spring', 'summer', 'fall', 'winter'] as const}
              onSelect={(value) => setEditSeason(value as Season | null)}
              placeholder="Select season"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowEditInfoModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveInfo}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                disabled={isSaving}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {isSaving ? 'Saving...' : 'Save'}
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
    gap: 12,
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
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metadataLabel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  metadataValue: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  description: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  descriptionPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  metadataPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
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
  infoRow: {
    marginBottom: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  titleSection: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
  },
  outfitTitle: {
    color: '#000',
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
  },
  editIconButton: {
    marginLeft: 12,
    padding: 4,
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
  editModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH - 64,
    maxHeight: '80%',
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
