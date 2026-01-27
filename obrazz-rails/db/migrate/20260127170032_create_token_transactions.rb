class CreateTokenTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :token_transactions, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :token_balance_id, null: false

      # Тип операции
      t.string :operation, null: false # credit, debit, expire, refund

      # Количество (положительное для credit, отрицательное для debit)
      t.integer :amount, null: false
      
      # Баланс до и после операции
      t.integer :balance_before, null: false
      t.integer :balance_after, null: false
      
      # Причина операции
      t.string :reason # ai_generation, subscription_renewal, purchase, bonus, refund, expiration
      
      # Связь с AI генерацией (если debit за генерацию)
      t.uuid :ai_generation_id
      
      # Связь с платежом (если credit за покупку)
      t.uuid :payment_id
      
      # Описание
      t.string :description
      
      # Метаданные
      t.jsonb :metadata, default: {}

      t.timestamps

      t.index :user_id
      t.index :token_balance_id
      t.index :operation
      t.index :ai_generation_id
      t.index :payment_id
      t.index :created_at
    end

    add_foreign_key :token_transactions, :users
    add_foreign_key :token_transactions, :token_balances
  end
end
