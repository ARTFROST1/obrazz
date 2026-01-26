# Obrazz — Current Status

**Last Updated:** January 26, 2026  
**Current Stage:** Stage 4.13 Complete ✅ (Navigation Refactor)  
**Next Stage:** Stage 5 — Rails Backend + AI Features

## What's Implemented (Stage 1–4.13)

- Auth: Supabase email auth + session persistence
- Wardrobe: add items (camera/gallery), crop 3:4, background removal via Pixian.ai, filters
- Outfits: 2-step creator (selection → canvas), gestures (drag/scale/rotate), undo/redo, saved outfits
- Shopping Browser (Web Capture): add items from online stores via in-app WebView
- Offline-first: local-first reads, offline CRUD, sync queue + network monitor
- **NEW:** Unified Library Screen with native Liquid Glass segment control
- **NEW:** Floating Plus Button (context-sensitive: AI menu on Home, add item/outfit on Library)
- **NEW:** 3-tab bottom navigation + floating "+" button layout

## Navigation Changes (Stage 4.13)

### Bottom Navigation

- **Before:** 4 tabs (Home, Wardrobe, Outfits, Profile)
- **After:** 3 tabs (Home, Library, Profile) + floating "+" button

### Library Screen

- Unified screen combining Wardrobe and Outfits
- Native iOS segment control with Liquid Glass effect
- Smooth theme transition (light ↔ dark) when switching tabs
- Preserves existing header functionality

### Floating Plus Button

| Screen             | Действие                                             |
| ------------------ | ---------------------------------------------------- |
| Home               | AI меню (Virtual Try-On, Fashion Models, Variations) |
| Library (Wardrobe) | Добавить вещь                                        |
| Library (Outfits)  | Создать образ                                        |
| Profile            | Скрывается                                           |

## What's Next (Stage 5+)

- **Rails Backend** — API для AI, подписки, токены, платежи
- **AI Try-On** — примерка вещей на фото (The New Black API)
- **Subscriptions & Payments** — IAP (iOS/Android) + веб-биллинг (YooMoney для РФ)
- **Onboarding & Paywall** — первичный тур, конверсия в подписку

👉 **Подробный план:** [ROADMAP_NEXT_STEPS.md](./ROADMAP_NEXT_STEPS.md)

## Tech Snapshot (from package.json)

- Expo: `~54.0.30`
- React Native: `0.81.5`
- Router: `expo-router ~6.0.21`
- State: Zustand + TanStack Query
- Backend: Supabase (`@supabase/supabase-js ^2.51.0`)

## Primary Docs

- **Next steps & roadmap:** `Docs/ROADMAP_NEXT_STEPS.md` ⭐
- Roadmap / stages: `Docs/Implementation.md`
- Tech stack: `Docs/TechStack.md`
- Structure & conventions: `Docs/project_structure.md`
- UI system: `Docs/UI_UX_doc.md`
- App map: `Docs/AppMapobrazz.md`
- Backend architecture: `Docs/Extra/Features/Backend.md`
- AI service analysis: `Docs/Extra/Features/THE_NEW_BLACK_AI_SERVICE_ANALYSIS.md`
- Navigation refactor: `Docs/Features/NAVIGATION_REFACTOR_PLAN.md`
- Bugs / known issues: `Docs/Bug_tracking.md`
