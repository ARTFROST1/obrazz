# frozen_string_literal: true

module Api
  module V1
    module Webhooks
      class GoogleController < BaseController
        # POST /api/v1/webhooks/google
        # Google Play Real-time Developer Notifications
        # https://developer.android.com/google/play/billing/rtdn-reference
        def create
          # Google отправляет сообщение в формате Pub/Sub
          message = params[:message]
          
          unless message.present?
            return render json: { error: 'Missing message' }, status: :bad_request
          end

          # Декодируем data из base64
          data = JSON.parse(Base64.decode64(message[:data]))
          
          # Определяем тип уведомления
          if data['subscriptionNotification'].present?
            process_subscription_notification(data)
          elsif data['oneTimeProductNotification'].present?
            process_one_time_notification(data)
          else
            render_ignored('Unknown notification type')
          end
        end

        private

        def process_subscription_notification(data)
          notification = data['subscriptionNotification']
          
          event = record_webhook_event(
            source: 'google_play',
            external_id: notification['purchaseToken'],
            event_type: "subscription:#{notification['notificationType']}",
            payload: {
              package_name: data['packageName'],
              subscription_id: notification['subscriptionId'],
              purchase_token: notification['purchaseToken'],
              notification_type: notification['notificationType'],
              raw_data: data
            }
          )

          return render_ignored('Duplicate event') unless event

          ProcessGoogleWebhookJob.perform_later(event.id)
          render_accepted
        end

        def process_one_time_notification(data)
          notification = data['oneTimeProductNotification']
          
          event = record_webhook_event(
            source: 'google_play',
            external_id: notification['purchaseToken'],
            event_type: "one_time:#{notification['notificationType']}",
            payload: {
              package_name: data['packageName'],
              sku: notification['sku'],
              purchase_token: notification['purchaseToken'],
              notification_type: notification['notificationType'],
              raw_data: data
            }
          )

          return render_ignored('Duplicate event') unless event

          ProcessGoogleWebhookJob.perform_later(event.id)
          render_accepted
        end
      end
    end
  end
end
