# frozen_string_literal: true

# Migration to create user_profiles table for extended user data
# This stores additional profile info, preferences, and stats for mobile app users
class CreateUserProfiles < ActiveRecord::Migration[8.0]
  def change
    # Skip if table already exists (for Supabase compatibility)
    return if table_exists?(:user_profiles)

    create_table :user_profiles, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      # Link to main users table
      t.uuid :user_id, null: false

      # Profile info (may duplicate some data from users for convenience)
      t.string :display_name
      t.text :bio
      t.string :location
      t.string :website

      # User preferences
      # { theme, language, notifications: {...}, defaultSeason, favoriteStyles }
      t.jsonb :preferences, default: {
        theme: 'system',
        language: 'ru',
        notifications: {
          pushEnabled: true,
          communityUpdates: true,
          aiSuggestions: true,
          promotions: false
        }
      }

      # User statistics (cached for performance)
      t.integer :items_count, default: 0
      t.integer :outfits_count, default: 0
      t.integer :ai_generations_used, default: 0
      t.integer :likes_received, default: 0
      t.integer :followers_count, default: 0
      t.integer :following_count, default: 0

      # Gamification
      t.integer :streak_days, default: 0
      t.datetime :last_streak_date
      t.integer :total_points, default: 0
      t.jsonb :achievements, default: []
      t.jsonb :badges, default: []

      # Onboarding
      t.boolean :onboarding_completed, default: false
      t.jsonb :onboarding_progress, default: {}

      t.timestamps
    end

    # Indexes
    add_index :user_profiles, :user_id, unique: true
    add_index :user_profiles, :display_name

    # Foreign key
    add_foreign_key :user_profiles, :users, on_delete: :cascade
  end
end
