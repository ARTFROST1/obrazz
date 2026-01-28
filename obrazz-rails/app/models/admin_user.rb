# frozen_string_literal: true

# Admin user for accessing the custom admin panel.
# Uses the `admins` table to avoid a constant collision with the `Admin` namespace.
class AdminUser < ApplicationRecord
  self.table_name = "admins"

  has_secure_password

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }

  before_save :downcase_email

  scope :active, -> { where(active: true) }

  def active?
    active
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end
