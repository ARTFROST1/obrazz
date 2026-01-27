# frozen_string_literal: true

module Tokens
  class BalanceService
    class InsufficientTokensError < StandardError; end

    def initialize(user)
      @user = user
    end

    # Возвращает общий доступный баланс
    def available_balance
      active_balances.sum(:balance)
    end

    # Возвращает детальную информацию о балансах
    def detailed_balance
      {
        total: available_balance,
        subscription_tokens: subscription_balance,
        purchased_tokens: purchased_balance,
        bonus_tokens: bonus_balance,
        balances: balances_breakdown
      }
    end

    # Списывает токены для AI генерации
    # Порядок списания: subscription -> purchased -> bonus
    def debit_for_generation!(amount:, ai_generation:, reason: 'ai_generation')
      raise InsufficientTokensError, "Insufficient tokens. Need #{amount}, have #{available_balance}" if available_balance < amount

      remaining = amount
      transactions = []

      ActiveRecord::Base.transaction do
        # 1. Сначала списываем с subscription_tokens
        remaining, txns = debit_from_type('subscription_tokens', remaining, ai_generation, reason)
        transactions.concat(txns)

        # 2. Затем с purchased_tokens
        if remaining > 0
          remaining, txns = debit_from_type('purchased_tokens', remaining, ai_generation, reason)
          transactions.concat(txns)
        end

        # 3. Наконец с bonus_tokens
        if remaining > 0
          remaining, txns = debit_from_type('bonus_tokens', remaining, ai_generation, reason)
          transactions.concat(txns)
        end

        raise InsufficientTokensError, "Could not debit all tokens" if remaining > 0
      end

      transactions
    end

    # Начисляет токены от покупки
    def credit_from_purchase!(amount:, payment:, token_pack_id: nil)
      balance = find_or_create_balance('purchased_tokens', source: 'purchase')
      
      balance.credit!(
        amount,
        reason: 'purchase',
        description: "Token purchase: #{token_pack_id || 'manual'}",
        payment_id: payment.id,
        metadata: { token_pack_id: token_pack_id }
      )
    end

    # Начисляет бонусные токены
    def credit_bonus!(amount:, reason:, description: nil, expires_in: nil)
      balance = find_or_create_balance('bonus_tokens', source: 'bonus')
      
      # Обновляем срок действия если указан
      if expires_in
        balance.update!(expires_at: expires_in.from_now)
      end

      balance.credit!(
        amount,
        reason: reason,
        description: description
      )
    end

    # Обновляет токены подписки (вызывается при renewal)
    def refresh_subscription_tokens!(amount:, expires_at:)
      balance = find_or_create_balance('subscription_tokens', source: 'subscription')
      
      old_balance = balance.balance
      
      balance.update!(
        balance: amount,
        expires_at: expires_at
      )

      # Записываем транзакцию
      @user.token_transactions.create!(
        token_balance: balance,
        operation: 'credit',
        amount: amount,
        balance_before: old_balance,
        balance_after: amount,
        reason: 'subscription_renewal',
        description: 'Monthly subscription tokens refresh'
      )
    end

    # Истекает все просроченные токены
    def expire_expired_tokens!
      @user.token_balances.expired.with_balance.find_each(&:expire!)
    end

    private

    def active_balances
      @user.token_balances.active.with_balance
    end

    def subscription_balance
      @user.token_balances.subscription_tokens.active.sum(:balance)
    end

    def purchased_balance
      @user.token_balances.purchased_tokens.active.sum(:balance)
    end

    def bonus_balance
      @user.token_balances.bonus_tokens.active.sum(:balance)
    end

    def balances_breakdown
      @user.token_balances.map do |balance|
        {
          id: balance.id,
          type: balance.token_type,
          balance: balance.balance,
          available: balance.available_balance,
          source: balance.source,
          expires_at: balance.expires_at&.iso8601,
          active: balance.active?
        }
      end
    end

    def debit_from_type(token_type, amount, ai_generation, reason)
      return [amount, []] if amount <= 0

      balance = @user.token_balances.find_by(token_type: token_type)
      return [amount, []] unless balance&.active? && balance.balance > 0

      debit_amount = [amount, balance.balance].min
      
      balance.debit!(
        debit_amount,
        reason: reason,
        description: "AI generation: #{ai_generation.generation_type}",
        ai_generation_id: ai_generation.id,
        metadata: { generation_type: ai_generation.generation_type }
      )

      transaction = balance.token_transactions.last
      [amount - debit_amount, [transaction].compact]
    end

    def find_or_create_balance(token_type, source: nil)
      @user.token_balances.find_or_create_by!(token_type: token_type) do |balance|
        balance.balance = 0
        balance.source = source
      end
    end
  end
end
