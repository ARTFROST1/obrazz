# frozen_string_literal: true

module Api
  module V1
    module Ai
      class FashionModelController < BaseController
        # POST /api/v1/ai/fashion-model
        # Генерация модели в одежде
        def create
          result = ai_service.create_fashion_model(
            garment_url: params.require(:garment_url),
            prompt: params.require(:prompt),
            style: params[:style],
            negative_prompt: params[:negative_prompt]
          )

          render_success(result, status: :created)
        rescue Ai::GenerationService::InsufficientTokensError => e
          render_error(e.message, status: :payment_required, code: 'insufficient_tokens')
        rescue Ai::GenerationService::GenerationError => e
          render_error(e.message, status: :unprocessable_entity, code: 'generation_error')
        end

        private

        def ai_service
          @ai_service ||= Ai::GenerationService.new(current_user)
        end
      end
    end
  end
end
