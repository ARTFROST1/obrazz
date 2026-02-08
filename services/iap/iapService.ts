/**
 * In-App Purchase Service
 *
 * Handles:
 * - Subscriptions (Pro, Max) via App Store / Google Play
 * - Token packs (one-time purchases / consumables)
 * - Purchase validation with Rails backend
 * - Purchase restoration
 *
 * Note: react-native-iap must be installed:
 * npx expo install react-native-iap
 */

import { subscriptionService } from '@services/subscription/subscriptionService';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Product IDs must match App Store Connect / Google Play Console
export const IAP_PRODUCTS = {
  // Subscriptions (auto-renewable)
  subscriptions: {
    pro_monthly: Platform.select({
      ios: 'com.obrazz.pro_monthly',
      android: 'pro_monthly',
    }) as string,
    pro_yearly: Platform.select({
      ios: 'com.obrazz.pro_yearly',
      android: 'pro_yearly',
    }) as string,
    max_monthly: Platform.select({
      ios: 'com.obrazz.max_monthly',
      android: 'max_monthly',
    }) as string,
    max_yearly: Platform.select({
      ios: 'com.obrazz.max_yearly',
      android: 'max_yearly',
    }) as string,
  },
  // Token packs (consumables)
  tokenPacks: {
    tokens_10: Platform.select({
      ios: 'com.obrazz.tokens_10',
      android: 'tokens_10',
    }) as string,
    tokens_30: Platform.select({
      ios: 'com.obrazz.tokens_30',
      android: 'tokens_30',
    }) as string,
    tokens_100: Platform.select({
      ios: 'com.obrazz.tokens_100',
      android: 'tokens_100',
    }) as string,
    tokens_300: Platform.select({
      ios: 'com.obrazz.tokens_300',
      android: 'tokens_300',
    }) as string,
  },
} as const;

// Product metadata for UI
export interface ProductInfo {
  id: string;
  title: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
  type: 'subscription' | 'consumable';
  // For subscriptions
  period?: 'monthly' | 'yearly';
  // For token packs
  tokens?: number;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  productId?: string;
}

// Generic types for react-native-iap (will be dynamically imported)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RNIAPModule = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Purchase = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IAPSubscription = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IAPProduct = any;

class IAPService {
  private isInitialized = false;
  private iapModule: RNIAPModule | null = null;
  private purchaseListener: (() => void) | null = null;
  private errorListener: (() => void) | null = null;

  /**
   * Initialize IAP connection
   * Call this on app start
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // Skip on web
    if (Platform.OS === 'web') {
      console.log('[IAPService] Skipping IAP on web');
      return false;
    }

    const enableIapInDev = process.env.EXPO_PUBLIC_ENABLE_IAP_DEV === 'true';
    const isExpoGo = Constants.appOwnership === 'expo';
    const isPhysicalDevice = typeof Constants.isDevice === 'boolean' ? Constants.isDevice : true;

    // Avoid triggering RN-IAP init errors in environments without billing.
    // - Expo Go: native modules are limited
    // - Emulator/simulator: Play Billing / StoreKit often unavailable
    // By default, skip IAP in dev to avoid noisy init errors on emulators/dev clients.
    // Enable explicitly when testing purchases on a real device.
    if (__DEV__ && !enableIapInDev) {
      console.log(
        '[IAPService] IAP disabled in dev (set EXPO_PUBLIC_ENABLE_IAP_DEV=true to enable)',
      );
      return false;
    }

    if (__DEV__ && (isExpoGo || !isPhysicalDevice)) {
      console.log('[IAPService] IAP not available (expo-go / emulator) - skipping');
      return false;
    }

    try {
      // Dynamic import to avoid crashes if not installed
      this.iapModule = await import('react-native-iap');
      const { initConnection, purchaseUpdatedListener, purchaseErrorListener } = this.iapModule;

      const result = await initConnection();
      console.log('[IAPService] Connection initialized:', result);

      // Set up purchase listeners
      this.purchaseListener = purchaseUpdatedListener(this.handlePurchaseUpdate.bind(this));
      this.errorListener = purchaseErrorListener(this.handlePurchaseError.bind(this));

      this.isInitialized = true;
      return true;
    } catch (error: unknown) {
      // Check if running on emulator without billing support (expected error)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isEmulatorError =
        errorMessage.includes('Failed to initialize') ||
        errorMessage.includes('billing') ||
        errorMessage.includes('init-connection');

      if (isEmulatorError && __DEV__) {
        console.log('[IAPService] IAP not available (emulator/dev environment) - skipping');
        return false;
      }

      // Avoid redbox noise for known dev limitations.
      if (__DEV__) {
        console.warn('[IAPService] Failed to initialize (dev):', errorMessage);
        return false;
      }

      console.error('[IAPService] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Clean up IAP connection
   * Call this on app unmount
   */
  async cleanup(): Promise<void> {
    if (!this.iapModule) return;

    try {
      this.purchaseListener?.();
      this.errorListener?.();
      await this.iapModule.endConnection();
      this.isInitialized = false;
      console.log('[IAPService] Connection closed');
    } catch (error) {
      console.error('[IAPService] Cleanup error:', error);
    }
  }

  /**
   * Get available subscriptions
   */
  async getSubscriptions(): Promise<ProductInfo[]> {
    if (!this.iapModule || !this.isInitialized) {
      console.warn('[IAPService] Not initialized');
      return [];
    }

    try {
      const productIds = Object.values(IAP_PRODUCTS.subscriptions);
      const subscriptions = await this.iapModule.getSubscriptions({ skus: productIds });

      return subscriptions.map((sub: IAPSubscription) => this.mapSubscriptionToProductInfo(sub));
    } catch (error) {
      console.error('[IAPService] Failed to get subscriptions:', error);
      return [];
    }
  }

  /**
   * Get available token packs
   */
  async getTokenPacks(): Promise<ProductInfo[]> {
    if (!this.iapModule || !this.isInitialized) {
      console.warn('[IAPService] Not initialized');
      return [];
    }

    try {
      const productIds = Object.values(IAP_PRODUCTS.tokenPacks);
      const products = await this.iapModule.getProducts({ skus: productIds });

      return products.map((product: IAPProduct) => this.mapProductToProductInfo(product));
    } catch (error) {
      console.error('[IAPService] Failed to get token packs:', error);
      return [];
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    if (!this.iapModule || !this.isInitialized) {
      return { success: false, error: 'IAP not initialized' };
    }

    try {
      console.log('[IAPService] Requesting subscription:', productId);

      if (Platform.OS === 'ios') {
        await this.iapModule.requestSubscription({ sku: productId });
      } else {
        await this.iapModule.requestSubscription({
          sku: productId,
          subscriptionOffers: [{ sku: productId, offerToken: '' }],
        });
      }

      // Purchase will be handled by purchaseUpdatedListener
      return { success: true, productId };
    } catch (error: any) {
      console.error('[IAPService] Subscription purchase error:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Purchase a token pack (consumable)
   */
  async purchaseTokenPack(productId: string): Promise<PurchaseResult> {
    if (!this.iapModule || !this.isInitialized) {
      return { success: false, error: 'IAP not initialized' };
    }

    try {
      console.log('[IAPService] Requesting token pack:', productId);
      await this.iapModule.requestPurchase({ sku: productId });

      // Purchase will be handled by purchaseUpdatedListener
      return { success: true, productId };
    } catch (error: any) {
      console.error('[IAPService] Token pack purchase error:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.iapModule || !this.isInitialized) {
      return { success: false, error: 'IAP not initialized' };
    }

    try {
      console.log('[IAPService] Restoring purchases...');

      const purchases = await this.iapModule.getAvailablePurchases();
      console.log('[IAPService] Found purchases to restore:', purchases.length);

      for (const purchase of purchases) {
        await this.validateAndFinishPurchase(purchase);
      }

      // Refresh subscription status from backend
      await subscriptionService.fetchSubscriptionStatus();

      return { success: true };
    } catch (error: any) {
      console.error('[IAPService] Restore error:', error);
      return {
        success: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  /**
   * Handle incoming purchase update
   */
  private async handlePurchaseUpdate(purchase: Purchase): Promise<void> {
    console.log('[IAPService] Purchase update received:', purchase.productId);

    try {
      await this.validateAndFinishPurchase(purchase);
    } catch (error) {
      console.error('[IAPService] Error handling purchase update:', error);
    }
  }

  /**
   * Validate purchase with backend and finish transaction
   */
  private async validateAndFinishPurchase(purchase: Purchase): Promise<void> {
    if (!this.iapModule) return;

    const { transactionReceipt, productId } = purchase;

    if (!transactionReceipt) {
      console.warn('[IAPService] No receipt for purchase:', productId);
      return;
    }

    try {
      // Validate with Rails backend
      let validationResult;

      if (Platform.OS === 'ios') {
        validationResult = await subscriptionService.validateIOSReceipt(
          transactionReceipt,
          productId,
        );
      } else {
        validationResult = await subscriptionService.validateAndroidPurchase(
          transactionReceipt,
          productId,
        );
      }

      if (validationResult.success) {
        console.log('[IAPService] Purchase validated:', productId);

        // Finish the transaction
        await this.iapModule.finishTransaction({
          purchase,
          isConsumable: this.isConsumable(productId),
        });

        // Update local state if tokens were added
        if (validationResult.tokens_added) {
          useSubscriptionStore
            .getState()
            .addTokensLocal(validationResult.tokens_added, 'purchased');
        }

        // Refresh subscription status
        await subscriptionService.fetchSubscriptionStatus();
      } else {
        console.error('[IAPService] Backend validation failed:', validationResult.error);
      }
    } catch (error) {
      console.error('[IAPService] Validation error:', error);
    }
  }

  /**
   * Handle purchase error
   */
  private handlePurchaseError(error: any): void {
    console.error('[IAPService] Purchase error:', error);
    // Could emit event or update store here
  }

  /**
   * Check if product is consumable (token pack)
   */
  private isConsumable(productId: string): boolean {
    return Object.values(IAP_PRODUCTS.tokenPacks).includes(productId);
  }

  /**
   * Map subscription to ProductInfo
   */
  private mapSubscriptionToProductInfo(sub: IAPSubscription): ProductInfo {
    const id = sub.productId;
    const isYearly = id.includes('yearly');
    const isPro = id.includes('pro');

    return {
      id,
      title: isPro ? 'Pro' : 'Max',
      description: isPro ? '50 AI генераций в месяц' : '150 AI генераций в месяц',
      price: sub.localizedPrice || `${sub.price} ${sub.currency}`,
      priceValue: parseFloat(sub.price),
      currency: sub.currency,
      type: 'subscription',
      period: isYearly ? 'yearly' : 'monthly',
    };
  }

  /**
   * Map product to ProductInfo
   */
  private mapProductToProductInfo(product: IAPProduct): ProductInfo {
    const id = product.productId;
    const tokensMatch = id.match(/tokens_(\d+)/);
    const tokens = tokensMatch ? parseInt(tokensMatch[1], 10) : 0;

    return {
      id,
      title: `${tokens} токенов`,
      description: `Пакет из ${tokens} токенов для AI генераций`,
      price: product.localizedPrice || `${product.price} ${product.currency}`,
      priceValue: parseFloat(product.price),
      currency: product.currency,
      type: 'consumable',
      tokens,
    };
  }

  /**
   * Check if IAP is available on this device
   */
  isAvailable(): boolean {
    return Platform.OS !== 'web' && this.isInitialized;
  }
}

export const iapService = new IAPService();
