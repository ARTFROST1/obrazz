# frozen_string_literal: true

module Admin
  class UsersController < AdminController
    def index
      @users = User.includes(:subscription, :token_balances)
                   .order(created_at: :desc)
                   .page(params[:page])
                   .per(20)

      # Apply filters
      if params[:search].present?
        q = "%#{params[:search]}%"
        @users = @users.where("email ILIKE ? OR full_name ILIKE ? OR username ILIKE ?", q, q, q)
      end

      if params[:status].present?
        case params[:status]
        when "active"
          @users = @users.joins(:subscription).merge(Subscription.active.pro)
        when "free"
          @users = @users.joins(:subscription).where(subscriptions: { plan: "free" })
        when "cancelled"
          @users = @users.joins(:subscription).where(subscriptions: { status: "cancelled" })
        end
      end
    end

    def show
      @user = User.includes(:subscription, :token_balances, :ai_generations, :payments, :token_transactions)
                  .find(params[:id])

      @recent_generations = @user.ai_generations.order(created_at: :desc).limit(10)
      @recent_payments = @user.payments.order(created_at: :desc).limit(10)
      @recent_transactions = @user.token_transactions.order(created_at: :desc).limit(20)

      @stats = {
        total_generations: @user.ai_generations.count,
        total_spent: @user.payments.succeeded.sum(:amount),
        tokens_used: @user.token_transactions.where("amount < 0").sum(:amount).abs,
        member_since: @user.created_at
      }
    end
  end
end
