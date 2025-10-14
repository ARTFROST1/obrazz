# Stage 4.5: Outfits Collection & Navigation Reorganization

## Overview

Этот этап реорганизует навигацию приложения, добавляя полноценную страницу с коллекцией сохранённых образов и переносит функционал создания образа из основного таба в отдельный экран, доступный через FAB и хедер.

**Статус:** IN PROGRESS  
**Приоритет:** HIGH  
**Зависимости:** Stage 4 (Manual Outfit Creator) - COMPLETED  
**Предполагаемое время:** 3-5 дней

---

## Motivation

### Проблема

В текущей реализации:

- Отсутствует основная страница для просмотра всех сохранённых образов
- Таб "Create" занимает место в главной навигации, хотя это не основная функция просмотра контента
- Пользователю негде увидеть свою коллекцию образов
- Нарушена документация, где указано 4 таба: Home, Wardrobe, **Outfits**, Profile

### Решение

- Заменить таб "Create" на "Outfits" с коллекцией сохранённых образов
- Перенести создание образа в отдельный stack screen
- Добавить FAB (Floating Action Button) для быстрого доступа к созданию
- Добавить кнопку в хедер как альтернативный способ создания

---

## Design Decisions

### Navigation Architecture

#### Old Structure (Current)

```
Bottom Tabs:
├── Home (Feed)
├── Wardrobe
├── Create ❌ (should not be a primary tab)
└── Profile
```

#### New Structure (Target)

```
Bottom Tabs:
├── Home (Feed)
├── Wardrobe
├── Outfits ✅ (new primary tab)
└── Profile

Stack Screens:
└── /outfit/create (accessed via FAB or header button)
```

### User Flow

#### Creating a New Outfit

1. User navigates to "Outfits" tab
2. Sees grid of saved outfits (or empty state)
3. Clicks FAB (+) button in bottom-right OR
4. Clicks (+) button in header
5. Navigates to `/outfit/create` screen (stack navigation)
6. Creates outfit using existing functionality
7. Saves outfit
8. Returns to "Outfits" tab with new outfit visible

#### Editing an Existing Outfit

1. User on "Outfits" tab
2. Taps outfit card
3. Views outfit detail
4. Taps "Edit" button
5. Navigates to `/outfit/create` with `outfit_id` param
6. Modifies outfit
7. Saves changes
8. Returns to "Outfits" tab

---

## Implementation Plan

### Phase 1: Documentation Updates ✅

**Status:** COMPLETED

- [x] Update `Implementation.md` - Add Stage 4.5
- [x] Update `PRDobrazz.md` - Fix navigation structure
- [x] Update `AppMapobrazz.md` - Add FAB, update Saved Outfits section
- [x] Update `project_structure.md` - Reflect new file locations
- [x] Update `UI_UX_doc.md` - Add FAB specs, OutfitCard detailed specs
- [x] Create this plan document

### Phase 2: Type Definitions & Models

**Estimated Time:** 30 minutes

**Files to Create/Update:**

- `types/models/outfit.ts` - Ensure Outfit type is complete
- `types/components/OutfitCard.ts` - Props for OutfitCard component

**Tasks:**

- [ ] Verify Outfit type includes all necessary fields:
  ```typescript
  interface Outfit {
    id: string;
    user_id: string;
    title?: string;
    description?: string;
    items: OutfitItem[];
    background_id?: string;
    visibility: 'private' | 'shared' | 'public';
    created_at: string;
    updated_at: string;
    likes_count?: number;
    is_favorite?: boolean;
    thumbnail_uri?: string; // For preview
  }
  ```
- [ ] Create OutfitCardProps type
- [ ] Create OutfitGridProps type

### Phase 3: OutfitCard Component

**Estimated Time:** 2-3 hours

**File:** `components/outfit/OutfitCard.tsx`

**Requirements:**

- Display outfit preview image (composited items)
- Show title, visibility badge, likes count
- Support tap to view, long press for quick actions
- Responsive layout (2 cols mobile, 3-4 tablet)
- Loading skeleton state
- Error state fallback

**Props:**

```typescript
interface OutfitCardProps {
  outfit: Outfit;
  onPress?: (outfit: Outfit) => void;
  onLongPress?: (outfit: Outfit) => void;
  onEdit?: (outfit: Outfit) => void;
  onDuplicate?: (outfit: Outfit) => void;
  onDelete?: (outfit: Outfit) => void;
  onShare?: (outfit: Outfit) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
}
```

**Implementation Steps:**

- [ ] Create basic card structure with preview image
- [ ] Add overlay with gradient for text
- [ ] Add title and badges
- [ ] Implement tap handlers
- [ ] Implement long-press context menu
- [ ] Add three-dot menu icon
- [ ] Style according to UI_UX_doc.md specs
- [ ] Add animations (scale on press)
- [ ] Add loading skeleton variant
- [ ] Test on different screen sizes

### Phase 4: OutfitGrid Component

**Estimated Time:** 1 hour

**File:** `components/outfit/OutfitGrid.tsx`

**Requirements:**

- FlashList for performance with large datasets
- 2 columns on mobile, 3-4 on tablet
- Pull-to-refresh support
- Empty state handling
- Loading state
- Error state

**Props:**

```typescript
interface OutfitGridProps {
  outfits: Outfit[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onOutfitPress?: (outfit: Outfit) => void;
  onOutfitEdit?: (outfit: Outfit) => void;
  onOutfitDelete?: (outfit: Outfit) => void;
  EmptyComponent?: React.ComponentType;
}
```

**Implementation Steps:**

- [ ] Setup FlashList with responsive columns
- [ ] Implement pull-to-refresh
- [ ] Add empty state component
- [ ] Add loading state
- [ ] Optimize rendering performance
- [ ] Test scroll performance with 100+ items

### Phase 5: Empty State Component

**Estimated Time:** 30 minutes

**File:** `components/outfit/OutfitEmptyState.tsx`

**Requirements:**

- Display when no outfits exist
- Show icon, title, message
- CTA button to create first outfit
- Following UI_UX_doc.md specs

**Implementation Steps:**

- [ ] Create component with centered layout
- [ ] Add icon (wardrobe/outfit illustration)
- [ ] Add text content
- [ ] Add CTA button that navigates to create
- [ ] Style according to specs

### Phase 6: Outfits Screen (Main Tab)

**Estimated Time:** 3-4 hours

**File:** `app/(tabs)/outfits.tsx`

**Requirements:**

- Grid of OutfitCards using OutfitGrid component
- Search bar in header
- Filter chips (all/private/shared)
- Sort dropdown (newest, favorite, most used)
- FAB button (bottom-right)
- Header action button (+) in top-right
- Pull-to-refresh
- Infinite scroll/pagination
- Loading states
- Error handling

**Layout Structure:**

```
<Screen>
  <Header>
    <SearchBar />
    <FilterChips />
    <SortDropdown />
    <ActionButton icon="add" /> {/* Top-right */}
  </Header>

  <OutfitGrid
    outfits={filteredOutfits}
    onOutfitPress={handleOutfitPress}
    onOutfitEdit={handleOutfitEdit}
    onOutfitDelete={handleOutfitDelete}
    EmptyComponent={OutfitEmptyState}
  />

  <FAB
    icon="add"
    onPress={handleCreateOutfit}
    position="bottom-right"
  />
</Screen>
```

**State Management:**

- [ ] Use outfitStore for outfit data
- [ ] Add search query state
- [ ] Add filter state (all/private/shared)
- [ ] Add sort state (newest/favorite/most_used)
- [ ] Handle loading/error states

**Data Fetching:**

- [ ] Fetch user's outfits from Supabase
- [ ] Implement search filter
- [ ] Implement visibility filter
- [ ] Implement sorting
- [ ] Setup pull-to-refresh
- [ ] Setup pagination

**Navigation:**

- [ ] FAB → `/outfit/create` (router.push)
- [ ] Header button → `/outfit/create`
- [ ] Card tap → `/outfit/[id]` (detail view)
- [ ] Edit action → `/outfit/create?id=${outfit.id}`

**Implementation Steps:**

- [ ] Create basic screen layout
- [ ] Add header with search, filters, sort
- [ ] Integrate OutfitGrid component
- [ ] Add FAB component (create if doesn't exist)
- [ ] Add header action button
- [ ] Connect to outfitStore
- [ ] Implement data fetching with TanStack Query
- [ ] Implement search functionality
- [ ] Implement filter functionality
- [ ] Implement sort functionality
- [ ] Add navigation handlers
- [ ] Handle empty state
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Test all user flows

### Phase 7: FAB Component (Reusable)

**Estimated Time:** 1 hour

**File:** `components/ui/FAB.tsx`

**Requirements:**

- Reusable across app
- Positioned bottom-right with margins
- Primary color background
- Icon support
- Press animation
- Optional hide on scroll
- Shadow and elevation

**Props:**

```typescript
interface FABProps {
  icon: string;
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
  hideOnScroll?: boolean;
  style?: StyleProp<ViewStyle>;
}
```

**Implementation Steps:**

- [ ] Create animated FAB component
- [ ] Add press animation (scale)
- [ ] Add shadow and elevation
- [ ] Implement hide on scroll (optional)
- [ ] Add accessibility labels
- [ ] Style according to UI_UX_doc.md
- [ ] Export from ui/index.ts

### Phase 8: Move create.tsx to Stack

**Estimated Time:** 1 hour

**Current:** `app/(tabs)/create.tsx`  
**Target:** `app/outfit/create.tsx`

**Steps:**

- [ ] Create `/app/outfit/` directory if not exists
- [ ] Copy `app/(tabs)/create.tsx` to `app/outfit/create.tsx`
- [ ] Update any hardcoded navigation paths
- [ ] Add route params support:
  ```typescript
  // Support edit mode
  const { id } = useLocalSearchParams<{ id?: string }>();
  ```
- [ ] If `id` exists, load outfit data for editing
- [ ] Update header to show "Create Outfit" or "Edit Outfit"
- [ ] Ensure save/cancel navigation goes back to Outfits tab
- [ ] Remove old `app/(tabs)/create.tsx` file
- [ ] Test navigation flow

### Phase 9: Update Tab Navigation

**Estimated Time:** 30 minutes

**File:** `app/(tabs)/_layout.tsx`

**Changes:**

- [ ] Remove `create` tab configuration
- [ ] Add `outfits` tab configuration:
  ```tsx
  <Tabs.Screen
    name="outfits"
    options={{
      title: 'Outfits',
      tabBarIcon: ({ color }) => <TabBarIcon name="albums" color={color} />,
      headerTitle: 'My Outfits',
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/outfit/create')}>
          <Ionicons name="add" size={28} color={Colors.primary} />
        </TouchableOpacity>
      ),
    }}
  />
  ```
- [ ] Update icon names to match spec (albums/albums-outline for Outfits)
- [ ] Ensure correct tab order: index, wardrobe, outfits, profile
- [ ] Test tab switching

### Phase 10: Outfit Detail Screen (Basic)

**Estimated Time:** 2 hours

**File:** `app/outfit/[id].tsx`

**Requirements:**

- Display full outfit canvas view
- Show title, description
- Show visibility status
- Action buttons: Edit, Duplicate, Share, Delete
- Back button navigation

**Layout:**

```
<Screen>
  <Header>
    <BackButton />
    <Title>{outfit.title}</Title>
    <MoreButton />
  </Header>

  <ScrollView>
    <OutfitCanvas outfit={outfit} interactive={false} />

    <InfoSection>
      <Title />
      <Description />
      <Metadata />
    </InfoSection>

    <ActionButtons>
      <Button title="Edit" onPress={handleEdit} />
      <Button title="Duplicate" onPress={handleDuplicate} />
      <Button title="Share" onPress={handleShare} />
      <Button title="Delete" onPress={handleDelete} variant="danger" />
    </ActionButtons>
  </ScrollView>
</Screen>
```

**Implementation Steps:**

- [ ] Create screen with dynamic route param
- [ ] Fetch outfit by id
- [ ] Display outfit canvas (reuse Canvas component from create)
- [ ] Add metadata section
- [ ] Implement Edit button → navigate to `/outfit/create?id=${id}`
- [ ] Implement Duplicate → copy outfit and navigate to create
- [ ] Implement Share → export image functionality (basic)
- [ ] Implement Delete → confirm and delete
- [ ] Handle loading state
- [ ] Handle error state (outfit not found)
- [ ] Test navigation flow

### Phase 11: Update Outfit Service

**Estimated Time:** 1 hour

**File:** `services/outfit/outfitService.ts`

**New Functions Needed:**

- [ ] `getOutfitsByUserId(userId: string): Promise<Outfit[]>`
- [ ] `getOutfitById(id: string): Promise<Outfit | null>`
- [ ] `deleteOutfit(id: string): Promise<void>`
- [ ] `duplicateOutfit(id: string): Promise<Outfit>`
- [ ] `searchOutfits(userId: string, query: string): Promise<Outfit[]>`
- [ ] `filterOutfits(outfits: Outfit[], visibility: string): Outfit[]`
- [ ] `sortOutfits(outfits: Outfit[], sortBy: string): Outfit[]`

**Implementation Steps:**

- [ ] Add missing CRUD functions
- [ ] Add search/filter/sort helpers
- [ ] Update error handling
- [ ] Add TypeScript types
- [ ] Test all functions

### Phase 12: Update Outfit Store

**Estimated Time:** 1 hour

**File:** `store/outfit/outfitStore.ts`

**New State Needed:**

```typescript
interface OutfitStoreState {
  // Existing create/edit state...

  // New collection state
  outfits: Outfit[];
  isLoadingOutfits: boolean;
  outfitsError: string | null;
  searchQuery: string;
  filterBy: 'all' | 'private' | 'shared' | 'public';
  sortBy: 'newest' | 'favorite' | 'most_used';
}
```

**New Actions Needed:**

- [ ] `loadOutfits(userId: string): Promise<void>`
- [ ] `setSearchQuery(query: string): void`
- [ ] `setFilter(filter: string): void`
- [ ] `setSort(sort: string): void`
- [ ] `deleteOutfit(id: string): Promise<void>`
- [ ] `duplicateOutfit(id: string): Promise<void>`
- [ ] Computed: `filteredAndSortedOutfits`

**Implementation Steps:**

- [ ] Add collection state fields
- [ ] Implement load outfits action
- [ ] Implement search/filter/sort actions
- [ ] Add computed getter for filtered list
- [ ] Update existing save action to refresh list
- [ ] Test state updates

### Phase 13: Integration Testing

**Estimated Time:** 2-3 hours

**Test Scenarios:**

#### Navigation Flow

- [ ] Tab navigation works correctly
- [ ] All 4 tabs present: Feed, Wardrobe, Outfits, Profile
- [ ] Outfits tab is accessible and renders
- [ ] FAB button navigates to create screen
- [ ] Header (+) button navigates to create screen
- [ ] Create screen can be accessed from Outfits tab
- [ ] Back navigation returns to Outfits tab
- [ ] Save in create returns to Outfits tab

#### Outfits Screen

- [ ] Empty state shows when no outfits
- [ ] CTA in empty state navigates to create
- [ ] Outfit grid displays saved outfits
- [ ] 2 columns on mobile, 3-4 on tablet
- [ ] Cards show correct outfit data
- [ ] Tap card navigates to detail screen
- [ ] Long press shows context menu
- [ ] Search filters outfits correctly
- [ ] Filter chips work (all/private/shared)
- [ ] Sort dropdown works (newest/favorite/most_used)
- [ ] Pull-to-refresh reloads data
- [ ] Scroll performance is smooth with 50+ outfits

#### Create/Edit Flow

- [ ] Create new outfit works
- [ ] Save new outfit adds to collection
- [ ] Edit existing outfit works
- [ ] Save edited outfit updates in collection
- [ ] Cancel returns without saving
- [ ] Edit mode loads correct outfit data

#### Detail Screen

- [ ] Detail screen displays outfit correctly
- [ ] Edit button navigates to create in edit mode
- [ ] Duplicate creates copy
- [ ] Delete removes outfit (with confirmation)
- [ ] Share exports image (basic implementation)

#### Data & State

- [ ] Outfit store updates correctly
- [ ] Data persists to Supabase
- [ ] Data loads on app restart
- [ ] Search/filter/sort doesn't lose data
- [ ] No memory leaks with large datasets

#### Edge Cases

- [ ] Handle no outfits gracefully
- [ ] Handle deleted items in outfit
- [ ] Handle network errors
- [ ] Handle concurrent edits
- [ ] Handle navigation interruptions

### Phase 14: Polish & Optimization

**Estimated Time:** 1-2 hours

**Tasks:**

- [ ] Add loading skeletons for outfit cards
- [ ] Add haptic feedback on FAB press
- [ ] Optimize images for outfit previews (thumbnails)
- [ ] Add subtle animations (card entrance)
- [ ] Improve error messages
- [ ] Add success toasts (outfit saved/deleted)
- [ ] Ensure consistent spacing and alignment
- [ ] Test dark mode (if implemented)
- [ ] Test accessibility (screen readers)
- [ ] Verify all UI matches UI_UX_doc.md specs

### Phase 15: Documentation & Cleanup

**Estimated Time:** 1 hour

**Tasks:**

- [ ] Update CHANGELOG.md with Stage 4.5 changes
- [ ] Create STAGE_4.5_COMPLETION.md document
- [ ] Update README.md if needed
- [ ] Remove old unused files
- [ ] Clean up commented code
- [ ] Verify all imports are correct
- [ ] Run linter and fix issues
- [ ] Run type checker and fix errors
- [ ] Update this plan with completion status

---

## File Structure Summary

### New Files to Create

```
app/
├── (tabs)/
│   └── outfits.tsx                    # NEW - Main outfits collection screen
├── outfit/
│   ├── create.tsx                     # MOVED from (tabs)/create.tsx
│   └── [id].tsx                       # NEW - Outfit detail/view screen

components/
├── outfit/
│   ├── OutfitCard.tsx                 # NEW - Outfit preview card
│   ├── OutfitGrid.tsx                 # NEW - Grid of outfit cards
│   └── OutfitEmptyState.tsx          # NEW - Empty state component
└── ui/
    └── FAB.tsx                        # NEW - Floating action button

types/
└── components/
    └── OutfitCard.ts                  # NEW - OutfitCard types

Docs/
└── STAGE_4.5_OUTFITS_NAVIGATION_PLAN.md  # This file
```

### Files to Modify

```
app/
└── (tabs)/
    └── _layout.tsx                    # UPDATE - Replace create with outfits tab

services/
└── outfit/
    └── outfitService.ts               # UPDATE - Add get, delete, search functions

store/
└── outfit/
    └── outfitStore.ts                 # UPDATE - Add collection state & actions

Docs/
├── Implementation.md                  # DONE - Added Stage 4.5
├── PRDobrazz.md                      # DONE - Updated navigation
├── AppMapobrazz.md                   # DONE - Updated Saved Outfits section
├── project_structure.md              # DONE - Updated file structure
└── UI_UX_doc.md                      # DONE - Added FAB and OutfitCard specs
```

### Files to Delete

```
app/
└── (tabs)/
    └── create.tsx                     # DELETE - Moved to outfit/create.tsx
```

---

## Dependencies & Prerequisites

### Required Packages (Already Installed)

- `@react-navigation/native`
- `expo-router`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `@tanstack/react-query`
- `zustand`
- `@supabase/supabase-js`

### Additional Packages (If Needed)

- `@shopify/flash-list` - High performance lists (check if installed)
- `react-native-haptic-feedback` - For FAB haptic feedback (optional)

---

## Success Criteria

### Functional Requirements

- ✅ Outfits tab exists in main navigation
- ✅ Outfits screen displays all saved outfits in a grid
- ✅ FAB button creates new outfit
- ✅ Header button creates new outfit
- ✅ Create screen is accessible from multiple entry points
- ✅ Edit outfit flow works correctly
- ✅ Delete outfit flow works with confirmation
- ✅ Search/filter/sort work correctly
- ✅ Navigation flows are intuitive and smooth

### Non-Functional Requirements

- ✅ Smooth 60fps animations
- ✅ Grid handles 100+ outfits without lag
- ✅ Images load progressively with placeholders
- ✅ All UI elements match design specs
- ✅ Accessibility labels present
- ✅ Error states handled gracefully
- ✅ Code follows project conventions
- ✅ TypeScript types are complete
- ✅ No console warnings or errors

### User Experience

- ✅ User can easily find saved outfits
- ✅ Creating outfit is one tap away (FAB)
- ✅ Navigation feels natural and expected
- ✅ Empty states guide user to action
- ✅ Loading states don't block interaction
- ✅ Feedback is immediate and clear

---

## Risks & Mitigation

### Risk: Performance with Large Datasets

**Mitigation:**

- Use FlashList instead of FlatList
- Implement image thumbnails
- Add pagination/infinite scroll
- Use memoization appropriately

### Risk: Complex Navigation Stack

**Mitigation:**

- Test all navigation paths thoroughly
- Document navigation architecture
- Use Expo Router conventions
- Handle deep linking properly

### Risk: State Synchronization Issues

**Mitigation:**

- Use TanStack Query for server state
- Invalidate cache on mutations
- Optimistic updates for better UX
- Error recovery strategies

---

## Testing Checklist

### Manual Testing

- [ ] Install on iOS device
- [ ] Install on Android device
- [ ] Test all navigation flows
- [ ] Test create/edit/delete flows
- [ ] Test with 0 outfits
- [ ] Test with 1 outfit
- [ ] Test with 50+ outfits
- [ ] Test search with various queries
- [ ] Test filters and sorting
- [ ] Test screen rotations
- [ ] Test back button behavior
- [ ] Test app backgrounding/foregrounding

### Automated Testing (Future)

- [ ] Unit tests for outfitService
- [ ] Unit tests for outfitStore
- [ ] Component tests for OutfitCard
- [ ] Integration tests for Outfits screen
- [ ] E2E test for create flow

---

## Notes

### Design Considerations

- FAB is the primary CTA for creating outfits
- Header button provides alternative access point
- Outfits tab becomes the hub for outfit management
- Create screen is modal-like but uses stack navigation for better back handling

### Future Enhancements (Post-Stage 4.5)

- Outfit collections/folders
- Bulk operations (multi-select)
- Advanced filters (by color, style, season)
- Outfit calendar/schedule
- Outfit recommendations
- Export multiple outfits
- Outfit analytics (views, likes)

---

## Completion Criteria

This stage is considered complete when:

1. All tasks in phases 1-15 are checked off
2. All success criteria are met
3. Manual testing checklist is complete
4. No critical bugs remain
5. Documentation is updated
6. Code is merged to main branch
7. STAGE_4.5_COMPLETION.md is created

---

**Last Updated:** January 14, 2025  
**Author:** Development Agent  
**Status:** Documentation Complete, Implementation Starting
