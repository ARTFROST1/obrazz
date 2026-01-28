# frozen_string_literal: true

require "json"
require "securerandom"

module Payments
  class YookassaService
    API_BASE = "https://api.yookassa.ru".freeze

    def initialize(shop_id: ENV["YOOKASSA_SHOP_ID"], secret_key: ENV["YOOKASSA_SECRET_KEY"])
      @shop_id = shop_id
      @secret_key = secret_key
    end

    # Creates a redirect-based payment in YooKassa.
    #
    # Params:
    # - amount: Numeric (RUB)
    # - currency: String (default 'RUB')
    # - description: String
    # - metadata: Hash (optional)
    # - return_url: String
    #
    # Returns:
    # { success: true, payment_id: '...', confirmation_url: '...' }
    # or
    # { success: false, error: '...' }
    def create_payment(amount:, currency: "RUB", description:, metadata: {}, return_url:)
      return { success: false, error: "YooKassa не настроена (нет YOOKASSA_SHOP_ID/YOOKASSA_SECRET_KEY)" } unless configured?

      idempotence_key = SecureRandom.uuid
      payload = {
        amount: {
          value: format("%.2f", amount.to_f),
          currency: currency
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: return_url
        },
        description: description,
        metadata: metadata || {}
      }

      response = connection.post("/v3/payments") do |req|
        req.headers["Content-Type"] = "application/json"
        req.headers["Accept"] = "application/json"
        req.headers["Idempotence-Key"] = idempotence_key
        req.body = JSON.generate(payload)
      end

      if response.success?
        body = safe_parse_json(response.body)
        confirmation_url = body.dig("confirmation", "confirmation_url")

        return {
          success: false,
          error: "YooKassa: не удалось получить confirmation_url"
        } if confirmation_url.blank?

        {
          success: true,
          payment_id: body["id"],
          confirmation_url: confirmation_url,
          status: body["status"]
        }
      else
        error_message = safe_parse_json(response.body).fetch("description", nil)

        {
          success: false,
          error: error_message.presence || "YooKassa error: HTTP #{response.status}"
        }
      end
    rescue Faraday::Error => e
      { success: false, error: "YooKassa network error: #{e.message}" }
    rescue StandardError => e
      { success: false, error: "YooKassa unexpected error: #{e.message}" }
    end

    private

    def configured?
      @shop_id.present? && @secret_key.present?
    end

    def connection
      @connection ||= Faraday.new(url: API_BASE) do |f|
        f.request :authorization, :basic, @shop_id, @secret_key
        f.adapter Faraday.default_adapter
      end
    end

    def safe_parse_json(value)
      return {} if value.blank?
      value.is_a?(Hash) ? value : JSON.parse(value)
    rescue JSON::ParserError
      {}
    end
  end
end
