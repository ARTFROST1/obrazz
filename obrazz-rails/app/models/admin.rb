# frozen_string_literal: true

# NOTE:
# The `Admin` constant is used as a namespace for controllers (Admin::...).
# Having a model named `Admin` collides with that namespace under Zeitwerk.
#
# Admin authentication is handled by the `AdminUser` model (table: `admins`).
module Admin
end
