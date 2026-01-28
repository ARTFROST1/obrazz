# frozen_string_literal: true

class ProcessGoogleWebhookJob < ApplicationJob
  queue_as :webhooks

  retry_on StandardError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  # Google notification types
  # https://developer.android.com/google/play/billing/rtdn-reference
  SUBSCRIPTION_RECOVERED = 1
  SUBSCRIPTION_RENEWED = 2
  SUBSCRIPTION_CANCELED = 3
  SUBSCRIPTION_PURCHASED = 4
  SUBSCRIPTION_ON_HOLD = 5
  SUBSCRIPTION_IN_GRACE_PERIOD = 6
  SUBSCRIPTION_RESTARTED = 7
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8
  SUBSCRIPTION_DEFERRED = 9
  SUBSCRIPTION_PAUSED = 10
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11
  SUBSCRIPTION_REVOKED = 12
  SUBSCRIPTION_EXPIRED = 13
  SUBSCRIPTION_PENDING_PURCHASE_CANCELED = 20

  def perform(webhook_event_id)
    event = WebhookEvent.find(webhook_event_id)
    return if event.processed?

    event.start_processing!

    begin
      payload = event.payload.deep_symbolize_keys
      notification_type = payload[:notification_type].to_i
      purchase_token = payload[:purchase_token]
      subscription_id = payload[:subscription_id]

      case notification_type
      when SUBSCRIPTION_PURCHASED, SUBSCRIPTION_RESTARTED
        handle_subscription_purchased(event, payload)
      when SUBSCRIPTION_RENEWED, SUBSCRIPTION_RECOVERED
        handle_subscription_renewed(event, payload)
      when SUBSCRIPTION_CANCELED, SUBSCRIPTION_REVOKED, SUBSCRIPTION_EXPIRED
        handle_subscription_canceled(event, payload)
      when SUBSCRIPTION_ON_HOLD, SUBSCRIPTION_IN_GRACE_PERIOD
        handle_subscription_hold(event, payload)
      else
        Rails.logger.info "Unhandled Google notification type: #{notification_type}"
        event.mark_processed!
      end
    rescue => e
      event.mark_failed!("processing_error", e.message)
      raise
    end
  end

  private

  def handle_subscription_purchased(event, payload)
    purchase_token = payload[:purchase_token]
    subscription_id = payload[:subscription_id]

    # TODO: Вызвать Google Play API для получения полной информации о покупке
    # Пока работаем с тем, что есть

    # Ищем пользователя (purchase_token может содержать obfuscatedExternalAccountId)
    user = find_user_by_token(purchase_token)

    unless user
      Rails.logger.warn "User not found for Google subscription: #{purchase_token}"
      event.mark_processed!
      return
    end

    payment = user.payments.find_or_create_by!(
      provider: "google_play",
      external_id: purchase_token
    ) do |p|
      p.payment_type = "subscription"
      p.subscription_plan = map_sku_to_plan(subscription_id)
      p.amount = 0 # Нужен API запрос для получения цены
      p.currency = "RUB"
    end

    payment.mark_as_succeeded! unless payment.succeeded?

    event.mark_processed!(
      user_id: user.id,
      payment_id: payment.id,
      subscription_id: user.subscription&.id
    )
  end

  def handle_subscription_renewed(event, payload)
    purchase_token = payload[:purchase_token]

    # Находим пользователя по purchase_token
    previous_payment = Payment.find_by(
      provider: "google_play",
      external_id: purchase_token
    )

    user = previous_payment&.user

    if user&.subscription
      # Продлеваем подписку
      user.subscription.renew!(1.month.from_now)
    end

    event.mark_processed!(
      user_id: user&.id,
      subscription_id: user&.subscription&.id
    )
  end

  def handle_subscription_canceled(event, payload)
    purchase_token = payload[:purchase_token]

    payment = Payment.find_by(provider: "google_play", external_id: purchase_token)
    user = payment&.user

    if user&.subscription
      user.subscription.downgrade_to_free!
    end

    event.mark_processed!(
      user_id: user&.id,
      subscription_id: user&.subscription&.id
    )
  end

  def handle_subscription_hold(event, payload)
    purchase_token = payload[:purchase_token]

    payment = Payment.find_by(provider: "google_play", external_id: purchase_token)
    user = payment&.user

    if user&.subscription
      user.subscription.update!(status: "past_due")
    end

    event.mark_processed!(
      user_id: user&.id,
      subscription_id: user&.subscription&.id
    )
  end

  def find_user_by_token(purchase_token)
    # Ищем по предыдущим платежам
    Payment.find_by(provider: "google_play", external_id: purchase_token)&.user
  end

  def map_sku_to_plan(subscription_id)
    case subscription_id
    when /monthly/i
      "pro_monthly"
    when /yearly/i, /annual/i
      "pro_yearly"
    else
      "pro_monthly"
    end
  end
end
