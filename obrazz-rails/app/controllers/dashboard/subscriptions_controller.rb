# frozen_string_literal: true

module Dashboard
  class SubscriptionsController < DashboardController
    before_action :set_subscription

    # GET /dashboard/subscription
    def show
      @payment_history = current_user.payments
                                      .where(payment_type: "subscription")
                                      .order(created_at: :desc)
                                      .limit(10)
      @available_plans = Subscription::PLANS - [ "free" ]
    end

    # GET /dashboard/subscription/plans
    def plans
      @current_plan = @subscription.plan
      @plans = [
        {
          id: "free",
          name: "Free",
          price: 0,
          tokens: 0,
          features: [
            "3 бонусных токена при регистрации",
            "Базовый доступ к гардеробу",
            "До 50 вещей в гардеробе"
          ]
        },
        {
          id: "pro_monthly",
          name: "Pro Monthly",
          price: 499,
          tokens: 100,
          features: [
            "100 AI-токенов в месяц",
            "Virtual Try-On (примерка)",
            "Fashion Models (модели)",
            "Неограниченный гардероб",
            "Приоритетная поддержка"
          ]
        },
        {
          id: "pro_yearly",
          name: "Pro Yearly",
          price: 3990,
          tokens: 100,
          yearly_savings: 1998,
          features: [
            "100 AI-токенов в месяц",
            "Virtual Try-On (примерка)",
            "Fashion Models (модели)",
            "Неограниченный гардероб",
            "Приоритетная поддержка",
            "Скидка 33% (экономия 1998₽)"
          ]
        }
      ]
    end

    # POST /dashboard/subscription/upgrade
    def upgrade
      plan = params[:plan]

      unless plan.in?(Subscription::PLANS)
        redirect_to dashboard_subscription_path, alert: "Неверный план"
        return
      end

      if plan == "free"
        downgrade_to_free
      else
        # Создаём платёж для апгрейда
        create_subscription_payment(plan)
      end
    end

    # POST /dashboard/subscription/cancel
    def cancel
      if @subscription.cancel!
        redirect_to dashboard_subscription_path, notice: "Подписка отменена. Она будет действовать до конца оплаченного периода."
      else
        redirect_to dashboard_subscription_path, alert: "Не удалось отменить подписку"
      end
    end

    # POST /dashboard/subscription/reactivate
    def reactivate
      if @subscription.reactivate!
        redirect_to dashboard_subscription_path, notice: "Подписка возобновлена!"
      else
        redirect_to dashboard_subscription_path, alert: "Не удалось возобновить подписку"
      end
    end

    private

    def set_subscription
      @subscription = current_user.subscription || current_user.create_subscription!(plan: "free", status: "active")
    end

    def downgrade_to_free
      if @subscription.update(plan: "free", status: "active", cancelled_at: nil)
        redirect_to dashboard_subscription_path, notice: "Вы перешли на бесплатный план"
      else
        redirect_to dashboard_subscription_path, alert: "Не удалось изменить план"
      end
    end

    def create_subscription_payment(plan)
      price_rub = plan == "pro_monthly" ? 499 : 3990

      payment = current_user.payments.create!(
        provider: "yookassa",
        external_id: "local_#{SecureRandom.uuid}",
        status: "pending",
        payment_type: "subscription",
        amount: price_rub,
        currency: "RUB",
        subscription_plan: plan,
        metadata: { plan: plan }
      )

      result = Payments::YookassaService.new.create_payment(
        amount: price_rub,
        currency: "RUB",
        description: "Подписка Obrazz #{plan == 'pro_monthly' ? 'Pro Monthly' : 'Pro Yearly'}",
        metadata: {
          internal_payment_id: payment.id,
          user_id: current_user.id,
          plan: plan
        },
        return_url: dashboard_subscription_url
      )

      if result[:success]
        payment.update!(external_id: result[:payment_id], external_status: "pending")
        redirect_to result[:confirmation_url], allow_other_host: true
      else
        payment.update!(status: "failed", error_message: result[:error])
        redirect_to dashboard_subscription_path, alert: "Ошибка создания платежа: #{result[:error]}"
      end
    end
  end
end
