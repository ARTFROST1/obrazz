# frozen_string_literal: true

class WebhookEvent < ApplicationRecord
  # ==================== CONSTANTS ====================
  SOURCES = %w[yookassa apple_iap google_play the_new_black].freeze
  STATUSES = %w[pending processing processed failed].freeze
  MAX_ATTEMPTS = 5

  # ==================== VALIDATIONS ====================
  validates :source, presence: true, inclusion: { in: SOURCES }
  validates :external_id, presence: true
  validates :event_type, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :payload, presence: true
  validates :external_id, uniqueness: { scope: :source }

  # ==================== SCOPES ====================
  scope :pending, -> { where(status: "pending") }
  scope :processing, -> { where(status: "processing") }
  scope :processed, -> { where(status: "processed") }
  scope :failed, -> { where(status: "failed") }
  scope :retriable, -> { where(status: "failed").where("attempts < ?", MAX_ATTEMPTS) }
  scope :by_source, ->(source) { where(source: source) }
  scope :recent, -> { order(created_at: :desc) }

  # ==================== INSTANCE METHODS ====================

  def pending?
    status == "pending"
  end

  def processing?
    status == "processing"
  end

  def processed?
    status == "processed"
  end

  def failed?
    status == "failed"
  end

  def can_retry?
    failed? && attempts < MAX_ATTEMPTS
  end

  def start_processing!
    update!(
      status: "processing",
      last_attempted_at: Time.current,
      attempts: attempts + 1
    )
  end

  def mark_processed!(user_id: nil, payment_id: nil, subscription_id: nil, ai_generation_id: nil)
    update!(
      status: "processed",
      processed_at: Time.current,
      user_id: user_id,
      payment_id: payment_id,
      subscription_id: subscription_id,
      ai_generation_id: ai_generation_id
    )
  end

  def mark_failed!(error_code, error_message)
    update!(
      status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
      error_code: error_code,
      error_message: error_message
    )
  end

  # Идемпотентность - проверка дубликатов
  def self.already_processed?(source, external_id)
    exists?(source: source, external_id: external_id, status: "processed")
  end
end
