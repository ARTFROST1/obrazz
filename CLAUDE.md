# CLAUDE.md - AI Assistant Guide for Obrazz

This document provides guidance for AI assistants working with the Obrazz codebase.

## Project Overview

Obrazz is a React Native/Expo mobile application for personal wardrobe management and AI-powered outfit creation. Key features:

- ✅ Personal wardrobe with background removal
- ✅ Manual outfit creation (4-Tab System, drag&drop canvas)
- 🚧 AI item analysis on upload (Mistral Small)
- 🚧 AI Stylist for outfit suggestions (Mistral Nemo)
- 🚧 AI Try-On on user photos (Gemini 2.5 Flash)
- 🚧 Gamification (streak, challenges)
- 🚧 Subscriptions (YooMoney RU, IAP global)

**Current Development Stage:** Stage 4.10 Complete → Next: Stage 5 (AI Item Analysis)

## Tech Stack

### Frontend

- **React Native** 0.81.4 with **Expo SDK** 54
- **TypeScript** 5.9.2 (strict mode enabled)
- **Expo Router** 6.x for file-based routing
- **Zustand** 5.x for state management with persistence
- **TanStack Query** 5.71.x for server state management
- **React Native Reanimated** 4.x for animations
- **React Hook Form** + **Yup/Zod** for form validation

### Backend

- **Supabase** for PostgreSQL database, authentication, and storage
- Environment variables prefixed with `EXPO_PUBLIC_`

### Development Tools

- **ESLint** with Expo config
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for staged file linting

## Project Structure

```
obrazz/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/             # Authentication flow screens
│   │   ├── _layout.tsx     # Auth layout
│   │   ├── welcome.tsx     # Welcome/landing screen
│   │   ├── sign-in.tsx     # Sign in screen
│   │   ├── sign-up.tsx     # Sign up screen
│   │   └── forgot-password.tsx
│   ├── (tabs)/             # Main tab navigation
│   │   ├── _layout.tsx     # Tab bar configuration
│   │   ├── index.tsx       # Feed tab
│   │   ├── wardrobe.tsx    # Wardrobe tab
│   │   ├── outfits.tsx     # Outfits tab
│   │   └── profile.tsx     # Profile tab
│   ├── item/[id].tsx       # Item detail screen (dynamic route)
│   ├── outfit/             # Outfit screens
│   │   ├── [id].tsx        # Outfit detail
│   │   └── create.tsx      # Outfit creation
│   ├── add-item.tsx        # Add wardrobe item
│   └── _layout.tsx         # Root layout with auth handling
├── components/             # Reusable components
│   ├── ui/                 # Base UI components (Button, Input, Loader, FAB)
│   ├── wardrobe/           # Wardrobe-specific components
│   ├── outfit/             # Outfit-specific components
│   └── common/             # Shared utility components
├── services/               # Business logic and API calls
│   ├── auth/authService.ts # Authentication service
│   ├── wardrobe/           # Item management service
│   └── outfit/             # Outfit management service
├── store/                  # Zustand state stores
│   ├── auth/authStore.ts   # Authentication state
│   ├── wardrobe/wardrobeStore.ts  # Wardrobe items state
│   └── outfit/outfitStore.ts      # Outfits state
├── lib/                    # External library configurations
│   └── supabase/client.ts  # Supabase client initialization
├── types/                  # TypeScript type definitions
│   ├── models/             # Data models (item, outfit, user)
│   ├── api/                # API response types
│   ├── components/         # Component prop types
│   └── navigation/         # Navigation types
├── utils/                  # Helper functions
│   ├── validation/         # Validation schemas
│   └── storage/            # Storage utilities
├── constants/              # App constants (Colors, categories)
├── config/                 # Configuration files
├── contexts/               # React contexts
├── hooks/                  # Custom React hooks
├── locales/                # Internationalization files
├── styles/                 # Global styles
├── assets/                 # Images, fonts, animations
└── Docs/                   # Project documentation
```

## Key Conventions

### File Naming

- Components: PascalCase (e.g., `ItemCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useKeyboardAwareScroll.ts`)
- Services: camelCase with `Service` suffix (e.g., `itemService.ts`)
- Stores: camelCase with `Store` suffix (e.g., `wardrobeStore.ts`)
- Types: PascalCase (e.g., `WardrobeItem`)

### Import Aliases

Use path aliases defined in `tsconfig.json`:

```typescript
import { supabase } from '@lib/supabase/client';
import { useAuthStore } from '@store/auth/authStore';
import { Button } from '@components/ui';
import { WardrobeItem } from '@types/models/item';
```

Available aliases: `@app`, `@components`, `@services`, `@store`, `@hooks`, `@utils`, `@types`, `@assets`, `@lib`, `@config`, `@contexts`, `@styles`, `@locales`, `@constants`

### State Management Pattern

**Zustand Store Structure:**

```typescript
interface StoreState {
  // State
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;

  // Getters (computed)
  getFilteredItems: () => Item[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // implementation
    }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        /* persisted fields */
      }),
      skipHydration: true, // For SSR compatibility
    },
  ),
);
```

### Service Layer Pattern

Services handle API calls and business logic:

```typescript
class ServiceName {
  async createItem(input: CreateInput): Promise<Item> {
    // 1. Process input
    // 2. Call Supabase
    // 3. Map response to model
    // 4. Return result
  }

  private mapSupabaseToModel(data: any): Model {
    // Map database schema to app model
  }
}

export const serviceName = new ServiceName();
```

### Component Structure

```typescript
import React from 'react';
import { View, Text } from 'react-native';

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ prop }) => {
  // Hooks
  // State
  // Effects
  // Handlers

  return (
    // JSX
  );
};
```

### Expo Router Navigation

- File-based routing in `app/` directory
- Dynamic routes: `[id].tsx`
- Layout files: `_layout.tsx`
- Groups: `(groupName)/`
- Auth flow handled in root `_layout.tsx`

Navigation:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/item/123');
router.replace('/(tabs)');
router.back();
```

## Database Schema

Uses Supabase PostgreSQL. Key tables:

- `items` - Wardrobe items
- `outfits` - User outfits
- `hidden_default_items` - User-hidden default items

Field naming convention: snake_case in DB, camelCase in app (mapped by services).

## Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Code quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run type-check    # TypeScript checking

# Build
eas build --platform ios
eas build --platform android
```

## Environment Variables

Create `.env` from `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_REMOVE_BG_API_KEY=your_key
EXPO_PUBLIC_OPENAI_API_KEY=your_key
```

Access via `process.env.EXPO_PUBLIC_*` or `Constants.expoConfig.extra.*`.

## Key Implementation Details

### Authentication Flow

1. Root layout (`app/_layout.tsx`) initializes auth listener
2. Auth state managed by `authStore` with persistence
3. Navigation protected based on `isAuthenticated`
4. Session stored in AsyncStorage (mobile) or localStorage (web)

### Image Handling

- Images saved locally using `expo-file-system`
- Thumbnails generated with `expo-image-manipulator`
- Path format: `${documentDirectory}wardrobe/${userId}_${timestamp}.jpg`

### Platform-Specific Code

#### Bottom Navigation

**See full documentation**: [Docs/BottomNavigation.md](Docs/BottomNavigation.md)

- **iOS**: Native liquid glass tab bar with SF Symbols
  - Uses `NativeTabs` from `expo-router/unstable-native-tabs`
  - `blurEffect` prop enables liquid glass appearance on all iOS 13+ versions
  - Automatically adapts to light/dark mode with system materials
  - **iOS 26+**: Full liquid glass with `minimizeBehavior="onScrollDown"`
  - **iOS 13-25**: Blur effect with `disableTransparentOnScrollEdge={true}` for visibility

- **Android**: Floating tab bar with Apple-inspired design
  - Positioned absolutely with 16px bottom margin
  - 24px border radius for rounded corners
  - Semi-transparent background with elevation shadow
  - **Important**: Screens need `paddingBottom` to avoid content overlap
  - Use `getTabBarPadding()` from `@constants/Layout`

**Example screen implementation**:

```typescript
import { getTabBarPadding } from '@constants/Layout';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: getTabBarPadding(), // Auto-adds 81px on Android, 0 on iOS
  },
});
```

#### Other Platform Differences

- iOS uses SF Symbols, Android uses FontAwesome icons
- Web uses localStorage instead of AsyncStorage for persistence

### Error Handling

- Services throw descriptive errors
- Stores manage error state
- Console logging with prefixes: `[ServiceName]`, `[StoreName]`

## Common Tasks

### Adding a New Screen

1. Create file in `app/` directory
2. Add any shared components to `components/`
3. Create types in `types/`
4. Add navigation if needed

### Adding a New Feature

1. Define types in `types/models/`
2. Create service in `services/`
3. Create store in `store/`
4. Build components in `components/`
5. Create screens in `app/`

### Working with Supabase

```typescript
import { supabase } from '@lib/supabase/client';

// Query
const { data, error } = await supabase.from('items').select('*').eq('user_id', userId);

// Insert
const { data, error } = await supabase.from('items').insert(itemData).select().single();
```

## Code Quality Guidelines

1. **TypeScript**: Use strict types, avoid `any` when possible
2. **Imports**: Use path aliases, group imports logically
3. **Components**: Keep small and focused, extract reusable parts
4. **State**: Use Zustand for global, useState for local
5. **Async**: Handle loading and error states
6. **Logging**: Use prefixed console logs for debugging

## Documentation

Existing documentation in `Docs/`:

- `Implementation.md` - Development roadmap
- `project_structure.md` - Detailed folder organization
- `UI_UX_doc.md` - Design specifications
- `TechStack.md` - Complete technology list
- `Bug_tracking.md` - Known issues
- `PRDobrazz.md` - Product requirements
- `AppMapobrazz.md` - Application architecture
- `BottomNavigation.md` - Bottom navigation implementation (iOS liquid glass & Android floating nav)

## Testing

Tests located in `__tests__` directories. Run with:

```bash
npm test
```

## Troubleshooting

### Auth Issues

- Clear auth storage: `clearAuthStorage()` from `@lib/supabase/client`
- Check console logs with `[AuthStore]` or `[Supabase]` prefixes

### Image Issues

- Check file paths use `FileSystem.documentDirectory`
- Verify file exists before operations

### Build Issues

- Clear cache: `npx expo start --clear`
- Check environment variables in app.config.js
