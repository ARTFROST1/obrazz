import { supabase } from '@lib/supabase/client';
import { useAuthStore } from '@store/auth/authStore';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import Constants from 'expo-constants';

/**
 * Subscription Service - API calls to Rails backend for subscription management
 *
 * Handles:
 * - Fetching subscription status
 * - Syncing token balance
 * - In-App Purchase validation (iOS/Android)
 * - Payment URLs for web payments (YooKassa for RU)
 */

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const RAILS_API_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_RAILS_API_URL ||
    Constants.expoConfig?.extra?.railsApiUrl ||
    'https://obrazz.onrender.com',
);

// Token package options
export const TOKEN_PACKS = {
  small: { tokens: 10, priceRub: 99, priceUsd: 1.49, id: 'tokens_10' },
  medium: { tokens: 30, priceRub: 249, priceUsd: 3.49, id: 'tokens_30' },
  large: { tokens: 100, priceRub: 699, priceUsd: 9.99, id: 'tokens_100' },
  xl: { tokens: 300, priceRub: 1799, priceUsd: 24.99, id: 'tokens_300' },
} as const;

// Subscription plan options
export const SUBSCRIPTION_PLANS = {
  pro: {
    id: 'pro_monthly',
    name: 'Pro',
    monthlyPriceRub: 299,
    monthlyPriceUsd: 4.99,
    tokens: 50,
    features: ['50 AI генераций/мес', 'Приоритетная обработка', 'История генераций'],
  },
  max: {
    id: 'max_monthly',
    name: 'Max',
    monthlyPriceRub: 599,
    monthlyPriceUsd: 9.99,
    tokens: 150,
    features: ['150 AI генераций/мес', 'Все Pro функции', 'Эксклюзивные фильтры', 'Ранний доступ'],
  },
} as const;

export interface SubscriptionResponse {
  success: boolean;
  data?: {
    subscription: {
      plan: 'free' | 'pro' | 'max';
      status: 'active' | 'cancelled' | 'expired' | 'paused' | 'trial';
      provider: 'web' | 'ios' | 'android';
      expires_at?: string;
      auto_renewal: boolean;
    };
    token_balance: {
      purchased: number;
      subscription: number;
      next_reset_at?: string;
    };
    usage: {
      ai_generations_used: number;
      ai_generations_limit: number | 'unlimited';
      outfits_created: number;
      wardrobe_items_count: number;
    };
  };
  error?: string;
}

export interface PaymentUrlResponse {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  error?: string;
}

export interface IAPValidationResponse {
  success: boolean;
  tokens_added?: number;
  subscription_updated?: boolean;
  error?: string;
}

class SubscriptionService {
  private async getAccessToken(): Promise<string | undefined> {
    const stateSession = useAuthStore.getState().session;
    if (stateSession?.access_token) return stateSession.access_token;

    // Fallback to Supabase session (may trigger refresh internally)
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return undefined;

      const session = data.session;
      if (session?.user && session?.access_token) {
        // Keep auth store in sync if it wasn't hydrated yet
        useAuthStore.getState().initialize(session.user, session);
        return session.access_token;
      }
    } catch {
      // ignore
    }

    return undefined;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = await this.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
  }

  /**
   * Fetch current subscription status from Rails backend
   */
  async fetchSubscriptionStatus(): Promise<SubscriptionResponse> {
    useSubscriptionStore.getState().setIsLoading(true);
    try {
      // If auth isn't ready yet, don't hammer the backend with unauthorized calls.
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const response = await fetch(`${RAILS_API_URL}/api/v1/subscription`, {
        method: 'GET',
        headers: {
          ...(await this.getAuthHeaders()),
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Don't throw; just surface a clean error for UI and logs.
        return {
          success: false,
          error: 'Unauthorized (missing or invalid access token)',
        };
      }

      if (!response.ok) {
        // Try to surface backend error payload (often JSON) for easier debugging.
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorJson = await response.json().catch(() => undefined);
          const message =
            (errorJson && typeof errorJson === 'object' && 'error' in (errorJson as any)
              ? String((errorJson as any).error)
              : undefined) || `HTTP ${response.status}`;
          return { success: false, error: message };
        }

        const errorText = await response.text().catch(() => '');
        return {
          success: false,
          error: errorText ? `${response.status}: ${errorText}` : `HTTP ${response.status}`,
        };
      }

      const data: SubscriptionResponse = await response
        .json()
        .catch(() => ({ success: false, error: 'Invalid JSON response from server' }));

      // Sync to store
      if (data.success && data.data?.subscription && data.data?.token_balance && data.data?.usage) {
        const { subscription, token_balance, usage } = data.data;

        useSubscriptionStore.getState().syncFromBackend({
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            provider: subscription.provider,
            expiresAt: subscription.expires_at ? new Date(subscription.expires_at) : undefined,
            autoRenewal: subscription.auto_renewal,
          },
          tokenBalance: {
            purchased: token_balance.purchased,
            subscription: token_balance.subscription,
            nextResetAt: token_balance.next_reset_at
              ? new Date(token_balance.next_reset_at)
              : undefined,
          },
          usage: {
            aiGenerationsUsed: usage.ai_generations_used,
            aiGenerationsLimit: usage.ai_generations_limit,
            outfitsCreated: usage.outfits_created,
            wardrobeItemsCount: usage.wardrobe_items_count,
          },
        });
      }

      return data;
    } catch (error) {
      console.error('[SubscriptionService] fetchSubscriptionStatus error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    } finally {
      useSubscriptionStore.getState().setIsLoading(false);
    }
  }

  /**
   * Get payment URL for web payment (YooKassa for Russia)
   * User will be redirected to this URL on the website
   */
  async getPaymentUrl(
    type: 'subscription' | 'tokens',
    itemId: string,
  ): Promise<PaymentUrlResponse> {
    try {
      const response = await fetch(`${RAILS_API_URL}/api/v1/payments/create`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          type,
          item_id: itemId,
          return_url: 'obrazz://payment-callback',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SubscriptionService] getPaymentUrl error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Validate iOS In-App Purchase receipt
   */
  async validateIOSReceipt(receipt: string, productId: string): Promise<IAPValidationResponse> {
    try {
      const response = await fetch(`${RAILS_API_URL}/api/v1/iap/ios/validate`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          receipt_data: receipt,
          product_id: productId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Refresh subscription status after successful validation
      if (data.success) {
        await this.fetchSubscriptionStatus();
      }

      return data;
    } catch (error) {
      console.error('[SubscriptionService] validateIOSReceipt error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Validate Android In-App Purchase
   */
  async validateAndroidPurchase(
    purchaseToken: string,
    productId: string,
  ): Promise<IAPValidationResponse> {
    try {
      const response = await fetch(`${RAILS_API_URL}/api/v1/iap/android/validate`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          purchase_token: purchaseToken,
          product_id: productId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Refresh subscription status after successful validation
      if (data.success) {
        await this.fetchSubscriptionStatus();
      }

      return data;
    } catch (error) {
      console.error('[SubscriptionService] validateAndroidPurchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Spend tokens on AI generation (calls backend to record transaction)
   */
  async spendTokens(
    amount: number,
    feature: 'virtual_tryon' | 'fashion_model' | 'variation' | 'outfit_generation',
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; remaining?: number; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      // First check locally
      if (!useSubscriptionStore.getState().canSpendTokens(amount)) {
        return {
          success: false,
          error: 'Insufficient tokens',
        };
      }

      const response = await fetch(`${RAILS_API_URL}/api/v1/tokens/spend`, {
        method: 'POST',
        headers: {
          ...(await this.getAuthHeaders()),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          feature,
          metadata,
        }),
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Unauthorized (missing or invalid access token)',
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        useSubscriptionStore.getState().spendTokensLocal(amount);
      }

      return data;
    } catch (error) {
      console.error('[SubscriptionService] spendTokens error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get dashboard URL for managing subscription on website
   * (For Russian users who can't pay via IAP)
   */
  getDashboardUrl(): string {
    return `${RAILS_API_URL}/dashboard`;
  }

  /**
   * Get tokens purchase page URL
   */
  getTokensPurchaseUrl(): string {
    return `${RAILS_API_URL}/dashboard/tokens`;
  }

  /**
   * Get subscription upgrade page URL
   */
  getSubscriptionUpgradeUrl(): string {
    return `${RAILS_API_URL}/dashboard/subscription`;
  }
}

export const subscriptionService = new SubscriptionService();
