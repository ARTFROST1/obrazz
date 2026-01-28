# frozen_string_literal: true

# Migration to grant table access to Supabase roles (anon, authenticated)
# This is CRITICAL for RLS to work - tables need GRANT permissions even with RLS enabled
# RLS policies control WHICH rows are visible, but GRANT controls IF the table is accessible at all
class GrantTableAccessToSupabaseRoles < ActiveRecord::Migration[8.0]
  def up
    # Core user-data tables - full CRUD for authenticated, read-only for anon (if viewing public data)
    execute <<-SQL
      -- Items: Full CRUD for authenticated users (their own items via RLS)
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
      GRANT SELECT ON public.items TO anon;  -- For viewing default/template items

      -- Outfits: Full CRUD for authenticated users (their own outfits via RLS)
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.outfits TO authenticated;
      GRANT SELECT ON public.outfits TO anon;  -- For viewing public outfits

      -- User profiles: Full CRUD for authenticated users (their own profile via RLS)
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
      GRANT SELECT ON public.user_profiles TO anon;  -- For viewing public profiles

      -- Users: Read + update own record for authenticated users
      GRANT SELECT, UPDATE ON public.users TO authenticated;
      GRANT SELECT ON public.users TO anon;  -- Basic user info
    SQL

    # Backend/business tables - read-only for authenticated users, no access for anon
    # Writes are done through Rails API (service_role or direct DB)
    execute <<-SQL
      -- Subscriptions: Users can view their own subscription
      GRANT SELECT ON public.subscriptions TO authenticated;

      -- Token balances: Users can view their own token balance
      GRANT SELECT ON public.token_balances TO authenticated;

      -- Token transactions: Users can view their own transaction history
      GRANT SELECT ON public.token_transactions TO authenticated;

      -- AI generations: Users can view their own AI generation history
      GRANT SELECT ON public.ai_generations TO authenticated;

      -- Payments: Users can view their own payment history
      GRANT SELECT ON public.payments TO authenticated;
    SQL
  end

  def down
    # Revoke grants (be careful - this breaks the app!)
    execute <<-SQL
      -- Core tables
      REVOKE ALL ON public.items FROM authenticated, anon;
      REVOKE ALL ON public.outfits FROM authenticated, anon;
      REVOKE ALL ON public.user_profiles FROM authenticated, anon;
      REVOKE ALL ON public.users FROM authenticated, anon;

      -- Backend tables
      REVOKE ALL ON public.subscriptions FROM authenticated;
      REVOKE ALL ON public.token_balances FROM authenticated;
      REVOKE ALL ON public.token_transactions FROM authenticated;
      REVOKE ALL ON public.ai_generations FROM authenticated;
      REVOKE ALL ON public.payments FROM authenticated;
    SQL
  end
end
