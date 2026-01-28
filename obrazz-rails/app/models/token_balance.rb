# frozen_string_literal: true

class TokenBalance < ApplicationRecord
  # ==================== ASSOCIATIONS ====================
  belongs_to :user
  has_many :token_transactions, dependent: :destroy

  # ==================== CONSTANTS ====================
  TOKEN_TYPES = %w[subscription_tokens purchased_tokens bonus_tokens].freeze
  SOURCES = %w[subscription purchase referral bonus promo registration_bonus].freeze

  # ==================== VALIDATIONS ====================
  validates :token_type, presence: true, inclusion: { in: TOKEN_TYPES }
  validates :balance, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: :token_type }
  validates :source, inclusion: { in: SOURCES }, allow_nil: true

  # ==================== SCOPES ====================
  scope :active, -> { where("expires_at IS NULL OR expires_at > ?", Time.current) }
  scope :expired, -> { where("expires_at < ?", Time.current) }
  scope :with_balance, -> { where("balance > 0") }
  scope :subscription_tokens, -> { where(token_type: "subscription_tokens") }
  scope :purchased_tokens, -> { where(token_type: "purchased_tokens") }
  scope :bonus_tokens, -> { where(token_type: "bonus_tokens") }

  # ==================== INSTANCE METHODS ====================

  def active?
    expires_at.nil? || expires_at > Time.current
  end

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def available_balance
    active? ? balance : 0
  end

  def credit!(amount, reason:, description: nil, payment_id: nil, metadata: {})
    return false if amount <= 0

    transaction do
      old_balance = balance
      new_balance = old_balance + amount

      update!(balance: new_balance)

      token_transactions.create!(
        user: user,
        operation: "credit",
        amount: amount,
        balance_before: old_balance,
        balance_after: new_balance,
        reason: reason,
        description: description,
        payment_id: payment_id,
        metadata: metadata
      )
    end

    true
  end

  def debit!(amount, reason:, description: nil, ai_generation_id: nil, metadata: {})
    return false if amount <= 0
    return false if balance < amount

    transaction do
      old_balance = balance
      new_balance = old_balance - amount

      update!(balance: new_balance)

      token_transactions.create!(
        user: user,
        operation: "debit",
        amount: -amount,
        balance_before: old_balance,
        balance_after: new_balance,
        reason: reason,
        description: description,
        ai_generation_id: ai_generation_id,
        metadata: metadata
      )
    end

    true
  end

  def expire!
    return if balance.zero?
    return unless expired?

    transaction do
      old_balance = balance

      update!(balance: 0)

      token_transactions.create!(
        user: user,
        operation: "expire",
        amount: -old_balance,
        balance_before: old_balance,
        balance_after: 0,
        reason: "expiration",
        description: "Tokens expired at #{expires_at}"
      )
    end
  end
end
