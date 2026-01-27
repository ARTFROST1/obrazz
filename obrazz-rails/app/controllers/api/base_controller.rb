# frozen_string_literal: true

module Api
  class BaseController < ActionController::API
    include ActionController::HttpAuthentication::Token::ControllerMethods

    # Error handling
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
    rescue_from Auth::SupabaseJwtService::InvalidTokenError, with: :handle_unauthorized
    rescue_from Auth::SupabaseJwtService::ExpiredTokenError, with: :handle_token_expired
    rescue_from Auth::SupabaseJwtService::MissingTokenError, with: :handle_unauthorized

    # Аутентификация
    before_action :authenticate_user!
    before_action :track_activity

    attr_reader :current_user

    protected

    def authenticate_user!
      token = extract_bearer_token
      
      if token.blank?
        render_unauthorized('Missing authentication token')
        return
      end

      jwt_service = Auth::SupabaseJwtService.new(token)
      payload = jwt_service.decode

      # Синхронизируем пользователя с локальной БД
      @current_user = Auth::UserSyncService.sync_from_token(payload)

      unless @current_user&.active?
        render_unauthorized('User account is not active')
      end
    rescue Auth::SupabaseJwtService::InvalidTokenError,
           Auth::SupabaseJwtService::ExpiredTokenError,
           Auth::SupabaseJwtService::MissingTokenError => e
      render_unauthorized(e.message)
    end

    def skip_authentication!
      @current_user = nil
    end

    def track_activity
      current_user&.touch_last_active!
    end

    # Response helpers
    def render_success(data = nil, status: :ok, meta: {})
      response = { success: true }
      response[:data] = data if data
      response[:meta] = meta if meta.present?
      render json: response, status: status
    end

    def render_error(message, status: :bad_request, code: nil, details: nil)
      response = {
        success: false,
        error: {
          message: message,
          code: code || status.to_s
        }
      }
      response[:error][:details] = details if details
      render json: response, status: status
    end

    def render_unauthorized(message = 'Unauthorized')
      render_error(message, status: :unauthorized, code: 'unauthorized')
    end

    def render_forbidden(message = 'Forbidden')
      render_error(message, status: :forbidden, code: 'forbidden')
    end

    def render_not_found(message = 'Resource not found')
      render_error(message, status: :not_found, code: 'not_found')
    end

    def render_validation_error(errors)
      render_error(
        'Validation failed',
        status: :unprocessable_entity,
        code: 'validation_error',
        details: errors
      )
    end

    private

    def extract_bearer_token
      header = request.headers['Authorization']
      return nil unless header.present?
      
      # Формат: "Bearer <token>"
      pattern = /^Bearer /i
      header.gsub(pattern, '') if header.match?(pattern)
    end

    # Error handlers
    def handle_standard_error(error)
      Rails.logger.error "Unhandled error: #{error.class} - #{error.message}"
      Rails.logger.error error.backtrace&.first(10)&.join("\n")

      # Отправляем в Sentry в production
      Sentry.capture_exception(error) if defined?(Sentry) && Rails.env.production?

      render_error(
        Rails.env.production? ? 'Internal server error' : error.message,
        status: :internal_server_error,
        code: 'internal_error'
      )
    end

    def handle_not_found(error)
      render_not_found(error.message)
    end

    def handle_validation_error(error)
      render_validation_error(error.record.errors.full_messages)
    end

    def handle_parameter_missing(error)
      render_error(
        "Missing parameter: #{error.param}",
        status: :bad_request,
        code: 'missing_parameter'
      )
    end

    def handle_unauthorized(error)
      render_unauthorized(error.message)
    end

    def handle_token_expired(_error)
      render_error(
        'Token has expired',
        status: :unauthorized,
        code: 'token_expired'
      )
    end
  end
end
