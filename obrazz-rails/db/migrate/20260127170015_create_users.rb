class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: :uuid do |t|
      # Supabase Auth ID - основной идентификатор
      t.uuid :supabase_id, null: false
      
      # Основная информация
      t.string :email, null: false
      t.string :username
      t.string :full_name
      t.string :avatar_url
      
      # Статус аккаунта
      t.string :status, default: 'active', null: false
      t.datetime :last_active_at
      
      # Настройки
      t.jsonb :preferences, default: {}
      t.jsonb :metadata, default: {}
      
      t.timestamps
      
      t.index :supabase_id, unique: true
      t.index :email, unique: true
      t.index :username, unique: true, where: "username IS NOT NULL"
      t.index :status
    end
  end
end
