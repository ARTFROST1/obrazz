# frozen_string_literal: true

# Migration to add missing columns for mobile app compatibility
# This fixes column mismatches between Rails schema and mobile app expectations
class AddMissingColumnsForMobileApp < ActiveRecord::Migration[8.0]
  def change
    # Add missing columns to items table
    change_table :items, bulk: true do |t|
      # Legacy color field (mobile app uses both 'color' and 'colors')
      t.string :color unless column_exists?(:items, :color)

      # Thumbnail URL for item preview
      t.string :thumbnail_url unless column_exists?(:items, :thumbnail_url)

      # Image hash for deduplication/change detection
      t.string :image_hash unless column_exists?(:items, :image_hash)
    end

    # Add indexes
    add_index :items, :image_hash, if_not_exists: true
  end
end
