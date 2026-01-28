# frozen_string_literal: true

module Ai
  class GenerationService
    class InsufficientTokensError < StandardError; end
    class GenerationError < StandardError; end

    def initialize(user)
      @user = user
      @client = TheNewBlackClient.new
      @token_service = Tokens::BalanceService.new(user)
    end

    # ==================== VIRTUAL TRY-ON ====================

    def create_virtual_try_on(garment_url:, model_url:, **options)
      create_generation(
        generation_type: "virtual_try_on",
        input_params: { garment_url: garment_url, model_url: model_url, **options },
        input_image_urls: [ garment_url, model_url ]
      ) do |generation|
        @client.create_virtual_try_on(
          garment_url: garment_url,
          model_url: model_url,
          **options
        )
      end
    end

    # ==================== FASHION MODEL ====================

    def create_fashion_model(garment_url:, prompt:, **options)
      create_generation(
        generation_type: "fashion_model",
        input_params: { garment_url: garment_url, prompt: prompt, **options },
        input_image_urls: [ garment_url ]
      ) do |generation|
        @client.create_fashion_model(
          garment_url: garment_url,
          prompt: prompt,
          **options
        )
      end
    end

    # ==================== VARIATION ====================

    def create_variation(garment_url:, prompt:, **options)
      create_generation(
        generation_type: "variation",
        input_params: { garment_url: garment_url, prompt: prompt, **options },
        input_image_urls: [ garment_url ]
      ) do |generation|
        @client.create_variation(
          garment_url: garment_url,
          prompt: prompt,
          **options
        )
      end
    end

    # ==================== STATUS & MANAGEMENT ====================

    def check_status(generation)
      return generation_response(generation) if generation.completed? || generation.failed?

      begin
        result = @client.get_task_status(generation.external_id)
        update_from_api_status(generation, result)
        generation_response(generation)
      rescue TheNewBlackClient::ApiError => e
        Rails.logger.error "Failed to check status for generation #{generation.id}: #{e.message}"
        generation_response(generation)
      end
    end

    def cancel(generation)
      return { error: "Cannot cancel completed generation" } if generation.completed?
      return { error: "Already cancelled" } if generation.cancelled?

      begin
        @client.cancel_task(generation.external_id) if generation.external_id.present?
      rescue TheNewBlackClient::ApiError => e
        Rails.logger.warn "Failed to cancel task in API: #{e.message}"
      end

      generation.cancel!
      generation_response(generation)
    end

    private

    def create_generation(generation_type:, input_params:, input_image_urls:)
      tokens_cost = AiGeneration::TOKEN_COSTS[generation_type] || 1

      # Проверяем баланс
      unless @user.can_generate?(tokens_cost)
        raise InsufficientTokensError, "Insufficient tokens. Need #{tokens_cost}, have #{@token_service.available_balance}"
      end

      generation = nil

      ActiveRecord::Base.transaction do
        # Создаём запись генерации
        generation = @user.ai_generations.create!(
          generation_type: generation_type,
          status: "pending",
          tokens_cost: tokens_cost,
          input_params: input_params,
          input_image_urls: input_image_urls
        )

        # Списываем токены
        @token_service.debit_for_generation!(
          amount: tokens_cost,
          ai_generation: generation
        )

        # Вызываем API
        begin
          api_response = yield(generation)

          generation.update!(
            external_id: api_response[:task_id] || api_response[:id],
            external_status: api_response[:status],
            status: "processing",
            started_at: Time.current
          )
        rescue TheNewBlackClient::ApiError => e
          generation.fail!(e.error_code || "api_error", e.message)
          raise GenerationError, e.message
        end
      end

      # Запускаем job для проверки статуса
      AiGenerationStatusJob.perform_later(generation.id)

      generation_response(generation)
    end

    def update_from_api_status(generation, result)
      case result[:status]
      when "completed", "done", "success"
        images = result[:images] || result[:output_images] || [ result[:image_url] ].compact
        generation.complete!(images, result)
      when "failed", "error"
        error_message = result[:error] || result[:message] || "Generation failed"
        generation.fail!("generation_failed", error_message)
      when "processing", "pending", "queued"
        generation.update!(external_status: result[:status])
      end
    end

    def generation_response(generation)
      {
        id: generation.id,
        type: generation.generation_type,
        status: generation.status,
        tokens_cost: generation.tokens_cost,
        input_params: generation.input_params,
        output_images: generation.output_image_urls,
        error: generation.failed? ? { code: generation.error_code, message: generation.error_message } : nil,
        created_at: generation.created_at.iso8601,
        completed_at: generation.completed_at&.iso8601,
        processing_time_ms: generation.processing_time_ms
      }
    end
  end
end
