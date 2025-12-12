import CartItemRow from '@/components/shopping/CartItemRow';
import { useBatchItemProcessing } from '@/hooks/useBatchItemProcessing';
import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CartScreen() {
  const router = useRouter();

  const { cartItems, removeFromCart, clearCart } = useShoppingBrowserStore();

  const { processBatchFromCart } = useBatchItemProcessing();

  const count = cartItems.length;

  const handleDelete = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleClearCart = () => {
    Alert.alert('Очистить корзину?', 'Все вещи будут удалены из корзины', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Очистить',
        style: 'destructive',
        onPress: async () => {
          await clearCart();
        },
      },
    ]);
  };

  const handleAddAll = async () => {
    if (count === 0) return;

    // Navigate back to browser
    router.back();

    // Start batch processing
    await processBatchFromCart();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Корзина',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          ),
          headerRight: () =>
            count > 0 ? (
              <TouchableOpacity style={styles.headerButton} onPress={handleClearCart}>
                <Text style={styles.clearText}>Очистить</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Content */}
        {count === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Корзина пуста</Text>
            <Text style={styles.emptyText}>
              Добавьте вещи из магазинов,{'\n'}
              чтобы добавить их в гардероб{'\n'}
              позже.
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Вернуться к магазинам</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header Info */}
            <View style={styles.infoHeader}>
              <Text style={styles.infoText}>
                {count} {count === 1 ? 'вещь' : count < 5 ? 'вещи' : 'вещей'} для добавления
              </Text>
            </View>

            {/* Items List */}
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CartItemRow item={item} onDelete={handleDelete} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAddAll}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Добавить всё ({count}) ➕</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerButton: {
    padding: 8,
  },
  clearText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '500',
  },
  infoHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
