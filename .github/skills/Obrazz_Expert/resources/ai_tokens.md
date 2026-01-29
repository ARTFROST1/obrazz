# AI & Tokens Reference — Obrazz

## AI Generation System

### Overview

AI-генерации проходят через Rails backend, который выступает proxy для The New Black API. Это позволяет:

- Контролировать расход токенов
- Сохранять результаты в Supabase Storage
- Отслеживать статистику использования
- Кэшировать результаты

### Generation Types

| Type             | Description                          | Token Cost |
| ---------------- | ------------------------------------ | ---------- |
| `virtual_try_on` | Примерка одежды на фото пользователя | 1          |
| `fashion_model`  | Генерация модели в указанной одежде  | 1          |
| `variation`      | Вариации дизайна одежды              | 1          |

### Generation Flow

```
Mobile App                    Rails Backend                 The New Black
     │                              │                              │
     │ POST /ai_generations         │                              │
     │────────────────────────────► │                              │
     │                              │ Check token balance          │
     │                              │ Debit tokens                 │
     │                              │ Create AiGeneration record   │
     │                              │                              │
     │                              │ POST /v1/virtual-try-on      │
     │                              │─────────────────────────────►│
     │                              │                              │
     │                              │◄─────────────────────────────│
     │                              │ { task_id, status: pending } │
     │                              │                              │
     │◄──────────────────────────── │                              │
     │ { id, status: processing }   │                              │
     │                              │                              │
     │                              │ AiGenerationStatusJob        │
     │                              │ (polls every 5 seconds)      │
     │                              │                              │
     │                              │ GET /v1/tasks/{task_id}      │
     │                              │─────────────────────────────►│
     │                              │◄─────────────────────────────│
     │                              │ { status: completed, images }│
     │                              │                              │
     │                              │ Update AiGeneration          │
     │                              │ Upload to Supabase Storage   │
     │                              │                              │
     │ GET /ai_generations/{id}     │                              │
     │────────────────────────────► │                              │
     │◄──────────────────────────── │                              │
     │ { status: completed,         │                              │
     │   output_image_urls: [...] } │                              │
```

### Rails Services

#### GenerationService

```ruby
# app/services/ai/generation_service.rb
module Ai
  class GenerationService
    def initialize(user)
      @user = user
      @client = TheNewBlackClient.new
      @token_service = Tokens::BalanceService.new(user)
    end

    def create_virtual_try_on(garment_url:, model_url:, **options)
      create_generation(
        generation_type: "virtual_try_on",
        input_params: { garment_url:, model_url:, **options },
        input_image_urls: [garment_url, model_url]
      ) do |generation|
        @client.create_virtual_try_on(garment_url:, model_url:, **options)
      end
    end

    def create_fashion_model(garment_url:, prompt:, **options)
      # Similar pattern
    end

    def create_variation(garment_url:, prompt:, **options)
      # Similar pattern
    end

    def check_status(generation)
      return generation if generation.completed? || generation.failed?

      result = @client.get_task_status(generation.external_id)
      update_from_api_status(generation, result)
      generation
    end

    private

    def create_generation(generation_type:, input_params:, input_image_urls:)
      tokens_cost = AiGeneration::TOKEN_COSTS[generation_type]

      unless @user.can_generate?(tokens_cost)
        raise InsufficientTokensError, "Need #{tokens_cost} tokens"
      end

      ActiveRecord::Base.transaction do
        generation = @user.ai_generations.create!(
          generation_type:,
          status: "pending",
          tokens_cost:,
          input_params:,
          input_image_urls:
        )

        @token_service.debit_for_generation!(
          amount: tokens_cost,
          ai_generation: generation
        )

        api_response = yield(generation)
        generation.update!(external_id: api_response[:task_id], status: "processing")

        AiGenerationStatusJob.perform_later(generation.id)
        generation
      end
    end
  end
end
```

#### TheNewBlackClient

```ruby
# app/services/ai/the_new_black_client.rb
module Ai
  class TheNewBlackClient
    BASE_URL = ENV.fetch("THE_NEW_BLACK_API_URL", "https://api.thenewblack.ai")

    def create_virtual_try_on(garment_url:, model_url:, **options)
      post("/v1/virtual-try-on", {
        garment_image: garment_url,
        model_image: model_url,
        category: options[:category] || "upper_body"
      })
    end

    def create_fashion_model(garment_url:, prompt:, **options)
      post("/v1/fashion-model", {
        garment_image: garment_url,
        prompt: prompt,
        style: options[:style] || "photorealistic"
      })
    end

    def create_variation(garment_url:, prompt:, **options)
      post("/v1/clothing-variations", {
        garment_image: garment_url,
        prompt: prompt,
        strength: options[:strength] || 0.5,
        num_variations: options[:num_variations] || 1
      })
    end

    def get_task_status(task_id)
      get("/v1/tasks/#{task_id}")
    end

    private

    def post(path, body)
      response = connection.post(path) do |req|
        req.headers["Authorization"] = "Bearer #{@api_key}"
        req.body = body
      end
      handle_response(response)
    end
  end
end
```

---

## Token System

### Token Types

| Type                  | Source                       | Expiry                | Priority  |
| --------------------- | ---------------------------- | --------------------- | --------- |
| `subscription_tokens` | Monthly subscription renewal | End of billing period | 1 (first) |
| `purchased_tokens`    | Token pack purchases         | Never                 | 2         |
| `bonus_tokens`        | Registration, promotions     | 30 days               | 3 (last)  |

### Token Debit Order

При списании токенов используется приоритет:

1. subscription_tokens (истекают первыми)
2. purchased_tokens (постоянные)
3. bonus_tokens (бонусные)

### BalanceService

```ruby
# app/services/tokens/balance_service.rb
module Tokens
  class BalanceService
    def initialize(user)
      @user = user
    end

    # Общий доступный баланс
    def available_balance
      active_balances.sum(:balance)
    end

    # Детальная информация
    def detailed_balance
      {
        total: available_balance,
        subscription_tokens: subscription_balance,
        purchased_tokens: purchased_balance,
        bonus_tokens: bonus_balance,
        balances: balances_breakdown
      }
    end

    # Списание для AI генерации
    def debit_for_generation!(amount:, ai_generation:, reason: "ai_generation")
      raise InsufficientTokensError if available_balance < amount

      remaining = amount
      transactions = []

      ActiveRecord::Base.transaction do
        # 1. subscription_tokens
        remaining, txns = debit_from_type("subscription_tokens", remaining, ai_generation)
        transactions.concat(txns)

        # 2. purchased_tokens
        if remaining > 0
          remaining, txns = debit_from_type("purchased_tokens", remaining, ai_generation)
          transactions.concat(txns)
        end

        # 3. bonus_tokens
        if remaining > 0
          remaining, txns = debit_from_type("bonus_tokens", remaining, ai_generation)
          transactions.concat(txns)
        end

        raise InsufficientTokensError if remaining > 0
      end

      transactions
    end

    # Начисление от покупки
    def credit_from_purchase!(amount:, payment:, token_pack_id: nil)
      balance = find_or_create_balance("purchased_tokens", source: "purchase")
      balance.credit!(amount, reason: "purchase", payment_id: payment.id)
    end

    # Начисление бонусов
    def credit_bonus!(amount:, reason:, expires_in: 30.days)
      balance = find_or_create_balance("bonus_tokens", source: "bonus")
      balance.update!(expires_at: expires_in.from_now) if expires_in
      balance.credit!(amount, reason: reason)
    end

    # Обновление токенов подписки
    def refresh_subscription_tokens!(amount:, expires_at:)
      balance = find_or_create_balance("subscription_tokens", source: "subscription")
      balance.update!(balance: amount, expires_at: expires_at)
    end

    private

    def active_balances
      @user.token_balances.where("expires_at IS NULL OR expires_at > ?", Time.current)
    end
  end
end
```

### Token Packs

```ruby
TOKEN_PACKS = {
  "small_50" => {
    tokens: 50,
    price_rub: 299,
    price_usd: 4.99,
    description: "50 токенов"
  },
  "medium_200" => {
    tokens: 200,
    price_rub: 999,
    price_usd: 14.99,
    description: "200 токенов (экономия 17%)"
  },
  "large_500" => {
    tokens: 500,
    price_rub: 1999,
    price_usd: 29.99,
    description: "500 токенов (экономия 33%)"
  }
}
```

---

## Subscription System

### Plans

```ruby
PLANS = {
  "free" => {
    monthly_tokens: 0,
    price_rub: 0,
    features: ["wardrobe_management", "manual_outfits", "3_bonus_tokens"]
  },
  "pro_monthly" => {
    monthly_tokens: 100,
    price_rub: 299,
    features: ["all_free_features", "ai_try_on", "ai_fashion_model", "ai_variations", "priority_support"]
  },
  "pro_yearly" => {
    monthly_tokens: 100,
    price_rub: 2390,  # ~199/month
    features: ["all_pro_features", "2_months_free"]
  }
}
```

### Subscription Model

```ruby
# app/models/subscription.rb
class Subscription < ApplicationRecord
  belongs_to :user
  has_many :payments

  PLAN_TOKENS = {
    "free" => 0,
    "pro_monthly" => 100,
    "pro_yearly" => 100
  }

  def upgrade!(new_plan, payment_provider:, external_id:)
    transaction do
      update!(
        plan: new_plan,
        status: "active",
        payment_provider: payment_provider,
        external_id: external_id,
        current_period_start: Time.current,
        current_period_end: calculate_period_end(new_plan),
        auto_renew: true
      )

      credit_subscription_tokens!
    end
  end

  def renew!(new_period_end)
    transaction do
      update!(
        status: "active",
        current_period_start: Time.current,
        current_period_end: new_period_end,
        cancelled_at: nil
      )

      credit_subscription_tokens!
    end
  end

  def cancel!
    update!(
      status: "cancelled",
      cancelled_at: Time.current,
      auto_renew: false
    )
  end

  private

  def credit_subscription_tokens!
    return if free?

    token_service = Tokens::BalanceService.new(user)
    token_service.refresh_subscription_tokens!(
      amount: monthly_tokens,
      expires_at: current_period_end
    )
  end
end
```

---

## Payment Integration (YooKassa)

### Payment Flow

```
User taps "Buy Tokens"
     │
     ▼
POST /api/v1/payments
  {
    payment_type: "token_pack",
    token_pack_id: "medium_200",
    return_url: "obrazz://payment/callback"
  }
     │
     ▼
Rails creates Payment record (status: pending)
Rails calls YookassaService.create_payment()
     │
     ▼
YooKassa returns confirmation_url
     │
     ▼
Mobile opens WebView with confirmation_url
User completes payment on YooKassa
     │
     ▼
YooKassa redirects to return_url
YooKassa sends webhook to /api/v1/webhooks/yookassa
     │
     ▼
Rails verifies signature
Rails updates Payment (status: succeeded)
Rails credits tokens to user
     │
     ▼
Mobile polls payment status or receives push
```

### YookassaService

```ruby
# app/services/payments/yookassa_service.rb
module Payments
  class YookassaService
    API_BASE = "https://api.yookassa.ru"

    def create_payment(amount:, currency: "RUB", description:, metadata: {}, return_url:)
      return { success: false, error: "YooKassa not configured" } unless configured?

      payload = {
        amount: { value: format("%.2f", amount), currency: currency },
        capture: true,
        confirmation: { type: "redirect", return_url: return_url },
        description: description,
        metadata: metadata
      }

      response = connection.post("/v3/payments") do |req|
        req.headers["Idempotence-Key"] = SecureRandom.uuid
        req.body = JSON.generate(payload)
      end

      if response.success?
        body = JSON.parse(response.body)
        {
          success: true,
          payment_id: body["id"],
          confirmation_url: body.dig("confirmation", "confirmation_url"),
          status: body["status"]
        }
      else
        { success: false, error: "YooKassa error: #{response.status}" }
      end
    end

    private

    def connection
      @connection ||= Faraday.new(url: API_BASE) do |f|
        f.request :authorization, :basic, @shop_id, @secret_key
        f.request :json
        f.response :json
      end
    end
  end
end
```

### Webhook Processing

```ruby
# app/services/webhooks/yookassa_processor.rb
module Webhooks
  class YookassaProcessor
    def process!(webhook_event)
      payload = webhook_event.payload
      payment_id = payload.dig("object", "id")
      status = payload.dig("object", "status")

      payment = Payment.find_by!(external_id: payment_id)

      case status
      when "succeeded"
        payment.mark_succeeded!
        credit_tokens!(payment) if payment.token_pack?
        activate_subscription!(payment) if payment.subscription?
      when "canceled"
        payment.mark_failed!
      end

      webhook_event.update!(status: "processed", processed_at: Time.current)
    end

    private

    def credit_tokens!(payment)
      pack = TOKEN_PACKS[payment.token_pack_id]
      Tokens::BalanceService.new(payment.user).credit_from_purchase!(
        amount: pack[:tokens],
        payment: payment,
        token_pack_id: payment.token_pack_id
      )
    end
  end
end
```

---

## Mobile Integration (React Native)

### AI Service (Planned)

```typescript
// services/ai/aiService.ts
import { railsClient } from '@services/api/railsClient';

export const aiService = {
  createVirtualTryOn: async (garmentUrl: string, modelUrl: string) => {
    return railsClient.post<AiGeneration>('/ai_generations', {
      generation_type: 'virtual_try_on',
      garment_url: garmentUrl,
      model_url: modelUrl,
    });
  },

  createFashionModel: async (garmentUrl: string, prompt: string) => {
    return railsClient.post<AiGeneration>('/ai_generations', {
      generation_type: 'fashion_model',
      garment_url: garmentUrl,
      prompt: prompt,
    });
  },

  getStatus: async (id: string) => {
    return railsClient.get<AiGeneration>(`/ai_generations/${id}/status`);
  },

  pollUntilComplete: async (id: string, onProgress?: (status: string) => void) => {
    while (true) {
      const generation = await aiService.getStatus(id);
      onProgress?.(generation.status);

      if (generation.status === 'completed' || generation.status === 'failed') {
        return generation;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  },
};
```

### Token Service (Planned)

```typescript
// services/tokens/tokenService.ts
export const tokenService = {
  getBalance: async () => {
    return railsClient.get<TokenBalance>('/tokens/balance');
  },

  getHistory: async (page = 1) => {
    return railsClient.get<TokenTransaction[]>(`/tokens/history?page=${page}`);
  },

  purchaseTokens: async (packId: string) => {
    const result = await railsClient.post<PaymentResult>('/payments', {
      payment_type: 'token_pack',
      token_pack_id: packId,
      return_url: 'obrazz://payment/callback',
    });

    // Open WebView with confirmation_url
    return result;
  },
};
```
