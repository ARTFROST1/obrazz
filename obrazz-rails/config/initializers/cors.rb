# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins do |source, _env|
      allowed = ENV.fetch("ALLOWED_ORIGINS", "").split(",").map(&:strip)
      # В development разрешаем все origins от Expo
      if Rails.env.development?
        allowed += [
          "http://localhost:3000",
          "http://localhost:8081"
        ]
      end

      allowed.include?(source) || Rails.env.development?
    end

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: [ "X-Request-Id", "X-Runtime" ],
      credentials: true,
      max_age: 86400
  end
end
