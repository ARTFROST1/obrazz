# frozen_string_literal: true

module Api
  module V1
    class SubscriptionsController < BaseController
      # GET /api/v1/subscription
      # Информация о подписке пользователя
      def show
        subscription = current_user.subscription
        render_success(subscription_data(subscription))
      end

      # POST /api/v1/subscription
      # Создание подписки (обычно через webhook)
      def create
        # Обычно подписки создаются через webhooks от платежных систем
        # Этот endpoint для ручного тестирования или специальных случаев
        render_error("Subscriptions are created via payment flow", status: :method_not_allowed)
      end

      # POST /api/v1/subscription/upgrade
      # Апгрейд подписки
      def upgrade
        plan = params.require(:plan)

        unless Subscription::PLANS.include?(plan)
          return render_error("Invalid plan: #{plan}", status: :bad_request)
        end

        subscription = current_user.subscription

        if subscription.plan == plan
          return render_error("Already on this plan", status: :unprocessable_entity)
        end

        if plan == "free"
          return render_error("Use cancel endpoint to downgrade to free", status: :bad_request)
        end

        # Возвращаем информацию для инициации платежа
        render_success({
          subscription: subscription_data(subscription),
          upgrade_to: plan,
          prices: Subscription::SUBSCRIPTION_PRICES[plan] || Payment::SUBSCRIPTION_PRICES[plan],
          payment_required: true,
          message: "Initiate payment to complete upgrade"
        })
      end

      # POST /api/v1/subscription/cancel
      # Отмена подписки
      def cancel
        subscription = current_user.subscription

        if subscription.free?
          return render_error("No active subscription to cancel", status: :unprocessable_entity)
        end

        subscription.cancel!

        render_success({
          subscription: subscription_data(subscription),
          message: "Subscription cancelled. Will expire at end of current period.",
          expires_at: subscription.current_period_end&.iso8601
        })
      end

      # DELETE /api/v1/subscription
      # Немедленное удаление подписки (даунгрейд до free)
      def destroy
        subscription = current_user.subscription

        if subscription.free?
          return render_error("Already on free plan", status: :unprocessable_entity)
        end

        subscription.downgrade_to_free!

        render_success({
          subscription: subscription_data(subscription),
          message: "Subscription cancelled and downgraded to free plan"
        })
      end

      private

      def subscription_data(subscription)
        return { plan: "free", status: "active" } unless subscription

        {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          is_pro: subscription.pro?,
          monthly_tokens: subscription.monthly_tokens,
          current_period_start: subscription.current_period_start&.iso8601,
          current_period_end: subscription.current_period_end&.iso8601,
          days_until_expiry: subscription.days_until_expiry,
          auto_renew: subscription.auto_renew,
          cancelled_at: subscription.cancelled_at&.iso8601,
          payment_provider: subscription.payment_provider
        }
      end
    end
  end
end
