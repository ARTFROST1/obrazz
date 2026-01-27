# frozen_string_literal: true

class AiGeneration < ApplicationRecord
  # ==================== ASSOCIATIONS ====================
  belongs_to :user
  has_many :token_transactions, dependent: :nullify

  # ==================== CONSTANTS ====================
  GENERATION_TYPES = %w[virtual_try_on fashion_model variation].freeze
  STATUSES = %w[pending processing completed failed cancelled].freeze

  # Стоимость в токенах для каждого типа генерации
  TOKEN_COSTS = {
    'virtual_try_on' => 1,
    'fashion_model' => 1,
    'variation' => 1
  }.freeze

  # ==================== VALIDATIONS ====================
  validates :generation_type, presence: true, inclusion: { in: GENERATION_TYPES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :tokens_cost, presence: true, numericality: { greater_than: 0 }

  # ==================== SCOPES ====================
  scope :pending, -> { where(status: 'pending') }
  scope :processing, -> { where(status: 'processing') }
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(generation_type: type) }
  scope :in_period, ->(start_date, end_date) { where(created_at: start_date..end_date) }

  # ==================== CALLBACKS ====================
  before_validation :set_default_cost, on: :create

  # ==================== INSTANCE METHODS ====================

  def pending?
    status == 'pending'
  end

  def processing?
    status == 'processing'
  end

  def completed?
    status == 'completed'
  end

  def failed?
    status == 'failed'
  end

  def cancelled?
    status == 'cancelled'
  end

  def start_processing!
    update!(
      status: 'processing',
      started_at: Time.current
    )
  end

  def complete!(output_urls, metadata = {})
    update!(
      status: 'completed',
      output_image_urls: output_urls,
      output_metadata: metadata,
      completed_at: Time.current,
      processing_time_ms: calculate_processing_time
    )
  end

  def fail!(error_code, error_message)
    update!(
      status: 'failed',
      error_code: error_code,
      error_message: error_message,
      completed_at: Time.current,
      processing_time_ms: calculate_processing_time
    )
  end

  def cancel!
    return unless pending? || processing?

    update!(status: 'cancelled')
    
    # Возврат токенов
    refund_tokens!
  end

  def virtual_try_on?
    generation_type == 'virtual_try_on'
  end

  def fashion_model?
    generation_type == 'fashion_model'
  end

  def variation?
    generation_type == 'variation'
  end

  def primary_output_url
    output_image_urls&.first
  end

  private

  def set_default_cost
    self.tokens_cost ||= TOKEN_COSTS[generation_type] || 1
  end

  def calculate_processing_time
    return nil unless started_at
    ((Time.current - started_at) * 1000).to_i
  end

  def refund_tokens!
    # Найти транзакцию списания токенов
    debit_transaction = token_transactions.find_by(operation: 'debit')
    return unless debit_transaction

    # Вернуть токены
    balance = debit_transaction.token_balance
    balance.credit!(
      tokens_cost,
      reason: 'refund',
      description: "Refund for cancelled generation ##{id}"
    )
  end
end
