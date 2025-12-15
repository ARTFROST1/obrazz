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
  const { stores, loadingStores, loadStores, openAllTabs, removeStore } = useShoppingBrowserStore();
  const [longPressedStore, setLongPressedStore] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleStorePress = useCallback(
    (clickedStore: Store) => {
      // Safety check: ensure stores exist
      if (!stores || stores.length === 0) {
        Alert.alert('Ошибка', 'Магазины не загружены. Попробуйте обновить страницу.');
        return;
      }

      // Find index of clicked store
      const clickedStoreIndex = stores.findIndex((s) => s.id === clickedStore.id);

      // Open all stores at once with clicked store as active
      openAllTabs(stores, clickedStoreIndex !== -1 ? clickedStoreIndex : 0);

      // Navigate to browser - it will show all tabs in carousel
      router.push('/shopping/browser');
    },
    [stores, openAllTabs, router],
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

  // Render store logo with priority: local asset > remote URL > monogram
  const renderStoreLogo = useCallback((store: Store) => {
    // Priority 1: Local asset for default stores
    if (store.logoLocal) {
      return <Image source={store.logoLocal} style={styles.avatar} resizeMode="contain" />;
    }

    // Priority 2: Remote URL (favicon) for custom stores
    if (store.logoUrl) {
      return (
        <Image
          source={{ uri: store.logoUrl }}
          style={styles.avatar}
          resizeMode="contain"
          onError={(e) => {
            console.log('Failed to load logo for', store.name, e.nativeEvent.error);
          }}
        />
      );
    }

    // Priority 3: Monogram fallback
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{store.name.charAt(0).toUpperCase()}</Text>
      </View>
    );
  }, []);

  if (loadingStores) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  // Handle empty stores state
  if (!stores || stores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              {renderStoreLogo(store)}
            </View>
            <Text style={styles.storeName} numberOfLines={1}>
              {store.name}
            </Text>
          </TouchableOpacity>
        ))}
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
    height: 100,
    justifyContent: 'center',
  },
  loadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    color: '#999999',
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
    textTransform: 'uppercase',
  },
  storeName: {
    color: '#333333',
    fontSize: 11,
    textAlign: 'center',
  },
});
