# Copilot Instructions for Obrazz

**Project:** Obrazz - Personal Wardrobe & AI Styling Mobile App  
**Tech Stack:** React Native 0.81.4 + Expo 54 + TypeScript + Zustand + Supabase  
**Stage:** 4.10 (Manual Outfit Creator complete, AI Outfit Generation planned)

## Architecture Overview

### Core Application Structure

Obrazz follows a **clean, layered architecture** with clear separation of concerns:

```
Authentication → Services → Stores (Zustand) → Components → Navigation (Expo Router)
    ↓
Supabase Backend (Auth + Database + Storage)
```

**Key Architectural Patterns:**

1. **Services Layer** (`/services`) - Encapsulate all backend/data operations
   - Each domain (auth, wardrobe, outfit) has its own service file
   - Services handle Supabase calls and data transformation
   - Example: `outfitService.ts` transforms snake_case DB columns to camelCase for app

2. **State Management** (`/store`) - Zustand stores with persistence
   - `authStore.ts` - Handles user session + persistence
   - `outfitStore.ts` - Complex outfit creation state with undo/redo (808 lines)
   - `wardrobeStore.ts` - Wardrobe items state
   - **Pattern:** Use `persist` middleware with `zustandStorage` adapter for AsyncStorage

3. **Navigation** (`/app` + Expo Router)
   - Route groups: `(auth)`, `(tabs)`, `(modals)` for logical screen organization
   - Protected routes handled via conditional rendering based on `useAuthStore().isAuthenticated`
   - Platform-specific UI: Android uses standard Tabs, iOS uses NativeTabs (liquid glass)

4. **Component Hierarchy** (`/components`)
   - Domain-organized: `outfit/`, `wardrobe/`, `ui/`, `common/`
   - UI components are generic, feature components are domain-specific
   - Image cropping system: `common/ImageCropper.tsx` + `common/CropOverlay.tsx` + `ResizableCropOverlay.tsx`

### Data Flow: Outfit Creation (Example)

1. **User selects items** → `outfitStore.selectItemForCategory()` updates `selectedItemsByCategory`
2. **Step 2 renders canvas** → `OutfitCanvas` receives items, renders with gestures
3. **User transforms item** → Gesture handler calls `updateItemTransform()` → store updates `currentItems`
4. **User saves** → `outfitService.createOutfit()` sends to Supabase, stores `canvasSettings` for edit mode
5. **Load for edit** → `outfitService.getOutfitById()` returns full item data, restore from `canvasSettings`

## Critical Conventions & Patterns

### Type Mapping: Database ↔ Application

**All database interactions follow a consistent naming convention:**

- Database uses **snake_case** (PostgreSQL standard)
- App uses **camelCase** (JavaScript standard)
- Services handle bidirectional mapping

```typescript
// Database: { user_id, is_favorite, created_at }
// App: { userId, isFavorite, createdAt }
// Example in outfitService.ts lines 333-345:
private mapDatabaseToOutfit(data: any): Outfit {
  return {
    userId: data.user_id,
    isAiGenerated: data.is_ai_generated,
    createdAt: new Date(data.created_at),
    // ... always map snake_case → camelCase
  };
}
```

**When adding new fields:** Create a mapping function, don't hardcode transformations in components.

### Supabase Auth & Session Management

**Pattern used in `authStore.ts` & `supabase/client.ts`:**

- Session persisted via `zustandStorage` wrapper around AsyncStorage
- Safe storage adapter validates and prevents corrupted auth data
- Platform-specific: Web uses `localStorage`, native uses `AsyncStorage`
- **Auth initialization:** Call `useAuthStore.getState().initialize()` on app startup

```typescript
// In services/auth/authService.ts
async signUp(data: SignUpData): Promise<AuthResponse> {
  const { data: authData, error } = await supabase.auth.signUp({...});
  if (!error && authData.user) {
    useAuthStore.getState().initialize(authData.user, authData.session);
  }
}
```

### Outfit Canvas & Item Transforms

**Canvas system architecture:**

- `OutfitCanvas.tsx` renders items as draggable, resizable components
- Each item has `transform: { x, y, scale, rotation }`
- Uses `react-native-gesture-handler` + `react-native-reanimated` for 60fps gestures
- **Min/Max scale enforced:** MIN_SCALE=0.5, MAX_SCALE=3.0
- Grid snapping optional via `snapToGrid` prop

**Custom Tab System (Stage 4.8-4.10):**

- `CustomTabManager.tsx` handles custom category tab creation
- `customTabStorage.ts` persists custom tab config to AsyncStorage
- **Bug fix (4.10):** Don't load AsyncStorage in edit mode; use `outfit.canvasSettings` instead
- Backward compatibility: Older outfits without canvasSettings fall back to defaults

### Zustand Store Patterns

**Do's:**

```typescript
// ✅ Create persistence wrapper
export const useOutfitStore = create<State>()(
  persist(
    (set) => ({...}),
    { name: 'outfit-store', storage: zustandStorage }
  )
);

// ✅ Selector pattern for performance
const items = useOutfitStore(state => state.currentItems);

// ✅ Batch updates
set((state) => ({
  item: {...state.item, ...updates},
  updatedAt: new Date()
}));
```

**Don'ts:**

```typescript
// ❌ Don't call store in services (services return data only)
// ❌ Don't duplicate server state (services handle this)
// ❌ Don't persist sensitive data (auth tokens handled separately)
```

## Building & Running

### Development

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on Android emulator
npx expo start --android

# Run on iOS simulator
npx expo start --ios

# Run on physical device (via Expo Go app)
# Scan QR code from terminal
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting (fix issues)
npm run lint:fix

# Code formatting
npm run format

# Pre-commit hooks (Husky)
# Automatically runs eslint + prettier before commit
```

### Key Build Configuration Files

- `tsconfig.json` - Path aliases configured: `@components/*`, `@services/*`, `@store/*`, etc.
- `metro.config.js` - Custom resolver for `@/` imports
- `babel.config.js` - Module resolver plugin
- `app.json` - Expo configuration with permissions (Camera, Photos)
- `.husky/` - Pre-commit hooks run linting

## Commonly Needed Patterns

### Adding a New Feature

1. **Create types** → `types/models/yourModel.ts`
2. **Create service** → `services/yourService/yourService.ts` with Supabase calls
3. **Create store** → `store/yourStore.ts` with Zustand if needed
4. **Create components** → `components/yourFeature/Component.tsx`
5. **Create screen** → `app/yourScreen.tsx` or route group

### Debugging Tips

- **Auth issues:** Check `authStore.ts` + `supabase/client.ts` SafeStorage validation
- **Outfit not saving:** Verify `canvasSettings` serialization in `outfitService.createOutfit()`
- **Custom tabs not loading:** Check `itemSelectionStepNew.tsx` AsyncStorage conditional loading (line ~50)
- **Gesture not working:** Ensure `react-native-gesture-handler` is imported at root
- **Performance:** Use Zustand selectors, not full store subscriptions in lists

### Key External Dependencies

| Package                      | Version | Purpose                                 |
| ---------------------------- | ------- | --------------------------------------- |
| expo-router                  | 6.0.11  | File-based routing                      |
| zustand                      | 5.0.3   | State management                        |
| @supabase/supabase-js        | 2.51.0  | Backend client                          |
| react-native-reanimated      | 4.1.1   | 60fps gestures/animations               |
| react-native-gesture-handler | 2.28.0  | Touch gesture detection                 |
| @tanstack/react-query        | 5.71.0  | Server state caching (not heavily used) |
| react-native-zoom-toolkit    | 5.0.1   | Image zoom in cropper                   |

### Environment Variables (`.env`)

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_PIXIAN_API_ID=your_pixian_id
EXPO_PUBLIC_PIXIAN_API_SECRET=your_pixian_secret
```

## Documentation References

- **Architecture details:** `Docs/AppMapobrazz.md` - Complete screen flows & data model
- **Project structure:** `Docs/project_structure.md` - Folder organization & conventions
- **Roadmap:** `Docs/Implementation.md` - 10-stage implementation plan
- **Tech specs:** `Docs/TechStack.md` - All dependencies & versions
- **UI/UX:** `Docs/UI_UX_doc.md` - Design system & component specs
- **Bug tracking:** `Docs/Bug_tracking.md` - Known issues & solutions
- **Recent changes:** `Docs/Extra/CHANGELOG.md` - What changed in each version

## Current Limitations & Known Patterns

1. **No real AI generation yet** - Placeholder screens exist, microservice not integrated
2. **Image handling** - Uses Pixian.ai for background removal; stored in Supabase Storage
3. **Carousel system** - SmoothCarousel component has custom scroll behavior (Stage 4.7)
4. **Community feed** - Placeholder only, not implemented
5. **Mobile-first design** - Web support via Expo Web but not optimized
6. **i18n** - Structure ready but not fully implemented (Russian + English planned)

## When You're Stuck

1. **Check existing implementations first:** Wardrobe items added (Stage 3), outfit creation (Stage 4) are mature patterns
2. **Read the stage completion docs:** `Docs/Extra/STAGE_4_COMPLETION.md` explains architectural decisions
3. **Trace the data flow:** Follow service → store → component for any feature
4. **Use TypeScript strictly:** Types provide the best documentation in this codebase
5. **Look at similar features:** E.g., if implementing shares, check existing isFavorite pattern in items & outfits
