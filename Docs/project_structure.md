# Project Structure - Obrazz

**Последнее обновление:** 13 января 2025  
**Статус:** Stage 1 завершён ✅

## Overview

This document defines the folder structure and organization guidelines for the Obrazz React Native application.

**Легенда:**

- ✅ Создано и настроено (Stage 1)
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
│   ├── (auth)/ ✅            # Authentication flow screens (placeholders)
│   ├── (tabs)/ ✅            # Tab-based navigation screens (placeholders)
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
├── components/ 📋             # Reusable components (готова структура)
│   ├── common/ 🚧           # Generic components
│   ├── wardrobe/ 🚧         # Wardrobe-specific components
│   ├── outfit/ 🚧           # Outfit creator components
│   ├── community/ 🚧        # Community feed components
│   └── ui/ 🚧              # Base UI components
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
│   └── STAGE_1_SUMMARY.md ✅
├── hooks/ 📋                  # Custom React hooks (готова структура)
├── lib/ ✅                   # External library configurations
│   └── supabase/ ✅         # Supabase specific logic
│       ├── client.ts ✅
│       └── schema.sql ✅
├── services/ 📋               # Business logic services (готова структура)
│   ├── auth/ 🚧            # Authentication service (Stage 2)
│   ├── wardrobe/ 🚧        # Wardrobe management (Stage 3)
│   ├── outfit/ 🚧          # Outfit creation/AI (Stage 4-5)
│   └── subscription/ 🚧    # Payment handling (Stage 7)
├── store/ 📋                  # Zustand stores (готова структура)
│   ├── auth/ 🚧
│   ├── wardrobe/ 🚧
│   └── ui/ 🚧
├── styles/ 📋                 # Global styles and themes (готова структура)
│   ├── themes/ 🚧
│   └── global.ts 🚧
├── types/ ✅                  # TypeScript type definitions
│   ├── api/ ✅
│   ├── models/ ✅
│   └── navigation/ ✅
├── utils/ 📋                  # Utility functions (готова структура)
│   ├── image/ 🚧
│   ├── validation/ 🚧
│   └── helpers/ 🚧
├── locales/ 📋                # i18n translations (готова структура)
│   ├── en/ 🚧
│   └── ru/ 🚧
├── node_modules/ ✅
├── .env ✅                   # Environment variables
├── .env.example 🚧          # Environment variables template
├── .eslintrc.js 🚧          # ESLint configuration (пока нет, использует inline config)
├── .gitignore ✅
├── .prettierrc 🚧           # Prettier configuration (пока нет, использует defaults)
├── app.json ✅              # Expo configuration
├── babel.config.js ✅       # Babel configuration
├── metro.config.js 🚧       # Metro bundler configuration (Expo defaults)
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

**Stage 1 Status:** Все основные экраны созданы как placeholders

```
app/
├── (auth)/ ✅                # Authentication flow screens
│   ├── _layout.tsx ✅       # Auth stack layout
│   ├── welcome.tsx ✅       # Welcome/splash screen (placeholder)
│   ├── sign-in.tsx ✅       # Sign in screen (placeholder)
│   ├── sign-up.tsx ✅       # Sign up screen (placeholder)
│   └── forgot-password.tsx ✅ # Password recovery (placeholder)
├── (tabs)/ ✅               # Tab-based navigation
│   ├── _layout.tsx ✅       # Tab navigator layout (configured)
│   ├── index.tsx ✅         # Home/Community feed (placeholder)
│   ├── wardrobe.tsx ✅      # Wardrobe screen (placeholder)
│   ├── create.tsx ✅        # Create outfit screen (placeholder)
│   └── profile.tsx ✅       # User profile (placeholder)
├── (modals)/ 🚧            # Modal screens (Stage 2+)
│   ├── add-item.tsx 🚧     # Add wardrobe item modal
│   ├── outfit-ai.tsx 🚧    # AI outfit generation
│   ├── subscription.tsx 🚧 # Subscription management
│   └── settings.tsx 🚧     # App settings
├── outfit/ 🚧              # Outfit screens (Stage 4)
│   ├── [id].tsx 🚧         # Outfit detail/edit screen
│   └── editor.tsx            # Outfit editor canvas
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
├── common/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Loader.tsx
│   └── ErrorBoundary.tsx
├── wardrobe/
│   ├── ItemCard.tsx
│   ├── ItemGrid.tsx
│   ├── ItemFilter.tsx
│   ├── CategoryPicker.tsx
│   └── ColorPicker.tsx
├── outfit/
│   ├── Canvas.tsx            # Drag & drop canvas
│   ├── CategoryCarousel.tsx  # Horizontal item carousel
│   ├── OutfitCard.tsx
│   ├── BackgroundPicker.tsx
│   └── TransformControls.tsx # Scale/rotate controls
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
├── auth/
│   ├── authService.ts        # Authentication logic
│   └── tokenManager.ts       # JWT token handling
├── wardrobe/
│   ├── itemService.ts        # Item CRUD operations
│   ├── imageProcessor.ts     # Image manipulation
│   └── backgroundRemover.ts  # Remove.bg integration
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
├── auth/
│   └── authStore.ts          # User auth state
├── wardrobe/
│   └── wardrobeStore.ts      # Items and categories
├── outfit/
│   └── outfitStore.ts        # Current outfit state
└── ui/
    ├── themeStore.ts         # Theme preferences
    └── navigationStore.ts    # Navigation state
```

### `/types` - TypeScript Definitions

```
types/
├── api/
│   ├── supabase.ts          # Supabase types
│   └── responses.ts         # API response types
├── models/
│   ├── user.ts
│   ├── item.ts
│   ├── outfit.ts
│   ├── post.ts
│   └── subscription.ts
└── navigation/
    └── types.ts             # Navigation param lists
```

### `/lib` - External Libraries Config

```
lib/
├── api/
│   ├── client.ts            # API client setup
│   └── endpoints.ts         # API endpoints
├── supabase/
│   ├── client.ts            # Supabase client
│   ├── queries.ts           # Database queries
│   └── migrations/          # DB migrations
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

Configure these path aliases in `tsconfig.json` and `babel.config.js`:

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
EXPO_PUBLIC_REMOVE_BG_API_KEY=
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
