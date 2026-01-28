# frozen_string_literal: true

module Api
  module V1
    module Ai
      class VariationController < BaseController
        # POST /api/v1/ai/variation
        # Генерация вариаций одежды
        def create
          result = ai_service.create_variation(
            garment_url: params.require(:garment_url),
            prompt: params.require(:prompt),
            strength: params[:strength]&.to_f,
            num_variations: params[:num_variations]&.to_i || 1
          )

          render_success(result, status: :created)
        rescue Ai::GenerationService::InsufficientTokensError => e
          render_error(e.message, status: :payment_required, code: "insufficient_tokens")
        rescue Ai::GenerationService::GenerationError => e
          render_error(e.message, status: :unprocessable_entity, code: "generation_error")
        end

        private

        def ai_service
          @ai_service ||= Ai::GenerationService.new(current_user)
        end
      end
    end
  end
end
