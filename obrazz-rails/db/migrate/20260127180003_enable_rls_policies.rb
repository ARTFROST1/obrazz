# frozen_string_literal: true

# Migration to enable Row Level Security (RLS) policies for Supabase
# This ensures data isolation - users can only access their own data
class EnableRlsPolicies < ActiveRecord::Migration[8.0]
  def up
    # Enable RLS on all user-data tables
    execute <<-SQL
      -- Enable RLS on items table
      ALTER TABLE items ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on outfits table#{'  '}
      ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on user_profiles table
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    SQL

    # Create RLS policies for items
    execute <<-SQL
      -- Items: Users can view their own items and builtin items
      CREATE POLICY "Users can view own items" ON items
        FOR SELECT
        USING (
          user_id IS NULL  -- Builtin items (no owner)
          OR user_id = auth.uid()  -- User's own items
        );

      -- Items: Users can create items for themselves
      CREATE POLICY "Users can create own items" ON items
        FOR INSERT
        WITH CHECK (
          user_id = auth.uid()
        );

      -- Items: Users can update their own items
      CREATE POLICY "Users can update own items" ON items
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

      -- Items: Users can delete their own items
      CREATE POLICY "Users can delete own items" ON items
        FOR DELETE
        USING (user_id = auth.uid());
    SQL

    # Create RLS policies for outfits
    execute <<-SQL
      -- Outfits: Users can view their own outfits and public outfits
      CREATE POLICY "Users can view own and public outfits" ON outfits
        FOR SELECT
        USING (
          user_id = auth.uid()
          OR visibility = 'public'
        );

      -- Outfits: Users can create outfits for themselves
      CREATE POLICY "Users can create own outfits" ON outfits
        FOR INSERT
        WITH CHECK (user_id = auth.uid());

      -- Outfits: Users can update their own outfits
      CREATE POLICY "Users can update own outfits" ON outfits
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

      -- Outfits: Users can delete their own outfits
      CREATE POLICY "Users can delete own outfits" ON outfits
        FOR DELETE
        USING (user_id = auth.uid());
    SQL

    # Create RLS policies for user_profiles
    execute <<-SQL
      -- Profiles: Users can view their own profile
      CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT
        USING (user_id = auth.uid());

      -- Profiles: Users can create their own profile
      CREATE POLICY "Users can create own profile" ON user_profiles
        FOR INSERT
        WITH CHECK (user_id = auth.uid());

      -- Profiles: Users can update their own profile
      CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    SQL
  end

  def down
    # Drop all policies
    execute <<-SQL
      DROP POLICY IF EXISTS "Users can view own items" ON items;
      DROP POLICY IF EXISTS "Users can create own items" ON items;
      DROP POLICY IF EXISTS "Users can update own items" ON items;
      DROP POLICY IF EXISTS "Users can delete own items" ON items;

      DROP POLICY IF EXISTS "Users can view own and public outfits" ON outfits;
      DROP POLICY IF EXISTS "Users can create own outfits" ON outfits;
      DROP POLICY IF EXISTS "Users can update own outfits" ON outfits;
      DROP POLICY IF EXISTS "Users can delete own outfits" ON outfits;

      DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    SQL

    # Disable RLS
    execute <<-SQL
      ALTER TABLE items DISABLE ROW LEVEL SECURITY;
      ALTER TABLE outfits DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
    SQL
  end
end
