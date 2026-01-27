# frozen_string_literal: true

# Rack::Attack configuration for rate limiting and protection

class Rack::Attack
  ### Configure Cache ###
  # Use Rails cache for throttling
  Rack::Attack.cache.store = Rails.cache

  ### Throttle Strategies ###

  # Throttle all requests by IP (60 req/min by default)
  throttle("req/ip", limit: ENV.fetch("RATE_LIMIT_REQUESTS_PER_MINUTE", 60).to_i, period: 1.minute) do |req|
    req.ip unless req.path.start_with?("/assets", "/health")
  end

  # Throttle AI generation requests more strictly (10 req/min)
  throttle("ai/ip", limit: 10, period: 1.minute) do |req|
    if req.path.start_with?("/api/v1/ai/")
      req.ip
    end
  end

  # Throttle authentication attempts (5 req/20 sec)
  throttle("auth/ip", limit: 5, period: 20.seconds) do |req|
    if req.path.start_with?("/api/v1/auth/") && req.post?
      req.ip
    end
  end

  # Throttle webhook endpoints (100 req/min per IP)
  throttle("webhooks/ip", limit: 100, period: 1.minute) do |req|
    if req.path.start_with?("/api/v1/webhooks/")
      req.ip
    end
  end

  ### Blocklist Rules ###

  # Block suspicious requests
  blocklist("block-bad-robots") do |req|
    # Block requests with suspicious user agents
    Rack::Attack::Fail2Ban.filter("bad-robots-#{req.ip}", maxretry: 3, findtime: 10.minutes, bantime: 1.hour) do
      req.user_agent.blank? && !req.path.start_with?("/health")
    end
  end

  # Block requests with SQL injection patterns
  blocklist("sql-injection") do |req|
    sql_patterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i
    ]
    
    query = req.query_string.to_s
    body = req.body&.read.to_s rescue ""
    req.body&.rewind rescue nil
    
    sql_patterns.any? { |pattern| query.match?(pattern) || body.match?(pattern) }
  end

  ### Response Configuration ###

  # Custom throttled response
  self.throttled_responder = lambda do |req|
    match_data = req.env["rack.attack.match_data"]
    now = match_data[:epoch_time]
    retry_after = match_data[:period] - (now % match_data[:period])

    [
      429,
      {
        "Content-Type" => "application/json",
        "Retry-After" => retry_after.to_s
      },
      [{
        error: "rate_limit_exceeded",
        message: "Rate limit exceeded. Retry after #{retry_after} seconds.",
        retry_after: retry_after
      }.to_json]
    ]
  end

  # Custom blocked response
  self.blocklisted_responder = lambda do |req|
    [
      403,
      { "Content-Type" => "application/json" },
      [{
        error: "forbidden",
        message: "Your request has been blocked."
      }.to_json]
    ]
  end

  ### Logging ###
  
  ActiveSupport::Notifications.subscribe("throttle.rack_attack") do |_name, _start, _finish, _id, payload|
    req = payload[:request]
    Rails.logger.warn "[Rack::Attack] Throttled #{req.ip}: #{req.path}"
  end

  ActiveSupport::Notifications.subscribe("blocklist.rack_attack") do |_name, _start, _finish, _id, payload|
    req = payload[:request]
    Rails.logger.warn "[Rack::Attack] Blocked #{req.ip}: #{req.path}"
  end
end
