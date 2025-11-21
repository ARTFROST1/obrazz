export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription;
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru';
  notifications: NotificationPreferences;
  defaultSeason?: Season;
  favoriteStyles?: StyleTag[];
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  communityUpdates: boolean;
  aiSuggestions: boolean;
  promotions: boolean;
}

export interface UserStats {
  itemsCount: number;
  outfitsCount: number;
  aiGenerationsUsed: number;
  likesReceived: number;
  followersCount: number;
  followingCount: number;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium_monthly' | 'premium_yearly';
  status: 'active' | 'expired' | 'cancelled';
  startedAt: Date;
  expiresAt?: Date;
  provider: 'app_store' | 'google_play' | 'yookassa' | 'paymaster';
  providerReference?: string;
  features: SubscriptionFeatures;
}

export interface SubscriptionFeatures {
  maxOutfits: number;
  maxAiGenerations: number;
  unlimitedStorage: boolean;
  premiumBackgrounds: boolean;
  advancedFilters: boolean;
  prioritySupport: boolean;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type StyleTag =
  | 'casual'
  | 'classic'
  | 'sport'
  | 'minimalism'
  | 'old_money'
  | 'scandi'
  | 'indie'
  | 'y2k'
  | 'star'
  | 'alt'
  | 'cottagecore'
  | 'downtown';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
