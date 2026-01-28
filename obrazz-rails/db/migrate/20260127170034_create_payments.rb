class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :subscription_id # Связь с подпиской (если это оплата подписки)

      # Провайдер платежа
      t.string :provider, null: false # yookassa, apple_iap, google_play

      # Внешние идентификаторы
      t.string :external_id, null: false # ID платежа в платежной системе
      t.string :external_status # Статус во внешней системе

      # Статус платежа
      t.string :status, null: false, default: 'pending'
      # pending, processing, succeeded, failed, cancelled, refunded

      # Тип платежа
      t.string :payment_type, null: false # subscription, token_pack, one_time

      # Суммы
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :currency, null: false, default: 'RUB'

      # Для покупки токенов
      t.integer :tokens_amount # Количество токенов при покупке пакета
      t.string :token_pack_id # ID пакета токенов

      # Для подписки
      t.string :subscription_plan # free, pro_monthly, pro_yearly

      # Даты
      t.datetime :paid_at
      t.datetime :refunded_at

      # Метод оплаты
      t.string :payment_method # bank_card, apple_pay, google_pay, yoomoney, sbp

      # Ошибки
      t.string :error_code
      t.text :error_message

      # Метаданные
      t.jsonb :metadata, default: {}

      t.timestamps

      t.index :user_id
      t.index :subscription_id
      t.index :provider
      t.index :external_id, unique: true
      t.index :status
      t.index :payment_type
      t.index :created_at
    end

    add_foreign_key :payments, :users
    add_foreign_key :payments, :subscriptions
  end
end
