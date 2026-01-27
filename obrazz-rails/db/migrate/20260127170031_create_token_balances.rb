class CreateTokenBalances < ActiveRecord::Migration[8.0]
  def change
    create_table :token_balances, id: :uuid do |t|
      t.uuid :user_id, null: false

      # Типы токенов
      t.string :token_type, null: false # subscription_tokens, purchased_tokens, bonus_tokens

      # Баланс
      t.integer :balance, null: false, default: 0
      
      # Срок действия (для subscription_tokens)
      t.datetime :expires_at
      
      # Источник начисления
      t.string :source # subscription, purchase, referral, bonus, promo

      t.timestamps

      t.index [:user_id, :token_type], unique: true
      t.index :expires_at
      t.index :token_type
    end

    add_foreign_key :token_balances, :users
  end
end
