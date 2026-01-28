# frozen_string_literal: true

module Api
  module V1
    module Webhooks
      class TheNewBlackController < BaseController
        # POST /api/v1/webhooks/the_new_black
        # The New Black AI callback webhook
        def create
          payload = params.to_unsafe_h.except(:controller, :action)

          task_id = payload[:task_id] || payload[:id]
          status = payload[:status]

          unless task_id.present?
            return render json: { error: "Missing task_id" }, status: :bad_request
          end

          # Записываем событие
          event = record_webhook_event(
            source: "the_new_black",
            external_id: task_id,
            event_type: "task:#{status}",
            payload: payload
          )

          return render_ignored("Duplicate event") unless event

          # Обрабатываем в фоне
          ProcessTheNewBlackWebhookJob.perform_later(event.id)

          render_accepted
        end
      end
    end
  end
end
