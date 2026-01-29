# Database Schema Reference — Obrazz

## Overview

База данных PostgreSQL управляется через Supabase (Auth, Storage) + Rails migrations. Все таблицы используют UUID как primary key.

## Core Tables

### users

Пользователи приложения (синхронизируются с Supabase Auth).

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id     UUID NOT NULL UNIQUE,    -- ID из Supabase Auth
  email           VARCHAR NOT NULL UNIQUE,
  username        VARCHAR UNIQUE,
  full_name       VARCHAR,
  avatar_url      VARCHAR,
  status          VARCHAR DEFAULT 'active' NOT NULL,  -- active, suspended, deleted
  last_active_at  TIMESTAMP,
  preferences     JSONB DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL
);

CREATE INDEX index_users_on_supabase_id ON users (supabase_id);
CREATE INDEX index_users_on_email ON users (email);
CREATE INDEX index_users_on_status ON users (status);
```

### user_profiles

Расширенный профиль с настройками и геймификацией.

```sql
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name          VARCHAR,
  bio                   TEXT,
  location              VARCHAR,
  website               VARCHAR,
  preferences           JSONB DEFAULT '{
    "theme": "system",
    "language": "ru",
    "notifications": {
      "pushEnabled": true,
      "aiSuggestions": true,
      "promotions": false,
      "communityUpdates": true
    }
  }',
  -- Counters
  items_count           INTEGER DEFAULT 0,
  outfits_count         INTEGER DEFAULT 0,
  ai_generations_used   INTEGER DEFAULT 0,
  likes_received        INTEGER DEFAULT 0,
  followers_count       INTEGER DEFAULT 0,
  following_count       INTEGER DEFAULT 0,
  -- Gamification
  streak_days           INTEGER DEFAULT 0,
  last_streak_date      TIMESTAMP,
  total_points          INTEGER DEFAULT 0,
  achievements          JSONB DEFAULT '[]',
  badges                JSONB DEFAULT '[]',
  -- Onboarding
  onboarding_completed  BOOLEAN DEFAULT false,
  onboarding_progress   JSONB DEFAULT '{}',
  created_at            TIMESTAMP NOT NULL,
  updated_at            TIMESTAMP NOT NULL
);
```

### items

Вещи в гардеробе пользователя.

```sql
CREATE TABLE items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),  -- NULL для default items
  name            VARCHAR,
  category        VARCHAR NOT NULL,           -- tops, bottoms, dresses, outerwear, shoes, bags, accessories, other
  subcategory     VARCHAR,
  colors          JSONB DEFAULT '[]',         -- Array of colors
  primary_color   JSONB,                      -- { name, hex }
  color           VARCHAR,                    -- Simple color string
  material        VARCHAR,
  style           JSONB DEFAULT '[]',
  season          JSONB DEFAULT '[]',
  image_url       VARCHAR,
  thumbnail_url   VARCHAR,
  image_hash      VARCHAR,                    -- For duplicate detection
  is_default      BOOLEAN DEFAULT false,      -- Default items for all users
  brand           VARCHAR,
  size            VARCHAR,
  price           DECIMAL(10, 2),
  tags            JSONB DEFAULT '[]',
  favorite        BOOLEAN DEFAULT false,
  wear_count      INTEGER DEFAULT 0,
  last_worn_at    TIMESTAMP,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL
);

CREATE INDEX index_items_on_user_id ON items (user_id);
CREATE INDEX index_items_on_category ON items (category);
CREATE INDEX index_items_on_is_default ON items (is_default);
CREATE INDEX index_items_on_favorite ON items (favorite);
CREATE INDEX index_items_on_image_hash ON items (image_hash);
```

### hidden_default_items

Отслеживание скрытых default items по пользователям.

```sql
CREATE TABLE hidden_default_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at      TIMESTAMP NOT NULL,
  UNIQUE(user_id, item_id)
);
```

### outfits

Созданные образы.

```sql
CREATE TABLE outfits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  title           VARCHAR,
  description     TEXT,
  items           JSONB DEFAULT '[]',         -- Array of { itemId, transform: {x, y, scale, rotation} }
  background      JSONB DEFAULT '{"type": "color", "value": "#FFFFFF"}',
  visibility      VARCHAR DEFAULT 'private',  -- private, public
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata     JSONB,                      -- AI generation details
  tags            JSONB DEFAULT '[]',
  styles          JSONB DEFAULT '[]',
  seasons         JSONB DEFAULT '[]',
  occasions       JSONB DEFAULT '[]',
  last_worn_at    TIMESTAMP,
  wear_count      INTEGER DEFAULT 0,
  is_favorite     BOOLEAN DEFAULT false,
  -- Social counters (reserved for future)
  likes_count     INTEGER DEFAULT 0,
  views_count     INTEGER DEFAULT 0,
  shares_count    INTEGER DEFAULT 0,
  -- Canvas settings for edit mode
  canvas_settings JSONB,                      -- Full canvas state for restoration
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL
);

CREATE INDEX index_outfits_on_user_id ON outfits (user_id);
CREATE INDEX index_outfits_on_is_favorite ON outfits (is_favorite);
CREATE INDEX index_outfits_on_is_ai_generated ON outfits (is_ai_generated);
CREATE INDEX index_outfits_on_visibility ON outfits (visibility);
```

### subscriptions

Подписки пользователей.

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id),
  plan                  VARCHAR DEFAULT 'free' NOT NULL,    -- free, pro_monthly, pro_yearly
  status                VARCHAR DEFAULT 'active' NOT NULL,  -- active, cancelled, expired, past_due
  current_period_start  TIMESTAMP,
  current_period_end    TIMESTAMP,
  cancelled_at          TIMESTAMP,
  payment_provider      VARCHAR,                            -- yookassa, apple, google
  external_id           VARCHAR,                            -- Provider subscription ID
  auto_renew            BOOLEAN DEFAULT true,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMP NOT NULL,
  updated_at            TIMESTAMP NOT NULL
);

CREATE INDEX index_subscriptions_on_user_id ON subscriptions (user_id);
CREATE INDEX index_subscriptions_on_plan ON subscriptions (plan);
CREATE INDEX index_subscriptions_on_status ON subscriptions (status);
CREATE INDEX index_subscriptions_on_current_period_end ON subscriptions (current_period_end);
```

### token_balances

Балансы токенов по типам.

```sql
CREATE TABLE token_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  token_type      VARCHAR NOT NULL,           -- subscription_tokens, purchased_tokens, bonus_tokens
  balance         INTEGER DEFAULT 0 NOT NULL,
  expires_at      TIMESTAMP,                  -- NULL = never expires
  source          VARCHAR,                    -- subscription, purchase, registration_bonus, promo
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL,
  UNIQUE(user_id, token_type)
);

CREATE INDEX index_token_balances_on_user_id_and_token_type ON token_balances (user_id, token_type);
CREATE INDEX index_token_balances_on_expires_at ON token_balances (expires_at);
```

### token_transactions

Audit log всех операций с токенами.

```sql
CREATE TABLE token_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  token_balance_id  UUID NOT NULL REFERENCES token_balances(id),
  operation         VARCHAR NOT NULL,           -- credit, debit
  amount            INTEGER NOT NULL,
  balance_before    INTEGER NOT NULL,
  balance_after     INTEGER NOT NULL,
  reason            VARCHAR,                    -- ai_generation, purchase, subscription_renewal, bonus, refund
  ai_generation_id  UUID,
  payment_id        UUID,
  description       VARCHAR,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP NOT NULL,
  updated_at        TIMESTAMP NOT NULL
);

CREATE INDEX index_token_transactions_on_user_id ON token_transactions (user_id);
CREATE INDEX index_token_transactions_on_operation ON token_transactions (operation);
CREATE INDEX index_token_transactions_on_ai_generation_id ON token_transactions (ai_generation_id);
```

### ai_generations

Записи AI-генераций.

```sql
CREATE TABLE ai_generations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  generation_type     VARCHAR NOT NULL,         -- virtual_try_on, fashion_model, variation
  status              VARCHAR DEFAULT 'pending' NOT NULL,  -- pending, processing, completed, failed, cancelled
  tokens_cost         INTEGER DEFAULT 1 NOT NULL,
  external_id         VARCHAR,                  -- The New Black task ID
  external_status     VARCHAR,
  input_params        JSONB DEFAULT '{}',
  input_image_urls    TEXT[] DEFAULT '{}',
  output_image_urls   TEXT[] DEFAULT '{}',
  output_metadata     JSONB DEFAULT '{}',
  error_code          VARCHAR,
  error_message       TEXT,
  started_at          TIMESTAMP,
  completed_at        TIMESTAMP,
  processing_time_ms  INTEGER,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMP NOT NULL,
  updated_at          TIMESTAMP NOT NULL
);

CREATE INDEX index_ai_generations_on_user_id ON ai_generations (user_id);
CREATE INDEX index_ai_generations_on_generation_type ON ai_generations (generation_type);
CREATE INDEX index_ai_generations_on_status ON ai_generations (status);
CREATE INDEX index_ai_generations_on_external_id ON ai_generations (external_id);
```

### payments

Платежи через YooKassa/IAP.

```sql
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  subscription_id   UUID REFERENCES subscriptions(id),
  provider          VARCHAR NOT NULL,           -- yookassa, apple, google
  external_id       VARCHAR NOT NULL UNIQUE,    -- Provider payment ID
  external_status   VARCHAR,
  status            VARCHAR DEFAULT 'pending' NOT NULL,  -- pending, succeeded, failed, refunded
  payment_type      VARCHAR NOT NULL,           -- subscription, token_pack
  amount            DECIMAL(10, 2) NOT NULL,
  currency          VARCHAR DEFAULT 'RUB' NOT NULL,
  tokens_amount     INTEGER,                    -- For token_pack payments
  token_pack_id     VARCHAR,                    -- small_50, medium_200, large_500
  subscription_plan VARCHAR,                    -- For subscription payments
  paid_at           TIMESTAMP,
  refunded_at       TIMESTAMP,
  payment_method    VARCHAR,
  error_code        VARCHAR,
  error_message     TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP NOT NULL,
  updated_at        TIMESTAMP NOT NULL
);

CREATE INDEX index_payments_on_user_id ON payments (user_id);
CREATE INDEX index_payments_on_external_id ON payments (external_id);
CREATE INDEX index_payments_on_provider ON payments (provider);
CREATE INDEX index_payments_on_status ON payments (status);
CREATE INDEX index_payments_on_payment_type ON payments (payment_type);
```

### webhook_events

Лог входящих вебхуков.

```sql
CREATE TABLE webhook_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source            VARCHAR NOT NULL,           -- yookassa, apple, google, the_new_black
  external_id       VARCHAR NOT NULL,
  event_type        VARCHAR NOT NULL,
  status            VARCHAR DEFAULT 'pending' NOT NULL,  -- pending, processed, failed
  payload           JSONB DEFAULT '{}' NOT NULL,
  headers           JSONB DEFAULT '{}',
  attempts          INTEGER DEFAULT 0,
  processed_at      TIMESTAMP,
  last_attempted_at TIMESTAMP,
  error_code        VARCHAR,
  error_message     TEXT,
  -- Related records
  user_id           UUID,
  payment_id        UUID,
  subscription_id   UUID,
  ai_generation_id  UUID,
  created_at        TIMESTAMP NOT NULL,
  updated_at        TIMESTAMP NOT NULL,
  UNIQUE(source, external_id)
);

CREATE INDEX index_webhook_events_on_source_and_external_id ON webhook_events (source, external_id);
CREATE INDEX index_webhook_events_on_status ON webhook_events (status);
CREATE INDEX index_webhook_events_on_event_type ON webhook_events (event_type);
```

### admins

Администраторы панели управления.

```sql
CREATE TABLE admins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR NOT NULL UNIQUE,
  password_digest VARCHAR NOT NULL,
  name            VARCHAR,
  active          BOOLEAN DEFAULT true NOT NULL,
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL
);
```

---

## Enums Reference

### User Status

```ruby
%w[active suspended deleted]
```

### Subscription Plan

```ruby
PLANS = %w[free pro_monthly pro_yearly]
```

### Subscription Status

```ruby
STATUSES = %w[active cancelled expired past_due]
```

### AI Generation Type

```ruby
GENERATION_TYPES = %w[virtual_try_on fashion_model variation]
```

### AI Generation Status

```ruby
STATUSES = %w[pending processing completed failed cancelled]
```

### Token Type

```ruby
TOKEN_TYPES = %w[subscription_tokens purchased_tokens bonus_tokens]
```

### Token Operation

```ruby
OPERATIONS = %w[credit debit]
```

### Payment Provider

```ruby
PROVIDERS = %w[yookassa apple google]
```

### Payment Type

```ruby
PAYMENT_TYPES = %w[subscription token_pack]
```

### Payment Status

```ruby
STATUSES = %w[pending succeeded failed refunded]
```

### Item Category (React Native)

```typescript
const CATEGORIES = [
  'tops', // Верх
  'bottoms', // Низ
  'dresses', // Платья
  'outerwear', // Верхняя одежда
  'shoes', // Обувь
  'bags', // Сумки
  'accessories', // Аксессуары
  'other', // Другое
];
```

---

## Business Constants

```ruby
# Token costs per AI generation
TOKEN_COSTS = {
  "virtual_try_on" => 1,
  "fashion_model" => 1,
  "variation" => 1
}

# Monthly tokens per plan
PLAN_TOKENS = {
  "free" => 0,
  "pro_monthly" => 100,
  "pro_yearly" => 100
}

# Registration bonus
INITIAL_BONUS_TOKENS = 3
BONUS_EXPIRY_DAYS = 30

# Token packs
TOKEN_PACKS = {
  "small_50" => { tokens: 50, price_rub: 299 },
  "medium_200" => { tokens: 200, price_rub: 999 },
  "large_500" => { tokens: 500, price_rub: 1999 }
}

# Subscription prices (RUB)
SUBSCRIPTION_PRICES = {
  "pro_monthly" => 299,
  "pro_yearly" => 2390  # ~199/month
}
```

---

## Relationships Diagram

```
User
  ├── has_one :user_profile (CASCADE delete)
  ├── has_one :subscription
  ├── has_many :items
  ├── has_many :outfits
  ├── has_many :token_balances
  ├── has_many :token_transactions
  ├── has_many :ai_generations
  ├── has_many :payments
  └── has_many :hidden_default_items

Subscription
  ├── belongs_to :user
  └── has_many :payments

AiGeneration
  ├── belongs_to :user
  └── has_many :token_transactions

TokenBalance
  ├── belongs_to :user
  └── has_many :token_transactions

Payment
  ├── belongs_to :user
  ├── belongs_to :subscription (optional)
  └── has_many :token_transactions

Item
  ├── belongs_to :user (optional - NULL for defaults)
  └── has_many :hidden_default_items
```
