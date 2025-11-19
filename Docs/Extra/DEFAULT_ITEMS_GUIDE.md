# Default Items (Builtin Items) Guide

**Last Updated:** November 20, 2025
**Feature Status:** Implemented
**Version:** 1.0.0

---

## Overview

Default items (also called "builtin items") are pre-configured wardrobe items that are automatically available to all users. They serve as starter items to help new users explore the app's features without having to add their own items first.

### Key Features

- Visible to **all users** automatically
- Stored in database with images in Supabase Storage
- Can be **hidden** by users (not deleted from DB)
- Hidden items are stored per-user in `hidden_default_items` table
- Persist in database even when hidden by individual users

---

## Architecture

### Database Structure

#### Items Table (existing)

Default items are stored in the `items` table with `is_default = true`:

```sql
-- items table already has these fields:
is_default BOOLEAN DEFAULT FALSE  -- marks item as default/builtin
user_id UUID                       -- references profiles.id
```

#### Hidden Default Items Table (new)

Tracks which users have hidden which default items:

```sql
CREATE TABLE public.hidden_default_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
```

**RLS Policies:**

- Users can only view their own hidden items
- Users can only hide items for themselves
- Users can only unhide their own hidden items

### State Management

The `wardrobeStore` manages hidden default items:

```typescript
interface WardrobeState {
  hiddenDefaultItemIds: string[];

  // Actions
  setHiddenDefaultItemIds: (ids: string[]) => void;
  addHiddenDefaultItemId: (id: string) => void;
  removeHiddenDefaultItemId: (id: string) => void;
  removeItemLocally: (id: string) => void;

  // Getters
  getDefaultItems: () => WardrobeItem[];
  getUserOwnItems: () => WardrobeItem[];
}
```

### Service Layer

The `itemService` handles database operations:

```typescript
// Get user items including visible default items
async getUserItems(userId: string): Promise<WardrobeItem[]>

// Get only default items
async getDefaultItems(): Promise<WardrobeItem[]>

// Get hidden item IDs for a user
async getHiddenDefaultItemIds(userId: string): Promise<string[]>

// Hide a default item
async hideDefaultItem(userId: string, itemId: string): Promise<void>

// Unhide a default item
async unhideDefaultItem(userId: string, itemId: string): Promise<void>

// Unhide all default items
async unhideAllDefaultItems(userId: string): Promise<void>
```

---

## Managing Default Items

### Adding New Default Items

#### Step 1: Upload Images to Supabase Storage

1. Go to Supabase Dashboard > Storage
2. Open `wardrobe-items` bucket (or create it if needed)
3. Create a folder `default-items` for organization
4. Upload images (recommended: 800x800px, PNG/JPG)
5. Make sure the bucket is **public** or configure RLS appropriately
6. Copy the public URLs for each image

#### Step 2: Create SQL Insert Script

Create a new SQL migration or add to existing one:

```sql
-- Insert default items
INSERT INTO public.items (
  id,
  user_id,
  title,
  category,
  image_url,
  thumbnail_url,
  is_favorite,
  times_worn,
  is_default,
  metadata,
  created_at,
  updated_at
) VALUES
(
  uuid_generate_v4(),
  'YOUR_ADMIN_USER_ID',  -- Must be valid profile UUID
  'White T-Shirt',
  'tops',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wardrobe-items/default-items/white-tshirt.png',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wardrobe-items/default-items/white-tshirt.png',
  false,
  0,
  true,  -- This marks it as default item
  jsonb_build_object(
    'brand', 'Basic',
    'colors', jsonb_build_array(
      jsonb_build_object('name', 'White', 'hex', '#FFFFFF')
    ),
    'styles', jsonb_build_array('casual', 'minimalist'),
    'seasons', jsonb_build_array('spring', 'summer', 'fall', 'winter')
  ),
  NOW(),
  NOW()
);
```

#### Step 3: Execute Migration

Run the SQL in Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Paste the SQL script
3. Click "Run"
4. Verify items were created in Table Editor

### Updating Default Items

To update an existing default item:

```sql
UPDATE public.items
SET
  title = 'New Title',
  metadata = jsonb_build_object(
    'brand', 'Updated Brand',
    'colors', jsonb_build_array(
      jsonb_build_object('name', 'Blue', 'hex', '#0000FF')
    ),
    'styles', jsonb_build_array('casual'),
    'seasons', jsonb_build_array('summer')
  ),
  updated_at = NOW()
WHERE id = 'ITEM_UUID_HERE' AND is_default = true;
```

### Deleting Default Items

**Warning:** Deleting a default item will:

- Remove it for ALL users
- Delete associated hidden_default_items records (cascade)

```sql
DELETE FROM public.items
WHERE id = 'ITEM_UUID_HERE' AND is_default = true;
```

---

## User Behavior

### How Users Hide Default Items

When a user selects and deletes items in the wardrobe:

1. **User's own items** - Actually deleted from database
2. **Default items** - Hidden in `hidden_default_items` table

The app shows different messages:

- "Hide Items" - When only default items are selected
- "Delete Items" - When only user items are selected
- "Delete X and hide Y" - When both are selected

### How Users Restore Hidden Items

Currently, there's no UI for restoring hidden items. To restore:

**Option 1: Admin/Developer Action**

```sql
-- Restore all hidden items for a user
DELETE FROM public.hidden_default_items
WHERE user_id = 'USER_UUID_HERE';

-- Restore specific item for a user
DELETE FROM public.hidden_default_items
WHERE user_id = 'USER_UUID_HERE' AND item_id = 'ITEM_UUID_HERE';
```

**Option 2: Implement Settings UI** (recommended for future)

Add a "Restore default items" button in settings that calls:

```typescript
await itemService.unhideAllDefaultItems(userId);
```

---

## Current Default Items (24 items)

The following default items are currently configured:

| #   | Name                | Category    | Brand           | Colors      | Styles              |
| --- | ------------------- | ----------- | --------------- | ----------- | ------------------- |
| 1   | Casual Shirt        | tops        | Uniqlo          | Grey        | casual, minimalist  |
| 2   | iPhone              | accessories | Apple           | Silver      | minimalist          |
| 3   | Sneakers            | shoes       | Nike            | Grey        | sporty, casual      |
| 4   | Black Leather Bag   | bags        | Guess           | Black       | elegant, casual     |
| 5   | Wool Coat           | outerwear   | Zara            | Grey        | elegant, classic    |
| 6   | Baseball Cap        | accessories | Adidas          | Black       | sporty, streetwear  |
| 7   | Shorts              | bottoms     | H&M             | Blue        | casual, sporty      |
| 8   | Blazer              | outerwear   | Hugo Boss       | Navy        | elegant, classic    |
| 9   | Varsity Jacket      | outerwear   | Puma            | Black/White | streetwear          |
| 10  | Sneakers            | shoes       | Vans            | White       | casual, streetwear  |
| 11  | Combat Boots        | shoes       | Dr. Martens     | Black       | streetwear, grunge  |
| 12  | Longsleeved T-Shirt | tops        | COS             | Black       | casual, minimalist  |
| 13  | Maxi Skirt          | bottoms     | Mango           | Brown       | casual, bohemian    |
| 14  | Floral Dress        | dresses     | Zara            | Red         | romantic, casual    |
| 15  | Wool Sweater        | tops        | Massimo Dutti   | Beige       | casual, classic     |
| 16  | Jeans               | bottoms     | Levi's          | Black       | casual, classic     |
| 17  | Messenger Bag       | bags        | Coach           | Brown       | classic, casual     |
| 18  | Classic Watch       | accessories | Casio           | Silver      | minimalist, classic |
| 19  | Summer Dress        | dresses     | & Other Stories | White       | romantic, bohemian  |
| 20  | Denim Shirt         | tops        | Tommy Hilfiger  | Blue        | casual, classic     |
| 21  | Wool Trousers       | bottoms     | COS             | Navy        | elegant, minimalist |
| 22  | Scarf               | accessories | Acne Studios    | Beige       | minimalist, classic |
| 23  | Chelsea Boots       | shoes       | Clarks          | Brown       | elegant, classic    |
| 24  | Hoodie              | tops        | Champion        | Grey        | sporty, streetwear  |

---

## File Locations

### Migrations

```
lib/supabase/migrations/
  001_create_hidden_default_items.sql  -- Hidden items table
  002_insert_default_items.sql         -- Insert 24 default items
```

### Code Files

```
services/wardrobe/itemService.ts       -- Database operations
store/wardrobe/wardrobeStore.ts        -- State management
app/(tabs)/wardrobe.tsx                -- UI handling
types/models/item.ts                   -- Type definitions
```

---

## Security Considerations

### User ID for Default Items

Default items require a valid `user_id` due to foreign key constraints. Recommendations:

1. **Create a system user** - Create a dedicated profile for system/admin items
2. **Use admin's ID** - Use an existing admin user's profile ID
3. **Never expose** - Don't include this user_id in client responses

### RLS Policies

The RLS policies ensure:

- Default items (`is_default = true`) are visible to ALL authenticated users
- Only the owner (based on `user_id`) can modify/delete items
- Hidden items table is strictly per-user

### Image Security

- Use Supabase Storage with appropriate RLS
- Public buckets recommended for default items
- Consider CDN caching for better performance

---

## Troubleshooting

### Foreign Key Constraint Error (23503)

**Error:** `insert or update on table 'items' violates foreign key constraint 'items_user_id_fkey'`

**Cause:** The `user_id` doesn't exist in `profiles` table.

**Solution:** Use a valid UUID from your `profiles` table:

```sql
-- Find valid user IDs
SELECT id, email FROM public.profiles LIMIT 10;
```

### Duplicate Items After Re-running Script

**Problem:** Running the insert script multiple times creates duplicates.

**Solution:** Either:

1. Add `ON CONFLICT DO NOTHING` clause
2. Clear existing default items first:

```sql
DELETE FROM public.items WHERE is_default = true;
-- Then run insert script
```

### Items Not Appearing for Users

**Check:**

1. `is_default = true` is set
2. Item not in user's `hidden_default_items`
3. RLS policies are correctly configured

```sql
-- Verify item is default
SELECT id, title, is_default FROM public.items WHERE is_default = true;

-- Check hidden items
SELECT * FROM public.hidden_default_items WHERE user_id = 'USER_ID';
```

---

## Future Enhancements

### Planned Features

1. **Restore Hidden Items UI** - Settings screen option to restore all hidden default items
2. **Admin Panel** - Web interface to manage default items without SQL
3. **Categories/Collections** - Group default items into themed collections
4. **Seasonal Updates** - Automatic rotation of default items by season
5. **Localization** - Different default items per region/language

### Implementation Notes

For restore UI, add to settings:

```typescript
const handleRestoreDefaults = async () => {
  await itemService.unhideAllDefaultItems(user.id);
  // Reload items
  const items = await itemService.getUserItems(user.id);
  setItems(items);
};
```

---

## Quick Reference

### Adding a Default Item

1. Upload image to Supabase Storage
2. Copy public URL
3. Create SQL INSERT with `is_default = true`
4. Run in Supabase SQL Editor

### Hiding (User Action)

- Select item(s) in wardrobe
- Press delete
- Default items get hidden, not deleted

### Restoring Hidden Items

```sql
DELETE FROM public.hidden_default_items
WHERE user_id = 'USER_UUID';
```

### Checking Default Items Count

```sql
SELECT COUNT(*) FROM public.items WHERE is_default = true;
```

---

## Related Documentation

- [RUN_MIGRATION_INSTRUCTIONS.md](RUN_MIGRATION_INSTRUCTIONS.md) - How to run SQL migrations
- [QUICKSTART.md](QUICKSTART.md) - Project setup
- [DEVELOPER_CHECKLIST.md](DEVELOPER_CHECKLIST.md) - Development workflow

---

**Questions?** Check the troubleshooting section or review the migration files in `lib/supabase/migrations/`.
