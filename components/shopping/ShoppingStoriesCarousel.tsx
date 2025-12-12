import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import type { Store } from '@/types/models/store';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ShoppingStoriesCarousel() {
  const router = useRouter();
  const { stores, loadingStores, loadStores, openTab, removeStore } = useShoppingBrowserStore();
  const [longPressedStore, setLongPressedStore] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleStorePress = useCallback(
    (store: Store) => {
      openTab(store);
      router.push('/shopping/browser');
    },
    [openTab, router],
  );

  const handleRemoveStore = useCallback(
    async (storeId: string) => {
      try {
        await removeStore(storeId);
        setLongPressedStore(null);
      } catch {
        Alert.alert('Ошибка', 'Не удалось удалить магазин');
      }
    },
    [removeStore],
  );

  const handleStoreLongPress = useCallback(
    (store: Store) => {
      if (store.isDefault) {
        return; // Default stores cannot be removed
      }

      setLongPressedStore(store.id);
      Alert.alert('Управление магазином', `${store.name}`, [
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => handleRemoveStore(store.id),
        },
        {
          text: 'Отмена',
          style: 'cancel',
          onPress: () => setLongPressedStore(null),
        },
      ]);
    },
    [handleRemoveStore],
  );

  const handleAddStore = useCallback(() => {
    // TODO: Open modal to add custom store
    Alert.alert(
      'Добавить магазин',
      'Функция добавления пользовательских магазинов будет доступна в следующей версии',
    );
  }, []);

  if (loadingStores) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛍️ Магазины</Text>
        <Text style={styles.subtitle}>Найди и добавь вещь из интернет-магазина</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={80} // 64px avatar + 16px margin
      >
        {stores.map((store) => (
          <TouchableOpacity
            key={store.id}
            style={styles.storeItem}
            onPress={() => handleStorePress(store)}
            onLongPress={() => handleStoreLongPress(store)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.avatarContainer,
                longPressedStore === store.id && styles.avatarContainerPressed,
              ]}
            >
              {store.faviconUrl ? (
                <Image
                  source={{ uri: store.faviconUrl }}
                  style={styles.avatar}
                  onError={() => console.log('Failed to load favicon for', store.name)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{store.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.storeName} numberOfLines={1}>
              {store.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Add Store Button */}
        <TouchableOpacity style={styles.storeItem} onPress={handleAddStore} activeOpacity={0.7}>
          <View style={[styles.avatarContainer, styles.addButton]}>
            <Text style={styles.addButtonText}>+</Text>
          </View>
          <Text style={styles.storeName}>Добавить</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 140,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  storeItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    height: 64,
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    width: 64,
  },
  avatarContainerPressed: {
    borderColor: '#FF3B30',
    borderWidth: 3,
  },
  avatar: {
    height: 60,
    width: 60,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  storeName: {
    color: '#333333',
    fontSize: 11,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#999999',
    fontSize: 32,
    fontWeight: '300',
  },
});
