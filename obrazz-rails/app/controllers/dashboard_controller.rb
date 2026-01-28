# frozen_string_literal: true

class DashboardController < ActionController::Base
  # Dashboard использует обычный ActionController::Base для рендеринга HTML
  # API контроллеры используют ActionController::API

  layout "dashboard"

  before_action :authenticate_user!
  before_action :set_current_user

  helper_method :current_user, :user_signed_in?

  private

  def authenticate_user!
    return if user_signed_in?

    # Проверяем JWT токен из cookie или session
    token = session[:auth_token] || cookies.signed[:auth_token]

    if token.present?
      begin
        jwt_service = Auth::SupabaseJwtService.new(token)
        payload = jwt_service.decode
        supabase_id = payload[:sub]

        @current_user = User.find_by(supabase_id: supabase_id)

        if @current_user.nil?
          # Создаём пользователя если не существует (sync from Supabase)
          @current_user = User.create!(
            supabase_id: supabase_id,
            email: payload[:email],
            username: payload[:user_metadata]&.dig(:username),
            full_name: payload[:user_metadata]&.dig(:full_name),
            avatar_url: payload[:user_metadata]&.dig(:avatar_url),
            status: "active"
          )
        end

        @current_user.touch_last_active!
        session[:user_id] = @current_user.id
      rescue Auth::SupabaseJwtService::InvalidTokenError,
             Auth::SupabaseJwtService::ExpiredTokenError,
             Auth::SupabaseJwtService::MissingTokenError => e
        Rails.logger.warn "JWT Auth failed: #{e.message}"
        redirect_to_login
      end
    else
      redirect_to_login
    end
  end

  def set_current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def current_user
    @current_user
  end

  def user_signed_in?
    current_user.present?
  end

  def redirect_to_login
    # Перенаправляем на страницу логина
    session[:return_to] = request.fullpath
    redirect_to login_path, alert: "Пожалуйста, войдите в систему"
  end
end
