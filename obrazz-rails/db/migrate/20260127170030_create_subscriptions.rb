class CreateSubscriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :subscriptions, id: :uuid do |t|
      t.uuid :user_id, null: false

      # План подписки: free, pro_monthly, pro_yearly
      t.string :plan, null: false, default: 'free'
      t.string :status, null: false, default: 'active' # active, cancelled, expired, past_due

      # Период подписки
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :cancelled_at

      # Информация о платеже
      t.string :payment_provider # yookassa, apple_iap, google_play
      t.string :external_id # ID подписки во внешней системе
      
      # Автопродление
      t.boolean :auto_renew, default: true
      
      # Метаданные
      t.jsonb :metadata, default: {}

      t.timestamps

      t.index :user_id
      t.index :status
      t.index :plan
      t.index :current_period_end
      t.index :external_id
    end

    add_foreign_key :subscriptions, :users
  end
end
