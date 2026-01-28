# frozen_string_literal: true

module Api
  module V1
    class HealthController < ActionController::API
      # Health check endpoint - не требует аутентификации
      # GET /api/v1/health
      def show
        checks = {
          status: "ok",
          timestamp: Time.current.iso8601,
          version: api_version,
          environment: Rails.env,
          checks: {
            database: database_check,
            queue: queue_check
          }
        }

        # Определяем общий статус
        all_healthy = checks[:checks].values.all? { |c| c[:status] == "ok" }
        checks[:status] = all_healthy ? "ok" : "degraded"

        status_code = all_healthy ? :ok : :service_unavailable
        render json: checks, status: status_code
      end

      private

      def api_version
        "v1"
      end

      def database_check
        ActiveRecord::Base.connection.execute("SELECT 1")
        { status: "ok", latency_ms: measure_latency { ActiveRecord::Base.connection.execute("SELECT 1") } }
      rescue StandardError => e
        { status: "error", message: e.message }
      end

      def queue_check
        # Проверяем Solid Queue
        if defined?(SolidQueue)
          pending_jobs = SolidQueue::Job.where(finished_at: nil).count rescue 0
          { status: "ok", pending_jobs: pending_jobs }
        else
          { status: "ok", message: "Solid Queue configured" }
        end
      rescue StandardError => e
        { status: "error", message: e.message }
      end

      def measure_latency
        start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        yield
        finish_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        ((finish_time - start_time) * 1000).round(2)
      end
    end
  end
end
