# 🔧 Obrazz Backend Architecture

> **Дата создания:** 9 декабря 2025  
> **Версия:** 2.0.0  
> **Статус:** Планирование  
> **Обновлено:** 22 декабря 2025

---

## 📋 Оглавление

1. [Архитектура системы](#архитектура-системы)
2. [Ruby on Rails Backend](#ruby-on-rails-backend)
3. [Интеграция с Supabase](#интеграция-с-supabase)
4. [The New Black AI Integration](#the-new-black-ai-integration)
5. [Платёжная система](#платёжная-система)
6. [Система токенов и лимитов](#система-токенов-и-лимитов)
7. [Личный кабинет (Dashboard)](#личный-кабинет-dashboard)
8. [API Endpoints](#api-endpoints)
9. [Деплой и инфраструктура](#деплой-и-инфраструктура)

---

## 🏗 Архитектура системы

### Общая схема

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          КЛИЕНТЫ                                        │
├────────────────┬────────────────┬────────────────┬──────────────────────┤
│  iOS App       │  Android App   │  Web Dashboard │  Landing Page        │
│  (React Native)│  (React Native)│  (Rails Views) │  (Vite/React)        │
└───────┬────────┴───────┬────────┴───────┬────────┴──────────┬───────────┘
        │                │                │                   │
        ▼                ▼                ▼                   │
┌─────────────────────────────────────────────────────────────┤
│                     SUPABASE                                │
│  ┌─────────────┬─────────────┬─────────────┐               │
│  │    Auth     │  PostgreSQL │   Storage   │               │
│  │ (JWT/OAuth) │ (Database)  │  (Images)   │               │
│  └──────┬──────┴──────┬──────┴──────┬──────┘               │
└─────────┼─────────────┼─────────────┼───────────────────────┘
          │             │             │
          ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│              RUBY ON RAILS BACKEND (ЕДИНЫЙ)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Бизнес-логика           • Webhooks обработка       ││
│  │  • Подписки и токены       • Аналитика               ││
│  │  • Платежи (YooMoney/IAP)  • Admin панель (контент)  ││
│  │  • Web Dashboard (ЛК)      • Background Jobs          ││
│  │  • AI Proxy (The New Black)• Сохранение AI-результатов││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              THE NEW BLACK AI (ВНЕШНИЙ API)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Virtual Try-On API      (1 credit/image)            ││
│  │  • AI Fashion Models API   (1 credit/image)            ││
│  │  • Clothing Variation API  (1 credit/image)            ││
│  │  • Fashion Design API      (1 credit/image)            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Почему НЕТ отдельного AI Microservice?

**Ранее планировался NestJS микросервис**, но при использовании The New Black API он **избыточен**:

1. **The New Black — готовый API** — не нужно запускать ML модели
2. **Rails достаточно** — простые HTTP POST запросы с form-data
3. **Меньше инфраструктуры** — один сервер, одна кодовая база
4. **Rails уже делает** — JWT валидацию, лимиты, биллинг; добавить HTTP-вызовы тривиально
5. **Экономия** — нет дополнительных затрат на хостинг Node.js сервиса

### Разделение ответственности

| Компонент         | Технология            | Ответственность                                                                                       |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| **Supabase**      | PostgreSQL + Auth     | Source of truth: пользователи (auth), вещи, образы, подборки, AI-результаты                           |
| **Rails Backend** | Ruby on Rails 7.x     | Единый backend: бизнес-логика, подписки/токены, платежи, API для Mobile, AI proxy, админка, аналитика |
| **The New Black** | External REST API     | AI-генерация: virtual try-on, fashion models, variations                                              |
| **Mobile App**    | React Native/Expo     | UI/UX, локальное хранение изображений                                                                 |
| **Landing**       | Vite/React            | Маркетинговая страница                                                                                |
| **Dashboard**     | Rails Views + Hotwire | Личный кабинет пользователя                                                                           |

---

## 💎 Ruby on Rails Backend

### Почему Ruby on Rails?

1. **Быстрая разработка** — convention over configuration
2. **Встроенная поддержка платежей** — отличные gems (pay, stripe, yookassa)
3. **Hotwire/Turbo** — современный fullstack без отдельного SPA
4. **Background Jobs** — Solid Queue (Rails 8, без Redis); Sidekiq опционально
5. **Admin панель** — custom Rails views (Administrate/ActiveAdmin опционально)
6. **Зрелая экосистема** — проверенные решения для биллинга

### Стек технологий

> **Примечание (текущее состояние `obrazz-rails`):** Rails 8 + Solid Queue (без Redis) + Hotwire/Tailwind. Админка реализована как custom Rails views (HTTP Basic). Administrate можно подключить позже.

```ruby
# Gemfile (основные зависимости)

# Rails Core
gem 'rails', '~> 8.0'
gem 'puma', '~> 6.0'
gem 'pg', '~> 1.5'           # PostgreSQL (Supabase)
gem 'redis', '~> 5.0'        # (опционально) кэширование/очереди, не требуется при Solid Queue

# Authentication (интеграция с Supabase)
gem 'jwt'                     # Валидация JWT токенов от Supabase
gem 'omniauth'               # OAuth провайдеры (опционально)

# Billing & Payments
gem 'pay', '~> 7.0'          # Абстракция над платёжными системами
gem 'stripe', '~> 10.0'      # Stripe для глобальных платежей
gem 'yookassa', '~> 0.3'     # (опционально) YooMoney/YooKassa для РФ

# Background Jobs
gem 'solid_queue'            # Rails 8 database-backed jobs (без Redis)
gem 'mission_control-jobs'   # (опционально) Web UI для очередей

# (опционально) фоновые задачи через Sidekiq
gem 'sidekiq', '~> 7.2'
gem 'sidekiq-scheduler'

# API & Serialization
gem 'jbuilder'               # JSON responses
gem 'rack-cors'              # CORS для мобильного приложения

# Frontend (Dashboard)
gem 'turbo-rails'            # Hotwire Turbo
gem 'stimulus-rails'         # Hotwire Stimulus
gem 'tailwindcss-rails'      # Стили

# Admin
gem 'administrate'           # (опционально) Admin панель
gem 'pagy'                   # Пагинация

# Monitoring
gem 'sentry-ruby'            # Error tracking
gem 'lograge'                # Structured logs
```

### Структура приложения

```
rails-backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── subscriptions_controller.rb
│   │   │       ├── tokens_controller.rb           # Токены (покупка, баланс)
│   │   │       ├── ai_controller.rb               # AI-операции (proxy to The New Black)
│   │   │       ├── collections_controller.rb      # Curated Collections (read-only API)
│   │   │       ├── collection_items_controller.rb
│   │   │       ├── webhooks_controller.rb
│   │   │       └── stats_controller.rb
│   │   ├── dashboard/
│   │   │   ├── home_controller.rb
│   │   │   ├── subscription_controller.rb
│   │   │   ├── tokens_controller.rb               # Покупка токенов в ЛК
│   │   │   ├── billing_controller.rb
│   │   │   └── settings_controller.rb
│   │   ├── admin/
│   │   │   └── ... (custom Rails admin; Administrate optional)
│   │   └── webhooks/
│   │       ├── yookassa_controller.rb
│   │       ├── stripe_controller.rb
│   │       └── app_store_controller.rb
│   ├── models/
│   │   ├── user.rb                  # Синхронизация с Supabase
│   │   ├── subscription.rb          # Подписки (FREE/PRO/MAX)
│   │   ├── token_balance.rb         # Баланс токенов пользователя
│   │   ├── token_transaction.rb     # История транзакций токенов
│   │   ├── ai_generation.rb         # Логи AI-генераций
│   │   ├── payment.rb               # История платежей
│   │   └── concerns/
│   │       └── supabase_sync.rb     # Синхронизация с Supabase
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── auth_service.rb      # Валидация JWT
│   │   │   ├── sync_service.rb      # Синхронизация данных
│   │   │   └── storage_service.rb   # Upload изображений (service-role)
│   │   ├── the_new_black/
│   │   │   ├── client.rb            # HTTP клиент к The New Black API
│   │   │   ├── virtual_tryon.rb     # Virtual Try-On API wrapper
│   │   │   ├── fashion_models.rb    # AI Fashion Models API wrapper
│   │   │   ├── variations.rb        # Clothing Variation API wrapper
│   │   │   └── image_saver.rb       # Скачивание и сохранение результатов
│   │   ├── tokens/
│   │   │   ├── balance_service.rb   # Проверка/списание токенов
│   │   │   └── purchase_service.rb  # Покупка токенов
│   │   ├── collections/
│   │   │   ├── query.rb             # Пагинация/сортировка подборок
│   │   │   └── mapper.rb            # snake_case -> camelCase
│   │   ├── payments/
│   │   │   ├── yookassa_service.rb
│   │   │   ├── stripe_service.rb
│   │   │   └── iap_service.rb
│   │   └── subscriptions/
│   │       └── manager.rb           # Управление подписками
│   ├── jobs/
│   │   ├── sync_supabase_user_job.rb
│   │   ├── process_ai_generation_job.rb  # Async AI генерация
│   │   ├── save_ai_image_job.rb          # Скачать и сохранить в Storage
│   │   ├── process_payment_job.rb
│   │   ├── reset_monthly_tokens_job.rb   # Сброс бесплатных токенов
│   │   └── subscription_reminder_job.rb
│   └── views/
│       └── dashboard/
│           ├── home/
│           ├── subscription/
│           ├── tokens/               # Страница покупки токенов
│           ├── billing/
│           └── layouts/
├── config/
│   ├── routes.rb
│   ├── initializers/
│   │   ├── supabase.rb
│   │   ├── the_new_black.rb        # API credentials
│   │   ├── yookassa.rb
│   │   └── stripe.rb
│   └── locales/
│       ├── ru.yml
│       └── en.yml
├── db/
│   └── migrate/
└── spec/
```

### Модели данных (Rails)

```ruby
# app/models/user.rb
class User < ApplicationRecord
  include SupabaseSync

  has_one :subscription, dependent: :destroy
  has_one :token_balance, dependent: :destroy
  has_many :token_transactions, dependent: :destroy
  has_many :ai_generations, dependent: :destroy
  has_many :payments, dependent: :destroy

  # Синхронизация с Supabase Auth
  validates :supabase_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true

  after_create :create_token_balance!

  def current_plan
    subscription&.active? ? subscription.plan : 'free'
  end

  def can_generate?(tokens_needed = 1)
    token_balance.available >= tokens_needed
  end

  def spend_tokens!(amount, feature:, metadata: {})
    token_balance.spend!(amount, feature: feature, metadata: metadata)
  end
end

# app/models/subscription.rb
class Subscription < ApplicationRecord
  belongs_to :user

  enum :plan, { free: 0, pro: 1, max: 2 }
  enum :status, { active: 0, cancelled: 1, expired: 2, paused: 3 }
  enum :provider, { web: 0, ios: 1, android: 2 }  # Источник подписки

  validates :plan, presence: true
  validates :provider, presence: true

  scope :active, -> { where(status: :active).where('expires_at > ?', Time.current) }

  # Бесплатные токены по подписке (ежемесячно)
  MONTHLY_TOKENS = {
    free: 5,    # 5 бесплатных токенов
    pro: 50,    # 50 токенов/мес
    max: 150    # 150 токенов/мес
  }.freeze

  def active?
    status == 'active' && (expires_at.nil? || expires_at > Time.current)
  end

  def monthly_tokens
    MONTHLY_TOKENS[plan.to_sym] || 0
  end
end

# app/models/token_balance.rb
class TokenBalance < ApplicationRecord
  belongs_to :user

  # available = purchased + subscription_tokens (не истёкшие)
  # purchased — купленные токены (не истекают)
  # subscription_tokens — бесплатные от подписки (сбрасываются каждый месяц)

  validates :purchased, numericality: { greater_than_or_equal_to: 0 }
  validates :subscription_tokens, numericality: { greater_than_or_equal_to: 0 }

  def available
    purchased + subscription_tokens
  end

  def spend!(amount, feature:, metadata: {})
    raise InsufficientTokensError if available < amount

    # Сначала тратим subscription_tokens, потом purchased
    if subscription_tokens >= amount
      decrement!(:subscription_tokens, amount)
    else
      remaining = amount - subscription_tokens
      update!(subscription_tokens: 0)
      decrement!(:purchased, remaining)
    end

    user.token_transactions.create!(
      amount: -amount,
      transaction_type: :spend,
      feature: feature,
      metadata: metadata
    )
  end

  def add_purchased!(amount, payment:)
    increment!(:purchased, amount)
    user.token_transactions.create!(
      amount: amount,
      transaction_type: :purchase,
      payment: payment
    )
  end

  def reset_subscription_tokens!
    plan_tokens = user.subscription&.monthly_tokens || 5
    update!(subscription_tokens: plan_tokens)
    user.token_transactions.create!(
      amount: plan_tokens,
      transaction_type: :subscription_grant,
      metadata: { plan: user.current_plan }
    )
  end
end

# app/models/token_transaction.rb
class TokenTransaction < ApplicationRecord
  belongs_to :user
  belongs_to :payment, optional: true

  enum :transaction_type, {
    purchase: 0,           # Покупка токенов
    spend: 1,              # Трата на AI
    subscription_grant: 2, # Начисление от подписки
    refund: 3,             # Возврат
    bonus: 4               # Бонус (промо, реферал)
  }

  enum :feature, {
    virtual_tryon: 0,      # Виртуальная примерка
    fashion_model: 1,      # AI модель с вещью
    variation: 2,          # Вариации дизайна
    outfit_generation: 3   # Генерация образа
  }, _prefix: true

  validates :amount, presence: true
end

# app/models/ai_generation.rb
class AiGeneration < ApplicationRecord
  belongs_to :user
  belongs_to :token_transaction, optional: true

  enum :generation_type, {
    virtual_tryon: 0,
    fashion_model: 1,
    variation: 2
  }

  enum :status, {
    pending: 0,
    processing: 1,
    completed: 2,
    failed: 3
  }

  # input_data — JSON с параметрами запроса
  # result_url — URL результата в Supabase Storage
  # the_new_black_url — временный URL от API (удаляется через 48ч)
end
```

### Ценообразование токенов

```ruby
# config/initializers/token_pricing.rb
TOKEN_PACKS = {
  small: { tokens: 10, price_rub: 99, price_usd: 1.49 },
  medium: { tokens: 30, price_rub: 249, price_usd: 3.49 },
  large: { tokens: 100, price_rub: 699, price_usd: 9.99 },
  xl: { tokens: 300, price_rub: 1799, price_usd: 24.99 }
}.freeze

# Стоимость операций (в токенах)
AI_COSTS = {
  virtual_tryon: 1,      # 1 токен = примерка
  fashion_model: 1,      # 1 токен = модель с вещью
  variation: 1,          # 1 токен = вариация
  outfit_generation: 2   # 2 токена = генерация полного образа (сложнее)
}.freeze
```

### Refund/Chargeback: Tokens::RefundService (best practice)

Нужен явный сервис для возвратов токенов, чтобы корректно обрабатывать:

- **refund** (пользователь/провайдер вернул деньги)
- **chargeback** (оспаривание платежа)
- **AI failure refund** (генерация упала до получения результата)

Ключевая сложность: возвращать/снимать токены **в тот же источник**, откуда они были списаны:

- `subscription_tokens` (месячные, обновляемые)
- `purchased` (купленные, не истекают)

Best practice: при списании хранить breakdown в метаданных транзакции, например:

```json
{ "spent": { "subscription": 1, "purchased": 0 }, "generation_id": "..." }
```

Или завести отдельные поля в `token_transactions`: `subscription_delta`, `purchased_delta`.

Пример сервиса (концепт):

```ruby
# app/services/tokens/refund_service.rb
module Tokens
  class RefundService
    def initialize(user)
      @user = user
    end

    # Возвращает токены по исходной spend-транзакции
    # reason: :payment_refund | :chargeback | :ai_failed
    def refund_spend!(spend_transaction_id:, reason:, metadata: {})
      tx = @user.token_transactions.find(spend_transaction_id)
      raise ArgumentError, 'Not a spend transaction' unless tx.transaction_type == 'spend'

      spent = tx.metadata&.dig('spent') || { 'subscription' => 0, 'purchased' => tx.amount.abs }

      @user.token_balance.with_lock do
        @user.token_balance.increment!(:subscription_tokens, spent['subscription'].to_i)
        @user.token_balance.increment!(:purchased, spent['purchased'].to_i)

        @user.token_transactions.create!(
          amount: tx.amount.abs,
          transaction_type: :refund,
          feature: tx.feature,
          metadata: metadata.merge(
            refunded_transaction_id: tx.id,
            reason: reason,
            spent: spent
          )
        )
      end
    end

    # Списание токенов при chargeback по purchase
    def chargeback_purchase!(purchase_transaction_id:, metadata: {})
      tx = @user.token_transactions.find(purchase_transaction_id)
      raise ArgumentError, 'Not a purchase transaction' unless tx.transaction_type == 'purchase'

      amount = tx.amount

      @user.token_balance.with_lock do
        # снимаем только purchased
        @user.token_balance.decrement!(:purchased, amount)
        @user.token_transactions.create!(
          amount: -amount,
          transaction_type: :refund,
          metadata: metadata.merge(chargeback_of_transaction_id: tx.id)
        )
      end
    end
  end
end
```

---

## 🔗 Интеграция с Supabase

### Аутентификация через JWT

Rails Backend **не создаёт пользователей** — он только валидирует JWT токены от Supabase.

```ruby
# app/services/supabase/auth_service.rb
class Supabase::AuthService
  SUPABASE_JWT_SECRET = ENV['SUPABASE_JWT_SECRET']
  SUPABASE_URL = ENV['SUPABASE_URL']

  def self.verify_token(token)
    decoded = JWT.decode(
      token,
      SUPABASE_JWT_SECRET,
      true,
      { algorithm: 'HS256', aud: 'authenticated' }
    )

    payload = decoded.first
    {
      supabase_id: payload['sub'],
      email: payload['email'],
      role: payload['role'],
      expires_at: Time.at(payload['exp'])
    }
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    Rails.logger.error("JWT verification failed: #{e.message}")
    nil
  end

  def self.find_or_create_user(token_data)
    User.find_or_create_by!(supabase_id: token_data[:supabase_id]) do |user|
      user.email = token_data[:email]
      # token_balance создаётся автоматически через after_create
    end
  end
end

# app/controllers/concerns/supabase_authenticatable.rb
module SupabaseAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_supabase_user!
  end

  private

  def authenticate_supabase_user!
    token = request.headers['Authorization']&.split(' ')&.last

    unless token
      render json: { error: 'Missing authorization token' }, status: :unauthorized
      return
    end

    token_data = Supabase::AuthService.verify_token(token)

    unless token_data
      render json: { error: 'Invalid or expired token' }, status: :unauthorized
      return
    end

    @current_user = Supabase::AuthService.find_or_create_user(token_data)
  end

  def current_user
    @current_user
  end
end
```

### Синхронизация данных

Supabase остаётся **source of truth** для:

- Users (auth)
- Items (вещи)
- Outfits (образы)
- Collections (подборки)
- AI Generations (результаты AI — изображения в Storage)

Rails хранит:

- Subscriptions (подписки)
- Token balances (баланс токенов)
- Token transactions (история токенов)
- Payments (платежи)
- AI generation logs (логи генераций)

```ruby
# app/services/supabase/sync_service.rb
class Supabase::SyncService
  include HTTParty
  base_uri ENV['SUPABASE_URL']

  def initialize
    @headers = {
      'apikey' => ENV['SUPABASE_SERVICE_KEY'],
      'Authorization' => "Bearer #{ENV['SUPABASE_SERVICE_KEY']}",
      'Content-Type' => 'application/json'
    }
  end

  # Обновить subscription_plan в Supabase public.profiles
  #
  # Важно: таблица Supabase Auth users (auth.users) НЕ доступна через PostgREST.
  # Поэтому делаем public.profiles (id = uuid из auth.users.id) и обновляем её.
  def update_user_plan(supabase_id, plan)
    self.class.patch(
      "/rest/v1/profiles?id=eq.#{supabase_id}",
      body: { subscription_plan: plan }.to_json,
      headers: @headers
    )
  end

  # Получить количество вещей пользователя
  def get_items_count(supabase_id)
    response = self.class.get(
      "/rest/v1/items?user_id=eq.#{supabase_id}&select=count",
      headers: @headers.merge('Prefer' => 'count=exact')
    )
    response.headers['content-range']&.split('/')&.last&.to_i || 0
  end

  # Сохранить AI-генерацию в Storage
  #
  # Требуется bucket, например: ai-generations
  # POST /storage/v1/object/{bucket}/{path}
  def save_ai_image(user_id, image_url, generation_type, bucket: 'ai-generations')
    # Скачиваем изображение от The New Black (удаляется через 48ч)
    image_data = HTTParty.get(image_url).body
    filename = "#{generation_type}_#{SecureRandom.uuid}.png"
    path = "ai_generations/#{user_id}/#{filename}"

    # Загружаем в Supabase Storage
    self.class.post(
      "/storage/v1/object/#{bucket}/#{path}",
      body: image_data,
      headers: {
        'apikey' => ENV['SUPABASE_SERVICE_KEY'],
        'Authorization' => "Bearer #{ENV['SUPABASE_SERVICE_KEY']}",
        'Content-Type' => 'image/png',
        'x-upsert' => 'true'
      }
    )

    "#{ENV['SUPABASE_URL']}/storage/v1/object/public/#{bucket}/#{path}"
  end
end
```

### Требуемые объекты в Supabase (best practices)

1. **public.profiles** — профильная таблица (обновляем plan, показываем в приложении)

```sql
create table if not exists public.profiles (
  id uuid primary key, -- = auth.users.id
  email text,
  subscription_plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
```

2. **Storage bucket**: `ai-generations`

- Для приватности лучше сделать bucket **private** и выдавать signed URLs.
- Если нужен быстрый MVP — можно временно сделать bucket **public**, но это хуже по security.

#### Signed URLs (private bucket)

Если bucket private, Rails может выдавать signed URL на объект (например, try-on результат), чтобы mobile мог скачать без раскрытия public bucket.

```ruby
# app/services/supabase/sync_service.rb
class Supabase::SyncService
  # Создать signed URL на скачивание объекта
  def create_signed_url(bucket:, path:, expires_in: 3600)
    response = self.class.post(
      "/storage/v1/object/sign/#{bucket}/#{path}",
      body: { expiresIn: expires_in }.to_json,
      headers: @headers
    )

    # response: { signedURL: "/storage/v1/object/sign/..." }
    signed_path = response.parsed_response['signedURL']
    "#{ENV['SUPABASE_URL']}#{signed_path}"
  end
end
```

---

## 🤖 The New Black AI Integration

### Обзор API

**The New Black** — внешний AI-сервис для fashion-генерации. Вместо собственного ML/AI микросервиса, мы используем их готовый API.

**Доступные endpoints:**

| API                | Endpoint                              | Credits | Описание                         |
| ------------------ | ------------------------------------- | ------- | -------------------------------- |
| Virtual Try-On     | `/api/1.1/wf/vto_stream`              | 1       | Примерка одежды на фото модели   |
| AI Fashion Models  | `/api/1.1/wf/ai-fashion-models-items` | 1       | AI-модель в одежде из фото вещей |
| Clothing Variation | `/api/1.1/wf/variation`               | 1       | Создание вариаций дизайна        |
| Fashion Design     | `/api/1.1/wf/clothing`                | 1       | Генерация дизайна по описанию    |

**Важно:** Изображения удаляются с серверов The New Black через **48 часов**. Rails должен скачивать и сохранять результаты в Supabase Storage.

### Клиент для The New Black

```ruby
# app/services/the_new_black/client.rb
module TheNewBlack
  class Client
    include HTTParty
    base_uri 'https://thenewblack.ai/api/1.1/wf'

    def initialize
      @api_key = ENV['THE_NEW_BLACK_API_KEY']
      @email = ENV['THE_NEW_BLACK_EMAIL']
      @password = ENV['THE_NEW_BLACK_PASSWORD']
    end

    private

    def post_with_auth(endpoint, params)
      response = self.class.post(
        "#{endpoint}?api_key=#{@api_key}",
        multipart: true,
        body: {
          email: @email,
          password: @password,
          **params
        }
      )

      parsed = response.parsed_response

      if parsed.is_a?(Hash) && parsed['error']
        raise ApiError, parsed['error']
      end

      parsed
    end
  end

  class ApiError < StandardError; end
end

# app/services/the_new_black/virtual_tryon.rb
module TheNewBlack
  class VirtualTryon < Client
    # Примерка одежды на фото модели/пользователя
    #
    # @param model_photo [String] URL фото модели
    # @param clothing_photo [String] URL фото одежды
    # @param prompt [String] Инструкции (опционально)
    # @param ratio [String] Соотношение: auto, 1:1, 9:16, 3:4, 4:3
    # @return [String] URL сгенерированного изображения
    def call(model_photo:, clothing_photo:, clothing_photo_2: nil, prompt: '', ratio: 'auto')
      params = {
        model_photo: model_photo,
        clothing_photo: clothing_photo,
        prompt: prompt,
        ratio: ratio
      }
      params[:clothing_photo_2] = clothing_photo_2 if clothing_photo_2

      post_with_auth('/vto_stream', params) # обычно URL изображения или JSON
    end
  end
end

# app/services/the_new_black/fashion_models.rb
module TheNewBlack
  class FashionModels < Client
    # Создание AI-модели в одежде из фото вещей
    #
    # @param scene_description [String] Описание модели, сцены, деталей
    # @param item_image [String] URL фото вещи
    # @param item_image_2 [String] URL второй вещи (опционально)
    # @param item_image_3 [String] URL третьей вещи (опционально)
    # @return [String] URL сгенерированного изображения
    def call(scene_description:, item_image:, item_image_2: nil, item_image_3: nil)
      params = {
        'scene-description': scene_description,
        'item-image': item_image
      }
      params['item-image-2'] = item_image_2 if item_image_2
      params['item-image-3'] = item_image_3 if item_image_3

      post_with_auth('/ai-fashion-models-items', params)
    end
  end
end

# app/services/the_new_black/variations.rb
module TheNewBlack
  class Variations < Client
    # Создание вариаций дизайна
    #
    # @param image [String] URL исходного изображения
    # @param prompt [String] Описание желаемой вариации
    # @return [String] URL сгенерированного изображения
    def call(image:, prompt:)
      post_with_auth('/variation', {
        image: image,
        prompt: prompt
      })
    end
  end
end

# app/services/the_new_black/image_saver.rb
module TheNewBlack
  class ImageSaver
    def initialize(user)
      @user = user
      @storage = Supabase::SyncService.new
    end

    # Скачивает изображение от The New Black и сохраняет в Supabase Storage
    # (изображения The New Black удаляются через 48ч)
    def save(temp_url, generation_type)
      return nil if temp_url.blank?

      permanent_url = @storage.save_ai_image(
        @user.supabase_id,
        temp_url,
        generation_type
      )

      permanent_url
    end
  end
end
```

### AI Controller

```ruby
# app/controllers/api/v1/ai_controller.rb
class Api::V1::AiController < Api::V1::BaseController
  before_action :check_tokens

  # POST /api/v1/ai/virtual_tryon
  def virtual_tryon
    cost = AI_COSTS[:virtual_tryon]
    return insufficient_tokens(cost) unless current_user.can_generate?(cost)

    generation = current_user.ai_generations.create!(
      generation_type: :virtual_tryon,
      status: :pending,
      input_data: tryon_params.to_h,
      tokens_spent: cost
    )

    # Запускаем в background job для надёжности
    ProcessAiGenerationJob.perform_later(generation.id, :virtual_tryon)

    render json: {
      generationId: generation.id,
      status: 'processing',
      message: 'Generation started. Poll /ai/generations/:id for result.'
    }, status: :accepted
  end

  # POST /api/v1/ai/fashion_model
  def fashion_model
    cost = AI_COSTS[:fashion_model]
    return insufficient_tokens(cost) unless current_user.can_generate?(cost)

    generation = current_user.ai_generations.create!(
      generation_type: :fashion_model,
      status: :pending,
      input_data: fashion_model_params.to_h,
      tokens_spent: cost
    )

    ProcessAiGenerationJob.perform_later(generation.id, :fashion_model)

    render json: {
      generationId: generation.id,
      status: 'processing'
    }, status: :accepted
  end

  # POST /api/v1/ai/variation
  def variation
    cost = AI_COSTS[:variation]
    return insufficient_tokens(cost) unless current_user.can_generate?(cost)

    generation = current_user.ai_generations.create!(
      generation_type: :variation,
      status: :pending,
      input_data: variation_params.to_h,
      tokens_spent: cost
    )

    ProcessAiGenerationJob.perform_later(generation.id, :variation)

    render json: {
      generationId: generation.id,
      status: 'processing'
    }, status: :accepted
  end

  # GET /api/v1/ai/generations/:id
  def show_generation
    generation = current_user.ai_generations.find(params[:id])

    render json: {
      id: generation.id,
      status: generation.status,
      resultUrl: generation.result_url,
      createdAt: generation.created_at,
      tokensSpent: generation.tokens_spent
    }
  end

  private

  def check_tokens
    # Общая проверка — есть ли токены вообще
    unless current_user.can_generate?(1)
      render json: { error: 'No tokens available', tokensNeeded: 1 },
             status: :payment_required
    end
  end

  def insufficient_tokens(cost)
    render json: {
      error: 'Insufficient tokens',
      tokensNeeded: cost,
      tokensAvailable: current_user.token_balance.available
    }, status: :payment_required
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
```

### Background Job для AI

### Job dedup (best practice)

Чтобы избежать повторного выполнения генерации (например при двойном enqueue или ретраях), рекомендуется:

1. **Уникальные задания** на уровне очереди (`sidekiq-unique-jobs`)
2. **Идемпотентность** внутри job (у нас уже есть привязка `AiGeneration.token_transaction_id`)

Пример (если делаем job как Sidekiq Worker):

```ruby
# Gemfile
gem 'sidekiq-unique-jobs'

# app/jobs/process_ai_generation_job.rb (вариант: Sidekiq Worker)
class ProcessAiGenerationJob
  include Sidekiq::Worker

  sidekiq_options queue: :ai_generations,
                 lock: :until_executed,
                 lock_args: ->(args) { [args.first] } # generation_id

  def perform(generation_id, generation_type)
    # ...
  end
end
```

Если остаёмся на ActiveJob — всё равно важно проверять состояние `AiGeneration` и не списывать токены повторно.

```ruby
# app/jobs/process_ai_generation_job.rb
class ProcessAiGenerationJob < ApplicationJob
  queue_as :ai_generations
  retry_on TheNewBlack::ApiError, wait: 5.seconds, attempts: 3

  def perform(generation_id, generation_type)
    generation = AiGeneration.find(generation_id)
    user = generation.user

    # Идемпотентность + защита от double-spend:
    # - не списывать токены повторно при retry
    # - связывать генерацию с token_transaction
    generation.update!(status: :processing) if generation.pending?

    if generation.token_transaction_id.nil?
      user.token_balance.with_lock do
        # spend_tokens! создаёт TokenTransaction(transaction_type: :spend)
        user.spend_tokens!(
          generation.tokens_spent,
          feature: generation_type,
          metadata: { generation_id: generation.id }
        )

        generation.update!(token_transaction: user.token_transactions.order(created_at: :desc).first)
      end
    end

    # 2. Вызываем The New Black API
    temp_url = case generation_type
               when :virtual_tryon
                 TheNewBlack::VirtualTryon.new.call(**generation.input_data.symbolize_keys)
               when :fashion_model
                 TheNewBlack::FashionModels.new.call(**generation.input_data.symbolize_keys)
               when :variation
                 TheNewBlack::Variations.new.call(**generation.input_data.symbolize_keys)
               end

    # 3. Сохраняем в Supabase Storage (The New Black удаляет через 48ч)
    saver = TheNewBlack::ImageSaver.new(user)
    permanent_url = saver.save(temp_url, generation_type)

    # 4. Обновляем генерацию
    generation.update!(
      status: :completed,
      the_new_black_url: temp_url,
      result_url: permanent_url
    )

  rescue TheNewBlack::ApiError => e
    generation.update!(status: :failed, error_message: e.message)
    # Возврат токенов при ошибке (best practice):
    # - создавать TokenTransaction(transaction_type: :refund)
    # - возвращать в тот же "кошелёк" (subscription_tokens vs purchased) по данным исходной spend-транзакции
    # Здесь оставляем как концепт, реализация — в Tokens::RefundService.
    raise
  end
end
```

---

## 💳 Платёжная система

### Webhook security + идемпотентность (обязательно)

Проблема, которую нужно предотвратить: webhook может прийти **повторно** (retries), **в другом порядке**, или злоумышленник может попытаться подделать запрос.

Best practices:

1. **Signature verification**
   - Stripe: проверка подписи через `Stripe::Webhook.construct_event`.
   - YooKassa: проверять подпись/секрет по официальной схеме (или как минимум подтверждать payment через API и сверять `amount/metadata/user_id`).
   - Apple/Google S2S: верификация подписанного payload/JWT по ключам провайдера.

2. **Idempotency store** (в БД)
   - Таблица `webhook_events` с уникальным индексом `(provider, event_id)`.
   - Если event уже обработан — вернуть `200 OK` и ничего не делать.

Пример структуры:

```ruby
# db/schema (концепт)
# provider: 'stripe' | 'yookassa' | 'apple' | 'google'
create_table :webhook_events do |t|
  t.string :provider, null: false
  t.string :event_id, null: false
  t.jsonb  :payload
  t.datetime :processed_at
  t.timestamps
end
add_index :webhook_events, [:provider, :event_id], unique: true
```

Пример обработки (псевдокод):

```ruby
def handle_webhook(provider:, event_id:, payload:)
  WebhookEvent.create!(provider: provider, event_id: event_id, payload: payload)
  # если create! упал по unique index => уже обработано => OK

  # ... дальше бизнес-логика
end
```

### Стратегия по регионам

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ПЛАТЁЖНАЯ СТРАТЕГИЯ                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🇷🇺 РОССИЯ                       🌍 ОСТАЛЬНОЙ МИР                       │
│  ══════════                       ════════════════                       │
│                                                                          │
│  ┌─────────────────────┐          ┌─────────────────────┐               │
│  │    WEB BILLING      │          │   IN-APP PURCHASE   │               │
│  │   (YooMoney/Stripe) │          │  (Apple/Google)     │               │
│  │                     │          │                     │               │
│  │  • ~3.5% комиссия   │          │  • 15-30% комиссия  │               │
│  │  • Полный контроль  │          │  • Требование Apple │               │
│  │  • Личный кабинет   │          │  • Единый purchase  │               │
│  │    на сайте         │          │    flow             │               │
│  └──────────┬──────────┘          └──────────┬──────────┘               │
│             │                                │                           │
│             ▼                                ▼                           │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │              RAILS BACKEND (единая логика)               │            │
│  │                                                          │            │
│  │  Webhooks:         Webhooks:           Server-to-Server: │            │
│  │  • YooKassa        • Stripe            • App Store API   │            │
│  │  • payment.        • checkout.         • Play Store API  │            │
│  │    succeeded         completed                           │            │
│  │                                                          │            │
│  │  ─────────────────────────────────────────────────────  │            │
│  │                    SUBSCRIPTION                          │            │
│  │              (единая таблица подписок)                   │            │
│  │                                                          │            │
│  │  provider: 'web' | 'ios' | 'android'                     │            │
│  │  external_id: 'yookassa_xxx' | 'sub_xxx' | 'GPA.xxx'    │            │
│  └─────────────────────────────────────────────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Определение региона пользователя

```ruby
# app/services/payments/region_detector.rb
class Payments::RegionDetector
  RUSSIA_INDICATORS = [
    :phone_starts_with_7,
    :locale_ru,
    :timezone_moscow,
    :ip_from_russia
  ].freeze

  def self.detect(user, request = nil)
    # 1. Проверяем сохранённую страну
    return user.country if user.country.present?

    # 2. Детектим по признакам
    if request
      country = detect_from_request(request)
      user.update(country: country) if country
      return country
    end

    # 3. Default: требуем IAP
    'other'
  end

  def self.should_use_web_billing?(user, request = nil)
    detect(user, request) == 'RU'
  end

  private

  def self.detect_from_request(request)
    # IP geolocation
    geo = Geocoder.search(request.remote_ip).first
    return 'RU' if geo&.country_code == 'RU'

    # Accept-Language header
    return 'RU' if request.headers['Accept-Language']&.start_with?('ru')

    # Timezone
    tz = request.headers['X-Timezone']
    return 'RU' if tz&.include?('Moscow') || tz&.include?('Europe/Moscow')

    'other'
  end
end
```

### YooMoney (YooKassa) интеграция

```ruby
# app/services/payments/yookassa_service.rb
class Payments::YookassaService
  def initialize
    @client = Yookassa::Client.new(
      shop_id: ENV['YOOKASSA_SHOP_ID'],
      api_key: ENV['YOOKASSA_SECRET_KEY']
    )
  end

  def create_subscription(user, plan, period: :monthly)
    amount = calculate_amount(plan, period)

    payment = @client.payments.create(
      amount: { value: amount, currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: "#{ENV['DASHBOARD_URL']}/billing/success"
      },
      description: "Obrazz #{plan.titleize} - #{period == :yearly ? 'Год' : 'Месяц'}",
      save_payment_method: true,  # Для автопродления
      metadata: {
        user_id: user.id,
        supabase_id: user.supabase_id,
        plan: plan,
        period: period
      }
    )

    Payment.create!(
      user: user,
      provider: 'yookassa',
      external_id: payment.id,
      amount: amount,
      currency: 'RUB',
      status: 'pending',
      metadata: { plan: plan, period: period }
    )

    payment.confirmation.confirmation_url
  end

  def handle_webhook(notification)
    payment = @client.payments.find(notification['object']['id'])
    local_payment = Payment.find_by!(external_id: payment.id)

    case notification['event']
    when 'payment.succeeded'
      local_payment.update!(status: 'completed')
      activate_subscription(local_payment)
    when 'payment.canceled'
      local_payment.update!(status: 'cancelled')
    when 'refund.succeeded'
      handle_refund(local_payment)
    end
  end

  private

  def calculate_amount(plan, period)
    prices = {
      pro: { monthly: 399, yearly: 3299 },
      max: { monthly: 799, yearly: 5699 }
    }
    prices[plan.to_sym][period]
  end

  def activate_subscription(payment)
    metadata = payment.metadata.symbolize_keys
    user = payment.user

    subscription = user.subscription || user.build_subscription
    subscription.update!(
      plan: metadata[:plan],
      status: :active,
      provider: :web,
      started_at: Time.current,
      expires_at: metadata[:period] == 'yearly' ? 1.year.from_now : 1.month.from_now,
      payment_method_id: payment.metadata['payment_method_id']
    )

    # Синхронизация с Supabase
    Supabase::SyncService.new.update_user_plan(user.supabase_id, metadata[:plan])

    # Начисление/сброс subscription tokens на новый период
    user.token_balance.reset_subscription_tokens!
  end
end
```

### IAP (In-App Purchase) обработка

Для iOS и Android подписки оформляются **внутри приложения**, но валидация и управление — на бэкенде.

```ruby
# app/services/payments/iap_service.rb
class Payments::IapService
  # Валидация чека от App Store
  def verify_ios_receipt(receipt_data, user)
    response = HTTParty.post(
      ENV['APPLE_VERIFY_URL'], # sandbox или production
      body: {
        'receipt-data' => receipt_data,
        'password' => ENV['APPLE_SHARED_SECRET'],
        'exclude-old-transactions' => true
      }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )

    return nil unless response['status'] == 0

    latest_receipt = response['latest_receipt_info']&.last
    return nil unless latest_receipt

    process_apple_subscription(user, latest_receipt)
  end

  # Валидация покупки Google Play
  def verify_android_purchase(purchase_token, product_id, user)
    # Используем Google Play Developer API
    auth = Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: StringIO.new(ENV['GOOGLE_SERVICE_ACCOUNT_JSON']),
      scope: 'https://www.googleapis.com/auth/androidpublisher'
    )

    publisher = Google::Apis::AndroidpublisherV3::AndroidPublisherService.new
    publisher.authorization = auth

    subscription = publisher.get_purchase_subscriptionsv2(
      ENV['ANDROID_PACKAGE_NAME'],
      purchase_token
    )

    process_google_subscription(user, subscription, product_id)
  end

  private

  def process_apple_subscription(user, receipt)
    product_id = receipt['product_id']
    plan = map_product_to_plan(product_id)
    expires_at = Time.at(receipt['expires_date_ms'].to_i / 1000)

    subscription = user.subscription || user.build_subscription
    subscription.update!(
      plan: plan,
      status: expires_at > Time.current ? :active : :expired,
      provider: :ios,
      external_id: receipt['original_transaction_id'],
      started_at: Time.at(receipt['original_purchase_date_ms'].to_i / 1000),
      expires_at: expires_at
    )

    Supabase::SyncService.new.update_user_plan(user.supabase_id, plan)
  end

  def map_product_to_plan(product_id)
    case product_id
    when 'com.obrazz.pro.monthly', 'com.obrazz.pro.yearly' then 'pro'
    when 'com.obrazz.max.monthly', 'com.obrazz.max.yearly' then 'max'
    else 'free'
    end
  end
end

# app/controllers/api/v1/iap_controller.rb
class Api::V1::IapController < Api::V1::BaseController
  def verify_ios
    result = Payments::IapService.new.verify_ios_receipt(
      params[:receipt_data],
      current_user
    )

    if result
      render json: { success: true, subscription: result }
    else
      render json: { success: false, error: 'Invalid receipt' }, status: :unprocessable_entity
    end
  end

  def verify_android
    result = Payments::IapService.new.verify_android_purchase(
      params[:purchase_token],
      params[:product_id],
      current_user
    )

    if result
      render json: { success: true, subscription: result }
    else
      render json: { success: false, error: 'Invalid purchase' }, status: :unprocessable_entity
    end
  end
end
```

### Как работает гибридная модель

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    СЦЕНАРИЙ: ПОЛЬЗОВАТЕЛЬ ИЗ РОССИИ                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Пользователь открывает приложение                                   │
│     └─> App определяет регион (IP, язык, timezone)                      │
│                                                                          │
│  2. Показывается Paywall                                                 │
│     └─> Для РФ: кнопка "Оформить на сайте" (открывает WebView/браузер) │
│     └─> Цены БЕЗ комиссии Apple/Google                                  │
│                                                                          │
│  3. Переход на Rails Dashboard                                           │
│     └─> Авторизация через тот же Supabase токен                         │
│     └─> Выбор тарифа → Редирект на YooMoney                             │
│                                                                          │
│  4. Оплата на YooMoney                                                   │
│     └─> Успех → Webhook в Rails → Subscription активирована             │
│     └─> Редирект обратно в Dashboard → "Подписка активна"               │
│                                                                          │
│  5. Приложение получает обновлённый статус                               │
│     └─> Polling или Push notification                                   │
│     └─> Все лимиты обновлены                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                 СЦЕНАРИЙ: ПОЛЬЗОВАТЕЛЬ ИЗ США/ЕВРОПЫ                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Пользователь открывает приложение                                   │
│     └─> App определяет регион: NOT Russia                               │
│                                                                          │
│  2. Показывается Paywall                                                 │
│     └─> Стандартные IAP кнопки (Apple Pay / Google Pay)                │
│     └─> Цены с комиссией платформы                                      │
│                                                                          │
│  3. Native IAP Flow                                                      │
│     └─> iOS: StoreKit → App Store                                       │
│     └─> Android: Play Billing → Google Play                             │
│                                                                          │
│  4. Валидация на Rails Backend                                           │
│     └─> App отправляет receipt → Rails валидирует                       │
│     └─> Subscription создаётся с provider: 'ios' / 'android'            │
│                                                                          │
│  5. Синхронизация                                                        │
│     └─> Rails обновляет Supabase                                        │
│     └─> App получает подтверждение                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥 Личный кабинет (Dashboard)

### Функционал

1. **Профиль**
   - Просмотр email, дата регистрации
   - Смена пароля (через Supabase)
   - Удаление аккаунта

2. **Подписка**
   - Текущий план и статус
   - Дата окончания
   - Кнопка продления/смены плана
   - История платежей

3. **Лимиты и статистика**
   - Использовано вещей: X / 100
   - Удаление фона: X / 50 в этом месяце
   - AI-подборы: X / 30 в этом месяце
   - AI-примерки: X / 5

4. **Биллинг (только для веб-подписок)**
   - Привязанная карта
   - Автопродление вкл/выкл
   - Отмена подписки

### UI (Hotwire + Tailwind)

```erb
<!-- app/views/dashboard/home/index.html.erb -->
<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 py-8">

    <!-- Subscription Card -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Ваша подписка</h2>
        <span class="px-3 py-1 rounded-full text-sm font-medium
                     <%= @subscription&.active? ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600' %>">
          <%= @subscription&.active? ? @subscription.plan.titleize : 'FREE' %>
        </span>
      </div>

      <% if @subscription&.active? %>
        <p class="text-gray-600 mb-4">
          Активна до: <%= l(@subscription.expires_at, format: :long) %>
        </p>

        <% if @subscription.provider == 'web' %>
          <%= link_to 'Управление подпиской', dashboard_billing_path,
              class: 'text-indigo-600 hover:text-indigo-800' %>
        <% else %>
          <p class="text-sm text-gray-500">
            Управление подпиской доступно в
            <%= @subscription.provider == 'ios' ? 'App Store' : 'Google Play' %>
          </p>
        <% end %>
      <% else %>
        <%= link_to 'Оформить подписку', dashboard_subscription_path,
            class: 'inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700' %>
      <% end %>
    </div>

    <!-- Tokens & Usage -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="text-xl font-semibold mb-4">Токены и использование</h2>

      <div class="space-y-4">
        <div class="rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Доступно токенов</span>
            <span class="text-lg font-semibold"><%= @token_balance.available %></span>
          </div>
          <div class="flex items-center justify-between mt-2 text-sm text-gray-500">
            <span>Купленные</span>
            <span><%= @token_balance.purchased %></span>
          </div>
          <div class="flex items-center justify-between mt-1 text-sm text-gray-500">
            <span>Подписочные</span>
            <span><%= @token_balance.subscription_tokens %></span>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            Подписочные токены обновятся: <%= l(@token_balance_next_reset_at, format: :long) %>
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">AI-генераций (30 дней)</span>
            <span class="text-lg font-semibold"><%= @ai_generations_30d %></span>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
```

### Роуты Dashboard

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Dashboard (личный кабинет)
  namespace :dashboard do
    root 'home#index'

    resource :subscription, only: [:show, :create, :destroy] do
      post :change_plan
    end

    resource :billing, only: [:show] do
      post :update_card
      post :toggle_auto_renewal
    end

    resource :profile, only: [:show, :update] do
      delete :destroy_account
    end

    resources :payments, only: [:index, :show]
  end

  # API для мобильного приложения
  namespace :api do
    namespace :v1 do
      # Подписка и токены
      resource :subscription, only: [:show]

      resource :tokens, only: [:show] do
        get :history
        post :purchase
      end

      # IAP валидация
      post 'iap/verify_ios', to: 'iap#verify_ios'
      post 'iap/verify_android', to: 'iap#verify_android'

      # AI (The New Black)
      post 'ai/virtual_tryon', to: 'ai#virtual_tryon'
      post 'ai/fashion_model', to: 'ai#fashion_model'
      post 'ai/variation', to: 'ai#variation'
      get  'ai/generations/:id', to: 'ai#show_generation'
      get  'ai/generations', to: 'ai#generations_index'

      # Curated Collections (read-only для Mobile)
      resources :collections, only: [:index, :show] do
        get :items, on: :member
      end
      resources :collection_items, only: [:show]

      # (опционально) события для аналитики
      post 'collections/events', to: 'collections_events#create'
    end
  end

  # Webhooks
  namespace :webhooks do
    post 'yookassa', to: 'yookassa#create'
    post 'stripe', to: 'stripe#create'
    post 'app_store', to: 'app_store#create'
    post 'play_store', to: 'play_store#create'
  end

  # Admin
  # Best practice: отдельная admin-аутентификация и изоляция админки от Supabase user session.
  # Текущее состояние `obrazz-rails`: AdminUser (custom + has_secure_password) + HTTP Basic.
  # Devise можно подключить позже (опционально) при необходимости.
  # Administrate НЕ монтируется как engine; он генерирует routes/controllers в namespace :admin.
  # Sidekiq Web (если используем Sidekiq) также лучше защищать отдельной admin-аутентификацией.
  # mount Sidekiq::Web, at: '/sidekiq'
end
```

---

## 📡 API Endpoints

### Для мобильного приложения

```
# Подписки и токены
GET    /api/v1/subscription           # Текущая подписка
GET    /api/v1/tokens                 # Баланс токенов
GET    /api/v1/tokens/history         # История транзакций токенов
POST   /api/v1/tokens/purchase        # Инициировать покупку токенов

# Curated Collections (подборки)
GET    /api/v1/collections            # Список опубликованных подборок
GET    /api/v1/collections/:id        # Одна подборка
GET    /api/v1/collections/:id/items  # Товары подборки (пагинация)

# AI генерация (The New Black)
POST   /api/v1/ai/virtual_tryon       # Виртуальная примерка
POST   /api/v1/ai/fashion_model       # AI-модель с вещью
POST   /api/v1/ai/variation           # Вариации дизайна
GET    /api/v1/ai/generations/:id     # Статус/результат генерации
GET    /api/v1/ai/generations         # История генераций пользователя

# IAP
POST   /api/v1/iap/verify_ios         # Валидация Apple receipt
POST   /api/v1/iap/verify_android     # Валидация Google purchase
```

### Response форматы

```json
// GET /api/v1/subscription
{
  "subscription": {
    "plan": "pro",
    "status": "active",
    "provider": "web",
    "expiresAt": "2025-01-15T00:00:00Z",
    "autoRenewal": true,
    "monthlyTokens": 50
  }
}

// GET /api/v1/tokens
{
  "tokens": {
    "available": 35,
    "purchased": 20,
    "subscriptionTokens": 15,
    "resetsAt": "2025-01-01T00:00:00Z"
  }
}

// POST /api/v1/ai/virtual_tryon (accepted)
{
  "generationId": "uuid-123",
  "status": "processing",
  "tokensSpent": 1,
  "tokensRemaining": 34
}

// GET /api/v1/ai/generations/:id (completed)
{
  "id": "uuid-123",
  "status": "completed",
  "generationType": "virtual_tryon",
  "resultUrl": "https://supabase.../ai_generations/user_id/virtual_tryon_abc.png",
  "tokensSpent": 1,
  "createdAt": "2025-01-10T12:00:00Z"
}
  }
}
```

---

## 🚀 Деплой и инфраструктура

---

## ✅ Implementation Checklist (must-have)

1. Supabase: создать `public.profiles` (id = auth.users.id) + включить RLS policies.
2. Supabase Storage: создать bucket `ai-generations` (рекомендуется private).
3. Storage privacy: реализовать signed URLs для private bucket (download) и определить TTL.
4. JWT verification: `SUPABASE_JWT_SECRET` и корректная проверка `aud`/`exp`.
5. Token spend idempotency: привязать `AiGeneration` к `token_transaction_id`, не списывать дважды.
6. Refund/chargeback: реализовать `Tokens::RefundService` (refund в тот же источник токенов).
7. Webhook verification: Stripe signature, YooKassa verification, Apple/Google signed payload.
8. Webhook idempotency: таблица `webhook_events` с unique index `(provider,event_id)`.
9. AI storage: скачивать temp URL (TTL ~48h) и сохранять в Supabase Storage сразу.
10. Rate limiting: ограничить AI endpoints по user (например rack-attack) + защита от спама.
11. Job retries: настроить retry/backoff и корректно обрабатывать частичные фейлы.
12. Job dedup: уникальность выполнения по `ai_generation_id` (sidekiq-unique-jobs или эквивалент).
13. Observability: Sentry + структурные логи по generation_id/payment_id.
14. Secrets: service-role key только на backend, никогда не в mobile.
15. Data retention: политика хранения user photos/try-on результатов (удаление по запросу пользователя).

### Рекомендуемый стек

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION INFRASTRUCTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   CLOUDFLARE    │    │     RENDER      │    │    SUPABASE     │      │
│  │   (CDN + DNS)   │    │  (Rails Host)   │    │   (DB + Auth)   │      │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘      │
│           │                      │                      │                │
│           ▼                      ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         RAILS APP                                │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │   Web       │  │   Sidekiq   │  │   Redis     │              │    │
│  │  │   (Puma)    │  │   (Jobs)    │  │  (Cache)    │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Alternatives:                                                           │
│  • Railway.app (простой деплой Rails)                                   │
│  • Fly.io (edge deployment)                                             │
│  • Heroku (классика, дороже)                                            │
│  • VPS (Hetzner/DigitalOcean) + Kamal                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
SUPABASE_JWT_SECRET=xxx

# The New Black AI
THE_NEW_BLACK_API_KEY=xxx
THE_NEW_BLACK_EMAIL=xxx
THE_NEW_BLACK_PASSWORD=xxx

# Payments - Russia
YOOKASSA_SHOP_ID=xxx
YOOKASSA_SECRET_KEY=xxx

# Payments - Global
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# IAP
APPLE_SHARED_SECRET=xxx
APPLE_VERIFY_URL=https://buy.itunes.apple.com/verifyReceipt
GOOGLE_SERVICE_ACCOUNT_JSON=xxx
ANDROID_PACKAGE_NAME=com.obrazz.app

# Dashboard
DASHBOARD_URL=https://app.obrazz.ru
SECRET_KEY_BASE=xxx

# Redis (для Sidekiq)
REDIS_URL=redis://localhost:6379/0

# Monitoring
SENTRY_DSN=xxx
```

---

## 📋 Этапы разработки Backend

### Phase 1: Foundation (1-2 недели)

- [ ] Инициализация Rails 8 проекта
- [ ] Настройка PostgreSQL (connection к Supabase или отдельная БД для Rails)
- [ ] JWT аутентификация (Supabase интеграция)
- [ ] Базовые модели (User, Subscription, TokenBalance, TokenTransaction)
- [ ] API endpoints для subscription/tokens
- [ ] Подключить сервисный доступ к Supabase (service-role)

### Phase 2: Dashboard (1-2 недели)

- [ ] Hotwire + Tailwind setup
- [ ] Dashboard layout
- [ ] Profile management
- [ ] Subscription display
- [ ] Token balance & history
- [ ] Admin: базовая панель (custom уже есть; Administrate optional)

### Phase 3: Payments - Russia (1-2 недели)

- [ ] YooKassa интеграция
- [ ] Payment flow: подписки (redirect → webhook)
- [ ] Payment flow: токены (одноразовая покупка)
- [ ] Subscription activation + токены по подписке
- [ ] Auto-renewal setup

### Phase 4: Payments - IAP (1-2 недели)

- [ ] App Store receipt validation
- [ ] Google Play purchase validation
- [ ] Server-to-Server notifications
- [ ] Unified subscription + token handling

### Phase 5: The New Black AI Integration (1-2 недели)

- [ ] The New Black API client (HTTParty)
- [ ] Virtual Try-On wrapper service
- [ ] Fashion Models wrapper service
- [ ] Variations wrapper service
- [ ] Background job для AI генерации (Solid Queue; Sidekiq опционально)
- [ ] Сохранение результатов в Supabase Storage
- [ ] API endpoints: /ai/virtual_tryon, /ai/fashion_model, /ai/variation
- [ ] Tokens spending logic

### Phase 5.5: Curated Collections API (2-5 дней)

- [ ] Read-only API для Mobile (collections + items) через Rails
- [ ] Пагинация (cursor/limit) и сортировка
- [ ] Маппинг snake_case -> camelCase
- [ ] Admin CRUD для подборок (custom or Administrate)

### Phase 6: Production (1 неделя)

- [ ] Деплой на Render/Railway
- [ ] SSL + Domain setup
- [ ] (Опционально) Sidekiq + Redis в production
- [ ] Monitoring (Sentry)
- [ ] Backup strategy

---

## 📚 Связанная документация

- [PRDobrazz.md](../../PRDobrazz.md) — Product Requirements
- [Implementation.md](../../Implementation.md) — Roadmap
- [TechStack.md](../../TechStack.md) — Technical Stack
- [AppMapobrazz.md](../../AppMapobrazz.md) — App Screens & Flows
- [CURATED_COLLECTIONS_PLAN.md](../CURATED_COLLECTIONS_PLAN.md) — Curated Collections Feature
