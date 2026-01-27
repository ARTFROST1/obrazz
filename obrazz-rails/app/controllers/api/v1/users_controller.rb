# frozen_string_literal: true

module Api
  module V1
    class UsersController < BaseController
      # GET /api/v1/users/me
      # Возвращает профиль текущего пользователя
      def me
        render_success(user_data(current_user))
      end

      # PUT /api/v1/users/me
      # Обновляет профиль текущего пользователя
      def update
        current_user.update!(user_params)
        render_success(user_data(current_user))
      end

      private

      def user_params
        params.permit(:username, :full_name, :avatar_url, preferences: {})
      end

      def user_data(user)
        {
          id: user.id,
          supabase_id: user.supabase_id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          status: user.status,
          subscription: subscription_data(user.subscription),
          tokens: tokens_data(user),
          created_at: user.created_at.iso8601,
          last_active_at: user.last_active_at&.iso8601
        }
      end

      def subscription_data(subscription)
        return nil unless subscription

        {
          plan: subscription.plan,
          status: subscription.status,
          current_period_end: subscription.current_period_end&.iso8601,
          auto_renew: subscription.auto_renew,
          is_pro: subscription.pro?
        }
      end

      def tokens_data(user)
        {
          total: user.total_token_balance,
          available: user.available_tokens,
          balances: user.token_balances.map do |balance|
            {
              type: balance.token_type,
              balance: balance.balance,
              available: balance.available_balance,
              expires_at: balance.expires_at&.iso8601
            }
          end
        }
      end
    end
  end
end
