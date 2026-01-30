# frozen_string_literal: true

module Dashboard
  class OauthController < DashboardController
    layout "auth"

    skip_before_action :authenticate_user!, only: [ :google, :apple, :callback ]

    # POST /auth/google
    # Инициирует OAuth flow через Supabase для Google
    def google
      authorize_with_provider("google")
    end

    # POST /auth/apple
    # Инициирует OAuth flow через Supabase для Apple
    def apple
      authorize_with_provider("apple")
    end

    # GET /auth/oauth/callback
    # Универсальный callback для OAuth провайдеров
    def callback
      # Supabase отправляет токены в hash fragment (#access_token=...)
      # Они обрабатываются на клиенте через JavaScript
      # После чего JS отправляет токен на /auth/token

      # Проверяем query params на наличие ошибки
      if params[:error].present?
        error_message = params[:error_description] || params[:error]
        redirect_to login_path, alert: "Ошибка OAuth: #{error_message}"
        return
      end

      # Рендерим страницу, которая извлечёт токен из hash fragment
      render "callback"
    end

    # POST /auth/token
    # Принимает токен из JavaScript после OAuth callback
    def token
      access_token = params[:access_token]
      refresh_token = params[:refresh_token]

      if access_token.blank?
        respond_to do |format|
          format.html { redirect_to login_path, alert: "Токен не получен" }
          format.json { render json: { error: "Token missing" }, status: :bad_request }
        end
        return
      end

      authenticate_with_oauth_token(access_token, refresh_token)
    end

    private

    def authorize_with_provider(provider)
      # Формируем URL для OAuth через Supabase
      supabase_url = ENV.fetch("SUPABASE_URL")
      redirect_uri = auth_oauth_callback_url

      # Supabase OAuth URL
      oauth_url = "#{supabase_url}/auth/v1/authorize?" + {
        provider: provider,
        redirect_to: redirect_uri,
        scopes: provider == "google" ? "email profile" : "email name"
      }.to_query

      Rails.logger.info "OAuth redirect to: #{oauth_url}"

      redirect_to oauth_url, allow_other_host: true
    end

    def authenticate_with_oauth_token(access_token, refresh_token)
      begin
        # Валидируем токен через наш JWT service
        jwt_service = Auth::SupabaseJwtService.new(access_token)
        payload = jwt_service.decode

        # Сохраняем токен в session
        session[:auth_token] = access_token
        cookies.signed[:auth_token] = {
          value: access_token,
          httponly: true,
          secure: Rails.env.production?,
          expires: 7.days.from_now
        }

        if refresh_token.present?
          cookies.signed[:refresh_token] = {
            value: refresh_token,
            httponly: true,
            secure: Rails.env.production?,
            expires: 30.days.from_now
          }
        end

        # Синхронизируем/создаём пользователя
        user = sync_or_create_user(payload)
        session[:user_id] = user.id
        user.touch_last_active!

        respond_to do |format|
          format.html { redirect_to dashboard_root_path, notice: "Добро пожаловать!" }
          format.json { render json: { success: true, redirect_to: dashboard_root_path } }
        end
      rescue Auth::SupabaseJwtService::InvalidTokenError,
             Auth::SupabaseJwtService::ExpiredTokenError => e
        Rails.logger.error "OAuth token validation failed: #{e.message}"
        respond_to do |format|
          format.html { redirect_to login_path, alert: "Ошибка аутентификации: #{e.message}" }
          format.json { render json: { error: e.message }, status: :unauthorized }
        end
      rescue StandardError => e
        Rails.logger.error "OAuth authentication error: #{e.message}\n#{e.backtrace.join("\n")}"
        respond_to do |format|
          format.html { redirect_to login_path, alert: "Ошибка аутентификации. Попробуйте позже." }
          format.json { render json: { error: "Authentication failed" }, status: :internal_server_error }
        end
      end
    end

    def sync_or_create_user(payload)
      supabase_id = payload[:sub]
      email = payload[:email]
      user_metadata = payload[:user_metadata] || {}

      user = User.find_or_initialize_by(supabase_id: supabase_id)

      # Определяем данные из OAuth
      full_name = user_metadata["full_name"] ||
                  user_metadata["name"] ||
                  "#{user_metadata['given_name']} #{user_metadata['family_name']}".strip

      avatar_url = user_metadata["avatar_url"] ||
                   user_metadata["picture"]

      # Обновляем данные пользователя
      user.assign_attributes(
        email: email,
        full_name: full_name.presence,
        avatar_url: avatar_url,
        status: "active"
      )

      # Генерируем username если его нет
      if user.username.blank?
        user.username = generate_username(email, full_name)
      end

      is_new_user = user.new_record?
      user.save!

      # Создаём бонусные токены для новых пользователей
      create_welcome_bonus(user) if is_new_user

      user
    end

    def generate_username(email, full_name)
      base = if full_name.present?
        full_name.downcase.gsub(/[^a-z0-9]/, "")
      else
        email.split("@").first.downcase.gsub(/[^a-z0-9]/, "")
      end

      username = base[0, 20]
      counter = 0

      while User.exists?(username: username)
        counter += 1
        username = "#{base[0, 17]}#{counter}"
      end

      username
    end

    def create_welcome_bonus(user)
      return if user.token_balances.exists?(balance_type: "bonus_tokens")

      TokenBalance.create!(
        user: user,
        balance_type: "bonus_tokens",
        amount: 3,
        expires_at: 30.days.from_now
      )

      TokenTransaction.create!(
        user: user,
        transaction_type: "credit",
        amount: 3,
        balance_type: "bonus_tokens",
        description: "Welcome bonus"
      )
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.warn "Failed to create welcome bonus: #{e.message}"
    end
  end
end
