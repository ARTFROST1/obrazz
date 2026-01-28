# frozen_string_literal: true

module Dashboard
  class SessionsController < DashboardController
    layout "auth"

    skip_before_action :authenticate_user!, only: [ :new, :create, :callback ]

    # GET /login
    def new
      # Показываем форму входа
      # Пользователь может войти через:
      # 1. Email + Magic Link (через Supabase)
      # 2. Redirect из мобильного приложения с токеном
    end

    # POST /login
    def create
      email = params[:email]
      password = params[:password]
      remember_me = params[:remember_me] == "1"

      if email.present? && password.present?
        authenticate_with_supabase(email, password, remember_me)
      else
        redirect_to login_path, alert: "Введите email и пароль"
      end
    end

    # GET /auth/callback
    # Обрабатывает callback от Supabase после Magic Link
    def callback
      # Supabase добавляет токены в hash fragment (#)
      # Но hash не передаётся на сервер, поэтому используем JS
      # для извлечения и отправки токена
    end

    # DELETE /logout
    def destroy
      session.delete(:auth_token)
      session.delete(:user_id)
      cookies.delete(:auth_token)

      redirect_to login_path, notice: "Вы успешно вышли из системы"
    end

    private

    def authenticate_with_supabase(email, password, remember_me)
      begin
        # Аутентификация через Supabase Auth API
        auth_client = Auth::SupabaseAuthClient.new
        response = auth_client.sign_in(email: email, password: password)

        if response.success? && response.access_token
          token = response.access_token

          # Сохраняем токен в session/cookies
          session[:auth_token] = token

          if remember_me
            cookies.signed[:auth_token] = {
              value: token,
              httponly: true,
              secure: Rails.env.production?,
              expires: 7.days.from_now
            }
          end

          # Синхронизируем пользователя с локальной БД
          user = sync_user_from_response(response)
          session[:user_id] = user.id
          user.touch_last_active!

          redirect_to session.delete(:return_to) || dashboard_root_path,
                      notice: "Добро пожаловать!"
        else
          redirect_to login_path, alert: response.error || "Неверный email или пароль"
        end
      rescue StandardError => e
        Rails.logger.error "Supabase Auth Error: #{e.message}\n#{e.backtrace.join("\n")}"
        redirect_to login_path, alert: "Ошибка аутентификации. Попробуйте позже."
      end
    end

    def sync_user_from_response(response)
      user_data = response.user
      User.find_or_create_by!(supabase_id: user_data.id) do |u|
        u.email = user_data.email
        u.username = user_data.user_metadata&.dig("username")
        u.full_name = user_data.user_metadata&.dig("full_name")
        u.avatar_url = user_data.user_metadata&.dig("avatar_url")
        u.status = "active"
      end
    end

    # Поддержка входа через токен из мобильного приложения
    def authenticate_with_token(token)
      begin
        jwt_service = Auth::SupabaseJwtService.new(token)
        payload = jwt_service.decode

        # Сохраняем токен в session
        session[:auth_token] = token
        cookies.signed[:auth_token] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          expires: 7.days.from_now
        }

        # Синхронизируем пользователя
        supabase_id = payload[:sub]
        user = User.find_or_create_by!(supabase_id: supabase_id) do |u|
          u.email = payload[:email]
          u.username = payload[:user_metadata]&.dig(:username)
          u.full_name = payload[:user_metadata]&.dig(:full_name)
          u.avatar_url = payload[:user_metadata]&.dig(:avatar_url)
          u.status = "active"
        end

        session[:user_id] = user.id
        user.touch_last_active!

        redirect_to session.delete(:return_to) || dashboard_root_path,
                    notice: "Добро пожаловать!"
      rescue Auth::SupabaseJwtService::InvalidTokenError,
             Auth::SupabaseJwtService::ExpiredTokenError => e
        redirect_to login_path, alert: "Ошибка аутентификации: #{e.message}"
      end
    end
  end
end
