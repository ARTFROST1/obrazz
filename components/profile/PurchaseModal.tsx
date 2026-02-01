/**
 * PurchaseModal - IAP Purchase Selection
 *
 * Shows available:
 * - Subscriptions (Pro/Max monthly/yearly)
 * - Token packs (10/30/100/300)
 *
 * For Russian users: Shows web payment option
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { iapService, ProductInfo } from '@services/iap/iapService';
import { subscriptionService } from '@services/subscription/subscriptionService';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PurchaseType = 'subscription' | 'tokens';

interface PurchaseModalProps {
  visible: boolean;
  type: PurchaseType;
  onClose: () => void;
}

export function PurchaseModal({ visible, type, onClose }: PurchaseModalProps) {
  const { t } = useTranslation('profile');
  const insets = useSafeAreaInsets();
  const { paymentRegion } = useSubscriptionStore();

  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const isRussianUser = paymentRegion === 'ru';

  // Load products on mount
  useEffect(() => {
    if (!visible) return;

    const loadProducts = async () => {
      setLoading(true);
      try {
        if (type === 'subscription') {
          const subs = await iapService.getSubscriptions();
          setProducts(subs);
        } else {
          const packs = await iapService.getTokenPacks();
          setProducts(packs);
        }
      } catch (error) {
        console.error('[PurchaseModal] Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [visible, type]);

  // Handle purchase
  const handlePurchase = useCallback(
    async (product: ProductInfo) => {
      setPurchasing(product.id);

      try {
        let result;
        if (product.type === 'subscription') {
          result = await iapService.purchaseSubscription(product.id);
        } else {
          result = await iapService.purchaseTokenPack(product.id);
        }

        if (!result.success && result.error) {
          Alert.alert(t('purchase.error'), result.error);
        }
        // Success will be handled by IAP listener and refresh subscription
      } catch (error: any) {
        Alert.alert(t('purchase.error'), error.message || t('purchase.unknownError'));
      } finally {
        setPurchasing(null);
      }
    },
    [t],
  );

  // Handle restore
  const handleRestore = useCallback(async () => {
    setPurchasing('restore');
    try {
      const result = await iapService.restorePurchases();
      if (result.success) {
        Alert.alert(t('purchase.restored'), t('purchase.restoredMessage'));
      } else {
        Alert.alert(t('purchase.error'), result.error || t('purchase.restoreError'));
      }
    } catch (error: any) {
      Alert.alert(t('purchase.error'), error.message);
    } finally {
      setPurchasing(null);
    }
  }, [t]);

  // Handle web payment (Russian users)
  const handleWebPayment = useCallback(() => {
    if (type === 'subscription') {
      Linking.openURL(subscriptionService.getSubscriptionUpgradeUrl());
    } else {
      Linking.openURL(subscriptionService.getTokensPurchaseUrl());
    }
    onClose();
  }, [type, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {type === 'subscription' ? t('purchase.subscriptionTitle') : t('purchase.tokensTitle')}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text style={styles.description}>
            {type === 'subscription'
              ? t('purchase.subscriptionDescription')
              : t('purchase.tokensDescription')}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>{t('purchase.loading')}</Text>
            </View>
          ) : (
            <>
              {/* Product list */}
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    purchasing === product.id && styles.productCardPurchasing,
                  ]}
                  onPress={() => handlePurchase(product)}
                  disabled={purchasing !== null}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>{product.title}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                    {product.period && (
                      <Text style={styles.productPeriod}>
                        {product.period === 'yearly'
                          ? t('purchase.perYear')
                          : t('purchase.perMonth')}
                      </Text>
                    )}
                    {product.tokens && (
                      <Text style={styles.productTokens}>
                        {t('purchase.tokensCount', { count: product.tokens })}
                      </Text>
                    )}
                  </View>
                  <View style={styles.priceContainer}>
                    {purchasing === product.id ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.priceText}>{product.price}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* No products available */}
              {products.length === 0 && !loading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cart-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>{t('purchase.noProducts')}</Text>
                </View>
              )}

              {/* Restore purchases (for subscriptions) */}
              {type === 'subscription' && (
                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={handleRestore}
                  disabled={purchasing !== null}
                >
                  {purchasing === 'restore' ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.restoreText}>{t('purchase.restore')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Russian users: Web payment option */}
          {isRussianUser && (
            <View style={styles.ruSection}>
              <View style={styles.ruDivider}>
                <View style={styles.ruDividerLine} />
                <Text style={styles.ruDividerText}>{t('purchase.orPayOnWeb')}</Text>
                <View style={styles.ruDividerLine} />
              </View>

              <TouchableOpacity style={styles.webPaymentButton} onPress={handleWebPayment}>
                <Ionicons name="globe-outline" size={22} color="#FFF" />
                <Text style={styles.webPaymentText}>{t('purchase.payOnWebsite')}</Text>
                <Ionicons name="open-outline" size={18} color="#FFF" />
              </TouchableOpacity>

              <Text style={styles.ruNotice}>{t('purchase.ruPaymentNotice')}</Text>
            </View>
          )}

          {/* Terms */}
          <Text style={styles.terms}>
            {type === 'subscription' ? t('purchase.subscriptionTerms') : t('purchase.tokensTerms')}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: -0.1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardPurchasing: {
    opacity: 0.6,
    borderColor: '#000',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  productPeriod: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productTokens: {
    fontSize: 12,
    color: '#999',
  },
  priceContainer: {
    paddingLeft: 16,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 12,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  restoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    textDecorationLine: 'underline',
  },
  ruSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ruDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ruDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  ruDividerText: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 12,
  },
  webPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  webPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  ruNotice: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  terms: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});
