# frozen_string_literal: true

module Dashboard
  class HomeController < DashboardController
    # GET /dashboard
    def index
      @subscription = current_user.subscription
      @token_balance = current_user.available_tokens
      @recent_generations = current_user.ai_generations
                                         .includes(:user)
                                         .order(created_at: :desc)
                                         .limit(6)
      @total_generations = current_user.ai_generations.count
      @successful_generations = current_user.ai_generations.where(status: "completed").count

      # Статистика за текущий месяц
      current_month_start = Time.current.beginning_of_month
      @monthly_generations = current_user.ai_generations
                                          .where("created_at >= ?", current_month_start)
                                          .count
      @monthly_tokens_spent = current_user.token_transactions
                                           .where("created_at >= ?", current_month_start)
                                           .where(operation: "debit", reason: "ai_generation")
                                           .sum(:amount)
                                           .abs
    end
  end
end
