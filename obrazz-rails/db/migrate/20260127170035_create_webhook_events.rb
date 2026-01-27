class CreateWebhookEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :webhook_events, id: :uuid do |t|
      # Источник вебхука
      t.string :source, null: false # yookassa, apple_iap, google_play, the_new_black

      # Идентификаторы
      t.string :external_id, null: false # ID события от провайдера
      t.string :event_type, null: false # payment.succeeded, subscription.renewed и т.д.

      # Статус обработки
      t.string :status, null: false, default: 'pending' # pending, processing, processed, failed

      # Данные
      t.jsonb :payload, null: false, default: {} # Полные данные вебхука
      t.jsonb :headers, default: {} # HTTP заголовки
      
      # Обработка
      t.integer :attempts, default: 0 # Количество попыток обработки
      t.datetime :processed_at
      t.datetime :last_attempted_at
      
      # Ошибки
      t.string :error_code
      t.text :error_message
      
      # Связи (заполняются после обработки)
      t.uuid :user_id
      t.uuid :payment_id
      t.uuid :subscription_id
      t.uuid :ai_generation_id

      t.timestamps

      t.index [:source, :external_id], unique: true
      t.index :status
      t.index :event_type
      t.index :user_id
      t.index :created_at
    end
  end
end
