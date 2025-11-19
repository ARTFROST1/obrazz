# Changelog

All notable changes to the Obrazz project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Stage 4: Manual Outfit Creator

- Outfit editor canvas with drag & drop
- Category carousels for item selection
- Transform controls (scale, rotate)
- Background selection
- Outfit saving and management

### Default Items System (November 2025)

#### Added

- **Default Items Feature** - Pre-configured wardrobe items for all users
  - 24 builtin items with images in Supabase Storage
  - Items visible to all users automatically
  - Users can hide (not delete) default items
  - Per-user hiding stored in `hidden_default_items` table

- **Database Migrations**
  - `001_create_hidden_default_items.sql` - Hidden items tracking table
  - `002_insert_default_items.sql` - Insert 24 default items

- **Service Methods** (`itemService.ts`)
  - `getUserItems()` - Load items including visible defaults
  - `getDefaultItems()` - Get all default items
  - `getHiddenDefaultItemIds()` - Get user's hidden item IDs
  - `hideDefaultItem()` - Hide a default item
  - `unhideDefaultItem()` - Restore a hidden item
  - `unhideAllDefaultItems()` - Restore all hidden items

- **State Management** (`wardrobeStore.ts`)
  - `hiddenDefaultItemIds` state
  - `removeItemLocally()` action
  - `setHiddenDefaultItemIds()`, `addHiddenDefaultItemId()`, `removeHiddenDefaultItemId()` actions
  - `getDefaultItems()`, `getUserOwnItems()` getters

- **UI Updates** (`wardrobe.tsx`)
  - Different delete behavior for default vs user items
  - "Hide Items" vs "Delete Items" confirmation messages
  - Combined message when both types selected

- **Documentation**
  - `DEFAULT_ITEMS_GUIDE.md` - Complete guide for managing default items

## [0.3.0] - 2025-01-14

### Stage 3: Wardrobe Management Core ✅

#### Added

- **Wardrobe Screen** (`app/(tabs)/wardrobe.tsx`)
  - 2-column responsive grid layout
  - Real-time search functionality
  - Advanced filtering system (category, color, style, season, favorites)
  - Pull-to-refresh support
  - Item count display
  - Empty states with helpful messages

- **Add Item Screen** (`app/add-item.tsx`)
  - Camera integration with expo-camera
  - Gallery integration with expo-image-picker
  - Image preview with remove option
  - Optional background removal (Remove.bg API)
  - Form validation for required fields
  - Category, color, style, season selection
  - Brand and size optional fields

- **Item Detail Screen** (`app/item/[id].tsx`)
  - Full-screen image view
  - Complete item metadata display
  - Favorite toggle
  - Delete with confirmation
  - Usage statistics

- **Components**
  - `ItemCard` - Grid item card with favorite button
  - `ItemGrid` - Virtualized 2-column grid
  - `CategoryPicker` - Horizontal category selector
  - `ColorPicker` - Color selection component
  - `ItemFilter` - Full-screen filter modal

- **State Management**
  - `wardrobeStore` - Zustand store with AsyncStorage persistence
  - Complete CRUD operations
  - Advanced filtering and sorting
  - Favorite management

- **Services**
  - `itemService` - Supabase CRUD operations
  - Local image storage and thumbnails
  - Image optimization
  - `backgroundRemoverService` - Remove.bg API integration

- **Dependencies**
  - expo-camera ~16.0.0
  - expo-image-picker ~16.0.0
  - expo-file-system ~18.0.8
  - expo-image-manipulator ~13.0.0

#### Changed

- Updated `Button` component to support children prop
- Updated `types/models/user.ts` Season and StyleTag types
- Updated `config/env.ts` with exported constants
- Updated `app.json` with camera and photo library permissions

#### Fixed

- TypeScript EncodingType issues in expo-file-system
- Style conditional rendering in React Native
- Button component prop interface

#### Documentation

- Created `STAGE_3_COMPLETION.md` - Detailed technical report
- Created `STAGE_3_TESTING_GUIDE.md` - 14 test scenarios
- Created `STAGE_3_SUMMARY.md` - Executive summary
- Updated `Implementation.md` - Marked Stage 3 complete

## [0.2.0] - 2025-01-13

### Stage 2: Authentication & User Management ✅

#### Added

- Welcome screen with app features
- Sign up screen with validation
- Sign in screen with password recovery
- Profile screen with logout functionality
- Supabase authentication integration
- Auth store with persistence
- Protected route handling
- User session management

## [0.1.0] - 2025-01-12

### Stage 1: Foundation & Setup ✅

#### Added

- Project initialization with Expo SDK 54
- TypeScript configuration
- React Native 0.81.4 setup
- Supabase client configuration
- Database schema (16 migrations)
- ESLint and Prettier setup
- Husky pre-commit hooks
- Navigation structure with Expo Router
- Base UI components (Button, Input, Loader)
- Type definitions for all models
- Environment configuration
- Project structure and aliases

#### Documentation

- TechStack.md - Complete technology stack
- Implementation.md - 10-stage implementation plan
- project_structure.md - File organization guide
- UI_UX_doc.md - Design system specification
- Bug_tracking.md - Issue tracking template
- README.md - Project overview
- QUICKSTART.md - Quick start guide

---

## Version History

- **v0.3.0** - Wardrobe Management (Current)
- **v0.2.0** - Authentication & User Management
- **v0.1.0** - Foundation & Setup
- **v0.4.0** - Manual Outfit Creator (Planned)
- **v0.5.0** - AI Outfit Generation (Planned)
- **v0.6.0** - Community & Social (Planned)
- **v0.7.0** - Subscription & Monetization (Planned)
- **v0.8.0** - Polish & Optimization (Planned)
- **v0.9.0** - Testing & QA (Planned)
- **v1.0.0** - Production Launch (Planned)

---

## Breaking Changes

### v0.3.0

- `Button` component now accepts `children` prop (non-breaking, additive)
- Season type changed from `'autumn'` to `'fall'` (breaking if used)
- StyleTag type updated with new values (breaking if strict type checking)

### v0.2.0

- Initial auth implementation, no breaking changes

### v0.1.0

- Initial release, baseline version

---

## Migration Guides

### Upgrading to v0.3.0

If you have existing code using Season or StyleTag types:

```typescript
// Before
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// After
type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Before
type StyleTag = 'casual' | 'formal' | 'sporty' | 'street' | 'boho' | ...;

// After
type StyleTag = 'casual' | 'formal' | 'sporty' | 'elegant' | 'bohemian' | 'streetwear' | ...;
```

---

## Contributors

- AI Development Agent - Implementation
- Project Team - Planning and Design

---

## License

Proprietary - All Rights Reserved

---

_Last Updated: January 14, 2025_
