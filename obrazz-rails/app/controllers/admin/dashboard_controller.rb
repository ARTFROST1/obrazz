# frozen_string_literal: true

module Admin
  class DashboardController < AdminController
    def index
      @stats = {
        total_users: User.count,
        active_subscriptions: Subscription.active.count,
        total_revenue: Payment.succeeded.sum(:amount),
        total_generations: AiGeneration.count,
        users_this_week: User.where("created_at >= ?", 1.week.ago).count,
        generations_today: AiGeneration.where("created_at >= ?", Date.current.beginning_of_day).count,
        revenue_this_month: Payment.succeeded.where("created_at >= ?", Date.current.beginning_of_month).sum(:amount),
        tokens_spent_today: TokenTransaction.where("created_at >= ? AND amount < 0", Date.current.beginning_of_day).sum(:amount).abs
      }

      @recent_users = User.order(created_at: :desc).limit(5)
      @recent_payments = Payment.includes(:user).succeeded.order(created_at: :desc).limit(5)
      @recent_generations = AiGeneration.includes(:user).order(created_at: :desc).limit(5)

      # Chart data for last 7 days
      @chart_data = {
        labels: (6.days.ago.to_date..Date.current).map { |d| d.strftime("%b %d") },
        users: (6.days.ago.to_date..Date.current).map { |d| User.where("DATE(created_at) = ?", d).count },
        generations: (6.days.ago.to_date..Date.current).map { |d| AiGeneration.where("DATE(created_at) = ?", d).count },
        revenue: (6.days.ago.to_date..Date.current).map { |d| Payment.succeeded.where("DATE(created_at) = ?", d).sum(:amount) }
      }
    end
  end
end
