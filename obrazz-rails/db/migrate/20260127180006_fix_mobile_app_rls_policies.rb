# frozen_string_literal: true

# Fix RLS policies to use auth.uid() directly for items/outfits
# Mobile app stores auth.uid() directly in user_id columns
class FixMobileAppRlsPolicies < ActiveRecord::Migration[8.0]
  def up
    # Drop and recreate items policies to use auth.uid() directly
    execute <<-SQL
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view own items" ON items;
      DROP POLICY IF EXISTS "Users can create own items" ON items;
      DROP POLICY IF EXISTS "Users can update own items" ON items;
      DROP POLICY IF EXISTS "Users can delete own items" ON items;

      -- Recreate with direct auth.uid() comparison
      -- Note: Mobile app stores auth.uid() directly in user_id
      CREATE POLICY "Users can view own items" ON items
        FOR SELECT
        USING (
          user_id IS NULL  -- Builtin items (no owner)
          OR user_id::text = auth.uid()::text
        );

      CREATE POLICY "Users can create own items" ON items
        FOR INSERT
        WITH CHECK (user_id::text = auth.uid()::text);

      CREATE POLICY "Users can update own items" ON items
        FOR UPDATE
        USING (user_id::text = auth.uid()::text)
        WITH CHECK (user_id::text = auth.uid()::text);

      CREATE POLICY "Users can delete own items" ON items
        FOR DELETE
        USING (user_id::text = auth.uid()::text);
    SQL

    # Drop and recreate outfits policies
    execute <<-SQL
      DROP POLICY IF EXISTS "Users can view own and public outfits" ON outfits;
      DROP POLICY IF EXISTS "Users can create own outfits" ON outfits;
      DROP POLICY IF EXISTS "Users can update own outfits" ON outfits;
      DROP POLICY IF EXISTS "Users can delete own outfits" ON outfits;

      CREATE POLICY "Users can view own and public outfits" ON outfits
        FOR SELECT
        USING (
          user_id::text = auth.uid()::text
          OR visibility = 'public'
        );

      CREATE POLICY "Users can create own outfits" ON outfits
        FOR INSERT
        WITH CHECK (user_id::text = auth.uid()::text);

      CREATE POLICY "Users can update own outfits" ON outfits
        FOR UPDATE
        USING (user_id::text = auth.uid()::text)
        WITH CHECK (user_id::text = auth.uid()::text);

      CREATE POLICY "Users can delete own outfits" ON outfits
        FOR DELETE
        USING (user_id::text = auth.uid()::text);
    SQL

    # Drop and recreate user_profiles policies
    execute <<-SQL
      DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

      -- For user_profiles, user_id references public.users.id, which has supabase_id
      -- We need to join through users table
      CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT
        USING (
          user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
          OR user_id::text = auth.uid()::text  -- Fallback for direct storage
        );

      CREATE POLICY "Users can create own profile" ON user_profiles
        FOR INSERT
        WITH CHECK (
          user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
          OR user_id::text = auth.uid()::text
        );

      CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE
        USING (
          user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
          OR user_id::text = auth.uid()::text
        )
        WITH CHECK (
          user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
          OR user_id::text = auth.uid()::text
        );
    SQL
  end

  def down
    # Revert to original policies
    execute <<-SQL
      DROP POLICY IF EXISTS "Users can view own items" ON items;
      DROP POLICY IF EXISTS "Users can create own items" ON items;
      DROP POLICY IF EXISTS "Users can update own items" ON items;
      DROP POLICY IF EXISTS "Users can delete own items" ON items;

      CREATE POLICY "Users can view own items" ON items
        FOR SELECT
        USING (user_id IS NULL OR user_id = auth.uid());

      CREATE POLICY "Users can create own items" ON items
        FOR INSERT
        WITH CHECK (user_id = auth.uid());

      CREATE POLICY "Users can update own items" ON items
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

      CREATE POLICY "Users can delete own items" ON items
        FOR DELETE
        USING (user_id = auth.uid());
    SQL
  end
end
