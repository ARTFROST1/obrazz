# Obrazz Rails Backend

Rails 8 backend для мобильного приложения Obrazz - персональный гардероб с AI-стилистом.

## Tech Stack

- **Ruby** 4.0.0
- **Rails** 8.0.4
- **PostgreSQL** (Render free tier)
- **Solid Queue** (database-backed jobs, no Redis)
- **JWT** (Supabase authentication)

## Features

### Phase 1: Foundation ✅

- Rails 8 project with API mode
- PostgreSQL database with UUID primary keys
- Supabase JWT authentication
- CORS configuration
- Rack::Attack rate limiting
- Health check endpoint

### Phase 2: Token System ✅

- Token balances (subscription, purchased, bonus)
- Token transactions history
- Debit/credit operations
- Expiration handling

### Phase 3: AI Integration ✅

- The New Black API client
- Virtual Try-On
- Fashion Model generation
- Clothing Variations
- Solid Queue jobs for status polling
- Webhook support

### Phase 4: Payments ✅

- YooKassa integration
- Apple IAP webhooks
- Google Play webhooks
- Payment processing jobs

### Phase 5: Subscriptions ✅

- Free/Pro plans
- Upgrade/downgrade
- Auto-renewal handling
- Cancellation

### TODO

- [ ] Phase 6: Admin dashboard (Administrate)
- [ ] Phase 7: RSpec tests
- [ ] Phase 8: Deployment to Render

## Setup

### Prerequisites

- Ruby 4.0.0+
- PostgreSQL 14+
- Bundler

### Installation

```bash
# Clone repository
cd obrazz-rails

# Install dependencies
bundle install

# Setup database
bin/rails db:create db:migrate

# Start server
bin/rails server
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret

# The New Black AI
THE_NEW_BLACK_API_URL=https://api.thenewblack.ai
THE_NEW_BLACK_API_KEY=your_api_key

# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgres://localhost:5432/obrazz_development
```

## API Endpoints

### Health

- `GET /api/v1/health` - Health check (public)

### Users

- `GET /api/v1/users/me` - Current user profile
- `PUT /api/v1/users/me` - Update profile

### Tokens

- `GET /api/v1/tokens` - Token balances
- `GET /api/v1/tokens/balance` - Quick balance check
- `GET /api/v1/tokens/history` - Transaction history

### AI Generations

- `GET /api/v1/ai_generations` - List generations
- `POST /api/v1/ai_generations` - Create generation
- `GET /api/v1/ai_generations/:id` - Generation details
- `GET /api/v1/ai_generations/:id/status` - Check status
- `POST /api/v1/ai_generations/:id/cancel` - Cancel

### AI Shortcuts

- `POST /api/v1/ai/virtual-try-on` - Virtual Try-On
- `POST /api/v1/ai/fashion-model` - Fashion Model
- `POST /api/v1/ai/variation` - Clothing Variations

### Subscriptions

- `GET /api/v1/subscription` - Current subscription
- `POST /api/v1/subscription/upgrade` - Upgrade plan
- `POST /api/v1/subscription/cancel` - Cancel subscription

### Payments

- `GET /api/v1/payments` - Payment history
- `GET /api/v1/payments/token_packs` - Available packs
- `POST /api/v1/payments` - Initiate payment

### Webhooks

- `POST /api/v1/webhooks/yookassa` - YooKassa callbacks
- `POST /api/v1/webhooks/apple` - Apple IAP notifications
- `POST /api/v1/webhooks/google` - Google Play notifications
- `POST /api/v1/webhooks/the_new_black` - AI completion callbacks

## Running Background Jobs

```bash
# Start Solid Queue worker
bin/jobs

# Or with bundle exec
bundle exec rails solid_queue:start
```

## Testing

```bash
# Run tests
bundle exec rspec

# Run specific test
bundle exec rspec spec/models/user_spec.rb
```

## Deployment (Render)

See `render.yaml` for deployment configuration.

```bash
# Build command
bundle install && bin/rails db:migrate

# Start command
bin/rails server -p $PORT

# Worker command (separate service)
bin/jobs
```

## License

Proprietary - Obrazz
