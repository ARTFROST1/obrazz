import { User, WardrobeItem, Outfit, CommunityPost, Subscription } from '../models';

// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  recoverable?: boolean;
}

export interface ResponseMetadata {
  timestamp: string;
  version: string;
  requestId?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  metadata?: ResponseMetadata;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  cursor?: string;
}

// Auth Responses
export interface AuthResponse {
  user: User;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: string;
  };
}

export interface SignUpResponse extends AuthResponse {
  requiresEmailVerification: boolean;
}

export interface SignInResponse extends AuthResponse {
  isFirstLogin: boolean;
  requiresOnboarding: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  resetTokenSent: boolean;
}

// Item Responses
export interface ItemCreateResponse {
  item: WardrobeItem;
  backgroundRemoval?: {
    success: boolean;
    originalUrl?: string;
    processedUrl?: string;
    credits_used?: number;
  };
}

export interface ItemListResponse extends PaginatedResponse<WardrobeItem> {
  filters: {
    categories: string[];
    colors: string[];
    styles: string[];
    seasons: string[];
  };
}

export interface BackgroundRemovalResponse {
  success: boolean;
  processedImageUrl?: string;
  processedImagePath?: string;
  creditsRemaining?: number;
  processingTime?: number;
  error?: {
    code: string;
    message: string;
  };
}

// Outfit Responses
export interface OutfitCreateResponse {
  outfit: Outfit;
  shareUrl?: string;
}

export interface OutfitListResponse extends PaginatedResponse<Outfit> {
  stats: {
    totalOutfits: number;
    aiGenerated: number;
    manuallyCreated: number;
    shared: number;
  };
}

export interface AiGenerationResponse {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  variants?: Outfit[];
  processingTime?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
  error?: ApiError;
}

// Community Responses
export interface FeedResponse extends PaginatedResponse<CommunityPost> {
  trendingTags: string[];
  suggestedUsers?: User[];
}

export interface PostReactionResponse {
  success: boolean;
  newReactionCount: number;
  userReaction: string | null;
}

export interface CommentResponse {
  commentId: string;
  comment: Comment;
  parentUpdated?: boolean;
}

// Subscription Responses
export interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
  subscription?: Subscription;
  usage: {
    outfitsCreated: number;
    outfitsLimit: number | 'unlimited';
    aiGenerationsUsed: number;
    aiGenerationsLimit: number | 'unlimited';
    daysRemaining?: number;
  };
  availablePlans: SubscriptionPlan[];
}

export interface PurchaseResponse {
  success: boolean;
  subscription?: Subscription;
  receiptData?: string;
  needsValidation: boolean;
  error?: {
    code: 'payment_failed' | 'already_subscribed' | 'invalid_product' | 'store_error';
    message: string;
    recoverable: boolean;
  };
}

// File Upload Response
export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  error?: ApiError;
}

// Stats Response
export interface UserStatsResponse {
  wardrobe: {
    totalItems: number;
    byCategory: Record<string, number>;
    favoriteItems: number;
    mostWornItems: WardrobeItem[];
  };
  outfits: {
    totalOutfits: number;
    aiGenerated: number;
    manuallyCreated: number;
    mostWornOutfits: Outfit[];
  };
  social: {
    postsCount: number;
    likesReceived: number;
    followersCount: number;
    followingCount: number;
  };
}

// Search Response
export interface SearchResponse<T> {
  results: T[];
  query: string;
  filters: any;
  totalResults: number;
  searchTime: number;
  suggestions?: string[];
}

// Notification Response
export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  lastReadAt?: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'outfit_shared' | 'system';
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// Export/Import Response
export interface DataExportResponse {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  sizeBytes?: number;
}

export interface DataImportResponse {
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  itemsImported?: number;
  outfitsImported?: number;
  errors?: string[];
}

// Type guards
export function isApiError(response: any): response is ApiError {
  return response && typeof response.code === 'string' && typeof response.message === 'string';
}

export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && Array.isArray(response.items) && response.pagination !== undefined;
}
