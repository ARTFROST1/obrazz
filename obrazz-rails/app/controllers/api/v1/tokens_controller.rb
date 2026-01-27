# frozen_string_literal: true

module Api
  module V1
    class TokensController < BaseController
      # GET /api/v1/tokens
      # Список всех токен-балансов пользователя
      def index
        render_success(token_service.detailed_balance)
      end

      # GET /api/v1/tokens/balance
      # Быстрый endpoint для получения доступного баланса
      def balance
        render_success({
          available: token_service.available_balance,
          can_generate: current_user.can_generate?
        })
      end

      # GET /api/v1/tokens/history
      # История транзакций токенов
      def history
        transactions = current_user.token_transactions
                                   .includes(:token_balance, :ai_generation, :payment)
                                   .recent
                                   .limit(params[:limit] || 50)
                                   .offset(params[:offset] || 0)

        render_success(
          transactions.map { |t| transaction_data(t) },
          meta: {
            total: current_user.token_transactions.count,
            limit: params[:limit] || 50,
            offset: params[:offset] || 0
          }
        )
      end

      private

      def token_service
        @token_service ||= Tokens::BalanceService.new(current_user)
      end

      def transaction_data(transaction)
        {
          id: transaction.id,
          operation: transaction.operation,
          amount: transaction.amount,
          balance_before: transaction.balance_before,
          balance_after: transaction.balance_after,
          reason: transaction.reason,
          description: transaction.description,
          token_type: transaction.token_balance.token_type,
          ai_generation_id: transaction.ai_generation_id,
          payment_id: transaction.payment_id,
          created_at: transaction.created_at.iso8601
        }
      end
    end
  end
end
