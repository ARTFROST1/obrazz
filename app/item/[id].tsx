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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { itemService } from '@services/wardrobe/itemService';
import { WardrobeItem } from '@types/models/item';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateItem, deleteItem: deleteItemFromStore } = useWardrobeStore();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
          <Text style={styles.itemTitle}>{item.title || 'Untitled Item'}</Text>
          <View style={styles.row}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
            {item.brand && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValue}>{item.brand}</Text>
              </View>
            )}
            {item.size && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Size</Text>
                <Text style={styles.infoValue}>{item.size}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Colors */}
        {item.colors && item.colors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colors</Text>
            <View style={styles.colorsContainer}>
              {item.colors.map((color, index) => (
                <View key={index} style={[styles.colorCircle, { backgroundColor: color.hex }]} />
              ))}
            </View>
          </View>
        )}

        {/* Styles */}
        {item.styles && item.styles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Styles</Text>
            <View style={styles.tagsContainer}>
              {item.styles.map((style, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{style}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Seasons */}
        {item.seasons && item.seasons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seasons</Text>
            <View style={styles.tagsContainer}>
              {item.seasons.map((season, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{season}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
  itemTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
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
});
