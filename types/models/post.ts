import { User } from './user';
import { Outfit } from './outfit';

export interface CommunityPost {
  id: string;
  authorId: string;
  author?: User; // Populated when fetching
  outfitId?: string;
  outfit?: Outfit; // Populated when fetching
  caption?: string;
  images?: string[]; // Additional images besides outfit
  tags: string[];
  mentions: string[]; // User IDs mentioned in the post
  visibility: 'public' | 'followers' | 'private';
  type: 'outfit' | 'inspiration' | 'question' | 'tip';
  reactions: PostReactions;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isPinned: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  metadata?: PostMetadata;
}

export interface PostReactions {
  likesCount: number;
  lovesCount: number;
  wowsCount: number;
  inspiredCount: number;
  userReaction?: ReactionType; // Current user's reaction
}

export type ReactionType = 'like' | 'love' | 'wow' | 'inspired';

export interface PostMetadata {
  location?: {
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  weather?: {
    temperature?: number;
    condition?: string;
  };
  event?: string;
  brands?: string[];
  priceRange?: 'budget' | 'mid' | 'luxury';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User; // Populated when fetching
  text: string;
  parentId?: string; // For nested comments
  replies?: Comment[];
  likesCount: number;
  isLiked?: boolean; // By current user
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
}

export interface PostFilter {
  type?: ('outfit' | 'inspiration' | 'question' | 'tip')[];
  authorId?: string;
  tags?: string[];
  visibility?: ('public' | 'followers' | 'private')[];
  isFeatured?: boolean;
  isPinned?: boolean;
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface FeedOptions {
  filter?: PostFilter;
  sort?: 'newest' | 'trending' | 'popular' | 'following';
  limit?: number;
  cursor?: string;
}

export interface PostEngagement {
  postId: string;
  userId: string;
  reaction?: ReactionType;
  isBookmarked: boolean;
  isShared: boolean;
  viewedAt: Date;
  engagementScore: number; // Calculated based on actions
}

export interface TrendingTag {
  tag: string;
  count: number;
  trend: 'rising' | 'stable' | 'declining';
  relatedTags: string[];
}
