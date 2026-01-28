# frozen_string_literal: true

class Subscription < ApplicationRecord
  # ==================== ASSOCIATIONS ====================
  belongs_to :user
  has_many :payments, dependent: :nullify

  # ==================== CONSTANTS ====================
  PLANS = %w[free pro_monthly pro_yearly].freeze
  STATUSES = %w[active cancelled expired past_due].freeze

  # Токены в месяц для каждого плана
  PLAN_TOKENS = {
    "free" => 0,
    "pro_monthly" => 100,
    "pro_yearly" => 100
  }.freeze

  # ==================== VALIDATIONS ====================
  validates :plan, presence: true, inclusion: { in: PLANS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :user_id, uniqueness: true

  # ==================== SCOPES ====================
  scope :active, -> { where(status: "active") }
  scope :pro, -> { where(plan: %w[pro_monthly pro_yearly]) }
  scope :expiring_soon, ->(days = 3) { where("current_period_end < ?", days.days.from_now) }
  scope :expired, -> { where("current_period_end < ?", Time.current) }

  # ==================== INSTANCE METHODS ====================

  def active?
    status == "active"
  end

  def pro?
    plan.in?(%w[pro_monthly pro_yearly])
  end

  def free?
    plan == "free"
  end

  def monthly_tokens
    PLAN_TOKENS[plan] || 0
  end

  def expired?
    current_period_end.present? && current_period_end < Time.current
  end

  def days_until_expiry
    return nil unless current_period_end
    [ (current_period_end.to_date - Date.current).to_i, 0 ].max
  end

  def cancel!
    update!(
      status: "cancelled",
      cancelled_at: Time.current,
      auto_renew: false
    )
  end

  def reactivate!
    update!(
      status: "active",
      cancelled_at: nil,
      auto_renew: true
    )
  end

  def renew!(new_period_end)
    transaction do
      update!(
        status: "active",
        current_period_start: Time.current,
        current_period_end: new_period_end,
        cancelled_at: nil,
        auto_renew: true
      )

      # Начислить токены подписки
      credit_subscription_tokens!
    end
  end

  def upgrade!(new_plan, payment_provider: nil, external_id: nil)
    transaction do
      update!(
        plan: new_plan,
        status: "active",
        payment_provider: payment_provider,
        external_id: external_id,
        current_period_start: Time.current,
        current_period_end: calculate_period_end(new_plan),
        auto_renew: true
      )

      # Начислить токены нового плана
      credit_subscription_tokens!
    end
  end

  def downgrade_to_free!
    update!(
      plan: "free",
      status: "active",
      payment_provider: nil,
      external_id: nil,
      current_period_start: nil,
      current_period_end: nil,
      cancelled_at: nil,
      auto_renew: false
    )
  end

  private

  def calculate_period_end(plan)
    case plan
    when "pro_monthly"
      1.month.from_now
    when "pro_yearly"
      1.year.from_now
    else
      nil
    end
  end

  def credit_subscription_tokens!
    return if monthly_tokens.zero?

    balance = user.token_balances.find_or_initialize_by(token_type: "subscription_tokens")

    # Обновляем баланс подписочных токенов
    balance.update!(
      balance: monthly_tokens,
      source: "subscription",
      expires_at: current_period_end
    )

    # Записываем транзакцию
    user.token_transactions.create!(
      token_balance: balance,
      operation: "credit",
      amount: monthly_tokens,
      balance_before: 0,
      balance_after: monthly_tokens,
      reason: "subscription_renewal",
      description: "#{plan} subscription renewal"
    )
  end
end
