# Project Structure - Obrazz

**Last Updated:** January 30, 2026
**Current Stage:** Stage 4.13 Complete ✅ (Navigation Refactor + Offline-First + OAuth)
**Documentation Status:** ✅ Synchronized with codebase

## Overview

This document defines the folder structure and organization guidelines for the Obrazz React Native application.

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
│   ├── fonts/ ✅
│   ├── images/ ✅
│   ├── icons/ 🚧
│   └── animations/ 🚧       # Lottie animations
├── components/ ✅             # Reusable components
│   ├── common/ ✅           # Generic components (ImageCropper system)
│   ├── wardrobe/ ✅         # Wardrobe-specific components (Stage 3)
│   ├── outfit/ ✅           # Outfit creator components (Stage 4.7-4.8 - SmoothCarousel + Tabs)
│   ├── shopping/ ✅         # Shopping browser components (Stage 4.11)
│   ├── sync/ ✅             # Sync status components (Stage 4.12)
│   ├── home/ ✅             # Home screen components (CategoriesCarousel, StylesCarousel)
│   ├── ui/ ✅              # Base UI components (Button, Input, FAB, Loader, glass/)
│   └── Other components  # EditScreenInfo, ExternalLink, StyledText, Themed
├── config/ ✅                 # Configuration files
│   └── env.ts ✅            # Environment config
├── constants/ ✅              # Constants
│   ├── Colors.ts ✅
│   ├── categories.ts ✅     # 8 unified categories
{{ ... }}
│   └── outfitTabs.ts ✅     # Tab configurations (Stage 4.8 - NEW)
├── contexts/ 📋               # React contexts (готова структура)
├── Docs/ ✅                  # Documentation
│   ├── TechStack.md ✅
│   ├── Implementation.md ✅
│   ├── project_structure.md ✅
│   ├── Bug_tracking.md ✅
│   ├── UI_UX_doc.md ✅
│   ├── AppMapobrazz.md ✅
│   ├── PRDobrazz.md ✅
│   ├── README.md ✅
│   └── Extra/ ✅             # Additional documentation and archives
│       ├── QUICKSTART.md ✅
│       ├── DEVELOPER_CHECKLIST.md ✅
│       ├── STATUS.md ✅
│       ├── CURRENT_STATUS.md ✅
│       ├── CHANGELOG.md ✅
│       └── Archive/ ✅       # Archived stage completion docs
├── hooks/ ✅                  # Custom React hooks
│   ├── useKeyboardAwareScroll.ts ✅
│   ├── useSyncStatus.ts ✅   # Sync status hook (Stage 4.12)
│   └── useTranslation.ts ✅
├── lib/ ✅                   # External library configurations
│   └── supabase/ ✅         # Supabase specific logic
│       ├── client.ts ✅
│       └── schema.sql ✅
├── services/ 📋               # Business logic services
│   ├── auth/ ✅            # Authentication service (authService.ts + oauthService.ts)
│   ├── wardrobe/ ✅        # Wardrobe management (Stage 3 + 4.12 + 4.13)
│   │   ├── itemService.ts ✅          # Legacy online-only service
│   │   ├── itemServiceOffline.ts ✅   # Offline-first service (Stage 4.12)
│   │   └── backgroundRemover.ts ✅     # Pixian.ai + Apple Vision (subject-lifter)
│   ├── outfit/ ✅          # Outfit creation (Stage 4 + 4.12)
│   │   ├── outfitService.ts ✅        # Legacy online-only service
│   │   └── outfitServiceOffline.ts ✅ # Offline-first service (Stage 4.12)
│   ├── sync/ ✅            # Sync infrastructure (Stage 4.12)
│   │   ├── index.ts ✅                # Barrel export
│   │   ├── syncQueue.ts ✅            # Operation queue for offline
│   │   ├── syncService.ts ✅          # Sync orchestration
│   │   ├── networkMonitor.ts ✅       # Network state tracking
│   │   └── types.ts ✅                # Sync-related types
│   ├── shopping/ ✅        # Shopping browser (Stage 4.11)
│   │   ├── storeService.ts ✅         # Store management
│   │   └── webCaptureService.ts ✅    # Screenshot capture
│   ├── iap/ ✅             # In-App Purchases (Stage 5)
│   │   └── iapService.ts ✅           # IAP logic (App Store / Google Play)
│   ├── region/ ✅          # Region detection (Stage 5)
│   │   └── regionService.ts ✅        # RU/Global detection for payments
│   └── subscription/ ✅    # Payment handling (Stage 5)
│       └── subscriptionService.ts ✅  # Rails backend API
├── store/ 📋                  # Zustand stores
│   ├── auth/ ✅            # Auth store with persistence (authStore.ts)
│   ├── wardrobe/ ✅        # Wardrobe store (Stage 3)
│   ├── outfit/ ✅          # Outfit store with undo/redo (Stage 4)
│   ├── subscription/ ✅    # Subscription store (Stage 5)
│   └── ui/ 🚧
├── styles/ 📋                 # Global styles and themes (готова структура)
│   ├── themes/ 🚧
│   └── global.ts 🚧
├── types/ ✅                  # TypeScript type definitions
│   ├── api/ ✅
│   ├── models/ ✅
│   └── navigation/ ✅
├── utils/ ✅                  # Utility functions
│   ├── storage/ ✅           # Storage utilities (Stage 4.8)
│   │   └── customTabStorage.ts ✅ # AsyncStorage for custom tab
│   ├── shopping/ ✅          # Shopping utilities (Stage 4.11)
│   │   ├── imageDetection.ts ✅   # Image detection script injection
│   │   ├── logoFetcher.ts ✅      # Store favicon fetching
│   │   └── webviewOptimization.ts ✅ # Performance optimizations
│   ├── validation/ ✅       # Validation utilities
│   │   └── authValidation.ts ✅  # Auth validation
│   ├── image/ ✅             # Image utilities
│   │   ├── imageCompression.ts ✅
│   │   └── index.ts ✅
│   ├── errors/ ✅            # Error handling
│   │   ├── errorHandler.ts ✅
│   │   └── ServiceError.ts ✅
│   ├── logger/ ✅            # Logging utilities
│   │   └── index.ts ✅
│   ├── item/ ✅              # Item utilities
│   ├── debounce.ts ✅        # Debounce utility
│   ├── platform.ts ✅        # Platform detection
│   └── helpers/ 🚧
├── locales/ ✅                # i18n translations
│   ├── en/ ✅                # English translations (7 files)
│   │   ├── auth.json ✅
│   │   ├── categories.json ✅
│   │   ├── common.json ✅
│   │   ├── navigation.json ✅
│   │   ├── outfit.json ✅
│   │   ├── profile.json ✅
│   │   └── wardrobe.json ✅
│   └── ru/ ✅                # Russian translations (7 files)
├── node_modules/ ✅
├── .env ✅                   # Environment variables
├── .env.example ✅          # Environment variables template
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
├── CLAUDE.md ✅              # Copilot context file
└── TEST_SETUP_COMPLETE.md ✅
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
│   ├── index.tsx ✅         # Home (Shopping Stories / entry point; AI Hub planned)
│   ├── wardrobe.tsx ✅      # Wardrobe screen (Stage 3)
│   ├── outfits.tsx ✅       # Saved outfits collection (Stage 4.5)
│   └── profile.tsx ✅       # User profile with logout (Stage 2)
├── (modals)/ 🚧            # Modal screens (Stage 2+)
│   ├── add-item.tsx 🚧     # Add wardrobe item modal
│   ├── outfit-ai.tsx 🚧    # AI outfit generation
│   ├── subscription.tsx 🚧 # Subscription management
│   └── settings.tsx 🚧     # App settings
├── outfit/ ✅              # Outfit screens (Stage 4 + 4.5)
│   ├── create.tsx ✅        # Create/edit outfit screen (Stage 4)
│   └── [id].tsx ✅          # Outfit detail/view screen (Stage 4.5)
├── shopping/ ✅            # Shopping screens (Stage 4.11 - NEW)
│   ├── browser.tsx ✅       # Shopping Browser with WebView
│   └── cart.tsx ✅          # Shopping Cart screen
├── item/ ✅                # Item screens
│   └── [id].tsx ✅          # Item detail screen (Stage 3)
├── add-item.tsx ✅          # Add wardrobe item screen (Stage 3)
├── modal.tsx ✅             # Example modal
├── +html.tsx ✅             # HTML template for web
├── +not-found.tsx ✅        # 404 screen
└── _layout.tsx ✅           # Root layout with providers
```

### `/components` - Reusable Components (60+ total)

```
components/
├── ui/ ✅                     # Base UI components (Stage 2) - 7+ components
│   ├── Button.tsx ✅          # Primary/secondary button with loading
│   ├── Input.tsx ✅           # Form input with validation
│   ├── Loader.tsx ✅          # Loading spinner
│   ├── FAB.tsx ✅             # Floating Action Button
│   ├── SearchBar.tsx ✅       # Search input component
│   ├── DropdownMenu.tsx ✅    # Dropdown menu component
│   ├── glass/ ✅              # iOS 26+ Liquid Glass UI components
│   │   ├── GlassBackButton.tsx ✅
│   │   ├── GlassDropdownMenu.tsx ✅
│   │   ├── GlassIconButton.tsx ✅
│   │   ├── GlassSearchBar.tsx ✅
│   │   └── index.ts ✅
│   └── index.ts ✅            # Barrel export
├── common/ ✅                 # Common components (Stage 4.9) - 5 components
│   ├── ImageCropper.tsx ✅    # Custom 3:4 crop with pinch-to-zoom
│   ├── CropOverlay.tsx ✅     # Visual crop overlay
│   ├── ResizableCropOverlay.tsx ✅ # Resizable crop overlay
│   ├── DismissKeyboardView.tsx ✅ # Dismiss keyboard on tap
│   └── KeyboardAwareScrollView.tsx ✅ # Keyboard-aware scroll
├── wardrobe/ ✅               # Wardrobe components (Stage 3) - 8 components
│   ├── ItemCard.tsx ✅        # Item preview card
│   ├── ItemGrid.tsx ✅        # Grid display for items
│   ├── ItemFilter.tsx ✅      # Filtering component
│   ├── CategoryPicker.tsx ✅  # Category selection
│   ├── CategoryGridPicker.tsx ✅ # Grid-based category picker
│   ├── ColorPicker.tsx ✅     # Color selection
│   ├── SelectionGrid.tsx ✅   # Selection grid for multi-select
│   └── WardrobeHeader.tsx ✅  # Wardrobe screen header
├── outfit/ ✅                 # Outfit components (Stages 4.7-4.10) - 15 components
│   ├── SmoothCarousel.tsx ✅  # Physics-based carousel (Stage 4.7)
│   ├── CategorySelectorWithSmooth.tsx ✅ # Carousel container
│   ├── ItemSelectionStepNew.tsx ✅ # Step 1 with tab system (Stage 4.8)
│   ├── OutfitTabBar.tsx ✅    # Tab navigation (Stage 4.8)
│   ├── CustomTabManager.tsx ✅ # Inline category editing (Stage 4.8)
│   ├── CompositionStep.tsx ✅ # Step 2: Canvas composition
│   ├── OutfitCanvas.tsx ✅    # Drag & drop canvas with gestures
│   ├── BackgroundPicker.tsx ✅ # Background selector
│   ├── ItemMiniPreviewBar.tsx ✅ # Bottom preview bar
│   ├── OutfitCard.tsx ✅      # Outfit preview card
│   ├── OutfitGrid.tsx ✅      # Grid of outfit cards
│   ├── OutfitEmptyState.tsx ✅ # Empty outfit state
│   ├── OutfitFilter.tsx ✅    # Filter component
│   ├── OutfitPreview.tsx ✅   # Outfit detail preview
│   ├── OutfitHeader.tsx ✅    # Outfits screen header
│   └── index.ts ✅            # Barrel export
├── shopping/ ✅               # Shopping components (Stage 4.11) - 10 components
│   ├── GalleryBottomSheet.tsx ✅ # Gallery with detected items
│   ├── MasonryGallery.tsx ✅  # Masonry grid layout
│   ├── DetectedItemSheet.tsx ✅ # Bottom sheet for item details
│   ├── WebViewCropOverlay.tsx ✅ # Manual crop overlay for WebView
│   ├── CartItemRow.tsx ✅     # Cart item display component
│   ├── CartButton.tsx ✅      # Header cart button with count badge
│   ├── TabsCarousel.tsx ✅    # Tab switching carousel
│   ├── ShoppingStoriesCarousel.tsx ✅ # Store carousel (9 default stores)
│   ├── DetectionFAB.tsx ✅    # Floating action button for scan
│   └── GalleryImageItem.tsx ✅ # Gallery item component
├── sync/ ✅                   # Sync components (Stage 4.12) - 3 components
│   ├── OfflineBanner.tsx ✅   # Offline status banner
│   ├── SyncStatusIndicator.tsx ✅ # Sync status indicator
│   └── index.ts ✅            # Barrel export
├── home/ ✅                   # Home screen components - 2 components
│   ├── CategoriesCarousel.tsx ✅ # Categories carousel
│   └── StylesCarousel.tsx ✅  # Styles carousel
├── Root components ✅         # Expo template & utility components - 4 components
│   ├── EditScreenInfo.tsx ✅  # Development info component
│   ├── ExternalLink.tsx ✅    # External link handler
│   ├── StyledText.tsx ✅      # Themed text component
│   └── Themed.tsx ✅          # Theme-aware components
├── Hooks ✅                   # Custom hooks (in components folder)
│   ├── useClientOnlyValue.ts ✅ # Client-side value hook
│   ├── useClientOnlyValue.web.ts ✅ # Web version
│   ├── useColorScheme.ts ✅   # Color scheme hook
│   └── useColorScheme.web.ts ✅ # Web color scheme

> Note: Community/social features are removed from scope.
```

### `/services` - Business Logic

```
services/
├── auth/ ✅                   # Authentication (Stage 2)
│   └── authService.ts ✅      # Complete auth logic (signUp, signIn, signOut, reset)
├── wardrobe/ ✅             # Wardrobe services (Stage 3)
│   ├── itemService.ts ✅      # Item CRUD operations + Default Items management
│   └── backgroundRemover.ts ✅ # Pixian.ai background removal
├── outfit/ ✅               # Outfit services (Stage 4)
│   └── outfitService.ts ✅    # Outfit CRUD with canvasSettings
├── shopping/ ✅             # Shopping services (Stage 4.11 - NEW)
│   ├── storeService.ts ✅     # Store management (CRUD, history tracking)
│   └── webCaptureService.ts ✅ # Screenshot capture service
└── Future services 🚧      # Planned services
    ├── aiGenerator.ts 🚧      # AI outfit generation
    ├── canvasManager.ts 🚧     # Canvas state management
    ├── purchaseManager.ts 🚧   # RevenueCat integration
    └── quotaManager.ts 🚧       # Feature limits
```

### `/store` - State Management

```
store/
├── auth/ ✅
│   └── authStore.ts ✅        # User auth state with persistence
├── wardrobe/ ✅
│   └── wardrobeStore.ts ✅    # Items and categories state + hidden default items
├── outfit/ ✅
│   └── outfitStore.ts ✅      # Outfit state with tab system (Stage 4.8-4.10)
├── settings/ ✅
│   └── settingsStore.ts ✅    # App settings state
├── shoppingBrowserStore.ts ✅ # Shopping browser state (Stage 4.11 - NEW)
│                              # Tabs, cart, detected images, scan state
├── storage.ts ✅              # Storage utilities
└── Future stores 🚧           # Planned stores
    ├── themeStore.ts 🚧       # Theme preferences
    └── navigationStore.ts 🚧  # Navigation state
```

### `/types` - TypeScript Definitions ✅

```
types/
├── api/ ✅
│   ├── supabase.ts ✅        # Supabase types
│   └── responses.ts ✅       # API response types
├── models/ ✅
│   ├── index.ts ✅           # Barrel export
│   ├── user.ts ✅            # User model
│   ├── item.ts ✅            # Item model with ItemCategory
│   ├── outfit.ts ✅          # Outfit model with CanvasSettings
│   ├── post.ts ✅            # Post model
│   ├── store.ts ✅           # Store model (Stage 4.11)
│   │                         # Store, BrowserTab, DetectedImage, CartItem
│   └── subscription.ts ✅    # Subscription model
├── components/ ✅            # Component-specific types (Stage 4.8)
│   ├── FAB.ts ✅             # FAB types
│   ├── OutfitCard.ts ✅      # OutfitCard types
│   └── OutfitCreator.ts ✅   # OutfitTabType, CustomTabState
└── navigation/ ✅
    └── types.ts ✅           # Navigation param lists
```

### `/lib` - External Libraries Config

```
lib/
├── i18n/ ✅                  # Internationalization
│   └── config.ts ✅          # i18next configuration
├── supabase/ ✅
│   ├── client.ts ✅          # Supabase client configured
│   ├── schema.sql ✅         # Complete DB schema
│   └── migrations/ ✅        # Database migrations
└── api/ 🚧                   # API client (future)
    ├── client.ts 🚧          # API client setup
    └── endpoints.ts 🚧       # API endpoints
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
