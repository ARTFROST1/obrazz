# Project Structure - Obrazz

**Последнее обновление:** 13 января 2025  
**Статус:** Stage 2 завершён ✅

## Overview

This document defines the folder structure and organization guidelines for the Obrazz React Native application.

**Last Updated:** January 14, 2025  
**Current Stage:** Stage 4 Complete ✅

**Легенда:**

- ✅ Создано и настроено (Stages 1-4)
- 📋 Создано, готово к использованию
- 🚧 Будет создано в будущих стадиях

## Root Directory Structure

```
obrazz/
├── .vscode/ ✅                # VS Code settings
├── .windsurf/ ✅              # Windsurf AI agent rules
│   └── rules/
├── .husky/ ✅                 # Git hooks (Husky)
│   └── pre-commit
├── app/ ✅                    # Expo Router app directory (screens)
│   ├── (auth)/ ✅            # Authentication flow screens (IMPLEMENTED)
│   ├── (tabs)/ ✅            # Tab-based navigation screens (profile implemented)
│   ├── (modals)/ 🚧         # Modal screens (Stage 2+)
│   ├── _layout.tsx ✅       # Root layout
│   ├── +html.tsx ✅         # Web HTML root
│   ├── +not-found.tsx ✅    # 404 screen
│   └── modal.tsx ✅         # Example modal
├── assets/ ✅                 # Static assets
│   ├── fonts/ ✅
│   ├── images/ ✅
│   ├── icons/ 🚧
│   └── animations/ 🚧       # Lottie animations
├── components/ ✅             # Reusable components
│   ├── common/ 🚧           # Generic components
│   ├── wardrobe/ ✅         # Wardrobe-specific components (Stage 3)
│   ├── outfit/ ✅           # Outfit creator components (Stage 4)
│   ├── community/ 🚧        # Community feed components
│   └── ui/ ✅              # Base UI components (Button, Input, Loader)
├── config/ ✅                 # Configuration files
│   └── env.ts ✅            # Environment config
├── constants/ ✅              # Constants
│   └── Colors.ts ✅
├── contexts/ 📋               # React contexts (готова структура)
├── Docs/ ✅                  # Documentation
│   ├── TechStack.md ✅
│   ├── Implementation.md ✅
│   ├── project_structure.md ✅
│   ├── Bug_tracking.md ✅
│   ├── UI_UX_doc.md ✅
│   ├── STAGE_1_COMPLETION.md ✅
│   ├── STAGE_1_SUMMARY.md ✅
│   └── STAGE_2_COMPLETION.md ✅
├── hooks/ 📋                  # Custom React hooks (готова структура)
├── lib/ ✅                   # External library configurations
│   └── supabase/ ✅         # Supabase specific logic
│       ├── client.ts ✅
│       └── schema.sql ✅
├── services/ 📋               # Business logic services
│   ├── auth/ ✅            # Authentication service (authService.ts)
│   ├── wardrobe/ ✅        # Wardrobe management (Stage 3)
│   ├── outfit/ ✅          # Outfit creation (outfitService.ts - Stage 4)
│   └── subscription/ 🚧    # Payment handling (Stage 7)
├── store/ 📋                  # Zustand stores
│   ├── auth/ ✅            # Auth store with persistence (authStore.ts)
│   ├── wardrobe/ ✅        # Wardrobe store (Stage 3)
│   ├── outfit/ ✅          # Outfit store with undo/redo (Stage 4)
│   └── ui/ 🚧
├── styles/ 📋                 # Global styles and themes (готова структура)
│   ├── themes/ 🚧
│   └── global.ts 🚧
├── types/ ✅                  # TypeScript type definitions
│   ├── api/ ✅
│   ├── models/ ✅
│   └── navigation/ ✅
├── utils/ 📋                  # Utility functions
│   ├── image/ 🚧
│   ├── validation/ ✅       # Auth validation utilities
│   └── helpers/ 🚧
├── locales/ 📋                # i18n translations (готова структура)
│   ├── en/ 🚧
│   └── ru/ 🚧
├── node_modules/ ✅
├── .env ✅                   # Environment variables
├── .env.example 🚧          # Environment variables template
├── .eslintrc.js ✅          # ESLint configuration
├── .gitignore ✅
├── .prettierrc ✅           # Prettier configuration
├── app.json ✅              # Expo configuration
├── babel.config.js ✅       # Babel configuration
├── metro.config.js ✅       # Metro bundler configuration (custom path resolver)
├── package.json ✅
├── package-lock.json ✅
├── tsconfig.json ✅         # TypeScript configuration
├── README.md ✅
├── QUICKSTART.md ✅
├── DEVELOPER_CHECKLIST.md ✅
└── STATUS.md ✅
```

## Detailed Structure Guidelines

### `/app` - Screens and Navigation ✅

**Stage 1-2 Status:** Все auth экраны полностью реализованы

```
app/
├── (auth)/ ✅                # Authentication flow screens (FULLY IMPLEMENTED)
│   ├── _layout.tsx ✅       # Auth stack layout
│   ├── welcome.tsx ✅       # Welcome screen with features
│   ├── sign-in.tsx ✅       # Sign in with validation
│   ├── sign-up.tsx ✅       # Sign up with full validation
│   └── forgot-password.tsx ✅ # Password recovery flow
├── (tabs)/ ✅               # Tab-based navigation (4 tabs)
│   ├── _layout.tsx ✅       # Tab navigator layout
│   ├── index.tsx ✅         # Home/Community feed (Stage 6)
│   ├── wardrobe.tsx ✅      # Wardrobe screen (IMPLEMENTED - Stage 3)
│   ├── outfits.tsx 🚧       # Saved outfits collection (Stage 4.5 - IN PROGRESS)
│   └── profile.tsx ✅       # User profile with logout (IMPLEMENTED - Stage 2)
├── (modals)/ 🚧            # Modal screens (Stage 2+)
│   ├── add-item.tsx 🚧     # Add wardrobe item modal
│   ├── outfit-ai.tsx 🚧    # AI outfit generation
│   ├── subscription.tsx 🚧 # Subscription management
│   └── settings.tsx 🚧     # App settings
├── outfit/ ✅              # Outfit screens (Stage 4 + 4.5)
│   ├── create.tsx ✅        # Create outfit screen (moved from tabs, Stage 4)
│   ├── [id].tsx 🚧         # Outfit detail/view screen (Stage 4.5)
│   └── edit.tsx 🚧         # Outfit editor (Stage 4.5)
├── item/
│   └── [id].tsx              # Item detail screen
├── onboarding/
│   └── index.tsx             # Onboarding flow
├── +html.tsx                 # HTML template for web
├── +not-found.tsx           # 404 screen
└── _layout.tsx              # Root layout with providers
```

### `/components` - Reusable Components

```
components/
├── ui/ ✅                     # Base UI components (Stage 2)
│   ├── Button.tsx ✅          # Primary/secondary button with loading
│   ├── Input.tsx ✅           # Form input with validation
│   ├── Loader.tsx ✅          # Loading spinner
│   └── index.ts ✅           # Barrel export
├── common/
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ErrorBoundary.tsx
├── wardrobe/
│   ├── ItemCard.tsx
│   ├── ItemGrid.tsx
│   ├── ItemFilter.tsx
│   ├── CategoryPicker.tsx
│   └── ColorPicker.tsx
├── outfit/ ✅
│   ├── Canvas.tsx ✅          # Drag & drop canvas (Stage 4)
│   ├── CategoryCarousel.tsx ✅ # Horizontal item carousel (Stage 4)
│   ├── OutfitCard.tsx 🚧      # Outfit preview card (Stage 4.5)
│   ├── OutfitGrid.tsx 🚧      # Grid of outfit cards (Stage 4.5)
│   ├── BackgroundPicker.tsx ✅ # Background selector (Stage 4)
│   └── TransformControls.tsx ✅ # Scale/rotate controls (Stage 4)
├── community/
│   ├── PostCard.tsx
│   ├── FeedList.tsx
│   ├── ReactionButton.tsx
│   └── ShareButton.tsx
└── ui/
    ├── TabBar.tsx
    ├── Header.tsx
    ├── Avatar.tsx
    ├── Badge.tsx
    └── Skeleton.tsx
```

### `/services` - Business Logic

```
services/
├── auth/ ✅                   # Authentication (Stage 2)
│   └── authService.ts ✅      # Complete auth logic (signUp, signIn, signOut, reset)
├── wardrobe/
│   ├── itemService.ts        # Item CRUD operations
│   ├── imageProcessor.ts     # Image manipulation
│   └── backgroundRemover.ts  # Pixian.ai integration
├── outfit/
│   ├── outfitService.ts      # Outfit management
│   ├── aiGenerator.ts        # AI outfit generation
│   └── canvasManager.ts      # Canvas state management
└── subscription/
    ├── purchaseManager.ts     # RevenueCat integration
    └── quotaManager.ts        # Feature limits
```

### `/store` - State Management

```
store/
├── auth/ ✅
│   └── authStore.ts ✅        # User auth state with persistence
├── wardrobe/
│   └── wardrobeStore.ts      # Items and categories
├── outfit/
│   └── outfitStore.ts        # Current outfit state
└── ui/
    ├── themeStore.ts         # Theme preferences
    └── navigationStore.ts    # Navigation state
```

### `/types` - TypeScript Definitions ✅

```
types/
├── api/ ✅
│   ├── supabase.ts ✅        # Supabase types
│   └── responses.ts ✅       # API response types
├── models/ ✅
│   ├── user.ts ✅
│   ├── item.ts ✅
│   ├── outfit.ts ✅
│   ├── post.ts ✅
│   └── subscription.ts ✅
└── navigation/ ✅
    └── types.ts ✅           # Navigation param lists
```

### `/lib` - External Libraries Config

```
lib/
├── api/
│   ├── client.ts            # API client setup
│   └── endpoints.ts         # API endpoints
├── supabase/ ✅
│   ├── client.ts ✅          # Supabase client configured
│   └── schema.sql ✅         # Complete DB schema (16 migrations applied)
└── storage/
    ├── asyncStorage.ts      # AsyncStorage wrapper
    └── fileSystem.ts        # File system helpers
```

## Naming Conventions

### Files

- **Components:** PascalCase (e.g., `ItemCard.tsx`)
- **Screens:** kebab-case (e.g., `sign-in.tsx`)
- **Utilities:** camelCase (e.g., `imageHelpers.ts`)
- **Types:** PascalCase (e.g., `UserModel.ts`)
- **Stores:** camelCase (e.g., `authStore.ts`)

### Folders

- Use kebab-case for all folders (e.g., `outfit-creator`)
- Group related files in descriptive folders

### Variables and Functions

- **Variables:** camelCase (e.g., `currentUser`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_ITEMS_COUNT`)
- **Functions:** camelCase (e.g., `getUserProfile()`)
- **React Components:** PascalCase (e.g., `function UserProfile()`)
- **Types/Interfaces:** PascalCase (e.g., `interface UserProfile`)

## Import Aliases

Configure these path aliases in `tsconfig.json`, `babel.config.js`, and `metro.config.js` ✅:

```json
{
  "@app/*": ["app/*"],
  "@components/*": ["components/*"],
  "@services/*": ["services/*"],
  "@store/*": ["store/*"],
  "@hooks/*": ["hooks/*"],
  "@utils/*": ["utils/*"],
  "@types/*": ["types/*"],
  "@assets/*": ["assets/*"],
  "@lib/*": ["lib/*"],
  "@config/*": ["config/*"]
}
```

## Best Practices

### Component Organization

- Keep components small and focused (single responsibility)
- Co-locate component-specific styles and tests
- Use barrel exports (index.ts) for cleaner imports
- Separate presentational and container components

### Code Splitting

- Lazy load heavy components and screens
- Use dynamic imports for optional features
- Split vendor bundles appropriately

### Asset Management

- Optimize images before adding to project
- Use appropriate image formats (PNG for transparency, JPG for photos)
- Keep asset file sizes minimal
- Use vector icons when possible

### State Management

- Keep stores focused on specific domains
- Don't duplicate server state in local state
- Use TanStack Query for server state caching
- Persist only necessary data

### Testing Structure

```
__tests__/
├── components/
├── services/
├── utils/
└── e2e/
```

### Environment Variables

Required `.env` variables:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PIXIAN_API_ID=
EXPO_PUBLIC_PIXIAN_API_SECRET=
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
```

## File Size Guidelines

- Components: < 200 lines
- Services: < 300 lines
- Utilities: < 100 lines per function
- Split larger files into smaller, focused modules

## Security Considerations

- Never commit `.env` files
- Store sensitive keys in Expo SecureStore
- Validate all user inputs
- Sanitize data before storage
- Use HTTPS for all API calls
- Implement proper authentication checks

## Performance Guidelines

- Optimize list rendering with FlashList
- Implement image caching strategy
- Use memo and callbacks appropriately
- Lazy load heavy screens
- Minimize re-renders
- Profile performance regularly

## Documentation Requirements

- Document all public APIs
- Add JSDoc comments for complex functions
- Include README in major folders
- Keep documentation up-to-date
- Document breaking changes
