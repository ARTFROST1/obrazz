# frozen_string_literal: true

# Migration to enable RLS on backend tables and create user sync trigger
# This ensures backend tables are also protected and users auto-sync from auth.users
class EnableBackendRlsAndUserSync < ActiveRecord::Migration[8.0]
  def up
    # Enable RLS on backend tables
    execute <<-SQL
      -- Enable RLS on users table
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on subscriptions
      ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on token_balances
      ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on token_transactions
      ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on ai_generations
      ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on payments
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    SQL

    # Users table policies - users can only see themselves
    execute <<-SQL
      CREATE POLICY "Users can view own user record" ON users
        FOR SELECT
        USING (supabase_id = auth.uid());

      CREATE POLICY "Users can update own user record" ON users
        FOR UPDATE
        USING (supabase_id = auth.uid())
        WITH CHECK (supabase_id = auth.uid());
    SQL

    # Subscriptions policies
    execute <<-SQL
      CREATE POLICY "Users can view own subscription" ON subscriptions
        FOR SELECT
        USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
    SQL

    # Token balances policies
    execute <<-SQL
      CREATE POLICY "Users can view own token balance" ON token_balances
        FOR SELECT
        USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
    SQL

    # Token transactions policies
    execute <<-SQL
      CREATE POLICY "Users can view own token transactions" ON token_transactions
        FOR SELECT
        USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
    SQL

    # AI generations policies
    execute <<-SQL
      CREATE POLICY "Users can view own ai generations" ON ai_generations
        FOR SELECT
        USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

      CREATE POLICY "Users can create own ai generations" ON ai_generations
        FOR INSERT
        WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
    SQL

    # Payments policies
    execute <<-SQL
      CREATE POLICY "Users can view own payments" ON payments
        FOR SELECT
        USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
    SQL

    # Create function to sync user from auth.users to public.users
    execute <<-SQL
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (supabase_id, email, username, full_name, avatar_url, status, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          NEW.raw_user_meta_data->>'username',
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.raw_user_meta_data->>'avatar_url',
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (supabase_id) DO UPDATE SET
          email = EXCLUDED.email,
          username = COALESCE(EXCLUDED.username, users.username),
          full_name = COALESCE(EXCLUDED.full_name, users.full_name),
          avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
          updated_at = NOW();
      #{'  '}
        -- Also create user profile
        INSERT INTO public.user_profiles (user_id, created_at, updated_at)
        SELECT id, NOW(), NOW()
        FROM public.users
        WHERE supabase_id = NEW.id
        ON CONFLICT (user_id) DO NOTHING;
      #{'  '}
        -- Create default free subscription
        INSERT INTO public.subscriptions (user_id, plan, status, current_period_start, created_at, updated_at)
        SELECT id, 'free', 'active', NOW(), NOW(), NOW()
        FROM public.users
        WHERE supabase_id = NEW.id
        ON CONFLICT DO NOTHING;
      #{'  '}
        -- Create default token balance
        INSERT INTO public.token_balances (user_id, token_type, balance, source, created_at, updated_at)
        SELECT id, 'ai_credits', 5, 'free_tier', NOW(), NOW()
        FROM public.users
        WHERE supabase_id = NEW.id
        ON CONFLICT (user_id, token_type) DO NOTHING;
      #{'  '}
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    SQL

    # Create trigger on auth.users
    execute <<-SQL
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    SQL

    # Create function to update user on profile changes
    execute <<-SQL
      CREATE OR REPLACE FUNCTION public.handle_user_updated()
      RETURNS trigger AS $$
      BEGIN
        UPDATE public.users SET
          email = NEW.email,
          username = COALESCE(NEW.raw_user_meta_data->>'username', users.username),
          full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', users.full_name),
          avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', users.avatar_url),
          updated_at = NOW()
        WHERE supabase_id = NEW.id;
      #{'  '}
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    SQL

    # Create trigger for user updates
    execute <<-SQL
      DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
      CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();
    SQL
  end

  def down
    # Drop triggers
    execute <<-SQL
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();
      DROP FUNCTION IF EXISTS public.handle_user_updated();
    SQL

    # Drop policies
    execute <<-SQL
      DROP POLICY IF EXISTS "Users can view own user record" ON users;
      DROP POLICY IF EXISTS "Users can update own user record" ON users;
      DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
      DROP POLICY IF EXISTS "Users can view own token balance" ON token_balances;
      DROP POLICY IF EXISTS "Users can view own token transactions" ON token_transactions;
      DROP POLICY IF EXISTS "Users can view own ai generations" ON ai_generations;
      DROP POLICY IF EXISTS "Users can create own ai generations" ON ai_generations;
      DROP POLICY IF EXISTS "Users can view own payments" ON payments;
    SQL

    # Disable RLS
    execute <<-SQL
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE token_balances DISABLE ROW LEVEL SECURITY;
      ALTER TABLE token_transactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE ai_generations DISABLE ROW LEVEL SECURITY;
      ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
    SQL
  end
end
