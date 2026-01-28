# frozen_string_literal: true

class TokenTransaction < ApplicationRecord
  # ==================== ASSOCIATIONS ====================
  belongs_to :user
  belongs_to :token_balance
  belongs_to :ai_generation, optional: true
  belongs_to :payment, optional: true

  # ==================== CONSTANTS ====================
  OPERATIONS = %w[credit debit expire refund].freeze
  REASONS = %w[
    ai_generation subscription_renewal purchase bonus refund expiration
    referral promo registration_bonus manual_adjustment
  ].freeze

  # ==================== VALIDATIONS ====================
  validates :operation, presence: true, inclusion: { in: OPERATIONS }
  validates :amount, presence: true, numericality: { other_than: 0 }
  validates :balance_before, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :balance_after, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :reason, inclusion: { in: REASONS }, allow_nil: true

  # ==================== SCOPES ====================
  scope :credits, -> { where(operation: "credit") }
  scope :debits, -> { where(operation: "debit") }
  scope :for_ai_generations, -> { where(reason: "ai_generation") }
  scope :for_purchases, -> { where(reason: "purchase") }
  scope :recent, -> { order(created_at: :desc) }
  scope :in_period, ->(start_date, end_date) { where(created_at: start_date..end_date) }

  # ==================== INSTANCE METHODS ====================

  def credit?
    operation == "credit"
  end

  def debit?
    operation == "debit"
  end

  def refund?
    operation == "refund"
  end
end
