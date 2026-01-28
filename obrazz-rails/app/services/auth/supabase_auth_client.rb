# frozen_string_literal: true

module Auth
  # Supabase Auth Client для аутентификации пользователей
  # Использует Supabase Auth API для sign in/sign up
  class SupabaseAuthClient
    include HTTParty

    base_uri ENV.fetch("SUPABASE_URL", "https://example.supabase.co")

    def initialize
      @headers = {
        "apikey" => ENV.fetch("SUPABASE_ANON_KEY"),
        "Content-Type" => "application/json"
      }
    end

    # Аутентификация пользователя по email и паролю
    # @param email [String] Email пользователя
    # @param password [String] Пароль пользователя
    # @return [Hash] Response с access_token, user, session
    def sign_in(email:, password:)
      response = self.class.post(
        "/auth/v1/token?grant_type=password",
        headers: @headers,
        body: {
          email: email,
          password: password
        }.to_json
      )

      handle_response(response)
    end

    # Регистрация нового пользователя
    # @param email [String] Email пользователя
    # @param password [String] Пароль пользователя
    # @param options [Hash] Дополнительные данные (username, full_name, etc.)
    # @return [Hash] Response с access_token, user, session
    def sign_up(email:, password:, **options)
      response = self.class.post(
        "/auth/v1/signup",
        headers: @headers,
        body: {
          email: email,
          password: password,
          data: options
        }.to_json
      )

      handle_response(response)
    end

    # Выход пользователя (invalidate token)
    # @param access_token [String] JWT токен пользователя
    def sign_out(access_token:)
      response = self.class.post(
        "/auth/v1/logout",
        headers: @headers.merge("Authorization" => "Bearer #{access_token}")
      )

      handle_response(response)
    end

    # Получение пользователя по токену
    # @param access_token [String] JWT токен пользователя
    # @return [Hash] Информация о пользователе
    def get_user(access_token:)
      response = self.class.get(
        "/auth/v1/user",
        headers: @headers.merge("Authorization" => "Bearer #{access_token}")
      )

      handle_response(response)
    end

    private

    def handle_response(response)
      case response.code
      when 200..299
        OpenStruct.new(
          success?: true,
          data: response.parsed_response,
          access_token: response.parsed_response["access_token"],
          refresh_token: response.parsed_response["refresh_token"],
          user: OpenStruct.new(response.parsed_response["user"] || {}),
          session: response.parsed_response["session"] ?
                     OpenStruct.new(response.parsed_response["session"]) : nil
        )
      else
        error_message = response.parsed_response&.dig("error_description") ||
                       response.parsed_response&.dig("msg") ||
                       "Unknown error"

        OpenStruct.new(
          success?: false,
          error: error_message,
          code: response.code
        )
      end
    end
  end
end
