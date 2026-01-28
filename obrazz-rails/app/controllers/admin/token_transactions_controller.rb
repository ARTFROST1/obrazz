# frozen_string_literal: true

module Admin
  class TokenTransactionsController < AdminController
    def index
      @transactions = TokenTransaction.includes(:user)
                                      .order(created_at: :desc)
                                      .page(params[:page])
                                      .per(20)

      # Apply filters
      if params[:reason].present?
        @transactions = @transactions.where(reason: params[:reason])
      end

      if params[:user_id].present?
        @transactions = @transactions.where(user_id: params[:user_id])
      end

      @stats = {
        total_spent: TokenTransaction.where("amount < 0").sum(:amount).abs,
        total_granted: TokenTransaction.where("amount > 0").sum(:amount),
        today_spent: TokenTransaction.where("created_at >= ? AND amount < 0", Date.current.beginning_of_day).sum(:amount).abs,
        by_type: TokenTransaction.group(:reason).sum(:amount)
      }
    end

    def show
      @transaction = TokenTransaction.includes(:user, :token_balance).find(params[:id])
    end
  end
end
