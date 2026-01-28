class CreateAdmins < ActiveRecord::Migration[8.0]
  def change
    create_table :admins, id: :uuid do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name
      t.boolean :active, default: true, null: false
      t.datetime :last_login_at

      t.timestamps
    end

    add_index :admins, :email, unique: true

    # Create default admin (password should be changed immediately)
    reversible do |dir|
      dir.up do
        require 'bcrypt'
        password_hash = BCrypt::Password.create('changeme123')
        execute <<-SQL
          INSERT INTO admins (id, email, password_digest, name, active, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            'admin@obrazz.app',
            '#{password_hash}',
            'Super Admin',
            true,
            NOW(),
            NOW()
          )
        SQL
      end
    end
  end
end
