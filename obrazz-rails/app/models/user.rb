# frozen_string_literal: true

class User < ApplicationRecord
  # ==================== ASSOCIATIONS ====================
  has_one :subscription, dependent: :destroy
  has_many :token_balances, dependent: :destroy
  has_many :token_transactions, dependent: :destroy
  has_many :ai_generations, dependent: :destroy
  has_many :payments, dependent: :destroy

  # ==================== VALIDATIONS ====================
  validates :supabase_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, uniqueness: true, allow_nil: true
  validates :status, inclusion: { in: %w[active suspended deleted] }

  # ==================== SCOPES ====================
  scope :active, -> { where(status: "active") }
  scope :with_active_subscription, -> { joins(:subscription).merge(Subscription.active) }

  # ==================== CALLBACKS ====================
  after_create :create_default_subscription
  after_create :create_initial_token_balance

  # ==================== INSTANCE METHODS ====================

  def active?
    status == "active"
  end

  def has_pro_subscription?
    subscription&.active? && subscription&.pro?
  end

  def total_token_balance
    token_balances.sum(:balance)
  end

  def available_tokens
    # Subscription tokens (не истёкшие) + purchased + bonus
    token_balances
      .where("expires_at IS NULL OR expires_at > ?", Time.current)
      .sum(:balance)
  end

  def can_generate?(cost = 1)
    available_tokens >= cost
  end

  def touch_last_active!
    update_column(:last_active_at, Time.current)
  end

  private

  def create_default_subscription
    create_subscription!(plan: "free", status: "active")
  end

  def create_initial_token_balance
    # Начальный баланс для free плана (3 бесплатных токена)
    token_balances.create!(
      token_type: "bonus_tokens",
      balance: 3,
      source: "registration_bonus",
      expires_at: 30.days.from_now
    )
  end
end
