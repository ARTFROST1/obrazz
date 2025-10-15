# Obrazz — Detailed App Map & Full Page & Function Descriptions (English + Russian)

> This document is a comprehensive, developer- and designer-focused application map for **Obrazz** — a personal wardrobe + AI styling mobile app built with React Native. It covers every screen, interaction pattern, data flow, API considerations and functional details required to implement the MVP and extend it later.

**Latest Update:** January 15, 2025  
**Current Stage:** Stage 4.7 Complete ✅  
**Project Status:** Wardrobe Management, Manual Outfit Creator (Ultra Minimalist with 3-Mode Display System), and Outfits Collection - FULLY IMPLEMENTED

---

## Table of Contents

1. Product summary
2. Implementation status & current features
3. High-level architecture & data model
4. Global UI patterns and components
5. Full screen list and detailed behavior (UPDATED WITH ACTUAL IMPLEMENTATION)
   - Authentication & Onboarding ✅
   - Main (Home / Community feed) 🚧
   - Wardrobe (library) ✅
   - Item Add / Edit / Detail ✅
   - Outfit Creator (manual) ✅
   - Outfit Detail / View ✅
   - Saved Outfits (collection) ✅
   - AI Outfit Generator 🚧
   - Profile ✅
   - Settings 🚧
   - Web Capture (in-app browser + item grab) 🚧
   - Subscription & Payments 🚧
   - Admin & content automation notes 🚧
6. Navigation flow & screen transitions (DETAILED)
7. API endpoints / backend responsibilities (Supabase + microservices)
8. Data flows and storage details
9. Edge cases, errors & validation
10. Security, permissions, privacy
11. Accessibility & localization
12. Analytics and instrumentation
13. Appendix: assets / visuals / export formats

---

## 1. Product summary

**Obrazz** is a mobile-first application for users to upload and organize their clothing items, build outfits manually with an editor (collage), and generate outfits automatically using an AI assistant that picks items from the user's wardrobe and built-in presets. The app contains a community feed where users share looks and like each other's outfits. The MVP focuses on email-based authentication, local image storage, metadata persistence (Supabase), manual outfit editor and basic AI generation (server or third-party API). Subscription unlocks higher quotas and premium features.

---

## 2. Implementation Status & Current Features

### Completed Stages (As of January 14, 2025)

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
- Background removal service (Remove.bg integration)
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

#### ✅ Stage 4.6: Outfit Creator UX Refactoring - Ultra Minimalist

- **Two-step creation process:**
  - Step 1: Item Selection - vertical scroll of seamless carousels
  - Step 2: Composition - canvas with drag & drop and tools
- **Ultra-minimalist carousel design:**
  - NO category labels
  - NO pin buttons
  - NO selection indicators
  - Pure image strip with center-based selection
  - resizeMode="cover" for maximum fill
- **Progress indicator** showing X/7 categories selected
- **Edit mode** loads directly to Step 2 (composition)
- **Create mode** starts from Step 1 (selection)
- FAB (Floating Action Button) for creating outfits
- Search and filter (all/private/shared)
- Sort options (newest, favorites, most worn)
- Quick actions (edit, duplicate, delete, share)
- Outfit detail/view screen
- Navigation to /outfit/create stack screen

#### ✅ Stage 4.7: 3-Mode Category Display System

- **Three display modes for intelligent category filtering:**
  - **All (7 categories):** Complete overview - headwear, outerwear, tops, bottoms, footwear, accessories, bags
  - **Main (4 categories):** Core clothing focus - outerwear, tops, bottoms, footwear
  - **Extra (3 categories):** Accessories focus - headwear, accessories, bags
- **Dynamic auto-scaling system:**
  - Item dimensions automatically calculated based on available screen space
  - All visible categories fit perfectly without scrolling
  - Maintains 3:4 aspect ratio (width:height) for natural clothing display
  - Formula: `carouselHeight = availableHeight / numberOfCategories`
- **Display mode switcher:**
  - Bottom controls with intuitive icons (apps/shirt/diamond)
  - Active state with inverted colors for clear feedback
  - Labels: "All", "Main", "Extra"
- **Seamless vertical flow:**
  - Zero gaps between carousels
  - Pure minimalist design - no separators or borders
  - Each carousel perfectly aligned
- **Selection synchronization:**
  - Selected items preserved when switching between modes
  - Unified state management across all display modes
  - User can build outfit across different mode views
- **Adaptive layout:**
  - Measures actual container height dynamically
  - Works correctly on different screen sizes
  - Respects header, progress bar, and footer boundaries

### 🚧 In Progress / Planned

#### Stage 5: AI Outfit Generation (Planned)

- AI microservice setup
- Style and season-based outfit generation
- Color harmony algorithms
- 3 outfit variant generation

#### Stage 6: Community & Social Features (Planned)

- Community feed implementation
- Post creation and sharing
- Like/reaction system
- Copy outfit functionality

#### Stage 7-10: Remaining stages as per Implementation.md

### Current Application Structure

**Main Navigation Tabs (Bottom Tab Bar):**

1. 🏠 **Home/Feed** (`/(tabs)/index.tsx`) - Placeholder for community feed
2. 👔 **Wardrobe** (`/(tabs)/wardrobe.tsx`) - Fully functional wardrobe management
3. 📸 **Outfits** (`/(tabs)/outfits.tsx`) - Collection of saved outfits
4. 👤 **Profile** (`/(tabs)/profile.tsx`) - User profile and settings

**Stack Screens (Full-screen modals/pages):**

- 🔐 Authentication flow (`/(auth)/`)
- ➕ Add Item (`/add-item.tsx`)
- 📝 Item Detail (`/item/[id].tsx`)
- ✨ Create Outfit (`/outfit/create.tsx`)
- 👁️ Outfit Detail (`/outfit/[id].tsx`)

---

## 3. High-level architecture & data model

### 3.1 Architecture overview

**Current Implementation:**

- **Frontend**: React Native 0.81.4 with Expo SDK 54, TypeScript
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: Expo Router (file-based routing)
- **Gestures & Animations**: React Native Gesture Handler 2.x + Reanimated 4.x
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Image Processing**: Expo Image Picker, Expo Camera, Remove.bg API
- **File Storage**: Local device storage using expo-file-system (legacy API)

**Planned:**

- TanStack Query for server state (Stage 5+)
- Node.js microservice for AI (Stage 5)
- RevenueCat for subscriptions (Stage 7)

### 3.2 Key database entities (Postgres via Supabase)

- **users**: id, email, name, avatar_url (nullable), created_at, subscription_plan, locale, created_default_items (bool)
- **items**: id, user_id, title (nullable), category, color(s) (hex or label), material, style_tags (simple enumerated string), season_tags, image_local_path (client-only), image_hash, builtin_flag (boolean), created_at
- **outfits**: id, user_id (nullable for shared/public ones), title, description (nullable), items: array of item references with slot mapping and transform metadata (x,y,scale,rotation,z-index), background_id (or custom), visibility (private/shared/public), created_at
- **community_posts**: id, author_user_id, outfit_id (nullable), caption, reactions_count, created_at
- **subscriptions**: id, user_id, plan_type, started_at, expires_at, provider_reference
- **ai_requests**: id, user_id, params (style, season, constraints), result (serialized outfit candidates), created_at

> Note: Images remain local on device. `items` table stores a stable identifier linked to local files. For syncing in the future, a migration path to cloud storage will be needed.

---

## 4. Global UI patterns and components

- **App bar**: Left: menu/back, center: screen title or search, right: actions (add, profile). Large on main screens, compact on editors.
- **Bottom navigation**: 4 tabs: Home (Feed), Wardrobe, Outfits, Profile. Secondary flows (Create Outfit, AI, Settings) are modals or stack screens.
- **Floating Action Button (FAB)**: Circular button positioned bottom-right for primary actions (e.g., Create Outfit on Outfits screen).
- **Card components**: OutfitCard (image grid preview), ItemCard (single item with details), PostCard (community feed), BigTile (for featured content)
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
  - 🌐 Share with the community
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

### B. Main (Home / Community Feed)

#### Purpose

The social hub and discovery page. Users see community posts, curated picks, trending looks and “Outfit of the day” blocks.

#### Key components

- **Top carousel**: Featured cards or editorial picks (from built-in content). Tappable to open Outfit detail.
- **Feed**: Infinite scroll of PostCards. Each post includes author, outfit preview (compact collage), caption, reaction count, and actions: like, save to my outfits (copies metadata into user’s outfits), view full outfit.
- **Create buttons**: Quick actions to open Create Outfit or AI Outfit screens.
- **Filters / tabs**: All / Following (future) / Trending (MVP only All + Trending can be toggles)

#### Interactions

- Liking a post increments reactions_count (client calls Supabase). Liking does not affect AI in MVP.
- Tapping on outfit opens Outfit Detail screen (same as Saved Outfit detail). If the outfit belongs to another user and was created using built-in items, user can copy the outfit into their collection: this creates new outfit with item references swapped to the user's local items where possible (best-effort matching by category & color) or to built-in items.

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

#### Add Item screen

- Header: Back + Save
- Image area (top): preview of captured photo. Buttons: Take Photo, Choose from Gallery, Import from Web.
- On image select: automatically call background removal service (show loader). Store processed PNG transparently in local storage.
- Metadata section:
  - Category (picker) — required
  - Color (pick main color from palette or manual hex)
  - Material (text or pick list)
  - Style (picker: casual, formal, sporty, street, boho, etc.)
  - Season (chips: Spring, Summer, Autumn, Winter)
  - Optional: Title (user can name the piece)
- Save behavior: Persist metadata to Supabase (user_id + metadata + local image filename). Keep image file on device.

#### Item Detail

- Show full image (transparent background) centered on a neutral canvas. Show metadata below.
- Actions: Edit, Delete, Add to outfit (launch creator and pre-select this item in its category), Share (export image), Mark as built-in (admin only)
- When editing and image is replaced, re-run background removal.

Edge cases:

- If automatic background removal fails, fallback to original image and show suggestion to retake photo with higher contrast.

---

### E. Outfit Creator (Manual)

#### Purpose

Intuitive, fast UI to compose outfits from existing items using horizontal carousels and a WYSIWYG canvas for final adjustments.

#### Entry modes

- Empty creator (user chooses items from scratch)
- Pre-fill mode (user tapped an item and opened creator — that item should be pre-selected in its category)
- From saved outfit (edit mode) — loads saved item placements and metadata.

#### Layout

- Top: canvas preview (shows assembled items layered). Supports gestures: pinch-to-zoom (canvas), tap to select an element, double-tap to center, two-finger pan for canvas move.
- Middle: category carousels stacked vertically. Each carousel contains ItemCards for that category (user items first, built-in after). The center-most item is active (selected). A small lock icon toggles category pinned/unpinned.
- Bottom: control bar with buttons: Randomize (randomize unpinned categories), Background (choose from defaults), Save Outfit, Undo/Redo, Cancel.

#### Canvas element behaviors

- Each placed item has transform metadata: x, y, scale, rotation, zIndex
- Selecting an element opens a small context menu: bring forward/back, replace (opens category carousel focused), delete, lock position.
- Dragging an item moves it. Pinch scales, twist rotates. Snap-to-grid toggle exists.

#### Save flow

- On Save: ask for outfit name (optional) and visibility (private / shared). Save metadata to Supabase and include serialized transforms per item. Do not upload images — keep references to local filenames or builtin IDs.
- When saving as Shared (for community feed), create a Community Post and attach the outfit_id.

---

### F. Outfit Editor (Saved outfits)

#### Purpose

Edit previously saved outfits with full access to replace items and re-arrange element transforms.

#### Behavior

- Load saved outfit metadata + item references. For each referenced item, try to find the user's local item. If missing (user deleted that item), fall back to builtin asset or mark as missing with a placeholder.
- Changes are live-synced to local metadata. Option to revert to previous version (undo stack kept in memory until closed).
- Save overwrites the outfit. Optionally Save As -> create duplicate.

---

### G. AI Outfit Generator

#### Purpose

Automatically select items from the user's wardrobe (and built-in items) that match the selected style & season and output 3 candidate outfits rendered as collages.

#### Inputs (UI)

- Choose style (picker) — optional (e.g., casual, formal, street, boho)
- Choose season(s) — required
- Constraints (optional): color constraints, must include item IDs, exclude categories
- Number of variants (1–3 in MVP)

#### Process (high level)

1. Client prepares a request: user_id + list of items metadata (category, color tags, style tags, season) or the backend reads user items from DB.
2. AI microservice receives request, runs combinatorial scoring (color harmony, style compatibility, diversity), returns ranked outfit candidates. Each candidate is a list of item IDs and recommended transforms (optional). The microservice uses a third-party model or a heuristic algorithm for MVP.
3. Client receives results and builds collages on the canvas for each candidate.
4. User can preview, accept and save any generated outfit to their collection (same save behavior as manual outfits).

#### UX

- Show loading states and an explanation of why items were selected (color harmony, style match). For MVP, keep explanation simple, e.g., "selected for color contrast".
- If the AI chooses a built-in item when user lacks a matching item, allow quick replacement by tapping the slot and choosing an alternative from the user's wardrobe.

#### Rate limits & quota

- Free tier: 3 AI outfit runs total. Warn users near quota. Subscription unlocks unlimited runs.

---

### H. Saved Outfits (Collection) - Primary Tab

#### Purpose

Primary navigation tab for viewing all outfits created or generated by the user. This is the main hub for outfit management.

#### Layout

- Grid of OutfitCards (2 columns on mobile, 3-4 on tablet)
- OutfitCard shows a preview collage (3–4 items composited), name, visibility badge (private/shared), likes (if shared)
- Top bar: Search (by name), filter chips (all/private/shared), sort dropdown (newest, most used, favorite)
- **Floating Action Button (FAB)**: Bottom-right corner, navigates to Create Outfit screen
- **Header action**: Plus icon button in top-right, alternative way to navigate to Create Outfit

#### Actions

- Tap OutfitCard -> Outfit Detail (full canvas view)
- Outfit Detail actions: Edit, Duplicate, Share (export image), Add to Community (if not already), Delete
- Long press OutfitCard -> Quick actions: Edit, Duplicate, Share, Delete

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
- Notifications: on/off for community activity
- Data: export account metadata (no images), delete account (with confirmation)
- Help & Support: FAQ, contact

---

### K. Web Capture (In-app browser + grab)

#### Purpose

Allow users to browse a web page (Pinterest, stores) inside an in-app WebView and capture product images into their wardrobe.

#### Flow

1. User opens Web Capture and navigates to URL inside a WKWebView/Android WebView.
2. User taps a floating "Capture" button; the app runs a small script to detect visible image elements (or user taps an image directly).
3. Selected image is downloaded locally; background removal runs; user completes metadata form to save.

#### Notes

- Respect CORS and copyright: only provide an image saving helper, but do not claim content ownership. Add a short notice about copyright if saving images from external sites.

---

### L. Subscription & Payments

#### Plans

- Free: limited 3 saved outfits + 3 AI runs
- Premium (monthly/yearly): unlimited outfits, unlimited AI, premium backgrounds

#### Flows

- In-app purchases via App Store / Google Play for mobile platforms.
- In Russia allow a local payment provider integration (e.g., YooMoney / Moneta / Sberbank SDK) for direct payments if required by business. Implementation note: mobile platforms are strict about in-app purchases — review platform policies before enabling alternative payment channels for purchases related to digital content.

#### Edge cases

- If subscription is active on server but not reflected client-side, revalidate on app start (call Supabase and restore state).

---

### M. Admin & automation

- Admin panel (not in MVP) — manage built-in items, curated outfits, featured posts.
- Automation for feed: if a user marks outfit as "shared", it appears automatically in the feed. Add moderation queue if you plan to allow public sharing widely.

## 5. API endpoints / backend responsibilities (Supabase + microservice)

This is a recommended concise set of endpoints or DB actions. Supabase handles many CRUD actions via direct DB access; add RPC functions / Edge functions for complex logic.

### Auth (Supabase)

- POST /auth/sign_up (email) — Supabase
- POST /auth/sign_in — Supabase

### Items

- GET /items?user_id=... — list items metadata
- POST /items — create new item metadata
- PATCH /items/:id — edit item metadata
- DELETE /items/:id — delete metadata

> Note: image files -> local; if we later add cloud sync, image upload API will be needed.

### Outfits

- GET /outfits?user_id=...
- POST /outfits — save outfit metadata (items + transforms)
- PATCH /outfits/:id
- POST /outfits/:id/share -> create community post

### Community

- GET /posts?cursor=...
- POST /posts -> create post when user shares an outfit
- POST /posts/:id/react -> like a post

### AI microservice (Node.js)

- POST /ai/generate-outfits
  - Body: { user_id, style, seasons, constraints }
  - Response: candidates: [{items: [{item_id, score}], explanation, layout_hints}]

- POST /ai/analyze-item
  - (optional) Accepts an image or metadata and returns primary colors, dominant features

Security: AI endpoints require valid JWT and rate-limiting.

## 6. Data flows and storage details

- **Add item**: user picks image -> image saved to local FS -> background removal called (remote) -> processed image saved locally -> metadata POSTed to Supabase with local path and attributes.
- **Create outfit**: client serializes current canvas (list of item IDs + transforms) -> POST to /outfits -> Supabase stores metadata.
- **AI generation**: client triggers POST /ai/generate-outfits -> AI service reads items metadata from DB or client sends metadata -> AI returns candidates -> client renders canvases.
- **Share**: when sharing an outfit, server creates a post entry linking to outfit. Post is read in Home feed.

## 7. Edge cases, errors & validation

- **Image missing**: outfit references item removed by user -> show placeholder and prompt to replace.
- **Background remove failure**: offer retry and allow manual crop fallback.
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

- Track events: sign_up, sign_in, add_item, save_outfit, ai_generate, share_outfit, subscribe, like_post
- Use lightweight analytics (e.g., Amplitude, Firebase Analytics). Respect privacy and allow users to opt out.

## 11. Appendix: assets / visuals / export formats

- **Collage export**: export composed outfit as PNG with transparent background or with selected background. Allow share to other apps.
- **Backup**: export metadata as JSON (images excluded). Provide import/export in settings.
- **Built-in assets**: packaged into the app or pulled from Supabase on first run.

---

## Implementation notes, priorities and recommendations

1. **MVP priorities**: authentication (email), add item with background removal, manual outfit creator (canvas + carousels), AI generate simple combinatorics (server), wardrobe browsing, saved outfits, community sharing.
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
- **(Planned) Share** → Export or share to community

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
