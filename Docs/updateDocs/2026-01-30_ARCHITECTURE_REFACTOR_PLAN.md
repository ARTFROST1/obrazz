# 🏗️ План рефакторинга архитектуры Obrazz

> **Дата создания:** 30 января 2026  
> **Версия:** 1.0.0  
> **Статус:** Планирование  
> **Автор:** AI Architect

---

## 📋 Оглавление

1. [Резюме](#резюме)
2. [Текущее состояние](#текущее-состояние)
3. [Целевая архитектура](#целевая-архитектура)
4. [Компоненты миграции](#компоненты-миграции)
5. [План миграции по этапам](#план-миграции-по-этапам)
6. [Детальная спецификация Node.js Backend](#детальная-спецификация-nodejs-backend)
7. [Детальная спецификация Frontend Dashboard](#детальная-спецификация-frontend-dashboard)
8. [Free Tier лимиты и ограничения](#free-tier-лимиты-и-ограничения)
9. [Риски и митигация](#риски-и-митигация)
10. [Оценка трудозатрат](#оценка-трудозатрат)

---

## 📝 Резюме

### Цель рефакторинга

Разделение монолитного Rails backend на:

1. **Lightweight Node.js API** (Render) — бизнес-логика, AI, платежи
2. **Next.js Frontend** (Vercel) — лендинг + личный кабинет
3. **Rails Admin** (Render, отдельный аккаунт) — только админ-панель

### Ключевые требования

| Требование               | Решение                                    |
| ------------------------ | ------------------------------------------ |
| Free Tier везде          | Render Free + Vercel Hobby + Supabase Free |
| AI функции с FASHN SDK   | Node.js backend с TypeScript SDK           |
| Консистентный UI         | Миграция ERB → React компоненты            |
| Единый язык frontend     | TypeScript везде                           |
| Бизнес-логика на backend | НЕ в Supabase Edge Functions               |

---

## 📊 Текущее состояние

### Архитектура AS-IS

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Hobby)                                │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Next.js Landing Page                                            ││
│  │  - Маркетинговая страница                                        ││
│  │  - Статический контент                                           ││
│  └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        RENDER (Free Tier)                            │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Ruby on Rails 8.0.4 (МОНОЛИТ)                                   ││
│  │  ├── API для Mobile App (/api/v1/*)                              ││
│  │  ├── Личный кабинет (Dashboard) - Rails Views + Hotwire          ││
│  │  ├── Admin панель (/admin/*)                                     ││
│  │  ├── Бизнес-логика (подписки, токены, платежи)                   ││
│  │  ├── AI Proxy (The New Black API)                                ││
│  │  ├── Background Jobs (Solid Queue)                               ││
│  │  └── Webhooks (YooKassa, Apple, Google)                          ││
│  └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Free Tier)                          │
│  ├── Auth (JWT, OAuth)                                               │
│  ├── PostgreSQL Database                                             │
│  └── Storage (Images)                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Проблемы текущей архитектуры

| Проблема               | Влияние                                           |
| ---------------------- | ------------------------------------------------- |
| **Тяжёлый Rails**      | Cold start 30-60 сек на Render Free               |
| **Sleep после 15 мин** | Плохой UX для первого запроса                     |
| **Ruby ≠ FASHN SDK**   | Нужен HTTP client вместо нативного TypeScript SDK |
| **Смешанный код**      | Frontend (ERB) + Backend (Ruby) в одном месте     |
| **Сложность деплоя**   | Один монолит = всё ломается вместе                |

### Инвентаризация Rails кода

#### Controllers (требуют миграции в Node.js)

| Controller                         | Файл                                  | Функционал             | Приоритет |
| ---------------------------------- | ------------------------------------- | ---------------------- | --------- |
| `Api::V1::AiGenerationsController` | `api/v1/ai_generations_controller.rb` | CRUD генераций, статус | HIGH      |
| `Api::V1::TokensController`        | `api/v1/tokens_controller.rb`         | Баланс, история        | HIGH      |
| `Api::V1::SubscriptionsController` | `api/v1/subscriptions_controller.rb`  | Управление подписками  | HIGH      |
| `Api::V1::PaymentsController`      | `api/v1/payments_controller.rb`       | Создание платежей      | HIGH      |
| `Api::V1::UsersController`         | `api/v1/users_controller.rb`          | Профиль пользователя   | MEDIUM    |
| `Api::V1::Webhooks::*`             | `api/v1/webhooks/*`                   | Обработка вебхуков     | HIGH      |
| `Api::V1::Ai::*`                   | `api/v1/ai/*`                         | Shortcuts для AI       | HIGH      |

#### Services (требуют миграции в Node.js)

| Service                     | Файл                                    | LOC  | Функционал                      |
| --------------------------- | --------------------------------------- | ---- | ------------------------------- |
| `Ai::GenerationService`     | `services/ai/generation_service.rb`     | ~170 | Оркестрация AI генераций        |
| `Ai::TheNewBlackClient`     | `services/ai/the_new_black_client.rb`   | ~171 | HTTP клиент (заменить на FASHN) |
| `Tokens::BalanceService`    | `services/tokens/balance_service.rb`    | ~175 | Управление токенами             |
| `Payments::YookassaService` | `services/payments/yookassa_service.rb` | ~100 | YooKassa интеграция             |
| `Auth::SupabaseJwtService`  | `services/auth/supabase_jwt_service.rb` | ~80  | JWT валидация                   |
| `Webhooks::*`               | `services/webhooks/*`                   | ~200 | Обработка вебхуков              |

#### Dashboard Views (требуют миграции в Next.js)

| View         | Файл                                                       | Функционал             |
| ------------ | ---------------------------------------------------------- | ---------------------- |
| Home         | `views/dashboard/home/index.html.erb`                      | Главная ЛК (299 строк) |
| Generations  | `views/dashboard/generations/*`                            | Галерея AI генераций   |
| Tokens       | `views/dashboard/tokens/*`                                 | Управление токенами    |
| Subscription | `views/dashboard/subscriptions/*`                          | Управление подпиской   |
| Settings     | `views/dashboard/settings/*`                               | Настройки профиля      |
| Auth         | `views/dashboard/sessions/*`, `registrations/*`, `oauth/*` | Авторизация            |

#### Admin Views (остаются на Rails)

| View                   | Функционал                |
| ---------------------- | ------------------------- |
| `admin/dashboard`      | Статистика                |
| `admin/users`          | Управление пользователями |
| `admin/subscriptions`  | Управление подписками     |
| `admin/payments`       | История платежей          |
| `admin/ai_generations` | AI генерации              |

### Database Schema (Supabase)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │────<│  subscriptions  │     │   ai_generations│
│  (supabase_id)  │     │   (user_id)     │     │   (user_id)     │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌─────────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐
│ token_balances  │ │  payments  │ │   items    │ │    outfits     │
│   (user_id)     │ │ (user_id)  │ │ (user_id)  │ │   (user_id)    │
└────────┬────────┘ └────────────┘ └────────────┘ └────────────────┘
         │
         ▼
┌─────────────────┐
│token_transactions│
│(token_balance_id)│
└─────────────────┘
```

---

## 🎯 Целевая архитектура

### Архитектура TO-BE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL (Hobby)                                 │
│  ┌───────────────────────────────────────────────────────────────────── ┐│
│  │  Next.js 15 App                                                      ││
│  │  ├── Landing Page (/)                    ← Существует                ││
│  │  ├── Dashboard (/dashboard/*)            ← НОВОЕ (миграция с Rails)  ││
│  │  │   ├── /dashboard                      - Главная                   ││
│  │  │   ├── /dashboard/generations          - AI генерации              ││
│  │  │   ├── /dashboard/tokens               - Токены                    ││
│  │  │   ├── /dashboard/subscription         - Подписка                  ││
│  │  │   └── /dashboard/settings             - Настройки                 ││
│  │  ├── Auth Pages (/login, /signup)        ← НОВОЕ                     ││
│  │  └── API Routes (/api/*)                 - Proxy to Node.js backend  ││
│  └───────────────────────────────────────────────────────────────────── ┘│
└────────────────────────────────────────┬────────────────────────────────┘
                                         │ HTTPS
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        RENDER #1 (Free Tier)                             │
│  ┌───────────────────────────────────────────────────────────────────── ┐│
│  │  Node.js Backend (Hono/Fastify)                                      ││
│  │  ├── /api/v1/ai/*              - AI генерации (FASHN SDK)            ││
│  │  ├── /api/v1/tokens/*          - Управление токенами                 ││
│  │  ├── /api/v1/subscriptions/*   - Подписки                            ││
│  │  ├── /api/v1/payments/*        - Платежи (YooKassa)                  ││
│  │  ├── /api/v1/users/*           - Профиль                             ││
│  │  ├── /api/v1/webhooks/*        - Webhook handlers                    ││
│  │  └── Background Jobs           - BullMQ + Redis (или без)            ││
│  └───────────────────────────────────────────────────────────────────── ┘│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        RENDER #2 (Free Tier, отдельный аккаунт)          │
│  ┌───────────────────────────────────────────────────────────────────── ┐│
│  │  Ruby on Rails 8 (Только Admin)                                      ││
│  │  └── /admin/*                  - Админ-панель                        ││
│  └───────────────────────────────────────────────────────────────────── ┘│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Free Tier)                              │
│  ├── Auth (JWT, OAuth providers)                                         │
│  ├── PostgreSQL Database (все таблицы)                                   │
│  └── Storage (изображения генераций)                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        FASHN AI (External API)                           │
│  ├── Virtual Try-On v1.6                                                 │
│  ├── Product to Model                                                    │
│  ├── Face to Model                                                       │
│  └── Clothing Variations                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Потоки данных

#### 1. AI Generation Flow

```
Mobile App / Dashboard
        │
        ▼ POST /api/v1/ai/virtual-try-on
┌───────────────────┐
│  Vercel (Proxy)   │  ← Опционально, можно напрямую
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Node.js Backend   │
│ (Render)          │
│  1. Validate JWT  │
│  2. Check tokens  │
│  3. Call FASHN    │
│  4. Deduct tokens │
│  5. Save result   │
└────────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│FASHN  │  │Supabase│
│ AI    │  │ DB/   │
│       │  │Storage│
└───────┘  └───────┘
```

#### 2. Payment Flow (YooKassa)

```
Dashboard (Vercel)
        │
        ▼ POST /api/payments
┌───────────────────┐
│ Node.js Backend   │
│  1. Create payment│
│  2. Get redirect  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│    YooKassa       │
│  (checkout page)  │
└────────┬──────────┘
         │ webhook
         ▼
┌───────────────────┐
│ Node.js Backend   │
│  POST /webhooks/  │
│  yookassa         │
│  1. Verify sig    │
│  2. Update payment│
│  3. Credit tokens │
└───────────────────┘
```

---

## 🧩 Компоненты миграции

### Компонент 1: Node.js Backend

#### Выбор фреймворка

| Фреймворк   | Boot time | Memory | Плюсы                             | Минусы             |
| ----------- | --------- | ------ | --------------------------------- | ------------------ |
| **Hono** ⭐ | ~100ms    | ~50MB  | Ультралёгкий, Edge-ready          | Меньше middleware  |
| Fastify     | ~200ms    | ~80MB  | Production-ready, схема валидации | Больше boilerplate |
| Express     | ~300ms    | ~100MB | Огромная экосистема               | Медленнее          |

**Рекомендация:** Hono — минимальный footprint, идеален для Free Tier.

#### Структура проекта Node.js

```
obrazz-api/
├── src/
│   ├── index.ts                    # Entry point
│   ├── app.ts                      # Hono app setup
│   ├── middleware/
│   │   ├── auth.ts                 # JWT validation (Supabase)
│   │   ├── cors.ts                 # CORS config
│   │   └── error-handler.ts        # Global error handling
│   ├── routes/
│   │   ├── ai.routes.ts            # AI generation endpoints
│   │   ├── tokens.routes.ts        # Token management
│   │   ├── subscriptions.routes.ts # Subscription management
│   │   ├── payments.routes.ts      # Payment endpoints
│   │   ├── users.routes.ts         # User profile
│   │   └── webhooks.routes.ts      # Webhook handlers
│   ├── services/
│   │   ├── ai/
│   │   │   ├── fashn.service.ts    # FASHN AI SDK wrapper
│   │   │   └── generation.service.ts
│   │   ├── tokens/
│   │   │   └── balance.service.ts
│   │   ├── payments/
│   │   │   └── yookassa.service.ts
│   │   └── auth/
│   │       └── supabase.service.ts
│   ├── db/
│   │   ├── client.ts               # Supabase client
│   │   └── queries/                # SQL queries
│   ├── types/
│   │   └── index.ts
│   └── config/
│       └── env.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── render.yaml
```

### Компонент 2: Next.js Dashboard

#### Структура в существующем лендинге

```
obrazz-landing/                      # Существующий проект
├── app/
│   ├── page.tsx                     # Landing (существует)
│   ├── layout.tsx                   # Root layout
│   ├── (auth)/                      # Auth group
│   │   ├── login/page.tsx           # Логин
│   │   ├── signup/page.tsx          # Регистрация
│   │   └── layout.tsx               # Auth layout
│   ├── (dashboard)/                 # Dashboard group
│   │   ├── layout.tsx               # Dashboard layout (sidebar)
│   │   ├── page.tsx                 # /dashboard - главная
│   │   ├── generations/
│   │   │   ├── page.tsx             # Галерея
│   │   │   └── [id]/page.tsx        # Детали генерации
│   │   ├── tokens/
│   │   │   └── page.tsx             # Управление токенами
│   │   ├── subscription/
│   │   │   └── page.tsx             # Управление подпиской
│   │   └── settings/
│   │       └── page.tsx             # Настройки
│   └── api/                         # API Routes (proxy)
│       └── v1/
│           └── [...path]/route.ts   # Proxy to Node.js
├── components/
│   ├── landing/                     # Существующие компоненты
│   ├── dashboard/                   # НОВЫЕ компоненты
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── GenerationCard.tsx
│   │   ├── TokenBalance.tsx
│   │   └── SubscriptionStatus.tsx
│   └── ui/                          # Общие UI компоненты
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   └── server.ts                # Server client
│   └── api.ts                       # API client
└── ...
```

### Компонент 3: Rails Admin (минимальный)

#### Что остаётся

```
obrazz-admin/                        # Урезанный Rails
├── app/
│   ├── controllers/
│   │   └── admin/                   # Только admin контроллеры
│   ├── views/
│   │   ├── admin/                   # Только admin views
│   │   └── layouts/admin.html.erb
│   └── models/                      # Read-only доступ к Supabase
├── config/
│   ├── routes.rb                    # Только /admin/* routes
│   └── database.yml                 # Supabase connection
└── Gemfile                          # Минимальный набор gems
```

---

## 📅 План миграции по этапам

### Этап 0: Подготовка (1 день)

- [ ] Создать новый репозиторий `obrazz-api` для Node.js backend
- [ ] Настроить TypeScript, ESLint, Prettier
- [ ] Создать базовую структуру Hono приложения
- [ ] Настроить Supabase client
- [ ] Настроить деплой на Render (Docker)

### Этап 1: Core API (3-4 дня)

#### 1.1 Auth Middleware

```typescript
// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { createClient } from '@supabase/supabase-js';
import { verify } from 'jsonwebtoken';

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = verify(token, process.env.SUPABASE_JWT_SECRET!);
    const supabaseId = (payload as any).sub;

    // Get or create user
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_id', supabaseId)
      .single();

    if (!user) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          supabase_id: supabaseId,
          email: (payload as any).email,
          status: 'active',
        })
        .select()
        .single();
      user = newUser;
    }

    c.set('user', user);
    c.set('supabase', supabase);

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
```

#### 1.2 Tokens Service

```typescript
// src/services/tokens/balance.service.ts
import { SupabaseClient } from '@supabase/supabase-js';

interface User {
  id: string;
  supabase_id: string;
}

export class TokenBalanceService {
  constructor(
    private supabase: SupabaseClient,
    private user: User,
  ) {}

  async getAvailableBalance(): Promise<number> {
    const { data } = await this.supabase
      .from('token_balances')
      .select('balance')
      .eq('user_id', this.user.id)
      .gt('balance', 0);

    return data?.reduce((sum, b) => sum + b.balance, 0) ?? 0;
  }

  async debitForGeneration(amount: number, generationId: string): Promise<void> {
    // Порядок списания: subscription -> purchased -> bonus
    const tokenTypes = ['subscription_tokens', 'purchased_tokens', 'bonus_tokens'];
    let remaining = amount;

    for (const tokenType of tokenTypes) {
      if (remaining <= 0) break;

      const { data: balance } = await this.supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', this.user.id)
        .eq('token_type', tokenType)
        .gt('balance', 0)
        .single();

      if (balance) {
        const deductAmount = Math.min(remaining, balance.balance);

        // Update balance
        await this.supabase
          .from('token_balances')
          .update({ balance: balance.balance - deductAmount })
          .eq('id', balance.id);

        // Create transaction
        await this.supabase.from('token_transactions').insert({
          user_id: this.user.id,
          token_balance_id: balance.id,
          operation: 'debit',
          amount: -deductAmount,
          balance_before: balance.balance,
          balance_after: balance.balance - deductAmount,
          reason: 'ai_generation',
          ai_generation_id: generationId,
        });

        remaining -= deductAmount;
      }
    }

    if (remaining > 0) {
      throw new Error('Insufficient tokens');
    }
  }
}
```

#### 1.3 AI Generation Service (FASHN)

```typescript
// src/services/ai/fashn.service.ts
import FashnAI from 'fashn';

const fashn = new FashnAI({
  apiKey: process.env.FASHN_API_KEY!,
});

export interface TryOnParams {
  personImage: string;
  garmentImage: string;
  category?: 'tops' | 'bottoms' | 'one-pieces';
}

export class FashnService {
  async createVirtualTryOn(params: TryOnParams) {
    const result = await fashn.run({
      model_image: params.personImage,
      garment_image: params.garmentImage,
      category: params.category || 'tops',
    });

    return {
      taskId: result.id,
      status: result.status,
      outputUrl: result.output?.[0],
    };
  }

  async getTaskStatus(taskId: string) {
    const result = await fashn.getPrediction(taskId);

    return {
      status: result.status,
      outputUrl: result.output?.[0],
      error: result.error,
    };
  }
}
```

#### 1.4 AI Routes

```typescript
// src/routes/ai.routes.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { FashnService } from '../services/ai/fashn.service';
import { TokenBalanceService } from '../services/tokens/balance.service';

const ai = new Hono();

ai.use('/*', authMiddleware);

ai.post('/virtual-try-on', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const tokenService = new TokenBalanceService(supabase, user);
  const balance = await tokenService.getAvailableBalance();

  const COST = 1; // 1 token per generation

  if (balance < COST) {
    return c.json(
      {
        error: 'Insufficient tokens',
        required: COST,
        available: balance,
      },
      402,
    );
  }

  // Create generation record
  const { data: generation } = await supabase
    .from('ai_generations')
    .insert({
      user_id: user.id,
      generation_type: 'virtual_try_on',
      status: 'pending',
      tokens_cost: COST,
      input_params: body,
      input_image_urls: [body.personImage, body.garmentImage],
    })
    .select()
    .single();

  // Debit tokens
  await tokenService.debitForGeneration(COST, generation.id);

  // Call FASHN AI
  try {
    const fashnService = new FashnService();
    const result = await fashnService.createVirtualTryOn({
      personImage: body.personImage,
      garmentImage: body.garmentImage,
      category: body.category,
    });

    // Update generation with external ID
    await supabase
      .from('ai_generations')
      .update({
        external_id: result.taskId,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', generation.id);

    return c.json({
      id: generation.id,
      status: 'processing',
      externalId: result.taskId,
    });
  } catch (error) {
    await supabase
      .from('ai_generations')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', generation.id);

    return c.json({ error: 'Generation failed' }, 500);
  }
});

ai.get('/generations/:id/status', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const id = c.req.param('id');

  const { data: generation } = await supabase
    .from('ai_generations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!generation) {
    return c.json({ error: 'Not found' }, 404);
  }

  // If still processing, check FASHN status
  if (generation.status === 'processing' && generation.external_id) {
    const fashnService = new FashnService();
    const status = await fashnService.getTaskStatus(generation.external_id);

    if (status.status === 'succeeded') {
      await supabase
        .from('ai_generations')
        .update({
          status: 'completed',
          output_image_urls: [status.outputUrl],
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      generation.status = 'completed';
      generation.output_image_urls = [status.outputUrl];
    } else if (status.status === 'failed') {
      await supabase
        .from('ai_generations')
        .update({
          status: 'failed',
          error_message: status.error,
        })
        .eq('id', id);

      generation.status = 'failed';
    }
  }

  return c.json(generation);
});

export default ai;
```

### Этап 2: Payments & Webhooks (2 дня)

#### 2.1 YooKassa Service

```typescript
// src/services/payments/yookassa.service.ts
import crypto from 'crypto';

interface CreatePaymentParams {
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export class YookassaService {
  private shopId: string;
  private secretKey: string;
  private apiBase = 'https://api.yookassa.ru';

  constructor() {
    this.shopId = process.env.YOOKASSA_SHOP_ID!;
    this.secretKey = process.env.YOOKASSA_SECRET_KEY!;
  }

  async createPayment(params: CreatePaymentParams) {
    const idempotenceKey = crypto.randomUUID();

    const response = await fetch(`${this.apiBase}/v3/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: {
          value: params.amount.toFixed(2),
          currency: params.currency || 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: params.returnUrl,
        },
        description: params.description,
        metadata: params.metadata || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || 'YooKassa error');
    }

    return {
      paymentId: data.id,
      confirmationUrl: data.confirmation?.confirmation_url,
      status: data.status,
    };
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
```

#### 2.2 Webhook Routes

```typescript
// src/routes/webhooks.routes.ts
import { Hono } from 'hono';
import { YookassaService } from '../services/payments/yookassa.service';
import { createClient } from '@supabase/supabase-js';

const webhooks = new Hono();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

webhooks.post('/yookassa', async (c) => {
  const rawBody = await c.req.text();
  const body = JSON.parse(rawBody);

  // Store webhook event
  await supabase.from('webhook_events').insert({
    source: 'yookassa',
    external_id: body.object?.id || body.event,
    event_type: body.event,
    payload: body,
    status: 'pending',
  });

  if (body.event === 'payment.succeeded') {
    const payment = body.object;

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        external_status: payment.status,
        paid_at: new Date().toISOString(),
      })
      .eq('external_id', payment.id);

    // Credit tokens if token_pack purchase
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('*, user_id')
      .eq('external_id', payment.id)
      .single();

    if (paymentRecord?.payment_type === 'token_pack') {
      const { data: balance } = await supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', paymentRecord.user_id)
        .eq('token_type', 'purchased_tokens')
        .single();

      if (balance) {
        await supabase
          .from('token_balances')
          .update({ balance: balance.balance + paymentRecord.tokens_amount })
          .eq('id', balance.id);
      } else {
        await supabase.from('token_balances').insert({
          user_id: paymentRecord.user_id,
          token_type: 'purchased_tokens',
          balance: paymentRecord.tokens_amount,
          source: 'purchase',
        });
      }
    }
  }

  return c.json({ success: true });
});

export default webhooks;
```

### Этап 3: Dashboard Frontend (4-5 дней)

#### 3.1 Dashboard Layout

```tsx
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Sidebar user={user} />
      <main className="lg:pl-72">
        <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
```

#### 3.2 Dashboard Home Page

```tsx
// app/(dashboard)/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentGenerations } from '@/components/dashboard/RecentGenerations';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_id', user!.id)
    .single();

  // Get token balance
  const { data: balances } = await supabase
    .from('token_balances')
    .select('balance')
    .eq('user_id', userData.id);

  const totalTokens = balances?.reduce((sum, b) => sum + b.balance, 0) ?? 0;

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userData.id)
    .single();

  // Get recent generations
  const { data: generations } = await supabase
    .from('ai_generations')
    .select('*')
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false })
    .limit(6);

  // Get stats
  const { count: totalGenerations } = await supabase
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.id);

  const { count: successfulGenerations } = await supabase
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.id)
    .eq('status', 'completed');

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">
            Добро пожаловать, {userData.full_name || 'пользователь'}!
          </h1>
          <p className="mt-1 text-sm text-[#666666]">Ваш AI-стилист готов к работе</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Баланс токенов"
          value={totalTokens}
          icon="coins"
          link={{ href: '/dashboard/tokens', label: 'Пополнить' }}
        />
        <StatsCard
          title="Подписка"
          value={subscription?.plan === 'pro_monthly' ? 'Pro' : 'Free'}
          icon="badge"
          variant={subscription?.plan?.includes('pro') ? 'success' : 'default'}
          link={{
            href: '/dashboard/subscription',
            label: subscription?.plan?.includes('pro') ? 'Управление' : 'Улучшить',
          }}
        />
        <StatsCard
          title="Всего генераций"
          value={totalGenerations || 0}
          icon="sparkles"
          subtitle={`${successfulGenerations || 0} успешных`}
        />
        <StatsCard title="В этом месяце" value={0} icon="calendar" />
      </div>

      {/* Recent Generations */}
      <RecentGenerations generations={generations || []} />
    </div>
  );
}
```

#### 3.3 Sidebar Component

```tsx
// components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon },
  { name: 'AI-генерации', href: '/dashboard/generations', icon: SparklesIcon },
  { name: 'Токены', href: '/dashboard/tokens', icon: CurrencyDollarIcon },
  { name: 'Подписка', href: '/dashboard/subscription', icon: CreditCardIcon },
  { name: 'Настройки', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#1A1A2E] px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-white/10">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <span className="text-white text-2xl font-bold tracking-[3px]">OBRAZZ</span>
          </Link>
          <Link
            href="/"
            className="ml-auto text-xs text-white/50 hover:text-white transition-colors"
          >
            ← На сайт
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                        pathname === item.href
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10',
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* User info */}
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold text-white">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className="truncate">{user.email}</span>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
```

### Этап 4: Миграция Auth Pages (1-2 дня)

#### 4.1 Login Page

```tsx
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-[3px] text-[#1A1A2E]">OBRAZZ</h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-[#1A1A2E]">Вход в аккаунт</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-2xl sm:px-10 border border-[#E5E5E5]">
          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors"
            >
              <GoogleIcon className="h-5 w-5" />
              Войти через Google
            </button>
            <button
              onClick={() => handleOAuthLogin('apple')}
              className="w-full flex items-center justify-center gap-3 rounded-full bg-[#1A1A2E] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <AppleIcon className="h-5 w-5" />
              Войти через Apple
            </button>
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E5]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#999999]">или</span>
            </div>
          </div>

          {/* Email form */}
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A2E]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-3 text-[#1A1A2E] placeholder-[#999999] focus:border-[#1A1A2E] focus:outline-none focus:ring-1 focus:ring-[#1A1A2E]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A2E]">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-3 text-[#1A1A2E] placeholder-[#999999] focus:border-[#1A1A2E] focus:outline-none focus:ring-1 focus:ring-[#1A1A2E]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1A1A2E] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#666666]">
            Нет аккаунта?{' '}
            <Link href="/signup" className="font-semibold text-[#1A1A2E] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Этап 5: Rails Admin Isolation (1 день)

- [ ] Создать отдельный репозиторий `obrazz-admin`
- [ ] Удалить все non-admin код
- [ ] Настроить read-only подключение к Supabase
- [ ] Деплой на отдельный Render аккаунт

### Этап 6: Тестирование и деплой (2 дня)

- [ ] E2E тестирование всех flows
- [ ] Load testing
- [ ] Настройка мониторинга
- [ ] Финальный деплой
- [ ] Миграция DNS (если нужно)

---

## 📊 Free Tier лимиты и ограничения

### Vercel Hobby

| Ресурс           | Лимит                | Использование               |
| ---------------- | -------------------- | --------------------------- |
| Functions        | 1M invocations/month | Dashboard pages + API proxy |
| Bandwidth        | 100 GB/month         | Static + SSR                |
| Build minutes    | 6000/month           | CI/CD                       |
| Function timeout | 300s                 | Достаточно                  |

### Render Free

| Ресурс       | Лимит           | Использование         |
| ------------ | --------------- | --------------------- |
| Web Services | 750 hours/month | ~31 дня (достаточно)  |
| Memory       | 512 MB          | Hono ~50MB            |
| Sleep        | После 15 мин    | Cold start ~100-200ms |

### Supabase Free

| Ресурс         | Лимит          | Использование        |
| -------------- | -------------- | -------------------- |
| Database       | 500 MB         | Текущий размер ~50MB |
| Storage        | 1 GB           | AI outputs           |
| Auth MAU       | 50,000         | Более чем достаточно |
| Edge Functions | 500K/month     | НЕ используем        |
| Pausing        | После 1 недели | Ping job на Vercel   |

---

## ⚠️ Риски и митигация

| Риск                       | Вероятность | Влияние     | Митигация                             |
| -------------------------- | ----------- | ----------- | ------------------------------------- |
| Render sleep замедляет UX  | Высокая     | Средняя     | Keepalive ping каждые 10 мин          |
| Supabase pause             | Средняя     | Высокая     | Vercel cron job пингует каждые 5 дней |
| FASHN API downtime         | Низкая      | Высокая     | Graceful degradation, retry логика    |
| Превышение free tier       | Низкая      | Средняя     | Мониторинг usage, alerts              |
| Потеря данных при миграции | Низкая      | Критическая | Backup БД перед миграцией             |

---

## ⏱️ Оценка трудозатрат

| Этап       | Задачи                      | Оценка         |
| ---------- | --------------------------- | -------------- |
| **Этап 0** | Подготовка                  | 1 день         |
| **Этап 1** | Core API (auth, tokens, AI) | 3-4 дня        |
| **Этап 2** | Payments & Webhooks         | 2 дня          |
| **Этап 3** | Dashboard Frontend          | 4-5 дней       |
| **Этап 4** | Auth Pages                  | 1-2 дня        |
| **Этап 5** | Rails Admin Isolation       | 1 день         |
| **Этап 6** | Testing & Deploy            | 2 дня          |
| **Буфер**  | Непредвиденное              | 2 дня          |
| **ИТОГО**  |                             | **16-19 дней** |

---

## 📁 Итоговая структура репозиториев

```
GitHub:
├── obrazz/                          # Mobile App (React Native)
├── obrazz-landing/                  # Landing + Dashboard (Next.js) → Vercel
├── obrazz-api/                      # Backend API (Node.js/Hono) → Render
└── obrazz-admin/                    # Admin Panel (Rails) → Render (отдельный аккаунт)
```

---

## ✅ Checklist миграции

### Подготовка

- [ ] Backup Supabase БД
- [ ] Документировать все env variables
- [ ] Создать репозитории

### Node.js Backend

- [ ] Базовая структура Hono
- [ ] Auth middleware
- [ ] Token service
- [ ] AI service (FASHN)
- [ ] Payment service (YooKassa)
- [ ] Webhook handlers
- [ ] User routes
- [ ] Dockerfile + render.yaml
- [ ] Deploy на Render

### Next.js Dashboard

- [ ] Dashboard layout
- [ ] Home page
- [ ] Generations page
- [ ] Tokens page
- [ ] Subscription page
- [ ] Settings page
- [ ] Login/Signup pages
- [ ] API proxy routes
- [ ] Deploy на Vercel

### Rails Admin

- [ ] Изолировать admin код
- [ ] Настроить отдельный деплой
- [ ] Тестирование

### Финализация

- [ ] E2E тестирование
- [ ] DNS переключение
- [ ] Мониторинг
- [ ] Документация

---

## 📚 Приложения

### A. Environment Variables

#### Node.js Backend (.env)

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# FASHN AI
FASHN_API_KEY=fashn_xxx

# YooKassa
YOOKASSA_SHOP_ID=xxx
YOOKASSA_SECRET_KEY=xxx

# App
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://obrazz.app,https://www.obrazz.app
```

#### Next.js Dashboard (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API
NEXT_PUBLIC_API_URL=https://api.obrazz.app

# App
NEXT_PUBLIC_APP_URL=https://obrazz.app
```

### B. Render Configuration (render.yaml)

```yaml
services:
  - type: web
    name: obrazz-api
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: FASHN_API_KEY
        sync: false
      - key: YOOKASSA_SHOP_ID
        sync: false
      - key: YOOKASSA_SECRET_KEY
        sync: false
```

### C. Dockerfile для Node.js

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

**Дата создания:** 30 января 2026  
**Последнее обновление:** 30 января 2026  
**Версия документа:** 1.0.0
