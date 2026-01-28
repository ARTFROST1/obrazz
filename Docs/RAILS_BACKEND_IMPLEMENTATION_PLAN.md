# 🚀 Obrazz Rails Backend — Полный План Реализации

> **Дата создания:** 27 января 2026  
> **Версия:** 1.0.1  
> **Статус:** В работе (частично реализовано: Dashboard + custom Admin)  
> **Целевая платформа:** Render Free Tier (без Redis)

---

## 📋 Оглавление

1. [Executive Summary](#executive-summary)
2. [Архитектура системы](#архитектура-системы)
3. [Технический стек](#технический-стек)
4. [Структура базы данных](#структура-базы-данных)
5. [Модели и сервисы](#модели-и-сервисы)
6. [AI-интеграция (The New Black)](#ai-интеграция-the-new-black)
7. [Система токенов и биллинг](#система-токенов-и-биллинг)
8. [Личный кабинет (Dashboard)](#личный-кабинет-dashboard)
9. [Админ-панель](#админ-панель)
10. [API Endpoints](#api-endpoints)
11. [Деплой и инфраструктура](#деплой-и-инфраструктура)
12. [Поэтапный план реализации](#поэтапный-план-реализации)
13. [Чеклист готовности](#чеклист-готовности)

---

## 📊 Executive Summary

### Цель

Создать fullstack Ruby on Rails приложение, которое служит единым backend для:

1. **AI-функции** — proxy к The New Black API (Virtual Try-On, Fashion Models, Variations)
2. **Личный кабинет** — веб-интерфейс для пользователей (подписки, токены, история)
3. **Админ-панель** — управление контентом, коллекциями, пользователями
4. **Платежи** — YooKassa (РФ) + IAP валидация (Apple/Google)

### Ключевые ограничения

| Ограничение                  | Решение                                                   |
| ---------------------------- | --------------------------------------------------------- |
| **Render Free Tier**         | Нет Redis → используем **Solid Queue** (Rails 8 built-in) |
| **No Background Workers**    | Solid Queue работает через database polling               |
| **Spin-down на бездействии** | Миграция на paid tier при росте, или VPS                  |
| **PostgreSQL только**        | Supabase DB или Render PostgreSQL                         |

### Что получим

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RAILS BACKEND (ЕДИНЫЙ)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📱 Mobile API                    🌐 Web Dashboard                      │
│  • /api/v1/ai/*                   • /dashboard/*                       │
│  • /api/v1/tokens/*               • Hotwire + Tailwind                 │
│  • /api/v1/subscription           • Подписки, токены, история          │
│  • /api/v1/collections/*          • Настройки профиля                  │
│                                                                         │
│  🔧 Admin Panel                   💳 Webhooks                          │
│  • /admin/*                       • /webhooks/yookassa                 │
│  • Управление коллекциями         • /webhooks/stripe                   │
│  • Default items                  • /webhooks/app_store                │
│  • Аналитика                      • /webhooks/play_store               │
│                                                                         │
│  ⚡ Background Jobs (Solid Queue — no Redis!)                          │
│  • AI Generation processing                                            │
│  • Image saving to Supabase Storage                                    │
│  • Monthly token reset                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Текущее состояние реализации (Jan 2026)

- В `obrazz-rails` уже подключены маршруты и экраны: **Dashboard** (`/dashboard/*`) и **Admin** (`/admin/*`).
- Админка сейчас **custom** (Rails views + Tailwind + Hotwire) и защищена **HTTP Basic**.
- Из-за Zeitwerk `Admin` используется как namespace для контроллеров; модель админа — `AdminUser` (таблица `admins`).
- Если миграции не получается прогнать на удалённой Supabase/Postgres, таблицу `admins` можно создать SQL-ом (pgcrypto + bcrypt-совместимый хеш):

```sql
create extension if not exists pgcrypto;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_digest text not null,
  name text not null,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admins (email, password_digest, name, active)
values (
  'admin@obrazz.app',
  crypt('changeme123', gen_salt('bf', 12)),
  'Super Admin',
  true
)
on conflict (email) do nothing;
```

---

## 🏗 Архитектура системы

### Общая схема

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          КЛИЕНТЫ                                        │
├────────────────┬────────────────┬────────────────┬──────────────────────┤
│  iOS App       │  Android App   │  Web Dashboard │  Admin Panel         │
│  (React Native)│  (React Native)│  (Rails Views) │  (Rails Admin)       │
└───────┬────────┴───────┬────────┴───────┬────────┴──────────┬───────────┘
        │                │                │                   │
        ▼                ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAILS BACKEND                                    │
│                     (Render Free Tier)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Puma Web Server                                                 │   │
│  │  • API Controllers (api/v1/*)                                   │   │
│  │  • Dashboard Controllers (dashboard/*)                          │   │
│  │  • Admin Controllers (admin/*)                                  │   │
│  │  • Webhook Controllers (webhooks/*)                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Solid Queue (Database-backed, NO REDIS!)                       │   │
│  │  • ProcessAiGenerationJob                                       │   │
│  │  • SaveAiImageJob                                               │   │
│  │  • ResetMonthlyTokensJob (scheduled)                            │   │
│  │  • ProcessPaymentJob                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                         │
│  ┌─────────────┬─────────────┬─────────────┐                           │
│  │    Auth     │  PostgreSQL │   Storage   │                           │
│  │ (JWT tokens)│ (все данные)│ (images)    │                           │
│  └─────────────┴─────────────┴─────────────┘                           │
│                                                                         │
│  Таблицы (управляются из Rails):                                       │
│  • profiles (sync с auth.users)                                        │
│  • items, outfits (source of truth — mobile)                          │
│  • collections, collection_items (управление из admin)                │
│  • ai_generations (результаты AI)                                      │
│                                                                         │
│  Таблицы (только Rails PostgreSQL):                                    │
│  • subscriptions, token_balances, token_transactions                   │
│  • payments, webhook_events                                            │
│  • solid_queue_* (job management)                                      │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   THE NEW BLACK AI (External API)                       │
│  • Virtual Try-On: POST /api/1.1/wf/vto_stream                         │
│  • Fashion Models: POST /api/1.1/wf/ai-fashion-models-items            │
│  • Variations: POST /api/1.1/wf/variation                              │
│  • Edit Photo: POST /api/1.1/wf/edit                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Почему Solid Queue вместо Sidekiq/Redis?

| Критерий               | Sidekiq + Redis             | Solid Queue                |
| ---------------------- | --------------------------- | -------------------------- |
| **Render Free Tier**   | ❌ Требует Redis add-on ($) | ✅ Только PostgreSQL       |
| **Сложность деплоя**   | Средняя (2 сервиса)         | Низкая (1 сервис)          |
| **Производительность** | Высокая                     | Достаточная для старта     |
| **Rails 8 native**     | Нет                         | ✅ Встроен в Rails 8       |
| **Масштабирование**    | Отличное                    | Хорошее (до ~10K jobs/day) |

**Вывод:** Solid Queue идеален для MVP и Render Free Tier. При масштабировании можно мигрировать на Sidekiq.

---

## 🛠 Технический стек

### Gemfile

```ruby
# Gemfile

source 'https://rubygems.org'

ruby '3.3.0'

# Rails Core
gem 'rails', '~> 8.0'
gem 'puma', '~> 6.4'
gem 'pg', '~> 1.5'

# Background Jobs (NO REDIS!)
gem 'solid_queue', '~> 0.9'   # Rails 8 database-backed jobs
gem 'mission_control-jobs'    # Web UI для Solid Queue

# Authentication (Supabase JWT)
gem 'jwt', '~> 2.8'

# HTTP Client
gem 'httparty', '~> 0.21'
gem 'faraday', '~> 2.9'       # для multipart uploads

# Payments
gem 'stripe', '~> 12.0'       # Stripe для глобальных платежей
# YooKassa — custom service (см. app/services/payments/yookassa_service.rb)

# Frontend (Dashboard)
gem 'turbo-rails', '~> 2.0'
gem 'stimulus-rails', '~> 1.3'
gem 'tailwindcss-rails', '~> 3.0'
gem 'importmap-rails'

# Admin
gem 'administrate', '~> 1.0.0.beta3' # optional (custom admin already exists)

# Serialization
gem 'jbuilder', '~> 2.12'
gem 'oj', '~> 3.16'           # Быстрый JSON

# Security
gem 'rack-cors', '~> 2.0'
gem 'rack-attack', '~> 6.7'   # Rate limiting

# Monitoring
gem 'sentry-ruby', '~> 5.17'
gem 'sentry-rails', '~> 5.17'

# Development & Test
group :development, :test do
  gem 'debug'
  gem 'rspec-rails', '~> 6.1'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'dotenv-rails'
end

group :development do
  gem 'web-console'
  gem 'rubocop-rails-omakase', require: false
end

group :test do
  gem 'shoulda-matchers'
  gem 'webmock'
  gem 'vcr'
end
```

### Структура приложения

```
obrazz-rails/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── base_controller.rb
│   │   │       ├── ai_controller.rb
│   │   │       ├── tokens_controller.rb
│   │   │       ├── subscriptions_controller.rb
│   │   │       ├── collections_controller.rb
│   │   │       └── iap_controller.rb
│   │   ├── dashboard/
│   │   │   ├── application_controller.rb
│   │   │   ├── home_controller.rb
│   │   │   ├── subscriptions_controller.rb
│   │   │   ├── tokens_controller.rb
│   │   │   ├── billing_controller.rb
│   │   │   ├── generations_controller.rb
│   │   │   └── settings_controller.rb
│   │   ├── admin/
│   │   │   └── ... (Administrate generated)
│   │   └── webhooks/
│   │       ├── yookassa_controller.rb
│   │       ├── stripe_controller.rb
│   │       ├── app_store_controller.rb
│   │       └── play_store_controller.rb
│   │
│   ├── models/
│   │   ├── user.rb
│   │   ├── subscription.rb
│   │   ├── token_balance.rb
│   │   ├── token_transaction.rb
│   │   ├── ai_generation.rb
│   │   ├── payment.rb
│   │   ├── webhook_event.rb
│   │   ├── collection.rb
│   │   └── collection_item.rb
│   │
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── auth_service.rb
│   │   │   ├── storage_service.rb
│   │   │   └── sync_service.rb
│   │   ├── the_new_black/
│   │   │   ├── client.rb
│   │   │   ├── virtual_tryon.rb
│   │   │   ├── fashion_models.rb
│   │   │   ├── variations.rb
│   │   │   └── image_saver.rb
│   │   ├── tokens/
│   │   │   ├── balance_service.rb
│   │   │   ├── spend_service.rb
│   │   │   └── refund_service.rb
│   │   └── payments/
│   │       ├── yookassa_service.rb
│   │       ├── stripe_service.rb
│   │       └── iap_service.rb
│   │
│   ├── jobs/
│   │   ├── application_job.rb
│   │   ├── process_ai_generation_job.rb
│   │   ├── save_ai_image_job.rb
│   │   ├── reset_monthly_tokens_job.rb
│   │   └── process_payment_webhook_job.rb
│   │
│   └── views/
│       ├── dashboard/
│       │   ├── home/
│       │   ├── subscriptions/
│       │   ├── tokens/
│       │   ├── generations/
│       │   └── layouts/
│       └── admin/ (Administrate)
│
├── config/
│   ├── routes.rb
│   ├── application.rb
│   ├── environments/
│   ├── initializers/
│   │   ├── cors.rb
│   │   ├── solid_queue.rb
│   │   ├── supabase.rb
│   │   ├── the_new_black.rb
│   │   └── rack_attack.rb
│   └── locales/
│       ├── ru.yml
│       └── en.yml
│
├── db/
│   ├── migrate/
│   ├── schema.rb
│   └── seeds.rb
│
├── spec/
│   ├── models/
│   ├── services/
│   ├── requests/
│   └── jobs/
│
├── Procfile
├── render.yaml
└── Dockerfile (опционально)
```

---

## 🗄️ Структура базы данных

### Rails PostgreSQL (отдельная от Supabase)

```ruby
# db/migrate/001_create_users.rb
class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: :uuid do |t|
      t.string :supabase_id, null: false, index: { unique: true }
      t.string :email, null: false, index: { unique: true }
      t.string :country, limit: 2  # Для определения региона платежей
      t.timestamps
    end
  end
end

# db/migrate/002_create_subscriptions.rb
class CreateSubscriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :subscriptions, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.integer :plan, default: 0, null: false  # free: 0, pro: 1, max: 2
      t.integer :status, default: 0, null: false  # active, cancelled, expired
      t.integer :provider, default: 0, null: false  # web: 0, ios: 1, android: 2
      t.string :external_id  # yookassa_xxx, sub_xxx, GPA.xxx
      t.string :payment_method_id  # для автопродления
      t.datetime :started_at
      t.datetime :expires_at
      t.boolean :auto_renewal, default: true
      t.timestamps
    end

    add_index :subscriptions, [:user_id, :status]
    add_index :subscriptions, :external_id, unique: true, where: "external_id IS NOT NULL"
  end
end

# db/migrate/003_create_token_balances.rb
class CreateTokenBalances < ActiveRecord::Migration[8.0]
  def change
    create_table :token_balances, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true, index: { unique: true }
      t.integer :purchased, default: 0, null: false
      t.integer :subscription_tokens, default: 5, null: false  # FREE plan default
      t.datetime :subscription_tokens_reset_at
      t.timestamps
    end
  end
end

# db/migrate/004_create_token_transactions.rb
class CreateTokenTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :token_transactions, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :payment, type: :uuid, foreign_key: true, null: true
      t.integer :amount, null: false  # positive = add, negative = spend
      t.integer :transaction_type, null: false
      # purchase: 0, spend: 1, subscription_grant: 2, refund: 3, bonus: 4
      t.integer :feature, null: true
      # virtual_tryon: 0, fashion_model: 1, variation: 2, outfit_generation: 3
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :token_transactions, [:user_id, :created_at]
    add_index :token_transactions, :transaction_type
  end
end

# db/migrate/005_create_ai_generations.rb
class CreateAiGenerations < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_generations, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :token_transaction, type: :uuid, foreign_key: true, null: true
      t.integer :generation_type, null: false
      # virtual_tryon: 0, fashion_model: 1, variation: 2, edit: 3
      t.integer :status, default: 0, null: false
      # pending: 0, processing: 1, completed: 2, failed: 3
      t.jsonb :input_data, default: {}
      t.string :the_new_black_url  # Временный URL (удаляется через 48ч)
      t.string :result_url  # Постоянный URL в Supabase Storage
      t.integer :tokens_spent, default: 1
      t.text :error_message
      t.timestamps
    end

    add_index :ai_generations, [:user_id, :created_at]
    add_index :ai_generations, :status
  end
end

# db/migrate/006_create_payments.rb
class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.integer :provider, null: false  # yookassa: 0, stripe: 1, apple: 2, google: 3
      t.string :external_id, null: false, index: { unique: true }
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :currency, limit: 3, default: 'RUB'
      t.integer :status, default: 0, null: false
      # pending: 0, completed: 1, cancelled: 2, refunded: 3
      t.integer :payment_type, null: false
      # subscription: 0, tokens: 1
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :payments, [:user_id, :created_at]
  end
end

# db/migrate/007_create_webhook_events.rb
class CreateWebhookEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :webhook_events, id: :uuid do |t|
      t.string :provider, null: false
      t.string :event_id, null: false
      t.string :event_type
      t.jsonb :payload, default: {}
      t.datetime :processed_at
      t.timestamps
    end

    add_index :webhook_events, [:provider, :event_id], unique: true
  end
end

# db/migrate/008_create_collections.rb
class CreateCollections < ActiveRecord::Migration[8.0]
  def change
    create_table :collections, id: :uuid do |t|
      t.string :title, null: false
      t.text :description
      t.string :cover_image_url
      t.boolean :published, default: false
      t.integer :position, default: 0
      t.timestamps
    end

    add_index :collections, :published
    add_index :collections, :position
  end
end

# db/migrate/009_create_collection_items.rb
class CreateCollectionItems < ActiveRecord::Migration[8.0]
  def change
    create_table :collection_items, id: :uuid do |t|
      t.references :collection, type: :uuid, null: false, foreign_key: true
      t.string :supabase_item_id  # ID вещи в Supabase items
      t.string :title
      t.string :image_url, null: false
      t.string :category
      t.jsonb :metadata, default: {}
      t.integer :position, default: 0
      t.timestamps
    end

    add_index :collection_items, [:collection_id, :position]
  end
end
```

### Supabase таблицы (создаются миграциями в Supabase)

```sql
-- Supabase: public.profiles (sync с auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  tokens_available INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger для автоматического создания profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Supabase Storage bucket: ai-generations (private)
-- Создаётся через Dashboard или API
```

---

## 📦 Модели и сервисы

### User Model

```ruby
# app/models/user.rb
class User < ApplicationRecord
  has_one :subscription, dependent: :destroy
  has_one :token_balance, dependent: :destroy
  has_many :token_transactions, dependent: :destroy
  has_many :ai_generations, dependent: :destroy
  has_many :payments, dependent: :destroy

  validates :supabase_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true

  after_create :create_default_resources

  def current_plan
    subscription&.active? ? subscription.plan : 'free'
  end

  def can_generate?(tokens_needed = 1)
    token_balance&.available.to_i >= tokens_needed
  end

  def spend_tokens!(amount, feature:, metadata: {})
    raise InsufficientTokensError unless can_generate?(amount)
    Tokens::SpendService.new(self).call(amount, feature: feature, metadata: metadata)
  end

  private

  def create_default_resources
    create_subscription!(plan: :free, status: :active, provider: :web)
    create_token_balance!(purchased: 0, subscription_tokens: 5)
  end
end

class InsufficientTokensError < StandardError; end
```

### TokenBalance Model

```ruby
# app/models/token_balance.rb
class TokenBalance < ApplicationRecord
  belongs_to :user

  validates :purchased, numericality: { greater_than_or_equal_to: 0 }
  validates :subscription_tokens, numericality: { greater_than_or_equal_to: 0 }

  def available
    purchased + subscription_tokens
  end

  def reset_subscription_tokens!
    plan_tokens = user.subscription&.monthly_tokens || 5

    transaction do
      update!(
        subscription_tokens: plan_tokens,
        subscription_tokens_reset_at: Time.current
      )

      user.token_transactions.create!(
        amount: plan_tokens,
        transaction_type: :subscription_grant,
        metadata: { plan: user.current_plan, reset_at: Time.current.iso8601 }
      )
    end

    # Sync to Supabase
    Supabase::SyncService.new.update_user_tokens(user.supabase_id, available)
  end
end
```

### Subscription Model

```ruby
# app/models/subscription.rb
class Subscription < ApplicationRecord
  belongs_to :user

  enum :plan, { free: 0, pro: 1, max: 2 }
  enum :status, { active: 0, cancelled: 1, expired: 2 }
  enum :provider, { web: 0, ios: 1, android: 2 }

  MONTHLY_TOKENS = { free: 5, pro: 50, max: 150 }.freeze
  PRICES = {
    pro: { monthly: 399, yearly: 3299, currency: 'RUB' },
    max: { monthly: 799, yearly: 5699, currency: 'RUB' }
  }.freeze

  scope :active, -> { where(status: :active).where('expires_at > ? OR expires_at IS NULL', Time.current) }

  def active?
    status == 'active' && (expires_at.nil? || expires_at > Time.current)
  end

  def monthly_tokens
    MONTHLY_TOKENS[plan.to_sym] || 5
  end

  def upgrade_to!(new_plan, provider:, expires_at:, external_id: nil)
    transaction do
      update!(
        plan: new_plan,
        status: :active,
        provider: provider,
        external_id: external_id,
        started_at: Time.current,
        expires_at: expires_at
      )

      # Reset tokens for new plan
      user.token_balance.reset_subscription_tokens!

      # Sync to Supabase
      Supabase::SyncService.new.update_user_plan(user.supabase_id, new_plan)
    end
  end
end
```

### Supabase Auth Service

```ruby
# app/services/supabase/auth_service.rb
module Supabase
  class AuthService
    SUPABASE_JWT_SECRET = ENV.fetch('SUPABASE_JWT_SECRET')

    def self.verify_token(token)
      decoded = JWT.decode(
        token,
        SUPABASE_JWT_SECRET,
        true,
        { algorithm: 'HS256', verify_aud: false }
      )

      payload = decoded.first

      # Проверяем expiration
      if payload['exp'] && Time.at(payload['exp']) < Time.current
        Rails.logger.warn "JWT expired: #{payload['exp']}"
        return nil
      end

      {
        supabase_id: payload['sub'],
        email: payload['email'],
        role: payload['role'],
        expires_at: payload['exp'] ? Time.at(payload['exp']) : nil
      }
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      Rails.logger.error "JWT verification failed: #{e.message}"
      nil
    end

    def self.find_or_create_user(token_data)
      User.find_or_create_by!(supabase_id: token_data[:supabase_id]) do |user|
        user.email = token_data[:email]
      end
    end
  end
end
```

### The New Black Client

```ruby
# app/services/the_new_black/client.rb
module TheNewBlack
  class Client
    include HTTParty
    base_uri 'https://thenewblack.ai/api/1.1/wf'

    API_KEY = ENV.fetch('THE_NEW_BLACK_API_KEY')
    EMAIL = ENV.fetch('THE_NEW_BLACK_EMAIL')
    PASSWORD = ENV.fetch('THE_NEW_BLACK_PASSWORD')

    def initialize
      @credentials = { email: EMAIL, password: PASSWORD }
    end

    protected

    def post_multipart(endpoint, params)
      response = self.class.post(
        "#{endpoint}?api_key=#{API_KEY}",
        multipart: true,
        body: @credentials.merge(params)
      )

      handle_response(response)
    end

    private

    def handle_response(response)
      return response.body if response.success?

      parsed = response.parsed_response rescue nil
      error_msg = parsed.is_a?(Hash) ? parsed['error'] : response.body

      raise ApiError, error_msg || "HTTP #{response.code}"
    end
  end

  class ApiError < StandardError; end
end

# app/services/the_new_black/virtual_tryon.rb
module TheNewBlack
  class VirtualTryon < Client
    def call(model_photo:, clothing_photo:, clothing_photo_2: nil, prompt: '', ratio: 'auto')
      params = {
        model_photo: model_photo,
        clothing_photo: clothing_photo,
        prompt: prompt,
        ratio: ratio
      }
      params[:clothing_photo_2] = clothing_photo_2 if clothing_photo_2.present?

      post_multipart('/vto_stream', params)
    end
  end
end

# app/services/the_new_black/fashion_models.rb
module TheNewBlack
  class FashionModels < Client
    def call(scene_description:, item_image:, item_image_2: nil, item_image_3: nil)
      params = {
        'scene-description': scene_description,
        'item-image': item_image
      }
      params['item-image-2'] = item_image_2 if item_image_2.present?
      params['item-image-3'] = item_image_3 if item_image_3.present?

      post_multipart('/ai-fashion-models-items', params)
    end
  end
end

# app/services/the_new_black/variations.rb
module TheNewBlack
  class Variations < Client
    def call(image:, prompt:)
      post_multipart('/variation', { image: image, prompt: prompt })
    end
  end
end
```

### Image Saver (Supabase Storage)

```ruby
# app/services/the_new_black/image_saver.rb
module TheNewBlack
  class ImageSaver
    def initialize(user)
      @user = user
      @storage = Supabase::StorageService.new
    end

    def save(temp_url, generation_type)
      return nil if temp_url.blank?

      # Download from The New Black (URLs expire in 48h)
      image_data = download_image(temp_url)
      return nil unless image_data

      # Upload to Supabase Storage
      filename = "#{generation_type}_#{SecureRandom.uuid}.png"
      path = "ai_generations/#{@user.supabase_id}/#{filename}"

      @storage.upload(
        bucket: 'ai-generations',
        path: path,
        data: image_data,
        content_type: 'image/png'
      )
    end

    private

    def download_image(url)
      response = HTTParty.get(url, timeout: 30)
      return nil unless response.success?
      response.body
    rescue StandardError => e
      Rails.logger.error "Failed to download image: #{e.message}"
      nil
    end
  end
end

# app/services/supabase/storage_service.rb
module Supabase
  class StorageService
    SUPABASE_URL = ENV.fetch('SUPABASE_URL')
    SERVICE_KEY = ENV.fetch('SUPABASE_SERVICE_KEY')

    def upload(bucket:, path:, data:, content_type:)
      response = HTTParty.post(
        "#{SUPABASE_URL}/storage/v1/object/#{bucket}/#{path}",
        body: data,
        headers: {
          'apikey' => SERVICE_KEY,
          'Authorization' => "Bearer #{SERVICE_KEY}",
          'Content-Type' => content_type,
          'x-upsert' => 'true'
        }
      )

      return nil unless response.success?

      # Return public URL or create signed URL for private bucket
      create_signed_url(bucket: bucket, path: path)
    end

    def create_signed_url(bucket:, path:, expires_in: 3600 * 24 * 7) # 7 days
      response = HTTParty.post(
        "#{SUPABASE_URL}/storage/v1/object/sign/#{bucket}/#{path}",
        body: { expiresIn: expires_in }.to_json,
        headers: headers
      )

      return nil unless response.success?

      signed_path = response.parsed_response['signedURL']
      "#{SUPABASE_URL}#{signed_path}"
    end

    private

    def headers
      {
        'apikey' => SERVICE_KEY,
        'Authorization' => "Bearer #{SERVICE_KEY}",
        'Content-Type' => 'application/json'
      }
    end
  end
end
```

---

## 🤖 AI-интеграция (The New Black)

### AI Controller

```ruby
# app/controllers/api/v1/ai_controller.rb
module Api
  module V1
    class AiController < BaseController
      before_action :check_token_availability

      # POST /api/v1/ai/virtual_tryon
      def virtual_tryon
        generation = create_generation(:virtual_tryon, tryon_params.to_h)
        ProcessAiGenerationJob.perform_later(generation.id)
        render_generation_started(generation)
      end

      # POST /api/v1/ai/fashion_model
      def fashion_model
        generation = create_generation(:fashion_model, fashion_model_params.to_h)
        ProcessAiGenerationJob.perform_later(generation.id)
        render_generation_started(generation)
      end

      # POST /api/v1/ai/variation
      def variation
        generation = create_generation(:variation, variation_params.to_h)
        ProcessAiGenerationJob.perform_later(generation.id)
        render_generation_started(generation)
      end

      # GET /api/v1/ai/generations/:id
      def show
        generation = current_user.ai_generations.find(params[:id])
        render json: generation_json(generation)
      end

      # GET /api/v1/ai/generations
      def index
        generations = current_user.ai_generations
          .order(created_at: :desc)
          .limit(params[:limit] || 20)
          .offset(params[:offset] || 0)

        render json: {
          generations: generations.map { |g| generation_json(g) },
          total: current_user.ai_generations.count
        }
      end

      private

      def check_token_availability
        cost = ai_cost_for_action
        return if current_user.can_generate?(cost)

        render json: {
          error: 'Insufficient tokens',
          tokensNeeded: cost,
          tokensAvailable: current_user.token_balance&.available || 0
        }, status: :payment_required
      end

      def ai_cost_for_action
        case action_name.to_sym
        when :virtual_tryon, :fashion_model, :variation then 1
        else 1
        end
      end

      def create_generation(type, input_data)
        current_user.ai_generations.create!(
          generation_type: type,
          status: :pending,
          input_data: input_data,
          tokens_spent: ai_cost_for_action
        )
      end

      def render_generation_started(generation)
        render json: {
          generationId: generation.id,
          status: 'processing',
          tokensSpent: generation.tokens_spent,
          tokensRemaining: current_user.token_balance.available - generation.tokens_spent
        }, status: :accepted
      end

      def generation_json(gen)
        {
          id: gen.id,
          status: gen.status,
          generationType: gen.generation_type,
          resultUrl: gen.result_url,
          tokensSpent: gen.tokens_spent,
          createdAt: gen.created_at.iso8601,
          errorMessage: gen.error_message
        }
      end

      def tryon_params
        params.permit(:model_photo, :clothing_photo, :clothing_photo_2, :prompt, :ratio)
      end

      def fashion_model_params
        params.permit(:scene_description, :item_image, :item_image_2, :item_image_3)
      end

      def variation_params
        params.permit(:image, :prompt)
      end
    end
  end
end
```

### AI Generation Job (Solid Queue)

```ruby
# app/jobs/process_ai_generation_job.rb
class ProcessAiGenerationJob < ApplicationJob
  queue_as :default

  # Solid Queue retry configuration
  retry_on TheNewBlack::ApiError, wait: 5.seconds, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(generation_id)
    generation = AiGeneration.find(generation_id)
    user = generation.user

    # Идемпотентность: не обрабатывать повторно
    return if generation.completed? || generation.failed?

    generation.update!(status: :processing)

    # 1. Списать токены (один раз)
    spend_tokens_if_needed!(generation, user)

    # 2. Вызвать The New Black API
    temp_url = call_ai_api(generation)

    # 3. Сохранить в Supabase Storage
    saver = TheNewBlack::ImageSaver.new(user)
    permanent_url = saver.save(temp_url, generation.generation_type)

    # 4. Обновить генерацию
    generation.update!(
      status: :completed,
      the_new_black_url: temp_url,
      result_url: permanent_url
    )

    # 5. Sync tokens to Supabase (UI)
    Supabase::SyncService.new.update_user_tokens(
      user.supabase_id,
      user.token_balance.available
    )

  rescue TheNewBlack::ApiError => e
    handle_failure(generation, e.message)
    raise # Re-raise для retry
  rescue StandardError => e
    handle_failure(generation, e.message)
    Rails.logger.error "AI Generation #{generation_id} failed: #{e.message}"
  end

  private

  def spend_tokens_if_needed!(generation, user)
    return if generation.token_transaction_id.present?

    user.token_balance.with_lock do
      tx = Tokens::SpendService.new(user).call(
        generation.tokens_spent,
        feature: generation.generation_type,
        metadata: { generation_id: generation.id }
      )
      generation.update!(token_transaction_id: tx.id)
    end
  end

  def call_ai_api(generation)
    input = generation.input_data.symbolize_keys

    case generation.generation_type.to_sym
    when :virtual_tryon
      TheNewBlack::VirtualTryon.new.call(**input)
    when :fashion_model
      TheNewBlack::FashionModels.new.call(**input)
    when :variation
      TheNewBlack::Variations.new.call(**input)
    else
      raise "Unknown generation type: #{generation.generation_type}"
    end
  end

  def handle_failure(generation, error_message)
    generation.update!(
      status: :failed,
      error_message: error_message
    )

    # Refund tokens on failure
    if generation.token_transaction_id.present?
      Tokens::RefundService.new(generation.user).refund_generation!(generation)
    end
  end
end
```

---

## 💳 Система токенов и биллинг

### Tokens Service

```ruby
# app/services/tokens/spend_service.rb
module Tokens
  class SpendService
    def initialize(user)
      @user = user
    end

    def call(amount, feature:, metadata: {})
      balance = @user.token_balance
      raise InsufficientTokensError if balance.available < amount

      # Breakdown: сначала subscription_tokens, потом purchased
      breakdown = calculate_breakdown(balance, amount)

      balance.with_lock do
        balance.decrement!(:subscription_tokens, breakdown[:subscription])
        balance.decrement!(:purchased, breakdown[:purchased])

        @user.token_transactions.create!(
          amount: -amount,
          transaction_type: :spend,
          feature: feature,
          metadata: metadata.merge(spent: breakdown)
        )
      end
    end

    private

    def calculate_breakdown(balance, amount)
      sub_spend = [balance.subscription_tokens, amount].min
      purchased_spend = amount - sub_spend
      { subscription: sub_spend, purchased: purchased_spend }
    end
  end
end

# app/services/tokens/refund_service.rb
module Tokens
  class RefundService
    def initialize(user)
      @user = user
    end

    def refund_generation!(generation)
      tx = generation.token_transaction
      return unless tx&.spend?

      spent = tx.metadata&.dig('spent') || { 'subscription' => 0, 'purchased' => tx.amount.abs }

      @user.token_balance.with_lock do
        @user.token_balance.increment!(:subscription_tokens, spent['subscription'].to_i)
        @user.token_balance.increment!(:purchased, spent['purchased'].to_i)

        @user.token_transactions.create!(
          amount: tx.amount.abs,
          transaction_type: :refund,
          feature: tx.feature,
          metadata: {
            refunded_transaction_id: tx.id,
            reason: 'ai_failed',
            generation_id: generation.id
          }
        )
      end
    end

    def refund_payment!(payment, reason:)
      # Для chargeback/refund платежей за токены
      purchase_tx = @user.token_transactions
        .where(payment_id: payment.id, transaction_type: :purchase)
        .first

      return unless purchase_tx

      amount = purchase_tx.amount

      @user.token_balance.with_lock do
        # Можем уйти в минус purchased если токены уже потрачены
        @user.token_balance.decrement!(:purchased, [amount, @user.token_balance.purchased].min)

        @user.token_transactions.create!(
          amount: -amount,
          transaction_type: :refund,
          metadata: { reason: reason, payment_id: payment.id }
        )
      end
    end
  end
end
```

### YooKassa Integration

```ruby
# app/services/payments/yookassa_service.rb
module Payments
  class YookassaService
    SHOP_ID = ENV.fetch('YOOKASSA_SHOP_ID')
    SECRET_KEY = ENV.fetch('YOOKASSA_SECRET_KEY')
    BASE_URL = 'https://api.yookassa.ru/v3'

    SUBSCRIPTION_PRICES = {
      pro: { monthly: 399, yearly: 3299 },
      max: { monthly: 799, yearly: 5699 }
    }.freeze

    TOKEN_PACKS = {
      small: { tokens: 10, price: 99 },
      medium: { tokens: 30, price: 249 },
      large: { tokens: 100, price: 699 },
      xl: { tokens: 300, price: 1799 }
    }.freeze

    def create_subscription_payment(user, plan:, period: :monthly)
      amount = SUBSCRIPTION_PRICES.dig(plan.to_sym, period.to_sym)
      raise ArgumentError, "Invalid plan/period" unless amount

      create_payment(
        user: user,
        amount: amount,
        description: "Obrazz #{plan.to_s.titleize} - #{period == :yearly ? 'Год' : 'Месяц'}",
        payment_type: :subscription,
        metadata: { plan: plan, period: period },
        save_payment_method: true
      )
    end

    def create_tokens_payment(user, pack:)
      pack_data = TOKEN_PACKS[pack.to_sym]
      raise ArgumentError, "Invalid token pack" unless pack_data

      create_payment(
        user: user,
        amount: pack_data[:price],
        description: "Obrazz - #{pack_data[:tokens]} токенов",
        payment_type: :tokens,
        metadata: { pack: pack, tokens: pack_data[:tokens] }
      )
    end

    def process_webhook(notification)
      event_id = notification.dig('object', 'id')
      event_type = notification['event']

      # Idempotency check
      return if WebhookEvent.exists?(provider: 'yookassa', event_id: event_id)

      WebhookEvent.create!(
        provider: 'yookassa',
        event_id: event_id,
        event_type: event_type,
        payload: notification,
        processed_at: Time.current
      )

      payment_id = notification.dig('object', 'id')
      payment = Payment.find_by(external_id: payment_id)
      return unless payment

      case event_type
      when 'payment.succeeded'
        handle_payment_success(payment)
      when 'payment.canceled'
        payment.update!(status: :cancelled)
      when 'refund.succeeded'
        handle_refund(payment)
      end
    end

    private

    def create_payment(user:, amount:, description:, payment_type:, metadata:, save_payment_method: false)
      idempotence_key = SecureRandom.uuid

      response = HTTParty.post(
        "#{BASE_URL}/payments",
        basic_auth: { username: SHOP_ID, password: SECRET_KEY },
        headers: {
          'Content-Type' => 'application/json',
          'Idempotence-Key' => idempotence_key
        },
        body: {
          amount: { value: amount.to_s, currency: 'RUB' },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: "#{ENV['DASHBOARD_URL']}/dashboard/billing/success"
          },
          description: description,
          save_payment_method: save_payment_method,
          metadata: metadata.merge(user_id: user.id)
        }.to_json
      )

      raise PaymentError, response.body unless response.success?

      data = response.parsed_response

      payment = Payment.create!(
        user: user,
        provider: :yookassa,
        external_id: data['id'],
        amount: amount,
        currency: 'RUB',
        status: :pending,
        payment_type: payment_type,
        metadata: metadata
      )

      { payment: payment, confirmation_url: data.dig('confirmation', 'confirmation_url') }
    end

    def handle_payment_success(payment)
      payment.update!(status: :completed)

      case payment.payment_type.to_sym
      when :subscription
        activate_subscription(payment)
      when :tokens
        grant_tokens(payment)
      end
    end

    def activate_subscription(payment)
      metadata = payment.metadata.symbolize_keys
      period = metadata[:period]&.to_sym || :monthly
      expires_at = period == :yearly ? 1.year.from_now : 1.month.from_now

      payment.user.subscription.upgrade_to!(
        metadata[:plan],
        provider: :web,
        expires_at: expires_at,
        external_id: payment.external_id
      )
    end

    def grant_tokens(payment)
      tokens = payment.metadata['tokens'].to_i
      return if tokens.zero?

      payment.user.token_balance.with_lock do
        payment.user.token_balance.increment!(:purchased, tokens)

        payment.user.token_transactions.create!(
          amount: tokens,
          transaction_type: :purchase,
          payment: payment,
          metadata: { pack: payment.metadata['pack'] }
        )
      end

      # Sync to Supabase
      Supabase::SyncService.new.update_user_tokens(
        payment.user.supabase_id,
        payment.user.token_balance.available
      )
    end

    def handle_refund(payment)
      payment.update!(status: :refunded)
      Tokens::RefundService.new(payment.user).refund_payment!(payment, reason: :payment_refund)
    end
  end

  class PaymentError < StandardError; end
end
```

### IAP Validation (Apple/Google)

```ruby
# app/services/payments/iap_service.rb
module Payments
  class IapService
    APPLE_VERIFY_URL = ENV.fetch('APPLE_VERIFY_URL', 'https://buy.itunes.apple.com/verifyReceipt')
    APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'
    APPLE_SHARED_SECRET = ENV.fetch('APPLE_SHARED_SECRET')

    PRODUCT_TO_PLAN = {
      'com.obrazz.pro.monthly' => { plan: :pro, period: :monthly },
      'com.obrazz.pro.yearly' => { plan: :pro, period: :yearly },
      'com.obrazz.max.monthly' => { plan: :max, period: :monthly },
      'com.obrazz.max.yearly' => { plan: :max, period: :yearly }
    }.freeze

    def verify_ios(receipt_data, user)
      response = verify_apple_receipt(receipt_data, APPLE_VERIFY_URL)

      # Try sandbox if production fails with 21007
      if response['status'] == 21007
        response = verify_apple_receipt(receipt_data, APPLE_SANDBOX_URL)
      end

      return { success: false, error: 'Invalid receipt' } unless response['status'] == 0

      latest = response.dig('latest_receipt_info')&.last
      return { success: false, error: 'No subscription info' } unless latest

      process_apple_subscription(user, latest)
    end

    def verify_android(purchase_token, product_id, user)
      # Google Play Developer API
      subscription = fetch_google_subscription(purchase_token, product_id)
      return { success: false, error: 'Invalid purchase' } unless subscription

      process_google_subscription(user, subscription, product_id)
    end

    private

    def verify_apple_receipt(receipt_data, url)
      response = HTTParty.post(
        url,
        body: {
          'receipt-data' => receipt_data,
          'password' => APPLE_SHARED_SECRET,
          'exclude-old-transactions' => true
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
      response.parsed_response
    end

    def process_apple_subscription(user, receipt)
      product_id = receipt['product_id']
      plan_info = PRODUCT_TO_PLAN[product_id]
      return { success: false, error: 'Unknown product' } unless plan_info

      expires_at = Time.at(receipt['expires_date_ms'].to_i / 1000)
      external_id = receipt['original_transaction_id']

      # Idempotency
      if Payment.exists?(provider: :apple, external_id: external_id)
        return { success: true, message: 'Already processed' }
      end

      Payment.create!(
        user: user,
        provider: :apple,
        external_id: external_id,
        amount: 0, # IAP amounts handled by Apple
        currency: 'USD',
        status: expires_at > Time.current ? :completed : :expired,
        payment_type: :subscription,
        metadata: { product_id: product_id }
      )

      user.subscription.upgrade_to!(
        plan_info[:plan],
        provider: :ios,
        expires_at: expires_at,
        external_id: external_id
      )

      { success: true, subscription: user.subscription }
    end

    def fetch_google_subscription(purchase_token, product_id)
      # Simplified — in production use Google Auth + Publisher API
      # Google::Apis::AndroidpublisherV3
      nil # TODO: Implement
    end

    def process_google_subscription(user, subscription, product_id)
      # TODO: Similar to Apple flow
      { success: false, error: 'Not implemented' }
    end
  end
end
```

---

## 🖥️ Личный кабинет (Dashboard)

### Dashboard Layout

```erb
<%# app/views/layouts/dashboard.html.erb %>
<!DOCTYPE html>
<html>
<head>
  <title>Obrazz - Личный кабинет</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <%= csrf_meta_tags %>
  <%= csp_meta_tag %>
  <%= stylesheet_link_tag "tailwind", "inter-font", "data-turbo-track": "reload" %>
  <%= stylesheet_link_tag "application", "data-turbo-track": "reload" %>
  <%= javascript_importmap_tags %>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <%= link_to dashboard_root_path, class: "flex items-center" do %>
            <span class="text-2xl font-bold">Obrazz</span>
          <% end %>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Token balance -->
          <div class="flex items-center px-3 py-1.5 bg-gray-100 rounded-full">
            <span class="text-yellow-500 mr-1">⚡</span>
            <span class="font-medium"><%= @token_balance&.available || 0 %></span>
          </div>

          <!-- User menu -->
          <div class="relative" data-controller="dropdown">
            <button data-action="click->dropdown#toggle" class="flex items-center">
              <span class="text-gray-700"><%= current_user.email %></span>
              <svg class="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Sidebar + Content -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex gap-8">
      <!-- Sidebar -->
      <aside class="w-64 flex-shrink-0">
        <nav class="space-y-1">
          <%= link_to dashboard_root_path,
              class: "flex items-center px-4 py-3 rounded-xl #{request.path == dashboard_root_path ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}" do %>
            <span class="mr-3">🏠</span> Главная
          <% end %>

          <%= link_to dashboard_subscription_path,
              class: "flex items-center px-4 py-3 rounded-xl #{request.path.include?('subscription') ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}" do %>
            <span class="mr-3">💎</span> Подписка
          <% end %>

          <%= link_to dashboard_tokens_path,
              class: "flex items-center px-4 py-3 rounded-xl #{request.path.include?('tokens') ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}" do %>
            <span class="mr-3">⚡</span> Токены
          <% end %>

          <%= link_to dashboard_generations_path,
              class: "flex items-center px-4 py-3 rounded-xl #{request.path.include?('generations') ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}" do %>
            <span class="mr-3">🎨</span> Генерации
          <% end %>

          <%= link_to dashboard_settings_path,
              class: "flex items-center px-4 py-3 rounded-xl #{request.path.include?('settings') ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}" do %>
            <span class="mr-3">⚙️</span> Настройки
          <% end %>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="flex-1">
        <%= yield %>
      </main>
    </div>
  </div>
</body>
</html>
```

### Dashboard Home

```erb
<%# app/views/dashboard/home/index.html.erb %>
<div class="space-y-6">
  <h1 class="text-2xl font-bold">Добро пожаловать!</h1>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Subscription Card -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-gray-500">Подписка</span>
        <span class="px-3 py-1 rounded-full text-sm font-medium
          <%= @subscription&.active? ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600' %>">
          <%= @subscription&.plan&.upcase || 'FREE' %>
        </span>
      </div>
      <% if @subscription&.active? && @subscription.expires_at %>
        <p class="text-sm text-gray-500">
          До <%= l(@subscription.expires_at, format: :short) %>
        </p>
      <% end %>
      <%= link_to 'Управление', dashboard_subscription_path, class: 'text-blue-600 text-sm hover:underline' %>
    </div>

    <!-- Tokens Card -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-gray-500">Токены</span>
        <span class="text-2xl font-bold"><%= @token_balance&.available || 0 %></span>
      </div>
      <div class="text-sm text-gray-500 space-y-1">
        <div class="flex justify-between">
          <span>Купленные</span>
          <span><%= @token_balance&.purchased || 0 %></span>
        </div>
        <div class="flex justify-between">
          <span>Подписочные</span>
          <span><%= @token_balance&.subscription_tokens || 0 %></span>
        </div>
      </div>
      <%= link_to 'Купить токены', dashboard_tokens_path, class: 'text-blue-600 text-sm hover:underline mt-2 inline-block' %>
    </div>

    <!-- Generations Card -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-gray-500">Генераций (30 дней)</span>
        <span class="text-2xl font-bold"><%= @generations_count %></span>
      </div>
      <%= link_to 'Смотреть все', dashboard_generations_path, class: 'text-blue-600 text-sm hover:underline' %>
    </div>
  </div>

  <!-- Recent Generations -->
  <div class="bg-white rounded-2xl shadow-sm p-6">
    <h2 class="text-lg font-semibold mb-4">Последние генерации</h2>

    <% if @recent_generations.any? %>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <% @recent_generations.each do |gen| %>
          <div class="relative group">
            <% if gen.result_url.present? %>
              <%= image_tag gen.result_url,
                  class: "w-full aspect-[3/4] object-cover rounded-xl",
                  loading: "lazy" %>
            <% else %>
              <div class="w-full aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center">
                <% if gen.processing? %>
                  <span class="text-gray-400">⏳</span>
                <% else %>
                  <span class="text-gray-400">❌</span>
                <% end %>
              </div>
            <% end %>
            <div class="absolute bottom-2 left-2 right-2">
              <span class="px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                <%= gen.generation_type.humanize %>
              </span>
            </div>
          </div>
        <% end %>
      </div>
    <% else %>
      <p class="text-gray-500 text-center py-8">
        Пока нет генераций. Попробуйте AI-функции в приложении!
      </p>
    <% end %>
  </div>
</div>
```

---

## 🔧 Админ-панель

### Admin Panel (custom сейчас; Administrate optional)

> Примечание: в `obrazz-rails` уже есть custom admin (`/admin/*`) на Rails views + HTTP Basic.
> Ниже — пример, как можно подключить Administrate позже, если понадобится генерация CRUD-дашбордов.

```ruby
# app/dashboards/collection_dashboard.rb
require "administrate/base_dashboard"

class CollectionDashboard < Administrate::BaseDashboard
  ATTRIBUTE_TYPES = {
    id: Field::String,
    title: Field::String,
    description: Field::Text,
    cover_image_url: Field::String,
    published: Field::Boolean,
    position: Field::Number,
    collection_items: Field::HasMany,
    created_at: Field::DateTime,
    updated_at: Field::DateTime,
  }.freeze

  COLLECTION_ATTRIBUTES = %i[
    id
    title
    published
    position
    created_at
  ].freeze

  SHOW_PAGE_ATTRIBUTES = %i[
    id
    title
    description
    cover_image_url
    published
    position
    collection_items
    created_at
    updated_at
  ].freeze

  FORM_ATTRIBUTES = %i[
    title
    description
    cover_image_url
    published
    position
  ].freeze
end

# app/dashboards/collection_item_dashboard.rb
class CollectionItemDashboard < Administrate::BaseDashboard
  ATTRIBUTE_TYPES = {
    id: Field::String,
    collection: Field::BelongsTo,
    title: Field::String,
    image_url: Field::String,
    category: Field::String,
    position: Field::Number,
    metadata: Field::String.with_options(searchable: false),
    created_at: Field::DateTime,
  }.freeze

  COLLECTION_ATTRIBUTES = %i[
    id
    title
    category
    position
  ].freeze

  FORM_ATTRIBUTES = %i[
    collection
    title
    image_url
    category
    position
    metadata
  ].freeze
end
```

### Admin Routes

```ruby
# config/routes.rb (admin section)
namespace :admin do
  resources :collections do
    resources :collection_items
  end
  resources :users, only: [:index, :show]
  resources :ai_generations, only: [:index, :show]
  resources :payments, only: [:index, :show]

  root to: "collections#index"
end

# Protect admin with basic auth or separate auth
authenticate :admin_user do
  mount MissionControl::Jobs::Engine, at: "/jobs"
end
```

---

## 📡 API Endpoints

### Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Health check for Render
  get '/health', to: proc { [200, {}, ['OK']] }

  # API v1
  namespace :api do
    namespace :v1 do
      # Auth check
      get 'me', to: 'users#me'

      # Subscription
      resource :subscription, only: [:show]

      # Tokens
      resource :tokens, only: [:show] do
        get :history
        post :purchase
      end

      # AI
      post 'ai/virtual_tryon', to: 'ai#virtual_tryon'
      post 'ai/fashion_model', to: 'ai#fashion_model'
      post 'ai/variation', to: 'ai#variation'
      get 'ai/generations', to: 'ai#index'
      get 'ai/generations/:id', to: 'ai#show'

      # Collections (read-only for mobile)
      resources :collections, only: [:index, :show] do
        get :items, on: :member
      end

      # IAP
      post 'iap/verify_ios', to: 'iap#verify_ios'
      post 'iap/verify_android', to: 'iap#verify_android'
    end
  end

  # Dashboard
  namespace :dashboard do
    root to: 'home#index'
    resource :subscription, only: [:show, :create]
    resource :tokens, only: [:show] do
      post :purchase
    end
    resources :generations, only: [:index, :show]
    resource :billing, only: [:show]
    resource :settings, only: [:show, :update]
  end

  # Webhooks
  namespace :webhooks do
    post 'yookassa', to: 'yookassa#create'
    post 'stripe', to: 'stripe#create'
    post 'app_store', to: 'app_store#create'
    post 'play_store', to: 'play_store#create'
  end

  # Admin
  namespace :admin do
    resources :collections
    resources :collection_items
    root to: 'collections#index'
  end

  # Root
  root to: redirect('/dashboard')
end
```

### API Response Formats

```ruby
# GET /api/v1/me
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expiresAt": "2026-02-27T00:00:00Z"
    },
    "tokens": {
      "available": 45,
      "purchased": 20,
      "subscriptionTokens": 25
    }
  }
}

# POST /api/v1/ai/virtual_tryon (accepted)
{
  "generationId": "uuid",
  "status": "processing",
  "tokensSpent": 1,
  "tokensRemaining": 44
}

# GET /api/v1/ai/generations/:id (completed)
{
  "id": "uuid",
  "status": "completed",
  "generationType": "virtual_tryon",
  "resultUrl": "https://...",
  "tokensSpent": 1,
  "createdAt": "2026-01-27T12:00:00Z"
}

# GET /api/v1/collections
{
  "collections": [
    {
      "id": "uuid",
      "title": "Зимние образы",
      "description": "...",
      "coverImageUrl": "https://...",
      "itemsCount": 24
    }
  ]
}
```

---

## 🚀 Деплой и инфраструктура

### render.yaml

```yaml
# render.yaml
services:
  - type: web
    name: obrazz-rails
    runtime: ruby
    buildCommand: |
      bundle install
      bundle exec rails assets:precompile
      bundle exec rails db:migrate
    startCommand: bundle exec puma -C config/puma.rb
    envVars:
      - key: RAILS_ENV
        value: production
      - key: RAILS_MASTER_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: obrazz-db
          property: connectionString
      # Supabase
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      # The New Black
      - key: THE_NEW_BLACK_API_KEY
        sync: false
      - key: THE_NEW_BLACK_EMAIL
        sync: false
      - key: THE_NEW_BLACK_PASSWORD
        sync: false
      # Payments
      - key: YOOKASSA_SHOP_ID
        sync: false
      - key: YOOKASSA_SECRET_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      # IAP
      - key: APPLE_SHARED_SECRET
        sync: false
      # App
      - key: DASHBOARD_URL
        value: https://app.obrazz.ru
    healthCheckPath: /health

databases:
  - name: obrazz-db
    plan: free # Render free PostgreSQL
    databaseName: obrazz_production
```

### Procfile (для Solid Queue)

```
# Procfile
web: bundle exec puma -C config/puma.rb
worker: bundle exec rake solid_queue:start
```

### Solid Queue Configuration

```ruby
# config/solid_queue.yml
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: "*"
      threads: 3
      processes: 1
      polling_interval: 0.1

development:
  <<: *default

production:
  <<: *default
  workers:
    - queues: "*"
      threads: 5
      processes: 1
      polling_interval: 0.1

# config/initializers/solid_queue.rb
Rails.application.configure do
  config.active_job.queue_adapter = :solid_queue
  config.solid_queue.connects_to = { database: { writing: :queue } }
end

# Note: Solid Queue uses the same PostgreSQL database, no Redis needed!
```

### Environment Variables

```bash
# .env.example

# Rails
RAILS_ENV=production
RAILS_MASTER_KEY=xxx
SECRET_KEY_BASE=xxx

# Database (Render provides this)
DATABASE_URL=postgres://...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# The New Black AI
THE_NEW_BLACK_API_KEY=xxx
THE_NEW_BLACK_EMAIL=your@email.com
THE_NEW_BLACK_PASSWORD=your_password

# Payments - Russia
YOOKASSA_SHOP_ID=xxx
YOOKASSA_SECRET_KEY=xxx

# Payments - Global
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# IAP
APPLE_SHARED_SECRET=xxx
APPLE_VERIFY_URL=https://buy.itunes.apple.com/verifyReceipt
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
ANDROID_PACKAGE_NAME=com.obrazz.app

# App URLs
DASHBOARD_URL=https://app.obrazz.ru

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 📅 Поэтапный план реализации

### Phase 1: Foundation (1-2 недели)

**Цель:** Рабочий Rails проект с базовой инфраструктурой

| Задача                                                 | Приоритет | Время |
| ------------------------------------------------------ | --------- | ----- |
| Инициализация Rails 8 проекта                          | 🔴        | 2ч    |
| Настройка PostgreSQL + Solid Queue                     | 🔴        | 2ч    |
| Создание миграций (users, subscriptions, tokens, etc.) | 🔴        | 4ч    |
| JWT аутентификация (Supabase интеграция)               | 🔴        | 4ч    |
| Base API controller с authentication                   | 🔴        | 2ч    |
| Health check endpoint                                  | 🔴        | 30м   |
| CORS configuration                                     | 🔴        | 30м   |
| Деплой на Render (пустой проект)                       | 🔴        | 2ч    |
| RSpec setup + базовые тесты                            | 🟡        | 2ч    |

**Deliverables:**

- [ ] `GET /health` возвращает 200
- [ ] `GET /api/v1/me` возвращает пользователя по JWT
- [ ] Render deployment работает

---

### Phase 2: User & Tokens System (1 неделя)

**Цель:** Полностью работающая система токенов

| Задача                                | Приоритет | Время |
| ------------------------------------- | --------- | ----- |
| User model с Supabase sync            | 🔴        | 2ч    |
| TokenBalance model + logic            | 🔴        | 3ч    |
| TokenTransaction model                | 🔴        | 2ч    |
| Tokens::SpendService                  | 🔴        | 2ч    |
| Tokens::RefundService                 | 🔴        | 2ч    |
| API: GET /tokens, GET /tokens/history | 🔴        | 2ч    |
| Supabase profiles sync                | 🟡        | 2ч    |
| Unit tests для tokens                 | 🟡        | 3ч    |

**Deliverables:**

- [ ] API показывает баланс токенов
- [ ] Можно списывать/возвращать токены
- [ ] История транзакций работает

---

### Phase 3: AI Integration (1-2 недели)

**Цель:** AI-генерация через The New Black API

| Задача                                               | Приоритет | Время |
| ---------------------------------------------------- | --------- | ----- |
| TheNewBlack::Client base class                       | 🔴        | 2ч    |
| VirtualTryon service                                 | 🔴        | 2ч    |
| FashionModels service                                | 🔴        | 2ч    |
| Variations service                                   | 🔴        | 2ч    |
| ImageSaver (Supabase Storage)                        | 🔴        | 4ч    |
| AiGeneration model                                   | 🔴        | 2ч    |
| ProcessAiGenerationJob (Solid Queue)                 | 🔴        | 4ч    |
| API controllers (virtual_tryon, fashion_model, etc.) | 🔴        | 4ч    |
| Polling endpoint (GET /generations/:id)              | 🔴        | 1ч    |
| Error handling + refunds                             | 🟡        | 3ч    |
| Integration tests                                    | 🟡        | 4ч    |

**Deliverables:**

- [ ] Mobile может вызвать `/api/v1/ai/virtual_tryon`
- [ ] Job выполняется в Solid Queue
- [ ] Результат сохраняется в Supabase Storage
- [ ] Токены списываются корректно

---

### Phase 4: Subscriptions & Payments (2 недели)

**Цель:** YooKassa + IAP работают

| Задача                                     | Приоритет | Время |
| ------------------------------------------ | --------- | ----- |
| Subscription model                         | 🔴        | 2ч    |
| YookassaService (create payment)           | 🔴        | 4ч    |
| YooKassa webhook handler                   | 🔴        | 4ч    |
| Token purchase flow                        | 🔴        | 3ч    |
| Subscription activation                    | 🔴        | 3ч    |
| Monthly token reset job (scheduled)        | 🔴        | 2ч    |
| IAP verification (Apple)                   | 🟡        | 4ч    |
| IAP verification (Google)                  | 🟡        | 4ч    |
| Webhook idempotency (webhook_events table) | 🔴        | 2ч    |
| Stripe integration (optional)              | 🟢        | 4ч    |

**Deliverables:**

- [ ] Пользователь РФ может оплатить через YooKassa
- [ ] Webhook активирует подписку
- [ ] IAP валидация работает
- [ ] Токены начисляются ежемесячно

---

### Phase 5: Dashboard UI (1-2 недели)

**Цель:** Личный кабинет для пользователей

| Задача                                 | Приоритет | Время |
| -------------------------------------- | --------- | ----- |
| Dashboard layout (Tailwind + Turbo)    | 🔴        | 4ч    |
| Home page (stats)                      | 🔴        | 3ч    |
| Subscription page                      | 🔴        | 4ч    |
| Tokens page + purchase                 | 🔴        | 4ч    |
| Generations gallery                    | 🔴        | 4ч    |
| Settings page                          | 🟡        | 3ч    |
| Billing management (web subscriptions) | 🟡        | 4ч    |
| Mobile auth deep link                  | 🟡        | 2ч    |
| Responsive design                      | 🟡        | 4ч    |

**Deliverables:**

- [ ] Пользователь может войти в ЛК через браузер
- [ ] Видит подписку, токены, генерации
- [ ] Может купить токены и подписку

---

### Phase 6: Admin Panel (1 неделя)

**Цель:** Админка для управления контентом

| Задача                           | Приоритет | Время |
| -------------------------------- | --------- | ----- |
| Administrate setup (optional)    | 🔴        | 2ч    |
| Collections CRUD                 | 🔴        | 3ч    |
| Collection Items CRUD            | 🔴        | 3ч    |
| Users list (read-only)           | 🟡        | 2ч    |
| Payments list                    | 🟡        | 2ч    |
| AI Generations list              | 🟡        | 2ч    |
| Admin authentication             | 🔴        | 2ч    |
| Mission Control (job monitoring) | 🟡        | 1ч    |

**Deliverables:**

- [ ] Админ может создавать коллекции
- [ ] Админ видит пользователей и платежи
- [ ] Мониторинг очереди jobs

---

### Phase 7: Mobile Integration (1 неделя)

**Цель:** Mobile app полностью интегрирован с backend

| Задача                                    | Приоритет | Время |
| ----------------------------------------- | --------- | ----- |
| Mobile: aiService.ts (API calls)          | 🔴        | 4ч    |
| Mobile: AI screens (Virtual Try-On, etc.) | 🔴        | 8ч    |
| Mobile: Token balance display             | 🔴        | 2ч    |
| Mobile: Subscription status               | 🔴        | 2ч    |
| Mobile: Paywall (region detection)        | 🟡        | 4ч    |
| Mobile: IAP flow                          | 🟡        | 4ч    |
| Mobile: Web billing redirect (RU)         | 🟡        | 2ч    |
| E2E testing                               | 🟡        | 4ч    |

**Deliverables:**

- [ ] AI-функции работают из приложения
- [ ] Оплата работает (IAP + web)
- [ ] Токены синхронизируются

---

### Phase 8: Production Polish (1 неделя)

**Цель:** Production-ready система

| Задача                      | Приоритет | Время |
| --------------------------- | --------- | ----- |
| Sentry integration          | 🔴        | 2ч    |
| Rate limiting (rack-attack) | 🔴        | 2ч    |
| Logging improvements        | 🟡        | 2ч    |
| Performance optimization    | 🟡        | 4ч    |
| Security audit              | 🔴        | 4ч    |
| Documentation               | 🟡        | 4ч    |
| Monitoring dashboard        | 🟡        | 2ч    |
| Backup strategy             | 🔴        | 2ч    |

**Deliverables:**

- [ ] Errors отправляются в Sentry
- [ ] Rate limiting защищает API
- [ ] Система готова к production нагрузке

---

## ✅ Чеклист готовности

### Infrastructure

- [ ] Render проект создан
- [ ] PostgreSQL database настроена
- [ ] Solid Queue работает
- [ ] Домен настроен (app.obrazz.ru)
- [ ] SSL сертификат активен

### Supabase

- [ ] `public.profiles` таблица создана
- [ ] RLS policies настроены
- [ ] `ai-generations` bucket создан (private)
- [ ] Trigger для auto-create profiles работает

### Security

- [ ] SUPABASE_JWT_SECRET корректен
- [ ] SERVICE_KEY только на backend (не в mobile!)
- [ ] Webhook signature verification работает
- [ ] Rate limiting активен
- [ ] CORS настроен корректно

### Tokens System

- [ ] Spend idempotent (через token_transaction_id)
- [ ] Refund работает (в тот же источник)
- [ ] Monthly reset job scheduled
- [ ] Sync с Supabase profiles работает

### AI Integration

- [ ] The New Black credentials работают
- [ ] Images сохраняются в Supabase Storage
- [ ] Jobs выполняются в Solid Queue
- [ ] Retry logic настроен
- [ ] Refund при ошибке работает

### Payments

- [ ] YooKassa webhook настроен
- [ ] Idempotency через webhook_events
- [ ] Subscription activation работает
- [ ] Token purchase работает
- [ ] IAP validation работает (Apple/Google)

### Mobile

- [ ] aiService.ts интегрирован
- [ ] AI screens созданы
- [ ] Paywall показывает правильную опцию (web vs IAP)
- [ ] Deep link в Dashboard работает

---

## 📚 Связанная документация

- [Backend.md](./Extra/Features/Backend.md) — Исходная архитектура
- [THE_NEW_BLACK_AI_SERVICE_ANALYSIS.md](./Extra/Features/THE_NEW_BLACK_AI_SERVICE_ANALYSIS.md) — Анализ AI API
- [HOME_SCREEN_AI_HUB_DESIGN_PLAN.md](./Extra/Features/HOME_SCREEN_AI_HUB_DESIGN_PLAN.md) — Дизайн AI Hub
- [NAVIGATION_REFACTOR_PLAN.md](./Features/NAVIGATION_REFACTOR_PLAN.md) — Рефакторинг навигации
- [PRDobrazz.md](./PRDobrazz.md) — Product Requirements
- [Implementation.md](./Implementation.md) — Общий Roadmap

---

## 📝 Примечания

### Почему Solid Queue вместо Sidekiq?

1. **Render Free Tier** — нет Redis add-on
2. **Простота** — один сервис вместо двух
3. **Rails 8 native** — встроенная поддержка
4. **Достаточная производительность** — для MVP и start-up нагрузки

### Когда мигрировать на Sidekiq?

- При >10K jobs в день
- При необходимости real-time очередей
- При миграции на paid tier Render или VPS

### Масштабирование

1. **Start:** Render Free Tier (текущий план)
2. **Growth:** Render Starter ($7/мес) + Redis add-on
3. **Scale:** VPS (Hetzner/DigitalOcean) + Kamal deployment

---

**Общая оценка времени:** 8-10 недель при full-time разработке

**Критический путь:** Phase 1 → Phase 2 → Phase 3 → Phase 4

**Можно параллелить:** Phase 5-6 (Dashboard/Admin) с Phase 7 (Mobile)
