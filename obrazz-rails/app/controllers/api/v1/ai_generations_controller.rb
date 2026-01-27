# frozen_string_literal: true

module Api
  module V1
    class AiGenerationsController < BaseController
      # GET /api/v1/ai_generations
      # Список генераций пользователя
      def index
        generations = current_user.ai_generations
                                  .recent
                                  .limit(params[:limit] || 20)
                                  .offset(params[:offset] || 0)

        # Фильтр по типу
        generations = generations.by_type(params[:type]) if params[:type].present?
        
        # Фильтр по статусу
        generations = generations.where(status: params[:status]) if params[:status].present?

        render_success(
          generations.map { |g| generation_data(g) },
          meta: {
            total: current_user.ai_generations.count,
            limit: params[:limit] || 20,
            offset: params[:offset] || 0
          }
        )
      end

      # GET /api/v1/ai_generations/:id
      # Детали генерации
      def show
        generation = current_user.ai_generations.find(params[:id])
        render_success(generation_data(generation, detailed: true))
      end

      # POST /api/v1/ai_generations
      # Создание новой генерации (универсальный endpoint)
      def create
        result = case generation_params[:type]
                 when 'virtual_try_on'
                   ai_service.create_virtual_try_on(**virtual_try_on_params)
                 when 'fashion_model'
                   ai_service.create_fashion_model(**fashion_model_params)
                 when 'variation'
                   ai_service.create_variation(**variation_params)
                 else
                   return render_error('Invalid generation type', status: :bad_request)
                 end

        render_success(result, status: :created)
      rescue Ai::GenerationService::InsufficientTokensError => e
        render_error(e.message, status: :payment_required, code: 'insufficient_tokens')
      rescue Ai::GenerationService::GenerationError => e
        render_error(e.message, status: :unprocessable_entity, code: 'generation_error')
      end

      # GET /api/v1/ai_generations/:id/status
      # Проверка статуса генерации
      def status
        generation = current_user.ai_generations.find(params[:id])
        result = ai_service.check_status(generation)
        render_success(result)
      end

      # POST /api/v1/ai_generations/:id/cancel
      # Отмена генерации
      def cancel
        generation = current_user.ai_generations.find(params[:id])
        result = ai_service.cancel(generation)
        
        if result[:error]
          render_error(result[:error], status: :unprocessable_entity)
        else
          render_success(result)
        end
      end

      private

      def ai_service
        @ai_service ||= Ai::GenerationService.new(current_user)
      end

      def generation_params
        params.permit(:type, :garment_url, :model_url, :prompt, :category, :style,
                      :negative_prompt, :strength, :num_variations)
      end

      def virtual_try_on_params
        {
          garment_url: params.require(:garment_url),
          model_url: params.require(:model_url),
          category: params[:category]
        }.compact
      end

      def fashion_model_params
        {
          garment_url: params.require(:garment_url),
          prompt: params.require(:prompt),
          style: params[:style],
          negative_prompt: params[:negative_prompt]
        }.compact
      end

      def variation_params
        {
          garment_url: params.require(:garment_url),
          prompt: params.require(:prompt),
          strength: params[:strength]&.to_f,
          num_variations: params[:num_variations]&.to_i
        }.compact
      end

      def generation_data(generation, detailed: false)
        data = {
          id: generation.id,
          type: generation.generation_type,
          status: generation.status,
          tokens_cost: generation.tokens_cost,
          output_images: generation.output_image_urls,
          primary_image: generation.primary_output_url,
          created_at: generation.created_at.iso8601,
          completed_at: generation.completed_at&.iso8601
        }

        if detailed
          data.merge!(
            input_params: generation.input_params,
            input_images: generation.input_image_urls,
            output_metadata: generation.output_metadata,
            processing_time_ms: generation.processing_time_ms,
            error: generation.failed? ? {
              code: generation.error_code,
              message: generation.error_message
            } : nil
          )
        end

        data
      end
    end
  end
end
