# frozen_string_literal: true

module Api
  module V1
    module Webhooks
      class BaseController < ActionController::API
        # Webhooks не требуют JWT авторизации, но требуют проверки подписи
        
        rescue_from StandardError, with: :handle_error

        protected

        # Сохраняет событие webhook для обработки
        def record_webhook_event(source:, external_id:, event_type:, payload:)
          # Идемпотентность - проверяем дубликаты
          if WebhookEvent.already_processed?(source, external_id)
            Rails.logger.info "Webhook already processed: #{source}/#{external_id}"
            return nil
          end

          WebhookEvent.create!(
            source: source,
            external_id: external_id,
            event_type: event_type,
            payload: payload,
            headers: sanitized_headers,
            status: 'pending'
          )
        end

        def render_accepted
          render json: { status: 'accepted' }, status: :ok
        end

        def render_ignored(reason = 'Event ignored')
          render json: { status: 'ignored', reason: reason }, status: :ok
        end

        private

        def sanitized_headers
          # Сохраняем только релевантные заголовки
          relevant_headers = %w[
            Content-Type X-Request-Id X-Forwarded-For
            X-YooKassa-Signature X-Apple-Signature X-Google-Signature
            X-Webhook-Signature
          ]
          
          request.headers.to_h.slice(*relevant_headers.map { |h| "HTTP_#{h.upcase.tr('-', '_')}" })
        end

        def handle_error(error)
          Rails.logger.error "Webhook error: #{error.class} - #{error.message}"
          Rails.logger.error error.backtrace&.first(5)&.join("\n")
          
          Sentry.capture_exception(error) if defined?(Sentry) && Rails.env.production?

          # Всегда возвращаем 200 чтобы избежать повторных отправок
          # (ошибки обрабатываются в фоне)
          render json: { status: 'error', message: error.message }, status: :ok
        end
      end
    end
  end
end
