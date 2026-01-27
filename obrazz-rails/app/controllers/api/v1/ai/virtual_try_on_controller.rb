# frozen_string_literal: true

module Api
  module V1
    module Ai
      class VirtualTryOnController < BaseController
        # POST /api/v1/ai/virtual-try-on
        # Быстрый endpoint для Virtual Try-On
        def create
          result = ai_service.create_virtual_try_on(
            garment_url: params.require(:garment_url),
            model_url: params.require(:model_url),
            category: params[:category] || 'upper_body'
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
