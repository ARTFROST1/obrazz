export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: PriceInfo;
  duration: 'monthly' | 'yearly' | 'lifetime';
  features: PlanFeatures;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PriceInfo {
  amount: number;
  currency: string;
  displayPrice: string;
  originalPrice?: number; // For discounts
  discount?: {
    percentage: number;
    validUntil?: Date;
  };
}

export interface PlanFeatures {
  maxOutfits: number | 'unlimited';
  maxAiGenerations: number | 'unlimited';
  maxWardrobeItems: number | 'unlimited';
  backgroundOptions: string[];
  communityFeatures: boolean;
  webCapture: boolean;
  prioritySupport: boolean;
  advancedFilters: boolean;
  exportData: boolean;
  removeAds: boolean;
  exclusiveContent: boolean;
  earlyAccess: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan; // Populated when fetching
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  resumeAt?: Date;
  paymentMethod?: PaymentMethod;
  billingHistory: BillingRecord[];
  usage: UsageStats;
}

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'paused'
  | 'pending'
  | 'trial'
  | 'grace_period';

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'app_store' | 'google_play' | 'yookassa' | 'paymaster';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface BillingRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoiceUrl?: string;
  receiptUrl?: string;
  paymentMethod: string;
  createdAt: Date;
  paidAt?: Date;
  failureReason?: string;
}

export interface UsageStats {
  outfitsCreated: number;
  outfitsLimit: number | 'unlimited';
  aiGenerationsUsed: number;
  aiGenerationsLimit: number | 'unlimited';
  wardrobeItemsCount: number;
  wardrobeItemsLimit: number | 'unlimited';
  storageUsedMB: number;
  storageLimitMB: number | 'unlimited';
  lastResetDate: Date;
  nextResetDate: Date;
}

export interface SubscriptionOffer {
  id: string;
  type: 'trial' | 'discount' | 'upgrade' | 'winback';
  title: string;
  description: string;
  discountPercentage?: number;
  trialDays?: number;
  validFrom: Date;
  validUntil: Date;
  eligibilityCriteria?: {
    newUsersOnly?: boolean;
    specificPlans?: string[];
    minAccountAge?: number;
    maxAccountAge?: number;
  };
  ctaText: string;
  bannerImageUrl?: string;
}

export interface PurchaseResult {
  success: boolean;
  subscription?: UserSubscription;
  transaction?: {
    id: string;
    receiptData?: string;
    verificationResult?: Record<string, unknown>;
  };
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}
