# frozen_string_literal: true

# Migration to create outfits table for mobile app outfit creation functionality
# This table stores user-created outfits (combinations of wardrobe items)
class CreateOutfits < ActiveRecord::Migration[8.0]
  def change
    # Skip if table already exists (for Supabase compatibility)
    return if table_exists?(:outfits)

    create_table :outfits, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      # Ownership
      t.uuid :user_id, null: false

      # Basic info
      t.string :title
      t.text :description

      # Outfit composition - array of item references with transforms
      # Each item: { itemId, category, slot, transform: {x, y, scale, rotation, zIndex}, isVisible }
      t.jsonb :items, default: []

      # Background settings
      # { type: 'color'|'gradient'|'image'|'pattern', value: string, opacity?: number }
      t.jsonb :background, default: { type: 'color', value: '#FFFFFF' }

      # Visibility
      t.string :visibility, default: 'private' # private, shared, public

      # AI generation metadata
      t.boolean :is_ai_generated, default: false
      t.jsonb :ai_metadata # { generationId, model, prompt, style, confidence, etc. }

      # Categorization
      t.jsonb :tags, default: []
      t.jsonb :styles, default: [] # Style tags array
      t.jsonb :seasons, default: [] # Season array
      t.jsonb :occasions, default: [] # Occasion tags array

      # Usage & engagement stats
      t.datetime :last_worn_at
      t.integer :wear_count, default: 0
      t.boolean :is_favorite, default: false
      t.integer :likes_count, default: 0
      t.integer :views_count, default: 0
      t.integer :shares_count, default: 0

      # Canvas settings for edit mode restoration
      # { width, height, aspectRatio, showGrid, snapToGrid, gridSize, customTabCategories }
      t.jsonb :canvas_settings

      t.timestamps
    end

    # Indexes for common queries
    add_index :outfits, :user_id
    add_index :outfits, :visibility
    add_index :outfits, :is_ai_generated
    add_index :outfits, :is_favorite
    add_index :outfits, :created_at
    add_index :outfits, :last_worn_at

    # Foreign key
    add_foreign_key :outfits, :users, on_delete: :cascade
  end
end
