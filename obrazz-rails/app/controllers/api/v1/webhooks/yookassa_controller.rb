# frozen_string_literal: true

module Api
  module V1
    module Webhooks
      class YookassaController < BaseController
        # POST /api/v1/webhooks/yookassa
        # YooKassa webhook endpoint
        # https://yookassa.ru/developers/using-api/webhooks
        def create
          # Верификация подписи
          unless verify_signature
            Rails.logger.warn "YooKassa webhook signature verification failed"
            return render json: { error: "Invalid signature" }, status: :unauthorized
          end

          payload = JSON.parse(request.body.read)
          event_type = payload["event"]
          object = payload["object"]

          # Записываем событие
          event = record_webhook_event(
            source: "yookassa",
            external_id: object["id"],
            event_type: event_type,
            payload: payload
          )

          return render_ignored("Duplicate event") unless event

          # Обрабатываем в фоне
          ProcessYookassaWebhookJob.perform_later(event.id)

          render_accepted
        end

        private

        def verify_signature
          # В development пропускаем проверку подписи
          return true if Rails.env.development?

          # Если верификация не настроена, пропускаем
          return true unless YookassaConfig.webhook_verification_enabled?

          signature = request.headers["X-YooKassa-Signature"]
          return false if signature.blank?

          # YooKassa использует HMAC-SHA256
          body = request.body.read
          request.body.rewind

          expected = OpenSSL::HMAC.hexdigest("SHA256", YookassaConfig.webhook_secret, body)
          ActiveSupport::SecurityUtils.secure_compare(signature, expected)
        end
      end
    end
  end
end
