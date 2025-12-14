import type { CartItem } from '@/types/models/store';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CartItemRowProps {
  item: CartItem;
  onDelete: (itemId: string) => void;
  onPress?: (item: CartItem) => void;
}

export default function CartItemRow({ item, onDelete, onPress }: CartItemRowProps) {
  const handleDelete = () => {
    onDelete(item.id);
  };

  const handlePress = () => {
    onPress?.(item);
  };

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      {/* Thumbnail */}
      <Image source={{ uri: item.image.url }} style={styles.thumbnail} resizeMode="cover" />

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.sourceName}
        </Text>
        <Text style={styles.source} numberOfLines={1}>
          {getDomain(item.sourceUrl)}
        </Text>
        <Text style={styles.dimensions}>
          {item.image.width} × {item.image.height} px
        </Text>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  source: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  dimensions: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
