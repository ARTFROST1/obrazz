# frozen_string_literal: true

module Api
  module V1
    module Webhooks
      class AppleController < BaseController
        # POST /api/v1/webhooks/apple
        # Apple App Store Server Notifications V2
        # https://developer.apple.com/documentation/appstoreservernotifications
        def create
          # Apple отправляет JWT в signedPayload
          signed_payload = params[:signedPayload]

          unless signed_payload.present?
            return render json: { error: "Missing signedPayload" }, status: :bad_request
          end

          # Декодируем и верифицируем JWT (в production нужна полная верификация)
          payload = decode_signed_payload(signed_payload)

          notification_type = payload["notificationType"]
          subtype = payload["subtype"]
          data = payload["data"]

          # Извлекаем transaction info
          transaction_info = decode_signed_payload(data["signedTransactionInfo"]) rescue {}
          renewal_info = decode_signed_payload(data["signedRenewalInfo"]) rescue {}

          event_id = transaction_info["transactionId"] || SecureRandom.uuid

          # Записываем событие
          event = record_webhook_event(
            source: "apple_iap",
            external_id: event_id,
            event_type: "#{notification_type}:#{subtype}",
            payload: {
              notification_type: notification_type,
              subtype: subtype,
              transaction_info: transaction_info,
              renewal_info: renewal_info,
              raw_data: data
            }
          )

          return render_ignored("Duplicate event") unless event

          # Обрабатываем в фоне
          ProcessAppleWebhookJob.perform_later(event.id)

          render_accepted
        end

        private

        def decode_signed_payload(signed_payload)
          # В development просто декодируем без верификации
          # В production нужна полная верификация с Apple certificates
          parts = signed_payload.split(".")

          if parts.length == 3
            payload_part = parts[1]
            # Добавляем padding если нужно
            payload_part += "=" * (4 - payload_part.length % 4) if payload_part.length % 4 != 0
            JSON.parse(Base64.decode64(payload_part))
          else
            {}
          end
        rescue => e
          Rails.logger.error "Failed to decode Apple signed payload: #{e.message}"
          {}
        end
      end
    end
  end
end
