# frozen_string_literal: true

# Supabase configuration
# Used for JWT validation and Supabase client operations

Rails.application.config.supabase = {
  url: ENV.fetch("SUPABASE_URL", nil),
  jwt_secret: ENV.fetch("SUPABASE_JWT_SECRET", nil),
  anon_key: ENV.fetch("SUPABASE_ANON_KEY", nil),
  service_role_key: ENV.fetch("SUPABASE_SERVICE_ROLE_KEY", nil)
}

# Validate configuration in production
if Rails.env.production?
  config = Rails.application.config.supabase

  if config[:url].blank?
    Rails.logger.warn "WARNING: SUPABASE_URL is not set"
  end

  if config[:jwt_secret].blank?
    Rails.logger.warn "WARNING: SUPABASE_JWT_SECRET is not set - JWT validation will fail"
  end
end
