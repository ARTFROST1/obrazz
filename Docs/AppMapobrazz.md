# Obrazz — Detailed App Map & Full Page & Function Descriptions (English + Russian)

> This document is a comprehensive, developer- and designer-focused application map for **Obrazz** — a personal wardrobe + AI styling mobile app built with React Native. It covers every screen, interaction pattern, data flow, API considerations and functional details required to implement the MVP and extend it later.

**Latest Update:** December 20, 2025
**Current Stage:** Stage 4.12 Complete ✅ (Offline-First Architecture реализована)
**Project Status:** Auth, Wardrobe Management (offline-first), 4-Tab Outfit Creator (offline-first), Shopping Browser - FULLY IMPLEMENTED
**Next Stage:** Stage 5 - AI-анализ вещей при загрузке
**Documentation Status:** ✅ Synchronized with actual implementation

---

## Table of Contents

1. Product summary
2. Implementation status & current features
3. High-level architecture & data model
4. Global UI patterns and components
5. Full screen list and detailed behavior
   - Authentication & Onboarding ✅
   - Home (AI Hub) 🚧
   - Wardrobe (library) ✅
   - Item Add / Edit / Detail ✅ (with ImageCropper)
   - Outfit Creator (manual) ✅ (4-Tab System + SmoothCarousel)
   - Outfit Detail / View ✅
   - Saved Outfits (collection) ✅
   - Shopping Browser ✅ (Multi-tab, Auto-detection, Cart)
   - AI-стилист (подбор образов) 🚧
   - AI-примерка на фото 🚧
   - Profile ✅
   - Settings 🚧
   - Subscription & Billing 🚧
   - Onboarding & Paywall 🚧
6. Navigation flow & screen transitions
7. API endpoints / backend responsibilities
8. Data flows and storage details
9. Edge cases, errors & validation
10. Security, permissions, privacy
11. Accessibility & localization
12. Analytics and instrumentation
13. Appendix

---

## 1. Product summary

**Obrazz** is a mobile-first application for users to upload and organize their clothing items, build outfits manually with an editor (collage), and generate outfits automatically using an AI stylist that picks items from the user's wardrobe. The app includes AI-powered try-on feature allowing users to see how outfits look on their photos.

**Key Features:**

- 📦 Personal wardrobe management with auto background removal (offline-first)
- 🎨 Manual outfit creator with 4-tab system and drag-drop canvas (offline-first)
- 🛒 Shopping Browser - добавление вещей из интернет-магазинов (9 default stores)
- ⚡ **Offline-First Architecture** - instant UI updates, background sync, full offline support
- 🤖 AI-stylist for automatic outfit generation (planned)
- 👗 AI try-on on user photos (planned)
- 🎮 Gamification with streak and challenges (planned)
- 💳 Subscription model with YooMoney (RU) and IAP (global)

---

## 2. Implementation Status & Current Features

### Completed Stages (As of November 22, 2025)

#### ✅ Stage 1: Foundation & Setup

- Expo project with TypeScript fully configured
- Complete folder structure with path aliases
- Supabase client integration
- Database schema with 16 migrations applied
- ESLint, Prettier, Husky configured
- TypeScript types for all entities

#### ✅ Stage 2: Authentication & User Management

- Email-based registration and sign-in
- Password reset flow
- JWT token management with auto-refresh
- Zustand auth store with AsyncStorage persistence
- Protected route navigation
- Profile screen with logout functionality
- Welcome/onboarding screens

#### ✅ Stage 3: Wardrobe Management Core

- Wardrobe grid screen with ItemCard components
- Camera integration (expo-camera)
- Gallery picker (expo-image-picker)
- Background removal service (Pixian.ai integration)
- Item metadata form (category, colors, styles, seasons, brand, size)
- Full CRUD operations for wardrobe items
- Local image storage using expo-file-system
- Advanced filtering (category, color, style, season, favorite)
- Search functionality
- Item detail screen with statistics

#### ✅ Stage 4: Manual Outfit Creator

- Interactive canvas with drag & drop gestures
- Pinch to zoom/scale items
- Two-finger rotation
- 7 category carousels (headwear, outerwear, tops, bottoms, footwear, accessories, bags)
- Randomize function with category locking
- Multiple background options
- Undo/Redo functionality
- Save outfit with title and metadata
- Edit existing outfits
- Full gesture handler integration

#### ✅ Stage 4.5: Outfits Collection & Navigation

- Outfits tab in main navigation (replaced Create tab)
- Outfit grid display with OutfitCard components

#### ✅ Stage 4.6: Outfit Creator UX Refactoring

- **Two-step creation process:**
  - Step 1: Item Selection - vertical scroll of seamless carousels
  - Step 2: Composition - canvas with drag & drop and tools
- **Edit mode** loads directly to Step 2 (composition)
- **Create mode** starts from Step 1 (selection)
- FAB (Floating Action Button) for creating outfits
- Search and filter (all/private/shared)
- Sort options (newest, favorites, most worn)
- Quick actions (edit, duplicate, delete, share)
- Outfit detail/view screen
- Navigation to /outfit/create stack screen

#### ✅ Stage 4.7: SmoothCarousel System

**Complete carousel system replacement with modern physics-based implementation**

**Key Components:**

- **SmoothCarousel.tsx** - Modern carousel with realistic physics
  - Deceleration: 0.985 (natural momentum like CS:GO case opening)
  - Infinite loop with 30+ duplicates buffer for seamless scrolling
  - Full-width edge-to-edge design across entire screen
  - Border highlight on center item (no overlay buttons)
  - Velocity-based smart snapping
  - Ref-based tracking to prevent flickering
  - Items maintain 3:4 aspect ratio

**Technical Improvements:**

- Minimal state updates (ref-based tracking)
- Native snap with momentum physics
- Anti-flickering protection
- Performance optimized for fast scrolling

**Removed Legacy Components:**

- 5 obsolete carousel components removed (31KB)
- 33 documentation files archived

---

#### ✅ Stage 4.8: 4-Tab System (Current Implementation)

**Transition from 3 display modes to 4 customizable tabs**

**New Architecture:**

- **Tab 1: Basic** (👕) - 3 carousels: tops, bottoms, footwear
- **Tab 2: Dress** (👗) - 3 carousels: fullbody, footwear, accessories
- **Tab 3: All** (🔲) - 8 carousels: all categories with vertical scroll
- **Tab 4: Custom** (⚙️) - User-configurable categories

**Key Features:**

- **OutfitTabBar.tsx** ✅ - Tab navigation component
- **CustomTabManager.tsx** ✅ - Inline category editing
  - Add/remove categories
  - Duplicates allowed
  - AsyncStorage persistence
- **Clean carousels** - No flag buttons or overlays
- **Dynamic height** - Adapts to number of categories in tab

**New Files:**

- `types/components/OutfitCreator.ts` ✅ - OutfitTabType, CustomTabState
- `constants/outfitTabs.ts` ✅ - Tab configurations (4 default tabs)
- `utils/storage/customTabStorage.ts` ✅ - AsyncStorage persistence logic
- `components/outfit/OutfitTabBar.tsx` ✅ - Tab navigation UI
- `components/outfit/CustomTabManager.tsx` ✅ - Inline tab editing

---

#### ✅ Stage 4.9: ImageCropper Refactor

**Custom 3:4 crop with nativelike pinch-to-zoom**

**Key Features:**

- **Focal-point anchored pinch** - Zoom to touch point
- **Elastic boundaries** - Temporary over-zoom/pan with spring return
- **Simultaneous gestures** - 2-finger pinch + 1-finger pan
- **Double-tap zoom** - Quick zoom toggle
- **Spring animations** - damping: 20, stiffness: 300

**Components:**

- `components/common/ImageCropper.tsx` ✅ - Main component with pinch gestures
- `components/common/CropOverlay.tsx` ✅ - Visual overlay with darkened background
- `components/common/ResizableCropOverlay.tsx` ✅ - Alternative resizable overlay
- Uses `react-native-zoom-toolkit@^5.0.1`

---

#### ✅ Stage 4.10: Data Persistence Architecture

**Fixed critical edit mode data corruption bug**

**Solution:**

- AsyncStorage NOT loaded in edit mode
- Custom tab config loaded from outfit's `canvasSettings`
- Backward compatibility for older outfits
- Independent storage per outfit

**Files Updated:**

- `ItemSelectionStepNew.tsx` - Conditional AsyncStorage loading
- `outfitService.ts` - Full item data loading
- `outfitStore.ts` - Priority-based config restoration

---

#### ✅ Stage 4.11: Shopping Browser & Web Capture

**Complete shopping integration with multi-tab browser and intelligent image detection**

**Purpose:** Добавление вещей в гардероб напрямую из интернет-магазинов

**Key Features:**

- **Shopping Browser Screen** (`/shopping/browser.tsx`) ✅
  - Full WebView integration with mobile user-agent
  - Multi-tab system (up to 5 tabs simultaneously)
  - Automatic image detection on page load
  - Manual scan button for on-demand detection
  - Forward/backward navigation with gestures
  - Tab carousel with favicons

- **Intelligent Image Detection** ✅
  - JavaScript injection for automatic product image scanning
  - Filters images by size (min 200x200px, max 2000x2000px)
  - Deduplication by URL and dimensions
  - Category confidence scoring
  - Gallery bottom sheet with detected items

- **Shopping Cart** (`/shopping/cart.tsx`) ✅
  - Persistent cart storage via AsyncStorage
  - Add detected items to cart for later
  - Batch upload - add all cart items at once
  - Individual item management (delete, add to wardrobe)
  - Clear cart functionality

- **Manual Crop Mode** ✅
  - WebViewCropOverlay for manual screenshot capture
  - Falls back when auto-detection finds nothing
  - Direct integration with add-item screen

- **Default Stores** (9 интернет-магазинов) ✅
  - ZARA, H&M, ASOS, Nike, Adidas
  - Reserved, Mango, Pull&Bear, Bershka
  - Favicon support for visual identification
  - Custom store addition capability

**Components Created:**

- `components/shopping/GalleryBottomSheet.tsx` ✅ - Gallery with detected items
- `components/shopping/MasonryGallery.tsx` ✅ - Masonry grid layout
- `components/shopping/DetectedItemSheet.tsx` ✅ - Bottom sheet for item details
- `components/shopping/WebViewCropOverlay.tsx` ✅ - Manual crop overlay
- `components/shopping/CartItemRow.tsx` ✅ - Cart item display
- `components/shopping/CartButton.tsx` ✅ - Header cart button
- `components/shopping/TabsCarousel.tsx` ✅ - Tab switching carousel
- `components/shopping/ShoppingStoriesCarousel.tsx` ✅ - Store carousel
- `components/shopping/DetectionFAB.tsx` ✅ - Floating action button

**Services & State:**

- `services/shopping/storeService.ts` ✅ - Store management (CRUD, history)
- `services/shopping/webCaptureService.ts` ✅ - Screenshot capture
- `store/shoppingBrowserStore.ts` ✅ - Full state management:
  - Tabs, active tab, detected images
  - Cart items with AsyncStorage persistence
  - Scan state (isScanning, hasScanned)
  - Batch upload queue management
  - Selection state for multi-select

**Utilities:**

- `utils/shopping/imageDetection.ts` ✅ - Image detection script injection
- `utils/shopping/webviewOptimization.ts` ✅ - Performance optimizations

**Types:**

- `types/models/store.ts` ✅
  - Store, BrowserTab, DetectedImage
  - CartItem, BrowserHistoryItem
  - BatchProcessingState

**Technical Implementation:**

- WebView with injected JavaScript for image detection
- AsyncStorage for cart persistence
- Multi-tab architecture with tab switching
- Batch processing for multiple items
- Integration with existing add-item flow

**User Flow:**

1. User opens Shopping Browser from home/wardrobe
2. Tabs open for all 9 default stores
3. User browses store, images auto-detected on page load
4. User clicks "Scan" for manual detection
5. Gallery sheet opens with detected items
6. User can:
   - Add selected items to cart
   - Add directly to wardrobe (opens add-item screen)
   - Use manual crop if no items detected
7. Cart persists across sessions
8. Batch upload all cart items with one button

---

### 🚧 Planned (Stage 5+)

#### Stage 5: AI-функции (The New Black API)

- Virtual Try-On — примерка вещей на фото пользователя
- Fashion Models — генерация модели в одежде
- Variations — вариации дизайна вещей
- Rails Backend как прокси к The New Black API
- Токены: FREE 5/мес, PRO 50/мес, MAX 150/мес

#### Stage 6: Ruby on Rails Backend

- JWT авторизация (Supabase JWT validation)
- Admin panel (custom Rails admin)
- Token balance management
- Webhooks for YooMoney/RevenueCat

#### Stage 7: Подписки и биллинг

- YooMoney integration (Russia) via website
- IAP integration (global) via RevenueCat
- Plans: PRO (399₽/mo), MAX (799₽/mo)
- Purchasable token packs: 10-300 токенов

#### Stage 8: Геймификация и streak

- YooMoney integration (Russia) via website
- IAP integration (global) via RevenueCat
- Plans: PRO (399₽/mo), MAX (799₽/mo)
- Website user account & subscription management

#### Stage 9: Push Notifications & Gamification

- expo-notifications integration
- Streak system (daily usage tracking)
- Challenges and achievements
- Push reminders

#### Stage 10: Onboarding, Paywall & Ads

- Interactive onboarding tour
- Soft paywall after free limits
- VK Ads, РСЯ (Russia), Google AdMob (global)

### Current Application Structure

**Main Navigation Tabs (Bottom Tab Bar):**

1. 🏠 **Home** (`/(tabs)/index.tsx`) - AI Hub (streak, quick actions)
2. 👔 **Wardrobe** (`/(tabs)/wardrobe.tsx`) - Fully functional wardrobe management
3. 📸 **Outfits** (`/(tabs)/outfits.tsx`) - Collection of saved outfits
4. 👤 **Profile** (`/(tabs)/profile.tsx`) - User profile and settings

**Stack Screens (Full-screen modals/pages):**

- 🔐 Authentication flow (`/(auth)/`)
- ➕ Add Item (`/add-item.tsx`)
- 📝 Item Detail (`/item/[id].tsx`)
- ✨ Create Outfit (`/outfit/create.tsx`)
- 👁️ Outfit Detail (`/outfit/[id].tsx`)
- 🛒 Shopping Browser (`/shopping/browser.tsx`) ✅
- 🛍️ Shopping Cart (`/shopping/cart.tsx`) ✅
- 🤖 AI Stylist (planned)
- 👗 AI Try-On (planned)

---

## 3. High-level architecture & data model

### 3.1 Architecture overview

**Current Implementation (Verified November 20, 2025):**

- **Frontend**: React Native 0.81.4 with Expo SDK 54.0.13, TypeScript 5.9.2
- **State Management**: Zustand 5.0.3 with AsyncStorage 2.1.0 persistence
- **Navigation**: Expo Router 6.0.11 (file-based routing)
- **Gestures & Animations**:
  - React Native Gesture Handler 2.28.0
  - React Native Reanimated 4.1.1
  - React Native Worklets 0.5.1
  - React Native Zoom Toolkit 5.0.1
- **Backend**: Supabase 2.51.0 (PostgreSQL, Auth, Storage)
- **Image Processing**:
  - Expo Camera 17.0.8
  - Expo Image Picker 17.0.8
  - Expo Image Manipulator 14.0.7
  - Pixian.ai API for background removal
- **File Storage**: Local device storage using expo-file-system 19.0.17
- **Data Fetching**: TanStack Query 5.71.0 ✅ (implemented)
- **Forms & Validation**: React Hook Form 7.56.0, Zod 3.24.0, Yup 1.6.0

**Planned:**

- Node.js microservice for AI (Stage 5)
- RevenueCat for subscriptions (Stage 7)

### 3.2 Key database entities (Postgres via Supabase)

**Implemented Tables:**

- **users**: id, email, name, avatar_url, created_at, updated_at, subscription_plan, locale
- **items**: id, user_id, title, category (8 unified categories), colors (array), styles (array), seasons (array), brand, size, material, image_local_path, image_url, created_at, updated_at, is_favorite
- **outfits**: id, user_id, title, description, items (jsonb with transforms), background, visibility, occasions (array), styles (array), seasons (array), created_at, updated_at, times_worn, is_favorite

**Shopping Browser Types (AsyncStorage only - Stage 4.11):**

- **Store**: id, name, url, faviconUrl, isDefault, order
- **BrowserTab**: id, shopName, shopUrl, favicon, currentUrl, scrollPosition
- **DetectedImage**: id, url, width, height, alt, category, confidence
- **CartItem**: id, image (DetectedImage), sourceUrl, sourceName, addedAt, fromCart
- **BrowserHistoryItem**: url, title, timestamp, shopName

> Note: Shopping data stored locally via AsyncStorage. No Supabase tables needed. Cart and tabs persist across app restarts.

**Planned Tables (future):**

> Note: Community/social tables were removed from scope.

- **subscriptions**: id, user_id, plan_type, started_at, expires_at, provider_reference
- **ai_requests**: id, user_id, params, result, created_at

**Categories (Unified System):**
8 categories defined in `constants/categories.ts`:

1. headwear (головной убор)
2. outerwear (верхняя одежда)
3. tops (верх)
4. bottoms (низ)
5. footwear (обувь)
6. accessories (аксессуары)
7. fullbody (FullBody)
8. other (Другое)

> Note: Images remain local on device. `items` table stores both image_local_path (primary) and image_url (optional backup). For syncing in the future, a migration path to cloud storage will be needed.

---

## 4. Global UI patterns and components

- **App bar**: Left: menu/back, center: screen title or search, right: actions (add, profile). Large on main screens, compact on editors.
- **Bottom navigation**: 4 tabs: Home (Feed), Wardrobe, Outfits, Profile. Secondary flows (Create Outfit, AI, Settings) are modals or stack screens.
- **Floating Action Button (FAB)**: Circular button positioned bottom-right for primary actions (e.g., Create Outfit on Outfits screen).
- **Card components**: OutfitCard (image grid preview), ItemCard (single item with details)
- **Modals**: Confirmation modal, Save modal, Subscription modal, Image editor modal.
- **Pickers**: Horizontal scroll carousels for clothes categories (in Creator), dropdowns for style/season.
- **Canvas**: Editable layered canvas used by Outfit Creator/Editor with gestures to move/scale/rotate items.
- **Toast & Snackbars**: For success/failure messages and quota warnings.

---

## 5. Full screen list and detailed behavior (ACTUAL IMPLEMENTATION)

Below are the pages with full, explicit behavior and each function described based on the current implementation.

---

### A. Authentication & Onboarding ✅ IMPLEMENTED

**Route:** `/(auth)/`  
**Layout:** Stack navigation with no header  
**State Management:** Zustand authStore with AsyncStorage persistence

#### 1. Welcome Screen (`/(auth)/welcome.tsx`) ✅

**Purpose:** Initial entry point for unauthenticated users

**UI Elements:**

- Large emoji logo (👔)
- App title: "Welcome to Obrazz"
- Subtitle: "Your Personal Fashion Assistant / Create stunning outfits with AI"
- 4 Feature highlights with icons:
  - ✨ AI-powered outfit suggestions
  - 👗 Manage your digital wardrobe
  - 🎨 Create custom outfits
  - 🛒 Web Capture from online stores
- Primary button: "Sign In"
- Secondary button: "Create Account"

**Navigation:**

- "Sign In" → `/(auth)/sign-in`
- "Create Account" → `/(auth)/sign-up`

**State Logic:**

- If user has active session → Auto-navigate to `/(tabs)` home

---

#### 2. Sign Up Screen (`/(auth)/sign-up.tsx`) ✅

**Purpose:** User registration with email and password

**UI Elements:**

- Back button (navigates to welcome)
- Title: "Create Account"
- Email input with validation
- Password input with show/hide toggle
- Confirm password input
- "Create Account" button
- Link to "Already have an account? Sign In"

**Validation:**

- Email format check
- Password minimum 8 characters
- Password and confirm password match

**Actions:**

- On submit → Call `authService.signUp(email, password)`
- On success → Store user data in authStore → Navigate to `/(tabs)`
- On error → Display error alert with specific message

**Navigation:**

- "Sign In" link → `/(auth)/sign-in`
- Success → `/(tabs)` (authenticated area)

---

#### 3. Sign In Screen (`/(auth)/sign-in.tsx`) ✅

**Purpose:** User authentication

**UI Elements:**

- Back button
- Title: "Sign In"
- Email input
- Password input with show/hide toggle
- "Forgot Password?" link
- "Sign In" button
- Link to "Don't have an account? Sign Up"

**Actions:**

- On submit → Call `authService.signIn(email, password)`
- On success → Store session in authStore → Navigate to `/(tabs)`
- On error → Display error alert
- "Forgot Password" → Navigate to `/(auth)/forgot-password`

**Navigation:**

- "Sign Up" link → `/(auth)/sign-up`
- "Forgot Password" → `/(auth)/forgot-password`
- Success → `/(tabs)`

---

#### 4. Forgot Password Screen (`/(auth)/forgot-password.tsx`) ✅

**Purpose:** Password reset flow

**UI Elements:**

- Back button
- Title: "Reset Password"
- Email input
- "Send Reset Link" button
- Instructions text

**Actions:**

- On submit → Call `authService.resetPassword(email)`
- On success → Show success alert with instructions
- Email sent to user with reset link
- User clicks link → Opens in browser → Supabase hosted reset page

**Navigation:**

- Back button → `/(auth)/sign-in`

---

#### 5. Onboarding Sequence 🚧 PLANNED

**Note:** Not yet implemented. Planned for Stage 2 enhancement.

**Planned flow:**

- Step 1: App intro slides
- Step 2: Import hint
- Step 3: Style preferences
- Final: CTA to add first item

---

### Auth Flow Logic (Root Layout) ✅

**File:** `app/_layout.tsx`

**Session Management:**

1. On app start → Check for existing session
2. Initialize auth listener for state changes
3. Auto-refresh JWT tokens

**Navigation Guards:**

- If not authenticated and outside `(auth)` → Redirect to `/(auth)/welcome`
- If authenticated and in `(auth)` → Redirect to `/(tabs)`
- Loading state shows full-screen spinner

**Session Persistence:**

- Stored in AsyncStorage via Zustand persist middleware
- Survives app restarts
- Cleared on logout

---

### B. Home (AI Hub) PLANNED

#### Purpose

The main hub for AI features, quick actions, and gamification. Personal dashboard, NOT a social feed.

#### Key components

- **Streak Display**: Current streak days, calendar view
- **Quick Actions**: AI Stylist, AI Try-On, Create Outfit buttons
- **Recent Outfits**: Horizontal scroll of last created outfits

#### Gamification

- Streak system with milestone rewards
- Weekly challenges with points and badges

---

### C. Wardrobe (Library)

#### Purpose

Primary place to view all user items, quickly add new clothing, filter and manage items.

#### Layout

- Grid view of ItemCard thumbnails (adaptive two/three columns depending on device width).
- Top bar with search (by name / color), category filter chips, sort (date added, color, category).
- Floating Action Button (FAB) to add new item -> navigates to Add Item screen.

#### ItemCard interactions

- Tap -> Item Detail (full metadata + actions)
- Long press -> multi-select (for bulk delete or batch add to outfit)
- Swipe actions (optional): quick edit, delete

#### Filtering and sorting

- Category chips: when selected, show only that category. Multiple chips can be selected.
- Color filter: small palette picker to filter by dominant color (exact hex matching optional).

---

### D. Item Add / Edit / Detail

**Last Updated:** November 10, 2025  
**Current Version:** With ImageCropper integration

#### Add Item screen

- Header: Back + Save
- Image area (top): preview of captured photo. Buttons: Take Photo, Choose from Gallery
- **Image Selection Flow:**
  1. User taps Camera or Gallery
  2. **ImageCropper opens** - custom 3:4 crop overlay
  3. User adjusts image with pinch-to-zoom and pan
  4. User confirms crop → Background removal service called
  5. Processed PNG stored locally
- Metadata section:
  - Category (picker) — required (8 unified categories)
  - Color (pick main color from palette or manual hex)
  - Material (text or pick list)
  - Style (picker: casual, formal, sporty, street, boho, etc.)
  - Season (chips: Spring, Summer, Autumn, Winter)
  - Optional: Title (user can name the piece)
- Save behavior: Persist metadata to Supabase + local image path

#### ImageCropper Component

**File:** `components/common/ImageCropper.tsx`

**Features:**

- **Custom 3:4 crop overlay** - precise aspect ratio control
- **Focal-point anchored pinch** - zoom to touch point between fingers
- **Elastic boundaries** - temporary over-zoom/pan with spring animations
- **Simultaneous gestures** - pinch (2 fingers) + pan (1 finger)
- **Double-tap zoom** - quick zoom toggle
- **Spring animations** - damping: 20, stiffness: 300
- **No clamping during gesture** - smooth UX without jumps

**Technical:**

- Uses `react-native-zoom-toolkit` for gesture handling
- `CropOverlay.tsx` provides visual feedback
- Final crop via `expo-image-manipulator`
- Works on iOS and Android

#### Item Detail

- Show full image (transparent background) centered on neutral canvas
- Metadata displayed below image
- Actions: Edit, Delete, Add to outfit, Share (export image)
- When editing with new image: re-run ImageCropper → Background removal

Edge cases:

- If background removal fails: fallback to cropped image with suggestion to retake
- Missing image: show placeholder with re-upload option

---

### E. Outfit Creator (Manual) - CURRENT IMPLEMENTATION

**Last Updated:** November 10, 2025  
**Current Version:** 4-Tab System with SmoothCarousel

#### Purpose

Modern two-step process for creating outfits with tab-based category selection and drag-and-drop composition.

#### Entry modes

- **Create New** - Starts at Step 1 (Item Selection) with default tab
- **Edit Existing** - Loads directly to Step 2 (Composition) with saved items

#### Two-Step Process

**Step 1: Item Selection (ItemSelectionStepNew) with 4-Tab System**

Layout:

- Header: Back button, "Build Your Outfit" title, selected count badge
- Tab Bar: 4 tabs for different category combinations
  - **Tab 1: Basic** (👕) - 3 categories: tops, bottoms, footwear
  - **Tab 2: Dress** (👗) - 3 categories: fullbody, footwear, accessories
  - **Tab 3: All** (🔲) - 8 categories: all available
  - **Tab 4: Custom** (⚙️) - user-configurable categories
- Body: Vertical stack of SmoothCarousels (one per category in current tab)
  - Full-width edge-to-edge carousels
  - Center item selected (highlighted with border)
  - Smooth momentum-based scrolling (deceleration: 0.985)
  - Infinite loop for seamless experience
- Footer: Randomize + Next buttons

Tab Interactions:

- Tap tab to switch category set
- Scroll carousels horizontally to browse items
- Center item auto-selects
- Randomize picks random items from current tab
- Custom tab: tap again when active to enter edit mode
- Next button → Step 2 (Composition)

**Step 2: Composition (CompositionStep)**

Layout:

- Header: Back button, toolbar (Undo/Redo/Background/Clear)
- Body: Canvas with placed items
  - Drag items to position
  - Pinch to scale
  - Two-finger rotation
  - Layering controls
- Footer: Preview bar + Save button

Canvas Behaviors:

- Each item has transform metadata: x, y, scale, rotation, zIndex
- Drag to move
- Pinch gesture to scale (min: 0.5, max: 3.0)
- Rotate gesture for rotation
- Tap to select (shows transform controls)
- Double-tap to center
- Undo/Redo for all actions

#### Save Flow

- Tap Save → Opens modal with:
  - Outfit name (optional)
  - Occasion picker
  - Style picker (multiple)
  - Season picker
  - Visibility (private/shared)
- Save creates outfit record in Supabase
- **Stores:**
  - Item references + transforms
  - Canvas settings (custom tab configuration)
  - Background selection
- Success → Navigate back to Outfits tab

#### Data Persistence

**Create Mode:**

- Custom tab loaded from AsyncStorage (user preferences)
- Default to Basic tab if no saved preference

**Edit Mode:**

- Custom tab loaded from outfit's `canvasSettings`
- AsyncStorage NOT loaded to prevent data corruption
- Backward compatibility for older outfits

#### Technical Implementation

**Outfit Components (14 total):**

- `components/outfit/SmoothCarousel.tsx` ✅ - Physics-based carousel (Stage 4.7)
- `components/outfit/CategorySelectorWithSmooth.tsx` ✅ - Carousel container
- `components/outfit/ItemSelectionStepNew.tsx` ✅ - Step 1 with 4-tab system
- `components/outfit/OutfitTabBar.tsx` ✅ - Tab navigation (Stage 4.8)
- `components/outfit/CustomTabManager.tsx` ✅ - Inline editing (Stage 4.8)
- `components/outfit/CompositionStep.tsx` ✅ - Step 2 composition
- `components/outfit/OutfitCanvas.tsx` ✅ - Canvas with gestures
- `components/outfit/ItemMiniPreviewBar.tsx` ✅ - Preview bar
- `components/outfit/BackgroundPicker.tsx` ✅ - Background selector
- `components/outfit/OutfitCard.tsx` ✅ - Outfit preview cards
- `components/outfit/OutfitGrid.tsx` ✅ - Grid layout
- `components/outfit/OutfitEmptyState.tsx` ✅ - Empty state
- `components/outfit/OutfitFilter.tsx` ✅ - Filter component
- `components/outfit/OutfitPreview.tsx` ✅ - Detail preview

**Screen Files:**

- `app/outfit/create.tsx` ✅ - Main screen coordinator
- `app/outfit/[id].tsx` ✅ - Outfit detail/view screen

**State Management:**

- `store/outfit/outfitStore.ts` ✅ - Enhanced outfit state (Stage 4.8-4.10)
  - creationStep (1 | 2)
  - activeTab ('basic' | 'dress' | 'all' | 'custom')
  - customTabCategories (configurable)
  - isCustomTabEditing
  - selectedItemsForCreation
  - currentItems (with transforms)
  - currentBackground
  - canvasSettings
  - Data persistence architecture (Stage 4.10)

**Storage:**

- `utils/storage/customTabStorage.ts` ✅ - AsyncStorage persistence for custom tabs
- Conditional loading logic (edit mode vs create mode)

**Services:**

- `services/outfit/outfitService.ts` ✅ - CRUD with canvasSettings
- Full item data loading for edit mode (Stage 4.10)
- Priority-based data restoration

**Types:**

- `types/components/OutfitCreator.ts` ✅ - OutfitTabType, CustomTabState
- `types/components/OutfitCard.ts` ✅ - Card component types
- `types/components/FAB.ts` ✅ - FAB component types

---

### F. Outfit Editor (Saved outfits)

#### Purpose

Edit previously saved outfits with full access to replace items and re-arrange element transforms.

#### Behavior

- Load saved outfit metadata + item references. For each referenced item, try to find the user's local item. If missing (user deleted that item), fall back to builtin asset or mark as missing with a placeholder.
- Changes are live-synced to local metadata. Option to revert to previous version (undo stack kept in memory until closed).
- Save overwrites the outfit. Optionally Save As -> create duplicate.

---

### G. AI-стилист (подбор образов) 🚧 PLANNED

#### Purpose

Примерка вещей из гардероба на фото пользователя с помощью The New Black Virtual Try-On API.

#### Inputs (UI)

- Фото пользователя (из галереи или камера)
- Вещь из гардероба для примерки
- Опционально: текстовый промпт для уточнения

#### Process (high level)

1. Client отправляет запрос на Rails Backend: user_id + model_photo + clothing_photo
2. Rails проверяет токен-баланс пользователя
3. Rails вызывает The New Black Virtual Try-On API
4. Результат сохраняется в Supabase Storage (т.к. The New Black удаляет через 48ч)
5. Списывается 1 токен, результат возвращается клиенту

#### UX

- Прогресс-бар генерации (5-15 секунд)
- Предпросмотр результата
- Сохранение в галерею примерок
- Шеринг результата

#### Token cost

**1 токен = 1 генерация**

| План | Токенов/мес |
| ---- | ----------- |
| FREE | 5           |
| PRO  | 50          |
| MAX  | 150         |

**API:** The New Black Virtual Try-On (~$0.08-0.125/генерация)

---

### G.2. AI Fashion Models 🚧 PLANNED

#### Purpose

Генерация AI-модели в выбранной одежде из гардероба.

#### Flow

1. Пользователь выбирает вещь из гардероба
2. Выбирает параметры модели (пол, поза, фон)
3. Rails Backend вызывает The New Black Fashion Models API
4. Результат сохраняется в Supabase Storage
5. Пользователь видит модель в своей одежде

#### Technical

- **Input**: фото вещи + параметры модели + промпт
- **Process**: Rails → The New Black → Supabase Storage
- **Output**: изображение модели в одежде
- **Storage**: постоянное хранение в ai_generations

#### Token cost

| План | Токенов/мес |
| ---- | ----------- |
| FREE | 5           |
| PRO  | 50          |
| MAX  | 150         |

**API:** The New Black Fashion Models (~$0.08-0.125/генерация)

---

### G.3. Clothing Variations 🚧 PLANNED

#### Purpose

Генерация вариаций дизайна выбранной вещи из гардероба.

#### Flow

1. Пользователь выбирает вещь из гардероба
2. Вводит промпт для вариации (цвет, стиль, детали)
3. Rails Backend вызывает The New Black Variations API
4. Результат сохраняется в Supabase Storage
5. Пользователь видит вариации своей вещи

#### Technical

- **Input**: фото вещи + промпт
- **Process**: Rails → The New Black → Supabase Storage
- **Output**: изображение вариации
- **Storage**: постоянное хранение в ai_generations

#### Token cost

| План | Токенов/мес |
| ---- | ----------- |
| FREE | 5           |
| PRO  | 50          |
| MAX  | 150         |

**API:** The New Black Variations (~$0.08-0.125/генерация)

---

### H. Saved Outfits (Collection) - Primary Tab

#### Purpose

Primary navigation tab for viewing all outfits created or generated by the user. This is the main hub for outfit management.

#### Layout

- Grid of OutfitCards (2 columns on mobile, 3-4 on tablet)
- OutfitCard shows a preview collage (3–4 items composited), name, favorite badge
- Top bar: Search (by name), filter chips (all/favorites), sort dropdown (newest, most used, favorite)
- **Floating Action Button (FAB)**: Bottom-right corner, navigates to Create Outfit screen
- **Header action**: Plus icon button in top-right, alternative way to navigate to Create Outfit

#### Actions

- Tap OutfitCard -> Outfit Detail (full canvas view)
- Outfit Detail actions: Edit, Duplicate, Delete
- Long press OutfitCard -> Quick actions: Edit, Duplicate, Delete

#### Empty State

- When no outfits exist, show:
  - Large icon (outfit/wardrobe illustration)
  - Title: "No Outfits Yet"
  - Message: "Create your first outfit by combining items from your wardrobe"
  - CTA Button: "Create Outfit" -> navigates to Create screen

#### Navigation

- FAB (+) -> Navigate to Create Outfit screen (stack navigation)
- Header button (+) -> Navigate to Create Outfit screen (alternative)
- Edit action -> Navigate to Create Outfit screen in edit mode with outfit_id

---

### I. Profile

#### Purpose

User center: view account details, manage subscriptions, review created content.

#### Elements

- Header with avatar, name, counts (items, outfits, followers future)
- Tabs: My Outfits, My Items, Liked (future)
- Button: Edit profile
- Subscription panel: shows current plan, upgrade CTA
- App version, privacy policy, support link

---

### J. Settings

#### Options

- Theme: Light / Dark / System
- Language: English / Russian (others later)
- Notifications: on/off for app updates (future)
- Data: export account metadata (no images), delete account (with confirmation)
- Help & Support: FAQ, contact

---

### K. Shopping Browser ✅ IMPLEMENTED

#### Purpose

Добавление вещей в гардероб напрямую из интернет-магазинов с автоматическим обнаружением товаров и корзиной для отложенных покупок.

#### Entry Points

- Home screen - Shopping button (9 store icons carousel)
- Wardrobe screen - "Add from Store" action
- Floating Shopping icon (global access)

#### Layout & Navigation

**Shopping Browser Screen** (`/shopping/browser.tsx`)

- **Top Bar:**
  - Exit button (X) - closes browser, returns to previous screen
  - Tabs carousel with store favicons (swipeable)
  - Cart button with badge (shows item count)

- **Main Area:**
  - Full WebView with mobile user-agent
  - Automatic image detection on page load
  - Navigation controls (back/forward)
  - Loading indicator

- **Bottom Bar:**
  - Navigation buttons (back/forward with disable states)
  - Scan button (3 states):
    - Default: "Сканировать" with search icon
    - Scanning: Loading spinner + "Скан..."
    - No items found: "Вырезать" with scissors icon (manual crop)

- **Overlays:**
  - Gallery Bottom Sheet - shows detected items in masonry grid
  - WebView Crop Overlay - manual screenshot + crop

#### Tab Management

**Multi-Tab System:**

- Up to 5 tabs simultaneously open
- Each tab maintains:
  - Current URL
  - Scroll position
  - Favicon
  - Shop name
- Tab switching via carousel (swipe left/right)
- Each tab isolated - separate WebView instance

**Default Stores (9):**

1. ZARA - `https://www.zara.com`
2. H&M - `https://www2.hm.com`
3. ASOS - `https://www.asos.com`
4. Nike - `https://www.nike.com`
5. Adidas - `https://www.adidas.com`
6. Reserved - `https://www.reserved.com`
7. Mango - `https://shop.mango.com`
8. Pull&Bear - `https://www.pullandbear.com`
9. Bershka - `https://www.bershka.com`

#### Image Detection

**Automatic Detection (on page load):**

- JavaScript injection scans all `<img>` tags
- Filters by:
  - Minimum size: 200x200px
  - Maximum size: 2000x2000px
  - Excludes: icons, banners, decorative images
- Deduplication by URL and dimensions
- Confidence scoring for each image
- Auto-opens gallery sheet when items found

**Manual Detection:**

- User taps "Сканировать" button
- Triggers detection after 500ms delay
- Shows scanning state with spinner
- Opens gallery if items found
- Falls back to manual crop if nothing detected

**Detection Script Features:**

- Lazy-loaded images support
- Observes DOM mutations for dynamic content
- Background-url extraction from CSS
- Product image pattern recognition
- Category hints from alt text and class names

#### Gallery Bottom Sheet

**Layout:**

- Masonry grid (2 columns)
- Each item shows:
  - Product image (3:4 aspect ratio)
  - Dimensions badge
  - Selection checkbox (multi-select mode)

**Actions:**

- **Select All** - toggles all items
- **Add Selected to Cart** - adds checked items
- **Add to Wardrobe** - direct add (opens add-item screen)
- Close sheet - returns to browsing

**Sheet States:**

- Collapsed (hidden)
- Half-expanded (50% screen height)
- Full-expanded (90% screen height)
- Drag handle for resize

#### Shopping Cart Screen

**Purpose:** Persist detected items for batch upload later

**Route:** `/shopping/cart.tsx`

**Layout:**

- Header with cart count and "Очистить" button
- List of cart items (CartItemRow components):
  - Product image thumbnail
  - Source store name
  - Source URL (truncated)
  - Delete button
  - Tap to add individually

- **Bottom Actions Bar:**
  - "Добавить всё (N) ➕" - batch upload all items
  - Fixed position, shadow elevation

**Empty State:**

- 🛒 Cart icon
- "Корзина пуста" title
- Explanation text
- "Вернуться к магазинам" CTA

**Cart Features:**

- AsyncStorage persistence
- Survives app restarts
- Remove individual items
- Clear all with confirmation
- Badge on cart button (top-right)

#### Batch Upload Flow

**From Gallery Sheet:**

1. User selects multiple items (checkboxes)
2. Taps "Add Selected to Cart"
3. Items saved to cart with:
   - Image URL
   - Source store name
   - Source page URL
   - Timestamp
4. Success toast shown
5. Cart badge updates
6. Gallery sheet closes

**From Cart:**

1. User opens cart (`/shopping/cart`)
2. Reviews items
3. Taps "Добавить всё (N)"
4. Batch queue initiated
5. Navigates to `/add-item` with `source=web`
6. Items processed one-by-one:
   - Add-item screen pre-populated with image
   - User fills metadata
   - Saves to wardrobe
   - Auto-advances to next item
   - Cart item removed on save
7. When queue empty - returns to cart/wardrobe

**Queue Management:**

- `batchQueue` - array of CartItem
- `currentBatchIndex` - current position
- `isBatchMode` - flag for UI changes
- Skip item - removes from queue
- Cancel batch - clears queue

#### Manual Crop Mode

**Triggered when:**

- Auto-detection finds 0 items
- User taps "Вырезать" button
- User wants custom crop area

**WebViewCropOverlay Component:**

- Captures screenshot of current WebView
- Displays with crop overlay (3:4 aspect)
- Pinch to zoom, drag to pan
- Double-tap to zoom in/out
- "Готово" button - crops and navigates to add-item
- "Отмена" - closes overlay

**Technical:**

- Uses `react-native-view-shot` for capture
- Crop area highlighted (bright)
- Outside area dimmed (overlay)
- Final cropped image sent to add-item screen

#### WebView Optimization

**Performance Scripts:**

```javascript
// Preload optimizations (before content)
- Disable animations
- Reduce image quality to 80%
- Disable autoplay videos
- Remove tracking scripts

// Page optimizations (after load)
- Hide popups/modals
- Remove fixed headers
- Disable smooth scroll
- Lazy-load observer
```

**Cache Strategy:**

- `cacheEnabled={true}` - browser cache active
- `domStorageEnabled={true}` - localStorage support
- `sharedCookiesEnabled={true}` - persist login
- `incognito={false}` - enable cache

#### Integration with Add-Item Screen

**Parameters passed:**

```typescript
router.push({
  pathname: '/add-item',
  params: {
    imageUrl: string,          // Detected/cropped image URL
    source: 'web' | 'web_capture_manual',
    sourceStore?: string,      // Store name
    sourceUrl?: string,        // Product page URL
  }
});
```

**Add-Item Screen behavior:**

- Pre-loads image from `imageUrl`
- Shows source badge (store icon + name)
- Optional: auto-fill category from detection hints
- Background removal still available
- Save adds to wardrobe + removes from cart (if batch mode)

#### State Management

**shoppingBrowserStore.ts:**

```typescript
interface ShoppingBrowserState {
  // Stores
  stores: Store[];
  loadingStores: boolean;

  // Browser tabs
  tabs: BrowserTab[];
  activeTabId: string | null;

  // Detection
  detectedImages: DetectedImage[];
  selectedImage: DetectedImage | null;
  isScanning: boolean;
  hasScanned: boolean;

  // Selection
  selectedImageIds: Set<string>;

  // Cart
  cartItems: CartItem[];
  showGallerySheet: boolean;

  // Batch
  batchQueue: CartItem[];
  currentBatchIndex: number;
  isBatchMode: boolean;
}
```

#### Edge Cases

**Network Errors:**

- Alert: "Не удалось загрузить страницу"
- Options: "Попробовать снова", "Назад"
- Reload current page or exit

**No Items Detected:**

- Button changes to "Вырезать" (manual crop)
- User can capture screenshot manually
- Falls back to ImageCropper flow

**Cart Overflow:**

- No hard limit (unlimited items)
- Performance tested up to 100+ items
- Masonry grid virtualizes for large lists

**Tab Limit:**

- Max 5 tabs open simultaneously
- Warn user: "Maximum 5 tabs allowed"
- Close existing tab to open new one

**Image Load Failures:**

- Detected image URL invalid
- Show placeholder in gallery
- Skip in batch upload
- User can retry or remove

**Store Unavailable:**

- Page fails to load (timeout, 404, etc.)
- Error screen with retry option
- User can navigate to different store

#### Security & Privacy

- No cookies sent to Obrazz backend
- All browsing data local (AsyncStorage)
- No tracking of user activity
- Images downloaded directly (no proxy)
- HTTPS enforced (`mixedContentMode="never"`)
- Geolocation disabled
- Third-party cookies disabled

---

### L. Subscription & Billing 🚧 PLANNED

#### Тарифные планы

| Параметр              | FREE        | PRO (399₽/мес) | MAX (799₽/мес) |
| --------------------- | ----------- | -------------- | -------------- |
| **Вещи в каталоге**   | 100         | 250            | 500            |
| **Удаление фона/мес** | 50          | 100            | 200            |
| **AI-подборы/мес**    | 30 (1/день) | 60             | 100            |
| **AI-примерки/мес**   | 5 (бонус)   | 30             | 50             |
| **Реклама**           | Да          | Нет            | Нет            |
| **Годовая цена**      | —           | 3,299₽ (–17%)  | 5,699₽ (–41%)  |

#### Биллинг для РФ (веб-биллинг)

- **Метод оплаты:** YooMoney (комиссия ~3.5% + 45₽)
- **Реализация через сайт:**
  - Регистрация/логин на сайте
  - Личный кабинет с управлением подпиской
  - Webhook для подтверждения платежей
  - Синхронизация статуса с приложением через Supabase

#### Биллинг для глобального рынка

- **iOS:** Apple In-App Purchase
- **Android:** Google Play Billing
- **Реализация:** RevenueCat или expo-in-app-purchases

#### Edge cases

- Проверка статуса подписки при запуске приложения
- Восстановление покупок при переустановке
- Grace period при истечении подписки

---

### M. Onboarding & Paywall 🚧 PLANNED

#### Onboarding

- 3-5 экранов интерактивного тура
- Демонстрация AI-возможностей
- Настройка предпочтений (стиль, сезон)
- Skip для повторных пользователей

#### Paywall

- Показ после исчерпания бесплатных лимитов
- Soft paywall с возможностью пропуска (X раз)
- Отображение преимуществ PRO/MAX
- A/B тестирование вариантов

---

### N. Реклама 🚧 PLANNED

#### Для FREE пользователей

**Платформы:**

- VK Ads (РФ)
- РСЯ - Рекламная сеть Яндекса (РФ)
- Google AdMob (глобально)

**Форматы:**

- Баннерная реклама в нижней части экрана
- Interstitial между действиями (после сохранения образа)
- Rewarded video за бонусы (доп. токены)

**Примерный доход:** ~15₽/мес на FREE пользователя

---

## 5. API endpoints / backend responsibilities (Supabase + Rails Backend)

This is a recommended concise set of endpoints or DB actions. Supabase handles many CRUD actions via direct DB access; Rails Backend handles AI operations and billing.

### Auth (Supabase)

- POST /auth/sign_up (email) — Supabase
- POST /auth/sign_in — Supabase

### Items

- GET /items?user_id=... — list items metadata
- POST /items — create new item metadata
- PATCH /items/:id — edit item metadata
- DELETE /items/:id — delete metadata

> Note: image files -> Supabase Storage; local caching for offline mode.

### Outfits

- GET /outfits?user_id=...
- POST /outfits — save outfit metadata (items + transforms)
- PATCH /outfits/:id

### AI Endpoints (Rails Backend → The New Black API)

- POST /api/v1/ai/virtual_tryon
  - Body: { model_photo, clothing_photo, prompt?, ratio? }
  - Response: { image_url, generation_id }
  - API: The New Black Virtual Try-On

- POST /api/v1/ai/fashion_model
  - Body: { clothing_photo, prompt?, ratio? }
  - Response: { image_url, generation_id }
  - API: The New Black Fashion Models

- POST /api/v1/ai/variation
  - Body: { clothing_photo, prompt }
  - Response: { image_url, generation_id }
  - API: The New Black Variations

Security: AI endpoints require valid JWT and check token balance before processing.

### Token System (Rails Backend)

- GET /api/v1/tokens/balance — текущий баланс токенов
- POST /api/v1/tokens/purchase — покупка пакета токенов
- GET /api/v1/tokens/transactions — история транзакций

### Subscription (Website + App)

- POST /api/v1/billing/create-checkout (YooMoney)
- POST /api/v1/billing/webhook (YooMoney callback)
- GET /api/v1/subscription/status
- POST /api/v1/subscription/restore (IAP)

## 6. Data flows and storage details

- **Add item**: user picks image -> ImageCropper (3:4) -> background removal (Pixian.ai) -> image saved to Supabase Storage -> metadata POSTed to Supabase DB.
- **Create outfit**: client serializes canvas (item IDs + transforms + canvasSettings) -> POST to /outfits -> Supabase stores metadata.
- **AI Virtual Try-On**: Mobile → Rails → The New Black API → Rails saves to Supabase Storage → returns URL.
- **AI Fashion Models**: Mobile → Rails → The New Black API → Rails saves to Supabase Storage → returns URL.
- **AI Variations**: Mobile → Rails → The New Black API → Rails saves to Supabase Storage → returns URL.

## 7. Edge cases, errors & validation

- **Image missing**: outfit references item removed by user -> show placeholder and prompt to replace.
- **Background remove failure**: offer retry and allow manual crop fallback.
- **Insufficient tokens**: show purchase modal with token packs.
- **Quota exceeded**: block AI calls and show subscription CTA with clear benefits.
- **Network offline**: allow viewing local items but block server operations (sign-in, AI, share). Show clear messaging.
- **Conflicting saves**: if an outfit is edited on two devices (future feature), warn user and provide merge/revert options.

## 8. Security, permissions, privacy

- Use Supabase Auth and JWT for all server calls.
- Do not upload user images to third-party services without consent. If background removal requires sending image to third-party, state that clearly in UX and provide opt-in.
- Store minimal PII (email, name). Provide user data export & delete options per GDPR.
- Images stored locally — ensure files are saved in app-specific storage protected by OS sandbox.

## 9. Accessibility & localization

- Provide large touch targets (44–48px) for key actions.
- Support screen readers (announce canvas elements when selected). Provide alt text in item metadata (optional).
- Color contrast: maintain WCAG AA contrast for text and key UI elements.
- Localization: English & Russian in MVP. All strings in i18n files.

## 10. Analytics and instrumentation

- Track events: sign_up, sign_in, add_item, save_outfit, export_outfit, subscribe
- Use lightweight analytics (e.g., Amplitude, Firebase Analytics). Respect privacy and allow users to opt out.

## 11. Appendix: assets / visuals / export formats

- **Collage export**: export composed outfit as PNG with transparent background or with selected background. Allow share to other apps.
- **Backup**: export metadata as JSON (images excluded). Provide import/export in settings.
- **Built-in assets**: packaged into the app or pulled from Supabase on first run.

---

## Implementation notes, priorities and recommendations

1. **MVP priorities**: authentication (email), add item with background removal, manual outfit creator (canvas + carousels), wardrobe browsing, saved outfits.
2. **Local images first**: keep implementation that stores images locally and references them via stable IDs. This simplifies privacy and reduces storage costs early on.
3. **AI as a service**: begin with a deterministic scoring algorithm that matches color harmony rules and style tags; complement with a lightweight ML model later.
4. **Testing**: build a test harness for the creator/editor (unit-tests for transforms serialization). Manual QA for gestures.

---

## 6. DETAILED NAVIGATION FLOW & SCREEN TRANSITIONS (ACTUAL IMPLEMENTATION)

### Navigation Architecture

**Navigation System:** Expo Router (file-based routing)  
**Root Layout:** `app/_layout.tsx` with GestureHandlerRootView  
**Auth Protection:** Automatic redirect based on authentication state

---

### Complete Screen Inventory

#### ✅ Fully Implemented Screens

**Authentication Flow (`/(auth)/` stack):**

1. `welcome.tsx` - Welcome/landing screen
2. `sign-in.tsx` - Sign in form
3. `sign-up.tsx` - Registration form
4. `forgot-password.tsx` - Password reset

**Main Tabs (`/(tabs)/` bottom navigation):**

1. `index.tsx` - Home/Feed (placeholder)
2. `wardrobe.tsx` - Wardrobe management
3. `outfits.tsx` - Outfits collection
4. `profile.tsx` - User profile

**Stack Screens (modals/full-screen):**

1. `/add-item.tsx` - Add new wardrobe item
2. `/item/[id].tsx` - Item detail view
3. `/outfit/create.tsx` - Create/edit outfit
4. `/outfit/[id].tsx` - Outfit detail view

---

### Navigation Map (All Transitions)

```
┌─────────────────────────────────────────────────────────────┐
│                     APP START                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Check Auth Session  │
              └──────────┬───────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐                 ┌──────────────┐
│ NOT LOGGED IN │                 │  LOGGED IN   │
└───────┬───────┘                 └──────┬───────┘
        │                                │
        ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│            AUTHENTICATION FLOW                               │
│  ┌─────────────┐                                            │
│  │  Welcome    │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│    ┌────┴────┐                                             │
│    │         │                                              │
│    ▼         ▼                                              │
│ ┌──────┐  ┌────────┐                                       │
│ │SignIn│  │Sign Up │                                       │
│ └───┬──┘  └───┬────┘                                       │
│     │         │                                             │
│     │    ┌────┘                                             │
│     ▼    ▼                                                  │
│  ┌────────────┐                                            │
│  │Forgot Pass │                                            │
│  └────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ On Success
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MAIN APP (TABS)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │           BOTTOM TAB NAVIGATION                     │   │
│  ├───────┬──────────┬──────────┬─────────────────────┤   │
│  │ HOME  │ WARDROBE │ OUTFITS  │      PROFILE        │   │
│  └───┬───┴─────┬────┴────┬─────┴──────┬──────────────┘   │
│      │         │          │            │                   │
│      ▼         ▼          ▼            ▼                   │
│  ┌───────┐ ┌─────────┐ ┌────────┐ ┌────────┐            │
│  │ Feed  │ │Wardrobe │ │Outfits │ │Profile │            │
│  │(TODO) │ │  Grid   │ │  Grid  │ │Settings│            │
│  └───────┘ └────┬────┘ └────┬───┘ └───┬────┘            │
│                  │           │         │                   │
│                  │           │         │                   │
└──────────────────┼───────────┼─────────┼───────────────────┘
                   │           │         │
                   │           │         │
         ┌─────────┴──────┐    │         └──► (Settings screens planned)
         │                │    │
         ▼                ▼    ▼
    ┌─────────┐      ┌────────────┐
    │ Add Item│      │Create Outfit│ ◄─── FAB Button
    └────┬────┘      └─────┬──────┘
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌────────────┐
    │Item [id]│      │Outfit [id] │
    └─────────┘      └────────────┘
```

---

### Detailed Navigation Flows

#### 1. Authentication Journey

**Flow: New User Registration**

```
Welcome → Sign Up → Success → /(tabs)/ Home
```

**Actions:**

1. User opens app
2. No session found → Redirect to `/(auth)/welcome`
3. User taps "Create Account"
4. Navigate to `/(auth)/sign-up`
5. User fills form and submits
6. `authService.signUp()` called
7. On success: authStore updated, navigate to `/(tabs)/`

**Flow: Returning User Sign In**

```
Welcome → Sign In → Success → /(tabs)/ (last visited tab)
```

**Flow: Forgot Password**

```
Sign In → Forgot Password → Email sent → External Reset → Sign In
```

---

#### 2. Wardrobe Management Flow

**Flow: Add New Item**

```
Wardrobe → [+] Button → /add-item → Save → Back to Wardrobe
```

**Step-by-Step:**

1. User on `/(tabs)/wardrobe`
2. Taps header [+] button
3. Navigate to `/add-item` (full-screen modal)
4. User captures/selects image
5. (Optional) Runs background removal
6. Fills metadata (category, colors, styles, seasons)
7. Taps "Save to Wardrobe"
8. `itemService.createItem()` saves to database
9. Item added to wardrobeStore
10. Navigate back to `/(tabs)/wardrobe`
11. New item visible in grid

**Flow: View Item Details**

```
Wardrobe → Tap ItemCard → /item/[id] → Actions → Back
```

**Available Actions in Item Detail:**

- Toggle favorite (heart icon)
- Delete item (with confirmation)
- View statistics (wear count, added date)
- (Planned) Edit item
- (Planned) Add to outfit

**Flow: Search & Filter Items**

```
Wardrobe → Search/Filter → Filtered Results → Clear → All Items
```

**Filter Modal Navigation:**

1. Tap "Filter" button
2. Full-screen modal opens
3. Select filters (categories, colors, styles, seasons)
4. Tap "Apply Filters"
5. Modal closes
6. Grid updates with filtered items
7. "Clear All" button visible when filters active

---

#### 3. Outfit Creation Flow

**Flow: Create New Outfit**

```
Outfits → FAB [+] → /outfit/create → Build → Save → Back to Outfits
```

**Detailed Steps:**

1. User on `/(tabs)/outfits`
2. Taps FAB (Floating Action Button) or header [+]
3. Navigate to `/outfit/create`
4. Canvas loads with empty state
5. User selects items from category carousels
6. Items appear on canvas with gestures enabled
7. User arranges items (drag, scale, rotate)
8. (Optional) User taps "Randomize" for quick combination
9. (Optional) User changes background
10. User taps checkmark to save
11. Save modal appears
12. User enters outfit title (optional)
13. Taps "Save"
14. `outfitService.createOutfit()` saves metadata
15. Navigate back to `/(tabs)/outfits`
16. New outfit appears in grid

**Flow: Edit Existing Outfit**

```
Outfits → Tap Card → /outfit/[id] → Edit → /outfit/create?id=X → Save
```

**Edit Actions:**

1. User views outfit detail
2. Taps "Edit" button
3. Navigate to `/outfit/create` with query param `?id=[outfit_id]`
4. Canvas loads with saved outfit data
5. User makes changes
6. Save updates existing outfit via `outfitService.updateOutfit()`

---

#### 4. Outfit Collection Management

**Flow: View Outfit Details**

```
Outfits → Tap OutfitCard → /outfit/[id] → View/Actions
```

**Available Actions:**

- **Edit** → Navigate to `/outfit/create?id=X`
- **Duplicate** → Create copy via `outfitService.duplicateOutfit()`
- **I Wore This** → Increment wear count
- **Delete** → Remove outfit (with confirmation)
- **Favorite** → Toggle favorite status (heart icon)
- **(Planned) Share** → Export image / share to other apps

**Flow: Filter/Sort Outfits**

```
Outfits → Search/Filter/Sort → Results Update
```

**Filter Options:**

- All / Private / Shared / Public (chips)
- Search by title/description

**Sort Options:**

- Newest first
- Favorites
- Most worn

---

#### 5. Profile & Settings Flow

**Flow: View Profile**

```
Profile Tab → View Account → Settings Options
```

**Available Sections:**

- Account (Edit Profile, Change Password) - Placeholders
- App Settings (Notifications, Dark Mode, Language) - Placeholders
- Subscription (Upgrade to Pro) - Placeholder
- Support (Help, Terms, About) - Placeholders
- **Sign Out** → Confirmation → Logout → /(auth)/welcome

**Sign Out Flow:**

1. User taps "Sign Out" button
2. Confirmation alert appears
3. User confirms
4. `authService.signOut()` called
5. authStore cleared
6. Navigate to `/(auth)/welcome`

---

### Navigation Patterns

#### Stack Navigation

All full-screen modals use stack navigation with:

- Back button (top-left chevron or X)
- Title (center)
- Action buttons (top-right)

**Examples:**

- `/add-item` - Close (X) button
- `/item/[id]` - Back chevron
- `/outfit/create` - Back chevron + Save checkmark
- `/outfit/[id]` - Back chevron + Heart icon

#### Tab Navigation

Bottom tab bar always visible except:

- During authentication flow
- On full-screen stack screens

**Tab Bar Icons:**

- Home: `home` icon
- Wardrobe: `th` icon (grid)
- Outfits: `th-large` icon
- Profile: `user` icon

#### Gesture Navigation

- **Swipe back:** Enabled on all stack screens
- **Pull to refresh:** Enabled on Wardrobe and Outfits grids
- **Drag & drop:** Outfit canvas items
- **Pinch/rotate:** Outfit canvas gestures

---

### Deep Linking Support (Planned)

**Outfit sharing:**

```
obrazz://outfit/[id]
```

**Item detail:**

```
obrazz://item/[id]
```

**Profile view:**

```
obrazz://user/[username]
```

---

### Error States & Fallbacks

**404 Not Found:**

- Screen: `app/+not-found.tsx`
- Displayed when invalid route accessed

**Loading States:**

- Full-screen loader during auth check
- Skeleton placeholders for grids
- Spinner for async operations

**Empty States:**

- Wardrobe: "Add your first item to get started!"
- Outfits: OutfitEmptyState component with CTA
- Search/Filter no results: "No items match your filters"

---

### Navigation State Management

**Auth State (authStore):**

- Controls access to `/(auth)/` vs `/(tabs)/`
- Persisted in AsyncStorage
- Auto-restore on app launch

**Screen State:**

- Wardrobe filter state in wardrobeStore
- Current outfit in outfitStore with undo/redo
- Selected items, backgrounds, transforms

**Navigation History:**

- Maintained by Expo Router
- Back button respects navigation stack
- Tab switches reset stack for that tab

---

_End of document — Obrazz app map and detailed page & function descriptions._
