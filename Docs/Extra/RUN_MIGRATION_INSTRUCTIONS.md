# 🚀 Run Database Migration for Outfits Table

## Error You're Seeing

```
Could not find the 'background' column of 'outfits' in the schema cache
```

This means the `outfits` table doesn't exist or is missing columns.

## Quick Fix (5 minutes)

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste Migration**
   - Open file: `lib/supabase/migrations/004_create_outfits_table.sql`
   - Copy ALL the SQL code
   - Paste into the SQL Editor

4. **Run Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message: "Success. No rows returned"

5. **Verify Table Created**
   - Go to "Table Editor" in sidebar
   - You should see `outfits` table listed
   - Click on it to see columns

### Method 2: Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# From project root
cd lib/supabase/migrations

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

## What This Migration Creates

### Table: `outfits`

- ✅ All required columns (title, description, items, background, etc.)
- ✅ Proper JSONB types for complex data
- ✅ Indexes for fast queries
- ✅ Row Level Security (RLS) enabled
- ✅ Automatic `updated_at` trigger

### Columns Created:

- `id` - UUID primary key
- `user_id` - References auth.users
- `title` - Outfit name
- `description` - Optional description
- `items` - JSONB array of outfit items with positions
- `background` - JSONB background settings
- `canvas_settings` - JSONB canvas configuration
- `visibility` - private/shared/public
- `is_ai_generated` - Boolean flag
- `ai_metadata` - JSONB AI generation details
- `tags`, `styles`, `seasons`, `occasions` - Arrays
- `created_at`, `updated_at`, `last_worn_at` - Timestamps
- `wear_count`, `is_favorite` - Usage stats
- `likes_count`, `views_count`, `shares_count` - Social metrics

## After Running Migration

1. **Test Save Outfit**
   - Go back to the app
   - Create an outfit
   - Try to save it
   - Should work now! ✅

2. **If Still Errors**
   - Try restarting Metro bundler: `npm start`
   - Check Supabase logs in dashboard
   - Verify table exists in Table Editor

## Troubleshooting

### "permission denied for table outfits"

The RLS policies should fix this. If not, check:

- User is logged in (`auth.uid()` is set)
- Policies were created correctly

### "relation public.outfits does not exist"

- Migration didn't run successfully
- Check SQL Editor for errors
- Try running migration again

### "column does not exist"

- Some columns might be missing
- Drop table and run migration again:
  ```sql
  DROP TABLE IF EXISTS public.outfits CASCADE;
  ```
  Then run the full migration.

## Need Help?

Check the Bug_tracking.md file for similar issues or add a new entry.

---

**Next Steps After Migration:**

1. ✅ Run the migration
2. ✅ Restart Metro bundler
3. ✅ Test saving an outfit
4. ✅ Check that outfit appears in saved outfits

**Status:** Ready to run ✅
