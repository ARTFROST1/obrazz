# 🔧 Obrazz Backend Architecture

> **Дата создания:** 9 декабря 2025  
> **Версия:** 1.0.0  
> **Статус:** Планирование

---

## 📋 Оглавление

1. [Архитектура системы](#архитектура-системы)
2. [Ruby on Rails Backend](#ruby-on-rails-backend)
3. [Интеграция с Supabase](#интеграция-с-supabase)
4. [Платёжная система](#платёжная-система)
5. [Личный кабинет (Dashboard)](#личный-кабинет-dashboard)
6. [AI Microservice](#ai-microservice)
7. [API Endpoints](#api-endpoints)
8. [Деплой и инфраструктура](#деплой-и-инфраструктура)

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
│              RUBY ON RAILS BACKEND                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Бизнес-логика           • Webhooks обработка       ││
│  │  • Подписки и лимиты       • Аналитика               ││
│  │  • Платежи (YooMoney)      • Admin панель            ││
│  │  • Web Dashboard           • Background Jobs          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              AI MICROSERVICE (Node.js/NestJS)               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Mistral API (анализ вещей, подбор)                  ││
│  │  • Gemini API (AI-примерка)                            ││
│  │  • Pixian.ai (удаление фона)                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Разделение ответственности

| Компонент         | Технология            | Ответственность                                      |
| ----------------- | --------------------- | ---------------------------------------------------- |
| **Supabase**      | PostgreSQL + Auth     | Данные пользователей, вещей, образов; аутентификация |
| **Rails Backend** | Ruby on Rails 7.x     | Бизнес-логика, подписки, платежи, dashboard          |
| **AI Service**    | Node.js/NestJS        | AI-анализ, подбор образов, примерка                  |
| **Mobile App**    | React Native/Expo     | UI/UX, локальное хранение изображений                |
| **Landing**       | Vite/React            | Маркетинговая страница                               |
| **Dashboard**     | Rails Views + Hotwire | Личный кабинет пользователя                          |

---

## 💎 Ruby on Rails Backend

### Почему Ruby on Rails?

1. **Быстрая разработка** — convention over configuration
2. **Встроенная поддержка платежей** — отличные gems (pay, stripe, yookassa)
3. **Hotwire/Turbo** — современный fullstack без отдельного SPA
4. **Background Jobs** — Sidekiq для асинхронных задач
5. **Admin панель** — Rails Admin / ActiveAdmin из коробки
6. **Зрелая экосистема** — проверенные решения для биллинга

### Стек технологий

```ruby
# Gemfile (основные зависимости)

# Rails Core
gem 'rails', '~> 7.2'
gem 'puma', '~> 6.0'
gem 'pg', '~> 1.5'           # PostgreSQL (Supabase)
gem 'redis', '~> 5.0'        # Кэширование и очереди

# Authentication (интеграция с Supabase)
gem 'jwt'                     # Валидация JWT токенов от Supabase
gem 'omniauth'               # OAuth провайдеры (опционально)

# Billing & Payments
gem 'pay', '~> 7.0'          # Абстракция над платёжными системами
gem 'stripe', '~> 10.0'      # Stripe для глобальных платежей
gem 'yookassa', '~> 0.3'     # YooMoney/YooKassa для РФ

# Background Jobs
gem 'sidekiq', '~> 7.2'      # Фоновые задачи
gem 'sidekiq-scheduler'      # Периодические задачи

# API & Serialization
gem 'jbuilder'               # JSON responses
gem 'rack-cors'              # CORS для мобильного приложения

# Frontend (Dashboard)
gem 'turbo-rails'            # Hotwire Turbo
gem 'stimulus-rails'         # Hotwire Stimulus
gem 'tailwindcss-rails'      # Стили

# Admin
gem 'administrate'           # Admin панель
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
│   │   │       ├── limits_controller.rb
│   │   │       ├── webhooks_controller.rb
│   │   │       └── stats_controller.rb
│   │   ├── dashboard/
│   │   │   ├── home_controller.rb
│   │   │   ├── subscription_controller.rb
│   │   │   ├── billing_controller.rb
│   │   │   └── settings_controller.rb
│   │   ├── admin/
│   │   │   └── ... (ActiveAdmin/Administrate)
│   │   └── webhooks/
│   │       ├── yookassa_controller.rb
│   │       ├── stripe_controller.rb
│   │       └── app_store_controller.rb
│   ├── models/
│   │   ├── user.rb              # Синхронизация с Supabase
│   │   ├── subscription.rb      # Подписки
│   │   ├── payment.rb           # История платежей
│   │   ├── usage_limit.rb       # Лимиты использования
│   │   ├── usage_log.rb         # Логи использования AI
│   │   └── concerns/
│   │       └── supabase_sync.rb # Синхронизация с Supabase
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── auth_service.rb      # Валидация JWT
│   │   │   └── sync_service.rb      # Синхронизация данных
│   │   ├── payments/
│   │   │   ├── yookassa_service.rb  # YooMoney интеграция
│   │   │   ├── stripe_service.rb    # Stripe интеграция
│   │   │   └── iap_service.rb       # App Store / Play Store
│   │   └── subscriptions/
│   │       ├── manager.rb           # Управление подписками
│   │       └── limit_checker.rb     # Проверка лимитов
│   ├── jobs/
│   │   ├── sync_supabase_user_job.rb
│   │   ├── process_payment_job.rb
│   │   ├── reset_monthly_limits_job.rb
│   │   └── subscription_reminder_job.rb
│   └── views/
│       └── dashboard/
│           ├── home/
│           ├── subscription/
│           ├── billing/
│           └── layouts/
├── config/
│   ├── routes.rb
│   ├── initializers/
│   │   ├── supabase.rb
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
  has_many :payments, dependent: :destroy
  has_many :usage_logs, dependent: :destroy

  # Синхронизация с Supabase Auth
  # supabase_id — UUID из Supabase
  validates :supabase_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true

  def current_plan
    subscription&.active? ? subscription.plan : 'free'
  end

  def can_use_feature?(feature)
    LimitChecker.new(self).can_use?(feature)
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

  def active?
    status == 'active' && (expires_at.nil? || expires_at > Time.current)
  end
end

# app/models/usage_limit.rb
class UsageLimit < ApplicationRecord
  belongs_to :user

  LIMITS = {
    free: {
      items: 100,
      bg_removal: 50,
      ai_styling: 30,
      ai_tryon: 5
    },
    pro: {
      items: 250,
      bg_removal: 100,
      ai_styling: 60,
      ai_tryon: 30
    },
    max: {
      items: 500,
      bg_removal: 200,
      ai_styling: 100,
      ai_tryon: 50
    }
  }.freeze

  def limit_for(feature)
    LIMITS[user.current_plan.to_sym][feature.to_sym]
  end

  def remaining(feature)
    limit_for(feature) - send("#{feature}_used")
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
      user.create_usage_limit!
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

Rails хранит:

- Subscriptions
- Payments
- Usage limits
- Usage logs

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

  # Обновить subscription_plan в Supabase users table
  def update_user_plan(supabase_id, plan)
    self.class.patch(
      "/rest/v1/users?id=eq.#{supabase_id}",
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
end
```

---

## 💳 Платёжная система

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

    # Сброс лимитов
    user.usage_limit.reset_monthly!
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

    <!-- Usage Stats -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="text-xl font-semibold mb-4">Использование</h2>

      <div class="space-y-4">
        <%= render 'usage_bar',
            label: 'Вещей в гардеробе',
            used: @stats[:items_count],
            limit: @limits[:items] %>

        <%= render 'usage_bar',
            label: 'Удаление фона (этот месяц)',
            used: @usage.bg_removal_used,
            limit: @limits[:bg_removal] %>

        <%= render 'usage_bar',
            label: 'AI-подборы (этот месяц)',
            used: @usage.ai_styling_used,
            limit: @limits[:ai_styling] %>

        <%= render 'usage_bar',
            label: 'AI-примерки (этот месяц)',
            used: @usage.ai_tryon_used,
            limit: @limits[:ai_tryon] %>
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
      # Подписки и лимиты
      resource :subscription, only: [:show]
      resource :limits, only: [:show]

      # Использование функций (для трекинга лимитов)
      post 'usage/track', to: 'usage#track'

      # IAP валидация
      post 'iap/verify_ios', to: 'iap#verify_ios'
      post 'iap/verify_android', to: 'iap#verify_android'
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
  authenticate :user, ->(u) { u.admin? } do
    mount Administrate::Engine, at: '/admin'
    mount Sidekiq::Web, at: '/sidekiq'
  end
end
```

---

## 🤖 AI Microservice

AI-сервис остаётся на **Node.js/NestJS** — он занимается только AI-операциями.

### Взаимодействие с Rails

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Mobile App                                                              │
│     │                                                                    │
│     │ 1. Запрос AI-подбора                                              │
│     ▼                                                                    │
│  Rails Backend                                                           │
│     │                                                                    │
│     │ 2. Проверка лимитов                                               │
│     │    - current_user.can_use_feature?(:ai_styling)                   │
│     │                                                                    │
│     │ 3. Если OK → Forward to AI Service                                │
│     ▼                                                                    │
│  AI Microservice (NestJS)                                               │
│     │                                                                    │
│     │ 4. Выполнение AI-операции                                         │
│     │    - Mistral API / Gemini API                                     │
│     │                                                                    │
│     │ 5. Результат                                                       │
│     ▼                                                                    │
│  Rails Backend                                                           │
│     │                                                                    │
│     │ 6. Логирование использования                                      │
│     │    - current_user.usage_limit.increment!(:ai_styling_used)        │
│     │                                                                    │
│     │ 7. Возврат результата                                             │
│     ▼                                                                    │
│  Mobile App                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Rails как прокси для AI

```ruby
# app/controllers/api/v1/ai_controller.rb
class Api::V1::AiController < Api::V1::BaseController
  before_action :check_limits

  def analyze_item
    # Проверка лимита
    unless current_user.can_use_feature?(:bg_removal)
      return render json: { error: 'Limit exceeded' }, status: :payment_required
    end

    # Запрос к AI сервису
    result = AiService.analyze_item(params[:image_url])

    # Логирование использования
    current_user.usage_limit.increment!(:bg_removal_used)
    UsageLog.create!(
      user: current_user,
      feature: :bg_removal,
      cost: 0.0018  # Стоимость операции
    )

    render json: result
  end

  def generate_outfit
    unless current_user.can_use_feature?(:ai_styling)
      return render json: { error: 'Limit exceeded' }, status: :payment_required
    end

    result = AiService.generate_outfit(
      user_id: current_user.supabase_id,
      params: outfit_params
    )

    current_user.usage_limit.increment!(:ai_styling_used)
    UsageLog.create!(user: current_user, feature: :ai_styling, cost: 0.03)

    render json: result
  end

  def try_on
    unless current_user.can_use_feature?(:ai_tryon)
      return render json: { error: 'Limit exceeded' }, status: :payment_required
    end

    result = AiService.try_on(
      user_photo: params[:user_photo],
      outfit_id: params[:outfit_id]
    )

    current_user.usage_limit.increment!(:ai_tryon_used)
    UsageLog.create!(user: current_user, feature: :ai_tryon, cost: 3.0)

    render json: result
  end

  private

  def check_limits
    # Общая проверка что пользователь не заблокирован
  end

  def outfit_params
    params.permit(:style, :season, :occasion, item_ids: [])
  end
end

# app/services/ai_service.rb
class AiService
  include HTTParty
  base_uri ENV['AI_SERVICE_URL']

  def self.analyze_item(image_url)
    post('/api/analyze', body: { image_url: image_url }.to_json, headers: headers)
  end

  def self.generate_outfit(user_id:, params:)
    post('/api/outfit/generate', body: { user_id: user_id, **params }.to_json, headers: headers)
  end

  def self.try_on(user_photo:, outfit_id:)
    post('/api/tryon', body: { user_photo: user_photo, outfit_id: outfit_id }.to_json, headers: headers)
  end

  private

  def self.headers
    {
      'Content-Type' => 'application/json',
      'Authorization' => "Bearer #{ENV['AI_SERVICE_SECRET']}"
    }
  end
end
```

---

## 📡 API Endpoints

### Для мобильного приложения

```
# Подписки и лимиты
GET    /api/v1/subscription      # Текущая подписка
GET    /api/v1/limits            # Текущие лимиты и использование
POST   /api/v1/usage/track       # Трекинг использования функции

# IAP
POST   /api/v1/iap/verify_ios    # Валидация Apple receipt
POST   /api/v1/iap/verify_android # Валидация Google purchase

# AI (через Rails proxy)
POST   /api/v1/ai/analyze        # AI-анализ вещи
POST   /api/v1/ai/outfit         # AI-подбор образа
POST   /api/v1/ai/tryon          # AI-примерка
```

### Response форматы

```json
// GET /api/v1/subscription
{
  "subscription": {
    "plan": "pro",
    "status": "active",
    "provider": "web",
    "expires_at": "2025-01-15T00:00:00Z",
    "auto_renewal": true
  }
}

// GET /api/v1/limits
{
  "limits": {
    "items": { "used": 45, "limit": 250 },
    "bg_removal": { "used": 12, "limit": 100, "resets_at": "2025-01-01T00:00:00Z" },
    "ai_styling": { "used": 5, "limit": 60, "resets_at": "2025-01-01T00:00:00Z" },
    "ai_tryon": { "used": 2, "limit": 30, "resets_at": "2025-01-01T00:00:00Z" }
  }
}
```

---

## 🚀 Деплой и инфраструктура

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

# AI Service
AI_SERVICE_URL=https://ai.obrazz.app
AI_SERVICE_SECRET=xxx

# Dashboard
DASHBOARD_URL=https://app.obrazz.ru
SECRET_KEY_BASE=xxx

# Monitoring
SENTRY_DSN=xxx
```

---

## 📋 Этапы разработки Backend

### Phase 1: Foundation (1-2 недели)

- [ ] Инициализация Rails 7.2 проекта
- [ ] Настройка PostgreSQL (connection к Supabase)
- [ ] JWT аутентификация (Supabase интеграция)
- [ ] Базовые модели (User, Subscription, UsageLimit)
- [ ] API endpoints для subscription/limits

### Phase 2: Dashboard (1-2 недели)

- [ ] Hotwire + Tailwind setup
- [ ] Dashboard layout
- [ ] Profile management
- [ ] Subscription display
- [ ] Usage statistics

### Phase 3: Payments - Russia (1-2 недели)

- [ ] YooKassa интеграция
- [ ] Payment flow (redirect → webhook)
- [ ] Subscription activation
- [ ] Auto-renewal setup

### Phase 4: Payments - IAP (1-2 недели)

- [ ] App Store receipt validation
- [ ] Google Play purchase validation
- [ ] Server-to-Server notifications
- [ ] Unified subscription handling

### Phase 5: AI Integration (1 неделя)

- [ ] Proxy endpoints для AI сервиса
- [ ] Limit checking middleware
- [ ] Usage logging
- [ ] Cost tracking

### Phase 6: Production (1 неделя)

- [ ] Деплой на Render/Railway
- [ ] SSL + Domain setup
- [ ] Monitoring (Sentry)
- [ ] Backup strategy

---

## 📚 Связанная документация

- [PRDobrazz.md](./PRDobrazz.md) — Product Requirements
- [Implementation.md](./Implementation.md) — Roadmap
- [TechStack.md](./TechStack.md) — Technical Stack
- [AppMapobrazz.md](./AppMapobrazz.md) — App Screens & Flows
