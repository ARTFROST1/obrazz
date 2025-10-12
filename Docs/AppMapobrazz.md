# Obrazz — Detailed App Map & Full Page & Function Descriptions (English)

> This document is a comprehensive, developer- and designer-focused application map for **Obrazz** — a personal wardrobe + AI styling mobile app built with React Native. It covers every screen, interaction pattern, data flow, API considerations and functional details required to implement the MVP and extend it later.

---

## Table of Contents
1. Product summary
2. High-level architecture & data model
3. Global UI patterns and components
4. Full screen list and detailed behavior
   - Authentication & Onboarding
   - Main (Home / Community feed)
   - Wardrobe (library)
   - Item Add / Edit / Detail
   - Outfit Creator (manual)
   - Outfit Editor (saved outfits)
   - AI Outfit Generator
   - Saved Outfits (collection)
   - Profile
   - Settings
   - Web Capture (in-app browser + item grab)
   - Subscription & Payments
   - Admin & content automation notes
5. API endpoints / backend responsibilities (Supabase + microservices)
6. Data flows and storage details
7. Edge cases, errors & validation
8. Security, permissions, privacy
9. Accessibility & localization
10. Analytics and instrumentation
11. Appendix: assets / visuals / export formats

---

## 1. Product summary
**Obrazz** is a mobile-first application for users to upload and organize their clothing items, build outfits manually with an editor (collage), and generate outfits automatically using an AI assistant that picks items from the user's wardrobe and built-in presets. The app contains a community feed where users share looks and like each other's outfits. The MVP focuses on email-based authentication, local image storage, metadata persistence (Supabase), manual outfit editor and basic AI generation (server or third-party API). Subscription unlocks higher quotas and premium features.


## 2. High-level architecture & data model

### 2.1 Architecture overview
- **Frontend**: React Native (Expo recommended for MVP), TypeScript. State management via Zustand (or Redux) for app-wide state, React Query for server data sync. Use `react-native-reanimated` and `gesture-handler` for interactive editor and animations.
- **Backend**: Supabase as primary backend (Auth, Postgres DB, Functions). Minimal Node.js microservice for AI orchestration (optional hosting on same server or small VPS). Background removal handled via third-party API (Remove.bg style) — could be proxied through backend.
- **Storage**: Images stored locally on device filesystem (per requirement). Only metadata (file URI, attributes) stored in Supabase. Built-in items and presets stored in Supabase or embedded in app bundle for fast access.
- **AI**: External model(s) for style analysis and outfit generation. The AI microservice receives metadata (colors, style tags, season) and returns ranked combinations + layout hints (optional). Visual layout generation happens client-side by placing photo assets into the canvas.

### 2.2 Key database entities (Postgres via Supabase)
- **users**: id, email, name, avatar_url (nullable), created_at, subscription_plan, locale, created_default_items (bool)
- **items**: id, user_id, title (nullable), category, color(s) (hex or label), material, style_tags (simple enumerated string), season_tags, image_local_path (client-only), image_hash, builtin_flag (boolean), created_at
- **outfits**: id, user_id (nullable for shared/public ones), title, description (nullable), items: array of item references with slot mapping and transform metadata (x,y,scale,rotation,z-index), background_id (or custom), visibility (private/shared/public), created_at
- **community_posts**: id, author_user_id, outfit_id (nullable), caption, reactions_count, created_at
- **subscriptions**: id, user_id, plan_type, started_at, expires_at, provider_reference
- **ai_requests**: id, user_id, params (style, season, constraints), result (serialized outfit candidates), created_at

> Note: Images remain local on device. `items` table stores a stable identifier linked to local files. For syncing in the future, a migration path to cloud storage will be needed.


## 3. Global UI patterns and components
- **App bar**: Left: menu/back, center: screen title or search, right: actions (add, profile). Large on main screens, compact on editors.
- **Bottom navigation**: 4 tabs: Home, Wardrobe, Outfits, Profile. Secondary flows (Create Outfit, AI, Settings) are modals or stack screens.
- **Card components**: OutfitCard (image grid preview), ItemCard (single item with details), PostCard (community feed), BigTile (for featured content)
- **Modals**: Confirmation modal, Save modal, Subscription modal, Image editor modal.
- **Pickers**: Horizontal scroll carousels for clothes categories (in Creator), dropdowns for style/season.
- **Canvas**: Editable layered canvas used by Outfit Creator/Editor with gestures to move/scale/rotate items.
- **Toast & Snackbars**: For success/failure messages and quota warnings.


## 4. Full screen list and detailed behavior
Below are the pages with full, explicit behavior and each function described.

---

### A. Authentication & Onboarding

#### Screens
1. **Splash / Welcome**
   - Purpose: Brand entry, quick pitch, Sign in / Sign up CTA.
   - If user already has session, route to Home.

2. **Sign Up (Email)**
   - Inputs: email, password, confirm password.
   - Button: Create account (calls Supabase signUp)
   - On success: create default built-in items and few sample outfits in DB for new user metadata (not images), or set a flag for the app to provide local built-in assets.
   - Validation: email format, password length.

3. **Sign In (Email)**
   - Inputs: email, password
   - Actions: sign in, forgot password (email reset), link to sign up.

4. **Onboarding sequence** (shown after first sign-in)
   - Step 1: Short intro slides — what the app does
   - Step 2: Optional import hint (how to add items)
   - Step 3: Quick preferences — choose 1–3 style keywords (optional) and default season
   - Final: Call-to-action to add first item or open Wardrobe

Notes:
- Guest mode is not allowed to use core features, but the UI should allow browsing the app visually with CTAs to sign up.
- Onboarding is a small sequence, can be revisited from Profile.

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

### H. Saved Outfits (Collection)

#### Purpose
Listing of all outfits created or generated by the user.

#### Layout
- List or grid of OutfitCards. OutfitCard shows a preview collage (3–4 items composited), name, visibility badge (private/shared), likes (if shared).
- Sorting: newest, most used, favorite.

#### Actions
- Tap -> Outfit Detail (full canvas) + actions: Edit, Duplicate, Share (export image), Add to Community (if not already), Delete.
- Long press -> Quick actions: Duplicate, Share, Favorite.

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

_End of document — Obrazz app map and detailed page & function descriptions._

