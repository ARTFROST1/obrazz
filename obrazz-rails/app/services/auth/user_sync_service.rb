# frozen_string_literal: true

module Auth
  class UserSyncService
    # Синхронизирует пользователя Supabase с локальной БД
    # Создаёт нового пользователя или обновляет существующего
    def self.sync_from_token(jwt_payload)
      new(jwt_payload).sync
    end

    def initialize(jwt_payload)
      @payload = jwt_payload
      @supabase_id = jwt_payload[:sub]
      @email = jwt_payload[:email]
      @user_metadata = jwt_payload[:user_metadata] || {}
    end

    def sync
      user = User.find_by(supabase_id: @supabase_id)

      if user
        update_user(user)
      else
        create_user
      end
    end

    private

    def create_user
      User.create!(
        supabase_id: @supabase_id,
        email: @email,
        username: extract_username,
        full_name: @user_metadata[:full_name] || @user_metadata[:name],
        avatar_url: @user_metadata[:avatar_url] || @user_metadata[:picture],
        status: "active",
        last_active_at: Time.current,
        metadata: {
          provider: @user_metadata[:provider],
          created_via: "jwt_sync"
        }
      )
    rescue ActiveRecord::RecordNotUnique => e
      # Race condition - пользователь уже создан в параллельном запросе
      Rails.logger.warn "User creation race condition for #{@supabase_id}: #{e.message}"
      User.find_by!(supabase_id: @supabase_id)
    end

    def update_user(user)
      updates = {}

      # Обновляем email если изменился
      updates[:email] = @email if @email.present? && user.email != @email

      # Обновляем имя если изменилось
      new_name = @user_metadata[:full_name] || @user_metadata[:name]
      updates[:full_name] = new_name if new_name.present? && user.full_name != new_name

      # Обновляем аватар если изменился
      new_avatar = @user_metadata[:avatar_url] || @user_metadata[:picture]
      updates[:avatar_url] = new_avatar if new_avatar.present? && user.avatar_url != new_avatar

      # Обновляем last_active_at
      updates[:last_active_at] = Time.current

      user.update!(updates) if updates.any?
      user
    end

    def extract_username
      # Пытаемся извлечь username из user_metadata или email
      @user_metadata[:username] ||
        @user_metadata[:preferred_username] ||
        @email&.split("@")&.first
    end
  end
end
