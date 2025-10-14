# Fix for Items Category Check Constraint Error

## Problem

When trying to add wardrobe items, you're getting this error:

```
ERROR  Error creating item: {"code": "23514", "details": null, "hint": null, "message": "new row for relation \"items\" violates check constraint"}
```

This happens because the database schema doesn't match the app's TypeScript category types.

## Solution: Apply Database Migration

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Open the file `lib/supabase/migrations/fix_items_category_constraint.sql`
2. Copy all the SQL code from that file
3. Paste it into the SQL Editor in Supabase
4. Click **Run** button

The migration will:

- Remove the old check constraint with wrong category values
- Add a new constraint with correct categories matching your TypeScript types

### Step 3: Verify the Fix

Run this query in SQL Editor to confirm:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.items'::regclass
AND conname = 'items_category_check';
```

You should see the new constraint with these categories:

- `headwear` (was `hats`)
- `outerwear`
- `tops`
- `bottoms`
- `footwear` (was `shoes`)
- `accessories`
- `dresses`
- `suits` (new)
- `bags`

### Step 4: Test the App

1. Restart your app: `npx expo start --clear`
2. Try adding a wardrobe item with any category
3. It should now save successfully!

## What Changed?

**Before (Database):**

```sql
category IN ('tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
             'accessories', 'bags', 'jewelry', 'hats', 'other')
```

**After (Database):**

```sql
category IN ('headwear', 'outerwear', 'tops', 'bottoms', 'footwear',
             'accessories', 'dresses', 'suits', 'bags')
```

**TypeScript Type (unchanged):**

```typescript
type ItemCategory =
  | 'headwear'
  | 'outerwear'
  | 'tops'
  | 'bottoms'
  | 'footwear'
  | 'accessories'
  | 'dresses'
  | 'suits'
  | 'bags';
```

Now they match! ✅

## If You Have Existing Data

If you already have items in your database with old categories (`shoes`, `hats`, `jewelry`, `other`), you need to migrate them first:

```sql
-- Run this BEFORE the constraint migration
UPDATE public.items SET category = 'footwear' WHERE category = 'shoes';
UPDATE public.items SET category = 'headwear' WHERE category = 'hats';
UPDATE public.items SET category = 'accessories' WHERE category = 'jewelry';
UPDATE public.items SET category = 'accessories' WHERE category = 'other';
```

## Documentation

See `Docs/Bug_tracking.md` → BUG-S4-006 for full technical details.
