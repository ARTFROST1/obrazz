# frozen_string_literal: true

module Ai
  class TheNewBlackClient
    BASE_URL = ENV.fetch('THE_NEW_BLACK_API_URL', 'https://api.thenewblack.ai')
    
    class ApiError < StandardError
      attr_reader :status_code, :error_code, :response_body

      def initialize(message, status_code: nil, error_code: nil, response_body: nil)
        @status_code = status_code
        @error_code = error_code
        @response_body = response_body
        super(message)
      end
    end

    class RateLimitError < ApiError; end
    class AuthenticationError < ApiError; end
    class ValidationError < ApiError; end

    def initialize
      @api_key = ENV.fetch('THE_NEW_BLACK_API_KEY')
      @connection = build_connection
    end

    # ==================== VIRTUAL TRY-ON ====================
    
    # Создаёт задачу Virtual Try-On
    # @param garment_url [String] URL изображения одежды
    # @param model_url [String] URL фото модели
    # @param options [Hash] Дополнительные параметры
    # @return [Hash] { task_id: '...', status: 'pending' }
    def create_virtual_try_on(garment_url:, model_url:, **options)
      post('/v1/virtual-try-on', {
        garment_image: garment_url,
        model_image: model_url,
        category: options[:category] || 'upper_body',
        **options.except(:category)
      })
    end

    # ==================== FASHION MODEL ====================
    
    # Создаёт задачу Fashion Model (генерация модели в одежде)
    # @param garment_url [String] URL изображения одежды
    # @param prompt [String] Описание модели
    # @param options [Hash] Дополнительные параметры
    # @return [Hash] { task_id: '...', status: 'pending' }
    def create_fashion_model(garment_url:, prompt:, **options)
      post('/v1/fashion-model', {
        garment_image: garment_url,
        prompt: prompt,
        negative_prompt: options[:negative_prompt],
        style: options[:style] || 'photorealistic',
        **options.except(:negative_prompt, :style)
      })
    end

    # ==================== CLOTHING VARIATIONS ====================
    
    # Создаёт вариации дизайна одежды
    # @param garment_url [String] URL изображения одежды
    # @param prompt [String] Описание изменений
    # @param options [Hash] Дополнительные параметры
    # @return [Hash] { task_id: '...', status: 'pending' }
    def create_variation(garment_url:, prompt:, **options)
      post('/v1/clothing-variations', {
        garment_image: garment_url,
        prompt: prompt,
        strength: options[:strength] || 0.5,
        num_variations: options[:num_variations] || 1,
        **options.except(:strength, :num_variations)
      })
    end

    # ==================== COMMON ====================

    # Получает статус задачи
    # @param task_id [String] ID задачи
    # @return [Hash] { status: 'completed', images: [...] }
    def get_task_status(task_id)
      get("/v1/tasks/#{task_id}")
    end

    # Отменяет задачу
    # @param task_id [String] ID задачи
    def cancel_task(task_id)
      post("/v1/tasks/#{task_id}/cancel", {})
    end

    private

    def build_connection
      Faraday.new(url: BASE_URL) do |conn|
        conn.request :json
        conn.request :multipart
        conn.response :json, content_type: /\bjson$/
        conn.response :raise_error
        
        conn.headers['Authorization'] = "Bearer #{@api_key}"
        conn.headers['Content-Type'] = 'application/json'
        conn.headers['Accept'] = 'application/json'
        
        conn.options.timeout = 60
        conn.options.open_timeout = 10
        
        conn.adapter Faraday.default_adapter
      end
    end

    def get(path)
      response = @connection.get(path)
      parse_response(response)
    rescue Faraday::Error => e
      handle_error(e)
    end

    def post(path, body)
      response = @connection.post(path, body.to_json)
      parse_response(response)
    rescue Faraday::Error => e
      handle_error(e)
    end

    def parse_response(response)
      return {} if response.body.blank?
      
      response.body.is_a?(Hash) ? response.body.deep_symbolize_keys : response.body
    end

    def handle_error(error)
      response = error.response
      status = response&.dig(:status) || 0
      body = response&.dig(:body) || {}
      
      error_message = body.is_a?(Hash) ? body.dig('error', 'message') || body['message'] : body.to_s
      error_code = body.is_a?(Hash) ? body.dig('error', 'code') || body['code'] : nil

      case status
      when 401
        raise AuthenticationError.new(
          "Authentication failed: #{error_message}",
          status_code: status,
          error_code: 'auth_error'
        )
      when 429
        raise RateLimitError.new(
          "Rate limit exceeded: #{error_message}",
          status_code: status,
          error_code: 'rate_limit'
        )
      when 400, 422
        raise ValidationError.new(
          "Validation error: #{error_message}",
          status_code: status,
          error_code: error_code,
          response_body: body
        )
      else
        raise ApiError.new(
          "API error (#{status}): #{error_message}",
          status_code: status,
          error_code: error_code,
          response_body: body
        )
      end
    end
  end
end
