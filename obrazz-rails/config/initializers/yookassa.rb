# frozen_string_literal: true

# YooKassa Configuration for Obrazz
# ==================================
# YooKassa (ЮKassa) is used for Russian payments (RUB)
#
# Required environment variables:
# - YOOKASSA_SHOP_ID: Your shop ID from YooKassa dashboard
# - YOOKASSA_SECRET_KEY: Secret API key for backend API calls
# - YOOKASSA_WEBHOOK_SECRET: Secret for webhook signature verification (optional)
#
# YooKassa Dashboard: https://yookassa.ru/my
#
# Obrazz Pricing in RUB:
#   - Pro Monthly: 299₽/month
#   - Pro Yearly: 2499₽/year (208₽/month, save 17%)
#   - Token Pack 10: 99₽ (9.9₽ per token)
#   - Token Pack 50: 399₽ (7.98₽ per token, save 20%)
#   - Token Pack 100: 699₽ (6.99₽ per token, save 29%)
#   - Token Pack 500: 2999₽ (6₽ per token, save 39%)

unless ENV["SECRET_KEY_BASE_DUMMY"]
  if ENV["YOOKASSA_SHOP_ID"].present? && ENV["YOOKASSA_SECRET_KEY"].present?
    Rails.logger.info "[YooKassa] Configured with shop_id: #{ENV['YOOKASSA_SHOP_ID']}"
  else
    Rails.logger.warn "[YooKassa] YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY not set. YooKassa payments will not work."
  end
end

# YooKassa configuration helper module
module YookassaConfig
  class << self
    # Check if YooKassa is properly configured
    def enabled?
      ENV["YOOKASSA_SHOP_ID"].present? && ENV["YOOKASSA_SECRET_KEY"].present?
    end

    def shop_id
      ENV["YOOKASSA_SHOP_ID"]
    end

    def secret_key
      ENV["YOOKASSA_SECRET_KEY"]
    end

    def webhook_secret
      ENV["YOOKASSA_WEBHOOK_SECRET"]
    end

    def webhook_verification_enabled?
      webhook_secret.present?
    end

    # API Base URL
    def api_base
      "https://api.yookassa.ru"
    end

    # ====================
    # SUBSCRIPTION PRICES
    # ====================

    def pro_monthly_price_rub
      299
    end

    def pro_yearly_price_rub
      2499
    end

    def tokens_per_subscription
      100
    end

    # Get subscription price by plan name
    def subscription_price_rub(plan)
      case plan.to_s
      when "pro_monthly" then pro_monthly_price_rub
      when "pro_yearly" then pro_yearly_price_rub
      else 0
      end
    end

    # ====================
    # TOKEN PACK PRICES
    # ====================

    def token_packs
      {
        "pack_10" => { tokens: 10, price_rub: 99 },
        "pack_50" => { tokens: 50, price_rub: 399 },
        "pack_100" => { tokens: 100, price_rub: 699 },
        "pack_500" => { tokens: 500, price_rub: 2999 }
      }
    end

    def token_pack_price_rub(pack_id)
      token_packs.dig(pack_id, :price_rub) || 0
    end

    def token_pack_tokens(pack_id)
      token_packs.dig(pack_id, :tokens) || 0
    end

    # ====================
    # RETURN URLs
    # ====================

    def return_url_for(type)
      base = ENV.fetch("APP_URL", "http://localhost:3000")
      case type.to_sym
      when :subscription
        "#{base}/dashboard/subscription"
      when :tokens
        "#{base}/dashboard/tokens"
      else
        "#{base}/dashboard"
      end
    end

    # ====================
    # HELPERS
    # ====================

    # Format price for YooKassa API (2 decimal places)
    def format_price(amount_rub)
      format("%.2f", amount_rub.to_f)
    end

    # Build description for payment
    def payment_description(type, plan_or_pack_id)
      case type.to_sym
      when :subscription
        plan_name = plan_or_pack_id == "pro_yearly" ? "Pro Yearly" : "Pro Monthly"
        "Подписка Obrazz #{plan_name}"
      when :tokens
        tokens = token_pack_tokens(plan_or_pack_id)
        "Покупка #{tokens} токенов Obrazz"
      else
        "Оплата Obrazz"
      end
    end
  end
end
