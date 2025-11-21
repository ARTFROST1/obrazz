# Add Item Screen Redesign & Integration Plan

## 1. Overview

This document outlines the plan to redesign the "Add Item" screen in the Obrazz application. The goal is to improve usability by creating a more compact, two-step wizard interface with optimized touch targets and reduced scrolling.

## 2. Database & Data Model Analysis

### Current State

- **Table:** `items` (Supabase)
- **Columns:** `id`, `user_id`, `name`, `category`, `color`, `style` (array), `season` (array), `metadata` (JSONB), etc.
- **Service:** `services/wardrobe/itemService.ts` maps these fields.

### Gap Analysis

| Feature     | Current Status                                 | Required Change                                                                              | DB Impact                            |
| :---------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------- |
| **Price**   | Missing                                        | Add `price` field to `WardrobeItem` and `CreateItemInput`. Store in `metadata` JSONB column. | No schema change (JSONB update).     |
| **Styles**  | Existing `StyleTag` type has different values. | Update `StyleTag` type with new values (Casual, Classic, Sport, etc.).                       | No schema change (Array of strings). |
| **Seasons** | Existing `Season` type matches.                | UI update only.                                                                              | None.                                |
| **Colors**  | Existing `Color` type matches.                 | Update predefined color list in UI.                                                          | None.                                |

### Data Model Updates

1.  **`types/models/item.ts`**: Add `price?: number;` to `WardrobeItem` and `ItemMetadata`.
2.  **`types/models/user.ts`**: Update `StyleTag` type definition to:
    ```typescript
    export type StyleTag =
      | 'casual'
      | 'classic'
      | 'sport'
      | 'minimalism'
      | 'old_money'
      | 'scandi'
      | 'indie'
      | 'y2k'
      | 'star'
      | 'alt'
      | 'cottagecore'
      | 'downtown';
    ```
3.  **`services/wardrobe/itemService.ts`**: Update `createItem` and `updateItem` to handle `price` and map it to `metadata.price`.

## 3. UI/UX Redesign Plan

The screen will be split into two logical steps.

### Step 1: Visuals & Basics

- **Image Preview:**
  - Scale: 50% smaller than current.
  - Action: "Add/Change Photo" button below image.
  - Behavior: Opens native ActionSheet (Camera / Gallery).
- **Category Selection:**
  - Layout: Grid, 4 columns (2 rows).
  - Component: Updated `CategoryGridPicker`.
- **Color Selection:**
  - Layout: Grid, 4 columns.
  - Palette: Black, White, Gray, Brown, Beige, Red, Orange, Yellow, Green, Dark Green, Turquoise, Light Blue, Blue, Purple, Pink, Burgundy.
  - Style: Pastel/Fashionable shades for colors starting from Red.
- **Navigation:** "Next" button (replaces "Save").

### Step 2: Details & Context

- **Input Fields:**
  - Name (Title)
  - Brand
  - Price (New)
- **Style Selection:**
  - Layout: Grid, 4 columns (3 rows).
  - Options: Casual, Classic, Sport, Minimalism, Old Money, Scandi, Indie, Y2K, Star, Alt, Cottagecore, Downtown.
- **Season Selection:**
  - Layout: Grid, 4 columns (1 row).
  - Options: Spring, Summer, Fall, Winter.
- **Navigation:** "Save to Wardrobe" button (Final action).

## 4. Implementation Steps

### Phase 1: Core Logic & Types

1.  Modify `types/models/user.ts` to update `StyleTag`.
2.  Modify `types/models/item.ts` to add `price`.
3.  Modify `services/wardrobe/itemService.ts` to persist `price` in metadata.

### Phase 2: Component Updates

1.  **`CategoryGridPicker.tsx`**: Update styles to support 4 columns (`width: '22%'`).
2.  **`ColorPicker.tsx`**: Refactor from horizontal ScrollView to Grid (flex-wrap, 4 columns). Update color list.
3.  **`SelectionGrid.tsx` (New)**: Create a generic grid component for Styles and Seasons to ensure consistency (4 columns).

### Phase 3: Screen Refactoring (`app/add-item.tsx`)

1.  Introduce state `step` (1 | 2).
2.  Refactor render method to conditionally render Step 1 or Step 2.
3.  Implement "Next" button logic (validation for Step 1).
4.  Implement "Save" button logic (submit all data).
5.  Integrate Native Image Picker (ActionSheet).

## 5. Technical Details

### Color Palette Hex Codes (Proposed)

- Black: `#000000`
- White: `#FFFFFF`
- Gray: `#808080`
- Brown: `#8B4513`
- Beige: `#F5F5DC`
- Red: `#FF6B6B` (Pastel)
- Orange: `#FFB347` (Pastel)
- Yellow: `#FDFD96` (Pastel)
- Green: `#77DD77` (Pastel)
- Dark Green: `#006400`
- Turquoise: `#AFEEEE`
- Light Blue: `#AEC6CF` (Pastel)
- Blue: `#0000FF`
- Purple: `#B39EB5` (Pastel)
- Pink: `#FFB7B2` (Pastel)
- Burgundy: `#800020`

### Style Tags Mapping

- Display Name -> Internal Value
- Casual -> `casual`
- Classic -> `classic`
- Sport -> `sport`
- Minimalism -> `minimalism`
- Old Money -> `old_money`
- Scandi -> `scandi`
- Indie -> `indie`
- Y2K -> `y2k`
- Star -> `star`
- Alt -> `alt`
- Cottagecore -> `cottagecore`
- Downtown -> `downtown`
