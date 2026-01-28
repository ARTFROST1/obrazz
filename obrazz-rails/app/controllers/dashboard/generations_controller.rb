# frozen_string_literal: true

module Dashboard
  class GenerationsController < DashboardController
    before_action :set_generation, only: [ :show, :download ]

    # GET /dashboard/generations
    def index
      @generations = current_user.ai_generations
                                  .order(created_at: :desc)
                                  .page(params[:page])
                                  .per(12)

      @filter = params[:filter] || "all"

      case @filter
      when "virtual_tryon", "virtual_try_on"
        @generations = @generations.where(generation_type: "virtual_try_on")
      when "fashion_model"
        @generations = @generations.where(generation_type: "fashion_model")
      when "variation"
        @generations = @generations.where(generation_type: "variation")
      when "completed"
        @generations = @generations.where(status: "completed")
      when "failed"
        @generations = @generations.where(status: "failed")
      end

      @stats = {
        total: current_user.ai_generations.count,
        completed: current_user.ai_generations.where(status: "completed").count,
        failed: current_user.ai_generations.where(status: "failed").count,
        pending: current_user.ai_generations.where(status: %w[pending processing]).count
      }
    end

    # GET /dashboard/generations/:id
    def show
      @related_generations = current_user.ai_generations
                                          .where(generation_type: @generation.generation_type)
                                          .where.not(id: @generation.id)
                                          .order(created_at: :desc)
                                          .limit(4)
    end

    # GET /dashboard/generations/:id/download
    def download
      if @generation.primary_output_url.present?
        redirect_to @generation.primary_output_url, allow_other_host: true
      else
        redirect_to dashboard_generation_path(@generation), alert: "Изображение недоступно"
      end
    end

    private

    def set_generation
      @generation = current_user.ai_generations.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      redirect_to dashboard_generations_path, alert: "Генерация не найдена"
    end
  end
end
