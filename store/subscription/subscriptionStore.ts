import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../storage';

const parseDateValue = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * Subscription Store - User subscription, tokens, and usage
 *
 * Manages:
 * - Subscription plan (free/pro/max)
 * - Token balance (purchased + subscription)
 * - Usage statistics
 * - Payment region detection
 */

// Subscription plans matching Rails backend
export type SubscriptionPlan = 'free' | 'pro' | 'max';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused' | 'trial';
export type PaymentProvider = 'web' | 'ios' | 'android' | 'yookassa' | 'stripe';

export interface TokenBalance {
  purchased: number; // Bought tokens (never expire)
  subscription: number; // Monthly tokens from plan
  available: number; // Total available (purchased + subscription)
  nextResetAt?: Date; // When subscription tokens reset
}

export interface UsageStats {
  aiGenerationsUsed: number;
  aiGenerationsLimit: number | 'unlimited';
  outfitsCreated: number;
  wardrobeItemsCount: number;
  lastGenerationAt?: Date;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  externalId?: string;
  startedAt?: Date;
  expiresAt?: Date;
  autoRenewal: boolean;
}

// Monthly token allocation by plan
export const PLAN_TOKENS: Record<SubscriptionPlan, number> = {
  free: 5,
  pro: 50,
  max: 150,
};

// Token costs for AI features
export const AI_COSTS = {
  virtualTryon: 1,
  fashionModel: 1,
  variation: 1,
  outfitGeneration: 2,
};

export interface SubscriptionState {
  // Subscription data
  subscription: Subscription;
  tokenBalance: TokenBalance;
  usage: UsageStats;

  // Payment region (affects which payment methods are available)
  paymentRegion: 'ru' | 'global';

  // Loading states
  isLoading: boolean;
  lastSyncedAt?: Date;

  // Actions
  setSubscription: (subscription: Partial<Subscription>) => void;
  setTokenBalance: (balance: Partial<TokenBalance>) => void;
  setUsage: (usage: Partial<UsageStats>) => void;
  setPaymentRegion: (region: 'ru' | 'global') => void;

  // Token operations (local only, actual spending via API)
  canSpendTokens: (amount: number) => boolean;
  spendTokensLocal: (amount: number) => void;
  addTokensLocal: (amount: number, type: 'purchased' | 'subscription') => void;

  // Sync with backend
  syncFromBackend: (data: {
    subscription?: Partial<Subscription>;
    tokenBalance?: Partial<TokenBalance>;
    usage?: Partial<UsageStats>;
  }) => void;

  // UI helpers
  getPlanDisplayName: () => string;
  getTokensPercentUsed: () => number;

  // Loading
  setIsLoading: (loading: boolean) => void;

  // Reset
  resetToFree: () => void;
}

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  provider: 'web',
  autoRenewal: false,
};

const DEFAULT_TOKEN_BALANCE: TokenBalance = {
  purchased: 0,
  subscription: PLAN_TOKENS.free,
  available: PLAN_TOKENS.free,
};

const DEFAULT_USAGE: UsageStats = {
  aiGenerationsUsed: 0,
  aiGenerationsLimit: PLAN_TOKENS.free,
  outfitsCreated: 0,
  wardrobeItemsCount: 0,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: DEFAULT_SUBSCRIPTION,
      tokenBalance: DEFAULT_TOKEN_BALANCE,
      usage: DEFAULT_USAGE,
      paymentRegion: 'ru', // Default to Russian market
      isLoading: false,
      lastSyncedAt: undefined,

      setSubscription: (subscription) => {
        set((state) => ({
          subscription: { ...state.subscription, ...subscription },
        }));
      },

      setTokenBalance: (balance) => {
        set((state) => {
          const newBalance = { ...state.tokenBalance, ...balance };
          // Always recalculate available
          newBalance.available = newBalance.purchased + newBalance.subscription;
          return { tokenBalance: newBalance };
        });
      },

      setUsage: (usage) => {
        set((state) => ({
          usage: { ...state.usage, ...usage },
        }));
      },

      setPaymentRegion: (region) => {
        set({ paymentRegion: region });
      },

      canSpendTokens: (amount) => {
        const { tokenBalance } = get();
        return tokenBalance.available >= amount;
      },

      spendTokensLocal: (amount) => {
        set((state) => {
          const { tokenBalance, usage } = state;

          // Spend subscription tokens first, then purchased
          let remaining = amount;
          let newSubscription = tokenBalance.subscription;
          let newPurchased = tokenBalance.purchased;

          if (newSubscription >= remaining) {
            newSubscription -= remaining;
            remaining = 0;
          } else {
            remaining -= newSubscription;
            newSubscription = 0;
            newPurchased -= remaining;
          }

          return {
            tokenBalance: {
              ...tokenBalance,
              subscription: newSubscription,
              purchased: Math.max(0, newPurchased),
              available: newSubscription + Math.max(0, newPurchased),
            },
            usage: {
              ...usage,
              aiGenerationsUsed: usage.aiGenerationsUsed + 1,
              lastGenerationAt: new Date(),
            },
          };
        });
      },

      addTokensLocal: (amount, type) => {
        set((state) => {
          const { tokenBalance } = state;
          const newBalance = { ...tokenBalance };

          if (type === 'purchased') {
            newBalance.purchased += amount;
          } else {
            newBalance.subscription += amount;
          }
          newBalance.available = newBalance.purchased + newBalance.subscription;

          return { tokenBalance: newBalance };
        });
      },

      syncFromBackend: (data) => {
        set((state) => {
          const newState: Partial<SubscriptionState> = {
            lastSyncedAt: new Date(),
          };

          if (data.subscription) {
            newState.subscription = { ...state.subscription, ...data.subscription };
          }

          if (data.tokenBalance) {
            const balance = { ...state.tokenBalance, ...data.tokenBalance };
            balance.available = balance.purchased + balance.subscription;
            newState.tokenBalance = balance;
          }

          if (data.usage) {
            newState.usage = { ...state.usage, ...data.usage };
          }

          return newState;
        });
      },

      getPlanDisplayName: () => {
        const { subscription } = get();
        const names: Record<SubscriptionPlan, string> = {
          free: 'Free',
          pro: 'Pro',
          max: 'Max',
        };
        return names[subscription.plan];
      },

      getTokensPercentUsed: () => {
        const { tokenBalance, usage } = get();
        const limit =
          usage.aiGenerationsLimit === 'unlimited'
            ? tokenBalance.available + usage.aiGenerationsUsed
            : usage.aiGenerationsLimit;

        if (limit === 0) return 0;
        return Math.round((usage.aiGenerationsUsed / (limit as number)) * 100);
      },

      setIsLoading: (isLoading) => {
        set({ isLoading });
      },

      resetToFree: () => {
        set({
          subscription: DEFAULT_SUBSCRIPTION,
          tokenBalance: DEFAULT_TOKEN_BALANCE,
          usage: DEFAULT_USAGE,
          lastSyncedAt: undefined,
        });
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        tokenBalance: state.tokenBalance,
        usage: state.usage,
        paymentRegion: state.paymentRegion,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // JSON storage turns Dates into strings; normalize them back.
        state.lastSyncedAt = parseDateValue(state.lastSyncedAt);

        state.subscription = {
          ...state.subscription,
          startedAt: parseDateValue(state.subscription?.startedAt),
          expiresAt: parseDateValue(state.subscription?.expiresAt),
        };

        state.tokenBalance = {
          ...state.tokenBalance,
          nextResetAt: parseDateValue(state.tokenBalance?.nextResetAt),
          available: (state.tokenBalance?.purchased ?? 0) + (state.tokenBalance?.subscription ?? 0),
        };

        state.usage = {
          ...state.usage,
          lastGenerationAt: parseDateValue(state.usage?.lastGenerationAt),
        };
      },
    },
  ),
);
