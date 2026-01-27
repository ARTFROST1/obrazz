# frozen_string_literal: true

module Api
  module V1
    class PaymentsController < BaseController
      # GET /api/v1/payments
      # История платежей пользователя
      def index
        payments = current_user.payments
                               .recent
                               .limit(params[:limit] || 20)
                               .offset(params[:offset] || 0)

        render_success(
          payments.map { |p| payment_data(p) },
          meta: {
            total: current_user.payments.count,
            limit: params[:limit] || 20,
            offset: params[:offset] || 0
          }
        )
      end

      # GET /api/v1/payments/:id
      # Детали платежа
      def show
        payment = current_user.payments.find(params[:id])
        render_success(payment_data(payment, detailed: true))
      end

      # GET /api/v1/payments/token_packs
      # Доступные пакеты токенов
      def token_packs
        packs = Payment::TOKEN_PACKS.map do |id, pack|
          {
            id: id,
            tokens: pack[:tokens],
            price: pack[:price_rub],
            currency: 'RUB',
            price_per_token: (pack[:price_rub].to_f / pack[:tokens]).round(2)
          }
        end.sort_by { |p| p[:tokens] }

        subscription_plans = Payment::SUBSCRIPTION_PRICES.map do |id, plan|
          {
            id: id,
            tokens_per_month: plan[:tokens],
            price: plan[:price_rub],
            currency: 'RUB',
            billing_period: id.include?('yearly') ? 'yearly' : 'monthly',
            is_subscription: true
          }
        end

        render_success({
          token_packs: packs,
          subscription_plans: subscription_plans
        })
      end

      # POST /api/v1/payments
      # Инициация платежа (возвращает payment URL или данные для SDK)
      def create
        payment_type = params.require(:payment_type)
        provider = params[:provider] || 'yookassa'

        case payment_type
        when 'token_pack'
          initiate_token_pack_payment(provider)
        when 'subscription'
          initiate_subscription_payment(provider)
        else
          render_error('Invalid payment type', status: :bad_request)
        end
      end

      private

      def initiate_token_pack_payment(provider)
        pack_id = params.require(:token_pack_id)
        pack = Payment::TOKEN_PACKS[pack_id]

        unless pack
          return render_error('Invalid token pack', status: :bad_request)
        end

        payment = current_user.payments.create!(
          provider: provider,
          external_id: generate_external_id,
          status: 'pending',
          payment_type: 'token_pack',
          amount: pack[:price_rub],
          currency: 'RUB',
          tokens_amount: pack[:tokens],
          token_pack_id: pack_id
        )

        # TODO: Интеграция с YooKassa для получения payment URL
        # Сейчас возвращаем данные для клиента
        render_success({
          payment_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          tokens: payment.tokens_amount,
          provider: provider,
          status: 'pending',
          # confirmation_url: yookassa_url,  # Будет добавлено после интеграции
          message: 'Payment initiated. Complete payment flow on client.'
        }, status: :created)
      end

      def initiate_subscription_payment(provider)
        plan = params.require(:subscription_plan)
        plan_data = Payment::SUBSCRIPTION_PRICES[plan]

        unless plan_data
          return render_error('Invalid subscription plan', status: :bad_request)
        end

        if current_user.subscription&.plan == plan
          return render_error('Already subscribed to this plan', status: :unprocessable_entity)
        end

        payment = current_user.payments.create!(
          provider: provider,
          external_id: generate_external_id,
          status: 'pending',
          payment_type: 'subscription',
          amount: plan_data[:price_rub],
          currency: 'RUB',
          subscription_plan: plan,
          subscription: current_user.subscription
        )

        render_success({
          payment_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          plan: plan,
          provider: provider,
          status: 'pending',
          message: 'Payment initiated. Complete payment flow on client.'
        }, status: :created)
      end

      def generate_external_id
        "obrazz_#{SecureRandom.uuid}"
      end

      def payment_data(payment, detailed: false)
        data = {
          id: payment.id,
          provider: payment.provider,
          status: payment.status,
          payment_type: payment.payment_type,
          amount: payment.amount.to_f,
          currency: payment.currency,
          created_at: payment.created_at.iso8601,
          paid_at: payment.paid_at&.iso8601
        }

        if payment.for_tokens?
          data[:tokens_amount] = payment.tokens_amount
          data[:token_pack_id] = payment.token_pack_id
        end

        if payment.for_subscription?
          data[:subscription_plan] = payment.subscription_plan
        end

        if detailed
          data.merge!(
            external_id: payment.external_id,
            payment_method: payment.payment_method,
            refunded_at: payment.refunded_at&.iso8601,
            error: payment.failed? ? {
              code: payment.error_code,
              message: payment.error_message
            } : nil,
            metadata: payment.metadata
          )
        end

        data
      end
    end
  end
end
