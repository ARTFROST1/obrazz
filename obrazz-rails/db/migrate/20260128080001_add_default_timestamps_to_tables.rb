# frozen_string_literal: true

# Migration to add default timestamps to tables
# The created_at and updated_at columns were defined as NOT NULL but without defaults
# This caused "null value in column violates not-null constraint" errors
class AddDefaultTimestampsToTables < ActiveRecord::Migration[8.0]
  def up
    execute <<-SQL
      -- Items table
      ALTER TABLE items ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE items ALTER COLUMN updated_at SET DEFAULT NOW();

      -- Outfits table
      ALTER TABLE outfits ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE outfits ALTER COLUMN updated_at SET DEFAULT NOW();

      -- Users table
      ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();

      -- User profiles table
      ALTER TABLE user_profiles ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE user_profiles ALTER COLUMN updated_at SET DEFAULT NOW();
    SQL
  end

  def down
    execute <<-SQL
      ALTER TABLE items ALTER COLUMN created_at DROP DEFAULT;
      ALTER TABLE items ALTER COLUMN updated_at DROP DEFAULT;

      ALTER TABLE outfits ALTER COLUMN created_at DROP DEFAULT;
      ALTER TABLE outfits ALTER COLUMN updated_at DROP DEFAULT;

      ALTER TABLE users ALTER COLUMN created_at DROP DEFAULT;
      ALTER TABLE users ALTER COLUMN updated_at DROP DEFAULT;

      ALTER TABLE user_profiles ALTER COLUMN created_at DROP DEFAULT;
      ALTER TABLE user_profiles ALTER COLUMN updated_at DROP DEFAULT;
    SQL
  end
end
