# frozen_string_literal: true

class ProcessYookassaWebhookJob < ApplicationJob
  queue_as :webhooks

  retry_on StandardError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  # YooKassa notification types
  # https://yookassa.ru/developers/using-api/webhooks
  PAYMENT_SUCCEEDED = "payment.succeeded"
  PAYMENT_CANCELED = "payment.canceled"
  REFUND_SUCCEEDED = "refund.succeeded"

  def perform(webhook_event_id)
    event = WebhookEvent.find(webhook_event_id)
    return if event.processed?

    event.start_processing!

    begin
      payload = event.payload.deep_symbolize_keys
      event_type = payload[:event]
      object = payload[:object].deep_symbolize_keys

      case event_type
      when PAYMENT_SUCCEEDED
        handle_payment_succeeded(event, object)
      when PAYMENT_CANCELED
        handle_payment_canceled(event, object)
      when REFUND_SUCCEEDED
        handle_refund_succeeded(event, object)
      else
        Rails.logger.info "Unhandled YooKassa event type: #{event_type}"
        event.mark_processed!
      end
    rescue => e
      event.mark_failed!("processing_error", e.message)
      raise
    end
  end

  private

  def handle_payment_succeeded(event, object)
    payment_id = object[:id]
    metadata = object[:metadata] || {}

    # Ищем платеж по external_id
    payment = Payment.find_by(external_id: payment_id)

    # Или по нашему внутреннему ID из metadata
    payment ||= Payment.find_by(id: metadata[:payment_id])

    unless payment
      Rails.logger.warn "Payment not found for YooKassa payment: #{payment_id}"
      event.mark_processed!
      return
    end

    # Обновляем платеж
    payment.update!(
      external_status: object[:status],
      payment_method: extract_payment_method(object),
      metadata: payment.metadata.merge(yookassa_response: object)
    )

    payment.mark_as_succeeded!

    event.mark_processed!(
      user_id: payment.user_id,
      payment_id: payment.id,
      subscription_id: payment.subscription_id
    )
  end

  def handle_payment_canceled(event, object)
    payment_id = object[:id]
    payment = Payment.find_by(external_id: payment_id)

    if payment
      cancellation = object[:cancellation_details] || {}
      payment.mark_as_failed!(
        cancellation[:reason] || "canceled",
        cancellation[:party] || "Payment was canceled"
      )

      event.mark_processed!(user_id: payment.user_id, payment_id: payment.id)
    else
      event.mark_processed!
    end
  end

  def handle_refund_succeeded(event, object)
    payment_id = object[:payment_id]
    payment = Payment.find_by(external_id: payment_id)

    if payment
      payment.refund!
      event.mark_processed!(user_id: payment.user_id, payment_id: payment.id)
    else
      event.mark_processed!
    end
  end

  def extract_payment_method(object)
    pm = object[:payment_method]
    return nil unless pm

    case pm[:type]
    when "bank_card"
      "bank_card"
    when "yoo_money"
      "yoomoney"
    when "sbp"
      "sbp"
    when "apple_pay"
      "apple_pay"
    when "google_pay"
      "google_pay"
    else
      pm[:type]
    end
  end
end
