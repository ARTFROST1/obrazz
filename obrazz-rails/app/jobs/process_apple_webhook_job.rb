# frozen_string_literal: true

class ProcessAppleWebhookJob < ApplicationJob
  queue_as :webhooks

  retry_on StandardError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  # Apple notification types
  # https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
  SUBSCRIBED = "SUBSCRIBED"
  DID_RENEW = "DID_RENEW"
  DID_FAIL_TO_RENEW = "DID_FAIL_TO_RENEW"
  EXPIRED = "EXPIRED"
  REFUND = "REFUND"
  GRACE_PERIOD_EXPIRED = "GRACE_PERIOD_EXPIRED"
  REVOKE = "REVOKE"

  def perform(webhook_event_id)
    event = WebhookEvent.find(webhook_event_id)
    return if event.processed?

    event.start_processing!

    begin
      payload = event.payload.deep_symbolize_keys
      notification_type = payload[:notification_type]
      transaction_info = payload[:transaction_info] || {}

      case notification_type
      when SUBSCRIBED
        handle_subscribed(event, transaction_info)
      when DID_RENEW
        handle_renewal(event, transaction_info)
      when DID_FAIL_TO_RENEW, GRACE_PERIOD_EXPIRED
        handle_renewal_failed(event, transaction_info)
      when EXPIRED, REVOKE
        handle_expired(event, transaction_info)
      when REFUND
        handle_refund(event, transaction_info)
      else
        Rails.logger.info "Unhandled Apple notification type: #{notification_type}"
        event.mark_processed!
      end
    rescue => e
      event.mark_failed!("processing_error", e.message)
      raise
    end
  end

  private

  def handle_subscribed(event, transaction_info)
    original_transaction_id = transaction_info[:originalTransactionId]
    app_account_token = transaction_info[:appAccountToken] # Наш user_id

    user = find_user(app_account_token, original_transaction_id)

    unless user
      Rails.logger.warn "User not found for Apple subscription: #{original_transaction_id}"
      event.mark_processed!
      return
    end

    # Создаём или обновляем платёж
    payment = user.payments.find_or_create_by!(
      provider: "apple_iap",
      external_id: transaction_info[:transactionId]
    ) do |p|
      p.payment_type = "subscription"
      p.amount = (transaction_info[:price] || 0) / 1000.0 # Apple отправляет в milliunits
      p.currency = transaction_info[:currency] || "USD"
      p.subscription_plan = map_product_to_plan(transaction_info[:productId])
    end

    payment.mark_as_succeeded! unless payment.succeeded?

    event.mark_processed!(
      user_id: user.id,
      payment_id: payment.id,
      subscription_id: user.subscription&.id
    )
  end

  def handle_renewal(event, transaction_info)
    original_transaction_id = transaction_info[:originalTransactionId]

    # Находим пользователя по предыдущей транзакции
    previous_payment = Payment.find_by(
      provider: "apple_iap",
      external_id: original_transaction_id
    )

    user = previous_payment&.user

    if user
      # Создаём новый платёж за renewal
      payment = user.payments.create!(
        provider: "apple_iap",
        external_id: transaction_info[:transactionId],
        payment_type: "subscription",
        amount: (transaction_info[:price] || 0) / 1000.0,
        currency: transaction_info[:currency] || "USD",
        subscription_plan: map_product_to_plan(transaction_info[:productId]),
        status: "succeeded",
        paid_at: Time.current
      )

      # Продлеваем подписку
      expires_at = Time.at(transaction_info[:expiresDate].to_i / 1000) rescue 1.month.from_now
      user.subscription&.renew!(expires_at)

      event.mark_processed!(
        user_id: user.id,
        payment_id: payment.id,
        subscription_id: user.subscription&.id
      )
    else
      event.mark_processed!
    end
  end

  def handle_renewal_failed(event, transaction_info)
    user = find_user_by_transaction(transaction_info[:originalTransactionId])

    if user&.subscription
      user.subscription.update!(status: "past_due")
    end

    event.mark_processed!(user_id: user&.id, subscription_id: user&.subscription&.id)
  end

  def handle_expired(event, transaction_info)
    user = find_user_by_transaction(transaction_info[:originalTransactionId])

    if user&.subscription
      user.subscription.downgrade_to_free!
    end

    event.mark_processed!(user_id: user&.id, subscription_id: user&.subscription&.id)
  end

  def handle_refund(event, transaction_info)
    payment = Payment.find_by(
      provider: "apple_iap",
      external_id: transaction_info[:transactionId]
    )

    if payment
      payment.refund!
      event.mark_processed!(user_id: payment.user_id, payment_id: payment.id)
    else
      event.mark_processed!
    end
  end

  def find_user(app_account_token, original_transaction_id)
    # Сначала пробуем по appAccountToken (который содержит user_id)
    if app_account_token.present?
      user = User.find_by(id: app_account_token) || User.find_by(supabase_id: app_account_token)
      return user if user
    end

    # Если не нашли, ищем по предыдущим транзакциям
    find_user_by_transaction(original_transaction_id)
  end

  def find_user_by_transaction(original_transaction_id)
    return nil unless original_transaction_id.present?

    Payment.find_by(provider: "apple_iap", external_id: original_transaction_id)&.user
  end

  def map_product_to_plan(product_id)
    case product_id
    when /monthly/i
      "pro_monthly"
    when /yearly/i, /annual/i
      "pro_yearly"
    else
      "pro_monthly"
    end
  end
end
