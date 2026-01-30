# frozen_string_literal: true

module Dashboard
  class RegistrationsController < DashboardController
    layout "auth"

    skip_before_action :authenticate_user!, only: [ :new, :create ]

    # GET /signup
    def new
      # Показываем форму регистрации
    end

    # POST /signup
    def create
      email = params[:email]
      password = params[:password]
      password_confirmation = params[:password_confirmation]
      username = params[:username]

      # Валидация
      if email.blank? || password.blank?
        redirect_to signup_path, alert: "Введите email и пароль"
        return
      end

      if password != password_confirmation
        redirect_to signup_path, alert: "Пароли не совпадают"
        return
      end

      if password.length < 6
        redirect_to signup_path, alert: "Пароль должен быть не менее 6 символов"
        return
      end

      # Регистрация через Supabase
      register_with_supabase(email, password, username)
    end

    private

    def register_with_supabase(email, password, username)
      begin
        auth_client = Auth::SupabaseAuthClient.new
        response = auth_client.sign_up(
          email: email,
          password: password,
          username: username,
          full_name: username
        )

        if response.success?
          if response.access_token
            # Пользователь сразу залогинен (email confirmation отключен)
            token = response.access_token

            session[:auth_token] = token
            cookies.signed[:auth_token] = {
              value: token,
              httponly: true,
              secure: Rails.env.production?,
              expires: 7.days.from_now
            }

            # Синхронизируем пользователя с локальной БД
            user = sync_user_from_response(response)
            session[:user_id] = user.id

            # Создаем бонусные токены для нового пользователя
            create_welcome_bonus(user)

            redirect_to dashboard_root_path, notice: "Добро пожаловать в Obrazz!"
          else
            # Требуется подтверждение email
            redirect_to login_path, notice: "Проверьте email для подтверждения аккаунта"
          end
        else
          error_message = parse_error_message(response.error)
          redirect_to signup_path, alert: error_message
        end
      rescue StandardError => e
        Rails.logger.error "Supabase Registration Error: #{e.message}\n#{e.backtrace.join("\n")}"
        redirect_to signup_path, alert: "Ошибка регистрации. Попробуйте позже."
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

    def create_welcome_bonus(user)
      # Проверяем, не получал ли пользователь уже бонус
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

    def parse_error_message(error)
      case error
      when /already registered/i, /user already exists/i
        "Пользователь с таким email уже существует"
      when /invalid email/i
        "Некорректный email адрес"
      when /password/i
        "Пароль должен быть не менее 6 символов"
      else
        error || "Ошибка регистрации"
      end
    end
  end
end
