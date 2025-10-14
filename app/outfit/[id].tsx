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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { OutfitCanvas } from '@components/outfit/OutfitCanvas';
import { Outfit } from '../../types/models/outfit';

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

  const handleWear = useCallback(async () => {
    if (!outfit) return;

    try {
      await outfitService.incrementWearCount(outfit.id);
      Alert.alert('Logged!', 'Wear count updated');
      loadOutfit(); // Reload to show updated count
    } catch (error) {
      console.error('Error updating wear count:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit]);

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
          {outfit.description && (
            <View style={styles.infoRow}>
              <Text style={styles.description}>{outfit.description}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={20} color="#666" />
              <Text style={styles.statText}>{outfit.wearCount} wears</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.statText}>{new Date(outfit.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>

          {outfit.styles && outfit.styles.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Style:</Text>
              <View style={styles.tags}>
                {outfit.styles.map((style, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{style}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {outfit.seasons && outfit.seasons.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Season:</Text>
              <View style={styles.tags}>
                {outfit.seasons.map((season, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{season}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDuplicate}
            style={[styles.actionButton, styles.actionButtonSecondary]}
          >
            <Ionicons name="copy-outline" size={24} color="#000" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Duplicate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWear}
            style={[styles.actionButton, styles.actionButtonSecondary]}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#000" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              I Wore This
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Outfit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  dangerZone: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  deleteButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
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
  infoRow: {
    marginBottom: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
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
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statText: {
    color: '#666',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
});
