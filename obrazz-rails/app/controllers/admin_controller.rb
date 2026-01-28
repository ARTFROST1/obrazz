# frozen_string_literal: true

# Base controller for Admin panel
class AdminController < ActionController::Base
  before_action :authenticate_admin!

  layout "admin"

  private

  def authenticate_admin!
    authenticate_with_http_basic do |email, password|
      admin = AdminUser.find_by(email: email)
      if admin&.authenticate(password) && admin.active?
        @current_admin = admin
        return true
      end
    end

    request_http_basic_authentication("Obrazz Admin")
  end

  def current_admin
    @current_admin
  end
  helper_method :current_admin
end
