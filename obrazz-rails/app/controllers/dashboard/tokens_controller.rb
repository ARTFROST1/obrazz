# frozen_string_literal: true

module Dashboard
  class TokensController < DashboardController
    # GET /dashboard/tokens
    def index
      @token_balance = current_user.available_tokens
      @token_balances = current_user.token_balances
                                     .where("expires_at IS NULL OR expires_at > ?", Time.current)
                                     .order(created_at: :desc)
      @recent_transactions = current_user.token_transactions
                                          .includes(:ai_generation, :token_balance)
                                          .order(created_at: :desc)
                                          .limit(20)

      @token_packs = token_packs
    end

    # GET /dashboard/tokens/history
    def history
      @transactions = current_user.token_transactions
                                   .includes(:ai_generation, :token_balance)
                                   .order(created_at: :desc)
                                   .page(params[:page])
                                   .per(25)
    end

    # POST /dashboard/tokens/purchase
    def purchase
      pack_id = params[:pack_id]
      pack = token_packs.find { |p| p[:id] == pack_id }

      unless pack
        redirect_to dashboard_tokens_path, alert: "Неверный пакет токенов"
        return
      end

      # Создаём локальный платёж и платёж в YooKassa.
      # Локальный платёж создаём первым, чтобы прокинуть его id в metadata YooKassa.
      payment = current_user.payments.create!(
        provider: "yookassa",
        external_id: "local_#{SecureRandom.uuid}",
        status: "pending",
        payment_type: "token_pack",
        amount: pack[:price],
        currency: "RUB",
        tokens_amount: pack[:tokens],
        token_pack_id: pack_id,
        metadata: {
          pack_id: pack_id,
          tokens: pack[:tokens]
        }
      )

      result = Payments::YookassaService.new.create_payment(
        amount: pack[:price],
        currency: "RUB",
        description: "Покупка #{pack[:tokens]} токенов Obrazz",
        metadata: {
          internal_payment_id: payment.id,
          user_id: current_user.id,
          pack_id: pack_id,
          tokens: pack[:tokens]
        },
        return_url: dashboard_tokens_url
      )

      if result[:success]
        payment.update!(external_id: result[:payment_id], external_status: "pending")
        redirect_to result[:confirmation_url], allow_other_host: true
      else
        payment.update!(status: "failed", error_message: result[:error])
        redirect_to dashboard_tokens_path, alert: "Ошибка создания платежа: #{result[:error]}"
      end
    end

    private

    def token_packs
      [
        {
          id: "pack_10",
          tokens: 10,
          price: 99,
          popular: false,
          description: "Небольшой пакет"
        },
        {
          id: "pack_50",
          tokens: 50,
          price: 399,
          popular: true,
          description: "Популярный выбор",
          savings: 96
        },
        {
          id: "pack_100",
          tokens: 100,
          price: 699,
          popular: false,
          description: "Максимум экономии",
          savings: 291
        },
        {
          id: "pack_200",
          tokens: 200,
          price: 1199,
          popular: false,
          description: "Для активных пользователей",
          savings: 781
        }
      ]
    end
  end
end
