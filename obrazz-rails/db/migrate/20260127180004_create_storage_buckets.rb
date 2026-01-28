# frozen_string_literal: true

# Migration to set up Supabase Storage buckets for images
# Creates buckets for wardrobe item images and outfit thumbnails
class CreateStorageBuckets < ActiveRecord::Migration[8.0]
  def up
    # Create storage buckets via Supabase storage schema
    execute <<-SQL
      -- Create wardrobe-images bucket for item photos
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'wardrobe-images',
        'wardrobe-images',
        false,  -- Private bucket (RLS-protected)
        5242880,  -- 5MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
      )
      ON CONFLICT (id) DO NOTHING;

      -- Create outfit-thumbnails bucket for outfit preview images
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'outfit-thumbnails',
        'outfit-thumbnails',
        false,  -- Private bucket
        2097152,  -- 2MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
      )
      ON CONFLICT (id) DO NOTHING;

      -- Create ai-generations bucket for AI-generated images
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'ai-generations',
        'ai-generations',
        false,  -- Private bucket
        10485760,  -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
      )
      ON CONFLICT (id) DO NOTHING;

      -- Create user-avatars bucket for profile pictures
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'user-avatars',
        'user-avatars',
        true,  -- Public bucket (avatars are public)
        1048576,  -- 1MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
      )
      ON CONFLICT (id) DO NOTHING;
    SQL

    # Create storage policies for wardrobe-images bucket
    execute <<-SQL
      -- Users can view their own wardrobe images
      CREATE POLICY "Users can view own wardrobe images" ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'wardrobe-images'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can upload to their own folder
      CREATE POLICY "Users can upload own wardrobe images" ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'wardrobe-images'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can update their own images
      CREATE POLICY "Users can update own wardrobe images" ON storage.objects
        FOR UPDATE
        USING (
          bucket_id = 'wardrobe-images'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can delete their own images
      CREATE POLICY "Users can delete own wardrobe images" ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'wardrobe-images'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    SQL

    # Create storage policies for outfit-thumbnails bucket
    execute <<-SQL
      -- Users can view their own outfit thumbnails
      CREATE POLICY "Users can view own outfit thumbnails" ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'outfit-thumbnails'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can upload outfit thumbnails
      CREATE POLICY "Users can upload own outfit thumbnails" ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'outfit-thumbnails'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can delete their outfit thumbnails
      CREATE POLICY "Users can delete own outfit thumbnails" ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'outfit-thumbnails'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    SQL

    # Create storage policies for ai-generations bucket
    execute <<-SQL
      -- Users can view their own AI generations
      CREATE POLICY "Users can view own ai generations" ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'ai-generations'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can delete their AI generations
      CREATE POLICY "Users can delete own ai generations" ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'ai-generations'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    SQL

    # Create storage policies for user-avatars bucket (public)
    execute <<-SQL
      -- Anyone can view avatars (public bucket)
      CREATE POLICY "Public avatar access" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'user-avatars');

      -- Users can upload their own avatar
      CREATE POLICY "Users can upload own avatar" ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'user-avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can update their own avatar
      CREATE POLICY "Users can update own avatar" ON storage.objects
        FOR UPDATE
        USING (
          bucket_id = 'user-avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can delete their own avatar
      CREATE POLICY "Users can delete own avatar" ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'user-avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    SQL
  end

  def down
    # Drop storage policies
    execute <<-SQL
      -- Wardrobe images policies
      DROP POLICY IF EXISTS "Users can view own wardrobe images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can upload own wardrobe images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update own wardrobe images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete own wardrobe images" ON storage.objects;

      -- Outfit thumbnails policies
      DROP POLICY IF EXISTS "Users can view own outfit thumbnails" ON storage.objects;
      DROP POLICY IF EXISTS "Users can upload own outfit thumbnails" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete own outfit thumbnails" ON storage.objects;

      -- AI generations policies
      DROP POLICY IF EXISTS "Users can view own ai generations" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete own ai generations" ON storage.objects;

      -- Avatar policies
      DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
      DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
    SQL

    # Delete buckets
    execute <<-SQL
      DELETE FROM storage.buckets WHERE id IN (
        'wardrobe-images',
        'outfit-thumbnails',#{' '}
        'ai-generations',
        'user-avatars'
      );
    SQL
  end
end
