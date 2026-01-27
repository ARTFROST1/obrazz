# frozen_string_literal: true

class Payment < ApplicationRecord
  # ==================== ASSOCIATIONS ====================
  belongs_to :user
  belongs_to :subscription, optional: true
  has_many :token_transactions, dependent: :nullify

  # ==================== CONSTANTS ====================
  PROVIDERS = %w[yookassa apple_iap google_play].freeze
  STATUSES = %w[pending processing succeeded failed cancelled refunded].freeze
  PAYMENT_TYPES = %w[subscription token_pack one_time].freeze
  PAYMENT_METHODS = %w[bank_card apple_pay google_pay yoomoney sbp].freeze

  # Пакеты токенов
  TOKEN_PACKS = {
    'pack_10' => { tokens: 10, price_rub: 99 },
    'pack_50' => { tokens: 50, price_rub: 399 },
    'pack_100' => { tokens: 100, price_rub: 699 },
    'pack_500' => { tokens: 500, price_rub: 2999 }
  }.freeze

  # Цены подписок
  SUBSCRIPTION_PRICES = {
    'pro_monthly' => { price_rub: 299, tokens: 100 },
    'pro_yearly' => { price_rub: 2499, tokens: 100 }
  }.freeze

  # ==================== VALIDATIONS ====================
  validates :provider, presence: true, inclusion: { in: PROVIDERS }
  validates :external_id, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :payment_type, presence: true, inclusion: { in: PAYMENT_TYPES }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :currency, presence: true

  # ==================== SCOPES ====================
  scope :pending, -> { where(status: 'pending') }
  scope :succeeded, -> { where(status: 'succeeded') }
  scope :failed, -> { where(status: 'failed') }
  scope :refunded, -> { where(status: 'refunded') }
  scope :by_provider, ->(provider) { where(provider: provider) }
  scope :recent, -> { order(created_at: :desc) }
  scope :in_period, ->(start_date, end_date) { where(created_at: start_date..end_date) }
  scope :for_subscriptions, -> { where(payment_type: 'subscription') }
  scope :for_tokens, -> { where(payment_type: 'token_pack') }

  # ==================== INSTANCE METHODS ====================

  def pending?
    status == 'pending'
  end

  def succeeded?
    status == 'succeeded'
  end

  def failed?
    status == 'failed'
  end

  def refunded?
    status == 'refunded'
  end

  def for_subscription?
    payment_type == 'subscription'
  end

  def for_tokens?
    payment_type == 'token_pack'
  end

  def mark_as_processing!
    update!(status: 'processing')
  end

  def mark_as_succeeded!
    transaction do
      update!(
        status: 'succeeded',
        paid_at: Time.current
      )

      # Обработка в зависимости от типа платежа
      case payment_type
      when 'subscription'
        process_subscription_payment!
      when 'token_pack'
        process_token_pack_payment!
      end
    end
  end

  def mark_as_failed!(error_code, error_message)
    update!(
      status: 'failed',
      error_code: error_code,
      error_message: error_message
    )
  end

  def refund!
    return unless succeeded?

    transaction do
      update!(
        status: 'refunded',
        refunded_at: Time.current
      )

      # Отмена начисленных токенов
      refund_tokens! if for_tokens?
    end
  end

  private

  def process_subscription_payment!
    return unless subscription_plan.present?

    subscription = user.subscription || user.build_subscription
    subscription.upgrade!(
      subscription_plan,
      payment_provider: provider,
      external_id: external_id
    )
  end

  def process_token_pack_payment!
    return unless tokens_amount.present? && tokens_amount > 0

    # Найти или создать баланс purchased_tokens
    balance = user.token_balances.find_or_create_by!(token_type: 'purchased_tokens') do |b|
      b.balance = 0
      b.source = 'purchase'
    end

    balance.credit!(
      tokens_amount,
      reason: 'purchase',
      description: "Token pack purchase: #{token_pack_id}",
      payment_id: id
    )
  end

  def refund_tokens!
    return unless tokens_amount.present? && tokens_amount > 0

    balance = user.token_balances.find_by(token_type: 'purchased_tokens')
    return unless balance

    # Списываем токены как refund (но не ниже 0)
    amount_to_debit = [tokens_amount, balance.balance].min
    return if amount_to_debit.zero?

    balance.debit!(
      amount_to_debit,
      reason: 'refund',
      description: "Refund for payment ##{id}"
    )
  end
end
