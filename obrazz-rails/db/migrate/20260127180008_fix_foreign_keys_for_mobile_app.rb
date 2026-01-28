# frozen_string_literal: true

# Migration to fix foreign key constraints for mobile app
# Mobile app stores auth.uid() directly in user_id, not users.id
# We need to remove the foreign key constraint but keep the column
class FixForeignKeysForMobileApp < ActiveRecord::Migration[8.0]
  def up
    # Remove foreign key from items to users
    # Mobile app stores auth.uid() directly, not users.id
    if foreign_key_exists?(:items, :users)
      remove_foreign_key :items, :users
    end

    # Remove foreign key from outfits to users
    if foreign_key_exists?(:outfits, :users)
      remove_foreign_key :outfits, :users
    end

    # Note: We keep user_profiles foreign key because it references users.id correctly
    # The trigger handle_new_user creates user_profiles with the correct users.id
  end

  def down
    # Add back foreign keys (without validation to avoid issues)
    add_foreign_key :items, :users, column: :user_id, on_delete: :cascade, validate: false
    add_foreign_key :outfits, :users, column: :user_id, on_delete: :cascade, validate: false
  end
end
