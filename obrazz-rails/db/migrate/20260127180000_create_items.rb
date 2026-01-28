# frozen_string_literal: true

# Migration to create items table for mobile app wardrobe functionality
# This table stores wardrobe items (clothing pieces) that users add to their digital wardrobe
class CreateItems < ActiveRecord::Migration[8.0]
  def change
    # Skip if table already exists (for Supabase compatibility)
    return if table_exists?(:items)

    create_table :items, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      # Ownership - nullable for system default/builtin items
      t.uuid :user_id, null: true

      # Basic info
      t.string :name # User-defined title
      t.string :category, null: false # headwear, outerwear, tops, bottoms, footwear, accessories, fullbody, other
      t.string :subcategory

      # Colors - stored as JSONB arrays
      t.jsonb :colors, default: [] # Array of {hex, name} objects
      t.jsonb :primary_color # Single {hex, name} object

      # Attributes
      t.string :material
      t.jsonb :style, default: [] # Array of style tags
      t.jsonb :season, default: [] # Array of seasons

      # Image - URL for cloud storage
      t.string :image_url

      # Optional details
      t.boolean :is_default, default: false # System/builtin items
      t.string :brand
      t.string :size
      t.decimal :price, precision: 10, scale: 2
      t.jsonb :tags, default: [] # User tags

      # Usage stats
      t.boolean :favorite, default: false
      t.integer :wear_count, default: 0
      t.datetime :last_worn_at

      # Extended metadata (source info, AI tags, etc.)
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    # Indexes for common queries
    add_index :items, :user_id
    add_index :items, :category
    add_index :items, :favorite
    add_index :items, :is_default
    add_index :items, :created_at

    # Foreign key to users (optional - some items may be builtin without user)
    add_foreign_key :items, :users, column: :user_id, on_delete: :cascade, validate: false
  end
end
