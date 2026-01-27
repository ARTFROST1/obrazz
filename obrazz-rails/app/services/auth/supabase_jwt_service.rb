# frozen_string_literal: true

module Auth
  class SupabaseJwtService
    class InvalidTokenError < StandardError; end
    class ExpiredTokenError < StandardError; end
    class MissingTokenError < StandardError; end

    ALGORITHM = 'HS256'

    def initialize(token)
      @token = token
    end

    # Декодирует и валидирует JWT токен Supabase
    # Возвращает payload с данными пользователя
    def decode
      raise MissingTokenError, 'Token is missing' if @token.blank?

      decoded = JWT.decode(
        @token,
        jwt_secret,
        true, # verify signature
        {
          algorithm: ALGORITHM,
          verify_expiration: true,
          verify_iat: true,
          aud: 'authenticated',
          verify_aud: true
        }
      )

      payload = decoded.first.deep_symbolize_keys
      validate_payload!(payload)
      payload
    rescue JWT::ExpiredSignature
      raise ExpiredTokenError, 'Token has expired'
    rescue JWT::InvalidAudError
      raise InvalidTokenError, 'Invalid audience'
    rescue JWT::DecodeError => e
      raise InvalidTokenError, "Invalid token: #{e.message}"
    end

    # Извлекает Supabase user ID из токена
    def supabase_user_id
      payload = decode
      payload[:sub]
    end

    # Извлекает email из токена
    def email
      payload = decode
      payload[:email]
    end

    # Извлекает все user_metadata из токена
    def user_metadata
      payload = decode
      payload[:user_metadata] || {}
    end

    # Проверяет, валиден ли токен
    def valid?
      decode
      true
    rescue StandardError
      false
    end

    private

    def jwt_secret
      secret = ENV['SUPABASE_JWT_SECRET']
      raise InvalidTokenError, 'JWT secret not configured' if secret.blank?
      secret
    end

    def validate_payload!(payload)
      # Проверяем обязательные поля
      raise InvalidTokenError, 'Missing user ID (sub)' if payload[:sub].blank?
      
      # Проверяем issuer (должен быть URL Supabase)
      if payload[:iss].present?
        supabase_url = ENV['SUPABASE_URL']
        expected_issuer = "#{supabase_url}/auth/v1"
        unless payload[:iss] == expected_issuer
          Rails.logger.warn "JWT issuer mismatch: expected #{expected_issuer}, got #{payload[:iss]}"
          # Не фейлим, т.к. формат может отличаться
        end
      end

      # Проверяем role
      if payload[:role].present? && payload[:role] != 'authenticated'
        raise InvalidTokenError, "Invalid role: #{payload[:role]}"
      end
    end
  end
end
