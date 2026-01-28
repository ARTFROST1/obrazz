# frozen_string_literal: true

module Dashboard
  class SettingsController < DashboardController
    # GET /dashboard/settings
    def show
      @user = current_user
    end

    # PATCH /dashboard/settings
    def update
      @user = current_user

      if @user.update(user_params)
        redirect_to dashboard_settings_path, notice: "Настройки сохранены"
      else
        render :show, status: :unprocessable_entity
      end
    end

    # DELETE /dashboard/settings/account
    def destroy_account
      # Мягкое удаление - помечаем как удалённый
      current_user.update!(
        status: "deleted",
        deleted_at: Time.current
      )

      # Отменяем подписку если есть
      current_user.subscription&.cancel! if current_user.subscription&.active?

      # Выходим из системы
      session.delete(:auth_token)
      session.delete(:user_id)
      cookies.delete(:auth_token)

      redirect_to login_path, notice: "Ваш аккаунт удалён"
    end

    # GET /dashboard/settings/notifications
    def notifications
      @user = current_user
      @notification_settings = @user.notification_settings || default_notification_settings
    end

    # PATCH /dashboard/settings/notifications
    def update_notifications
      @user = current_user

      @user.update!(
        notification_settings: notification_params.to_h
      )

      redirect_to notifications_dashboard_settings_path, notice: "Настройки уведомлений сохранены"
    end

    private

    def user_params
      params.require(:user).permit(:username, :full_name, :avatar_url)
    end

    def notification_params
      params.require(:notifications).permit(
        :email_marketing,
        :email_generations,
        :email_subscription,
        :push_generations,
        :push_promotions
      )
    end

    def default_notification_settings
      {
        "email_marketing" => true,
        "email_generations" => true,
        "email_subscription" => true,
        "push_generations" => true,
        "push_promotions" => false
      }
    end
  end
end
