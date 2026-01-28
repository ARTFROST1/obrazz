# frozen_string_literal: true

module Admin
  class AiGenerationsController < AdminController
    def index
      @generations = AiGeneration.includes(:user)
                                 .order(created_at: :desc)
                                 .page(params[:page])
                                 .per(20)

      # Apply filters
      if params[:type].present?
        @generations = @generations.where(generation_type: params[:type])
      end

      if params[:status].present?
        @generations = @generations.where(status: params[:status])
      end

      if params[:user_id].present?
        @generations = @generations.where(user_id: params[:user_id])
      end

      @stats = {
        total: AiGeneration.count,
        today: AiGeneration.where("created_at >= ?", Date.current.beginning_of_day).count,
        by_type: AiGeneration.group(:generation_type).count,
        by_status: AiGeneration.group(:status).count,
        avg_processing_time: begin
          avg_ms = AiGeneration.where.not(processing_time_ms: nil).average(:processing_time_ms)
          avg_ms ? (avg_ms.to_f / 1000).round(2) : nil
        end
      }
    end

    def show
      @generation = AiGeneration.includes(:user).find(params[:id])
    end
  end
end
