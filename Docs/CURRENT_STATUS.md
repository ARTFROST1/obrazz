# Obrazz \u2014 Current Status

**Last Updated:** February 8, 2026
**Current Stage:** Stage 4.13 Complete (Navigation Refactor) + Expo SDK 55 migration
**Next Stage:** Stage 5 \u2014 AI Features + Backend Integration

---

## Implemented (Stage 1\u20134.13)

### Auth (Stage 2)

- Supabase email auth (sign-in, sign-up, forgot-password)
- Google OAuth + Apple Sign In (native on iOS + web fallback)
- Session persistence via Zustand + AsyncStorage

### Wardrobe Management (Stage 3)

- Add items via camera / gallery
- ImageCropper: 3:4 ratio, pinch-to-zoom, elastic bounce
- Background removal: **Apple Vision** (primary, iOS 16+) + **Pixian.ai** (fallback)
- 24 built-in default items for new users
- 8 categories: tops, bottoms, dresses, outerwear, shoes, bags, accessories, other
- Favorites, item detail view

### Outfit Creator (Stages 4\u20134.10)

- 2-step process: item selection \u2192 canvas composition
- SmoothCarousel for item browsing
- 4-Tab System (Basic, Dress, All, Custom)
- OutfitCanvas: drag, scale, rotate with 60fps gestures (Reanimated + Gesture Handler)
- Undo/Redo history, Background picker
- Full canvas state persistence (`canvasSettings`) for edit mode
- Custom tabs via AsyncStorage

### Shopping Browser (Stage 4.11)

- In-app WebView browser with 9 preset stores
- Image detection and capture from web pages
- Gallery BottomSheet with masonry layout, Cart system

### Offline-First Architecture (Stage 4.12)

- Local-first reads with optimistic UI
- Offline CRUD for items and outfits
- Sync queue with retry logic (AsyncStorage-backed)
- Network monitor (NetInfo), Sync status indicators

### Navigation Refactor (Stage 4.13)

- **Before:** 4 tabs (Home, Wardrobe, Outfits, Profile)
- **After:** 3 tabs (Home, Library, Profile) + floating "+" button
- Unified Library screen with iOS Liquid Glass segment control
- Context-sensitive Floating Plus Button

### IAP Infrastructure

- `react-native-iap` installed + `iapService.ts`
- `subscriptionService.ts` + `subscriptionStore.ts`

---

## Ecosystem Architecture

```
Mobile App (obrazz/)                 React Native 0.83.1 + Expo SDK 55
       |  Supabase JWT
       v
Backend API (obrazz-api/)            Node.js + Hono + TypeScript
       |              |
       v              v
  Supabase        FASHN AI (api.fashn.ai/v1)
  Auth+DB+Storage

Admin Panel (obrazz-admin/)          Rails 8.0.4 + HTTP Basic Auth
       |
       v
  Supabase PostgreSQL (direct read + subscription edit)

Landing + Dashboard (LandingPageObrazz/)   Next.js 15 + Supabase SSR
```

**Deployment:** All backend services \u2192 Render Frankfurt (Docker).

---

## Next Steps (Stage 5+)

### Backend API (obrazz-api \u2014 partially built)

- \u2705 API routes: AI, tokens, payments, subscriptions, users, webhooks
- \u2705 FASHN AI integration (virtual try-on, fashion model, variation)
- \u2705 YooKassa payment creation + webhook processing
- \u2705 Token system (balance, debit, credit, packs)
- \ud83d\udea7 Mobile app integration (connect screens to API)

### AI Features (Stage 5)

- Virtual Try-On, Fashion Models, Clothing Variations
- **Provider:** FASHN AI (`api.fashn.ai/v1`) \u2014 **NOT The New Black**
- **Architecture:** Mobile \u2192 obrazz-api \u2192 FASHN AI

### Subscriptions & Payments (Stage 7)

- IAP on mobile (iOS/Android)
- YooKassa for Russian users (web payments via obrazz-api)

### Planned (Stages 8\u201313)

- Push notifications & gamification
- Onboarding & Paywall
- Polish & optimization
- Testing & QA, Deployment & Launch

---

## Tech Snapshot

| Component         | Technology      | Version           |
| ----------------- | --------------- | ----------------- |
| Mobile Framework  | React Native    | 0.83.1            |
| Mobile SDK        | Expo            | ^55.0.0-preview.6 |
| React             | React           | 19.2.0            |
| Router            | expo-router     | ~55.0.0-beta.3    |
| Language          | TypeScript      | ~5.9.2            |
| State             | Zustand         | ^5.0.3            |
| Server State      | TanStack Query  | ^5.71.0           |
| Backend DB/Auth   | Supabase        | ^2.51.0           |
| Backend API       | Hono (Node.js)  | ^4.7.0            |
| Admin Panel       | Rails           | 8.0.4             |
| Landing/Dashboard | Next.js         | ^15.1.0           |
| Animations        | Reanimated      | ~4.2.1            |
| Gestures          | Gesture Handler | ~2.30.0           |
| AI Provider       | FASHN AI        | api.fashn.ai/v1   |

---

## Primary Docs

| Document                            | Contents                       |
| ----------------------------------- | ------------------------------ |
| `Docs/ROADMAP_NEXT_STEPS.md`        | Roadmap & next steps           |
| `Docs/Implementation.md`            | Stage-by-stage plan            |
| `Docs/TechStack.md`                 | Full tech stack                |
| `Docs/project_structure.md`         | Folder structure & conventions |
| `Docs/UI_UX_doc.md`                 | UI/UX design system            |
| `Docs/AppMapobrazz.md`              | Screen flows & data models     |
| `Docs/Bug_tracking.md`              | Known issues                   |
| `../../obrazz-api/README.md`        | Backend API docs               |
| `../../obrazz-admin/README.md`      | Admin panel docs               |
| `../../LandingPageObrazz/README.md` | Landing page docs              |
