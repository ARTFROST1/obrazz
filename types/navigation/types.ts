import { CommunityPost, Outfit, WardrobeItem } from '../models';

export type RootStackParamList = {
  // Auth Stack
  '(auth)/welcome': undefined;
  '(auth)/sign-in': { email?: string };
  '(auth)/sign-up': undefined;
  '(auth)/forgot-password': { email?: string };

  // Main Tabs
  '(tabs)': undefined;
  '(tabs)/index': undefined; // Home/Community
  '(tabs)/wardrobe': undefined;
  '(tabs)/create': undefined;
  '(tabs)/profile': undefined;

  // Modals
  '(modals)/add-item': {
    source?: 'camera' | 'gallery' | 'web';
    imageUri?: string;
  };
  '(modals)/outfit-ai': {
    preselectedItems?: string[];
  };
  '(modals)/subscription': {
    source?: 'limit_reached' | 'settings' | 'profile';
  };
  '(modals)/settings': undefined;

  // Detail Screens
  'outfit/[id]': {
    id: string;
    mode?: 'view' | 'edit';
  };
  'outfit/editor': {
    outfitId?: string;
    preselectedItems?: string[];
  };
  'item/[id]': {
    id: string;
  };

  // Community
  'post/[id]': {
    id: string;
  };
  'user/[id]': {
    id: string;
  };

  // Onboarding
  onboarding: undefined;

  // Web Capture
  'web-capture': {
    initialUrl?: string;
  };
};

// Tab Navigator Params
export type TabParamList = {
  index: undefined;
  wardrobe: undefined;
  create: undefined;
  profile: undefined;
};

// Auth Stack Params
export type AuthStackParamList = {
  welcome: undefined;
  'sign-in': { email?: string };
  'sign-up': undefined;
  'forgot-password': { email?: string };
};

// Modal Stack Params
export type ModalStackParamList = {
  'add-item': {
    source?: 'camera' | 'gallery' | 'web';
    imageUri?: string;
  };
  'outfit-ai': {
    preselectedItems?: string[];
  };
  subscription: {
    source?: 'limit_reached' | 'settings' | 'profile';
  };
  settings: undefined;
};

// Navigation Props for screens
export interface NavigationProps {
  item?: WardrobeItem;
  outfit?: Outfit;
  post?: CommunityPost;
}

// Deep linking configuration
export interface LinkingOptions {
  prefixes: string[];
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: 'home';
          wardrobe: 'wardrobe';
          create: 'create';
          profile: 'profile';
        };
      };
      'outfit/[id]': 'outfit/:id';
      'item/[id]': 'item/:id';
      'post/[id]': 'post/:id';
      'user/[id]': 'user/:id';
    };
  };
}

// Navigation state persistence
export interface NavigationState {
  index: number;
  routes: Array<{
    name: string;
    // Utility type for unknown params
    params?: Record<string, unknown>;
    state?: NavigationState;
  }>;
}
