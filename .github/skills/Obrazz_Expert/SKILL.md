---
name: Obrazz Expert
description: Глубокое знание кодовой базы Obrazz — React Native + Expo мобильное приложение для управления гардеробом с AI-стилистом + Rails backend (API, админка, биллинг). Используй для любых задач разработки в проекте.
---

# Obrazz Expert Skill

Образ — мобильное приложение для персонального гардероба с функциями AI-стилиста. Включает React Native приложение (Expo SDK 55) и Rails 8 backend для API, личного кабинета и админки.

## When to Use This Skill

- Разработка новых функций в мобильном приложении
- Исправление багов в React Native/Rails коде
- Добавление API endpoints в Rails backend
- Интеграция платежей (YooKassa, IAP)
- Работа с AI-генерациями (The New Black API)
- Управление токенами и подписками
- Настройка offline-first синхронизации
- Работа с Zustand stores и persistence

## Quick Reference Resources

### Architecture

📁 **[resources/architecture.md](resources/architecture.md)** — Паттерны кода, структура сервисов, Zustand stores

### Database

📁 **[resources/database.md](resources/database.md)** — Полная схема БД, enums, relationships

### Routes

📁 **[resources/routes.md](resources/routes.md)** — Все API endpoints, Dashboard, Admin routes

### AI & Tokens

📁 **[resources/ai_tokens.md](resources/ai_tokens.md)** — AI генерации, токеновая система, биллинг

## Key Constants

```typescript
// React Native Categories (8 unified)
const CATEGORIES = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'bags',
  'accessories',
  'other',
];

// Canvas transforms
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
```

```ruby
# Rails - Subscription Plans
PLANS = %w[free pro_monthly pro_yearly]
PLAN_TOKENS = { "free" => 0, "pro_monthly" => 100, "pro_yearly" => 100 }

# AI Generation Types
GENERATION_TYPES = %w[virtual_try_on fashion_model variation]
TOKEN_COSTS = { "virtual_try_on" => 1, "fashion_model" => 1, "variation" => 1 }
```

## Common Tasks

### Add new screen (React Native)

1. Create file in `app/` directory (Expo Router)
2. Add types in `types/models/` if needed
3. Create components in `components/`
4. Add store actions if needed

### Add new API endpoint (Rails)

1. Add route in `config/routes.rb`
2. Create controller in `app/controllers/api/v1/`
3. Inherit from `Api::V1::BaseController`
4. Use `render_success()` / `render_error()`

### Add Zustand store

```typescript
// store/feature/featureStore.ts
export const useFeatureStore = create<State>()(
  persist(
    (set) => ({
      data: [],
      fetch: async () => {
        /* ... */
      },
    }),
    { name: 'feature-store', storage: zustandStorage },
  ),
);
```

## File Locations

| Purpose           | Location                        |
| ----------------- | ------------------------------- |
| Screens           | `obrazz/app/`                   |
| Components        | `obrazz/components/`            |
| Services          | `obrazz/services/`              |
| Stores            | `obrazz/store/`                 |
| Types             | `obrazz/types/`                 |
| Rails Controllers | `obrazz-rails/app/controllers/` |
| Rails Models      | `obrazz-rails/app/models/`      |
| Rails Services    | `obrazz-rails/app/services/`    |
| Documentation     | `obrazz/Docs/`                  |

## Environment Variables

### React Native

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PIXIAN_API_ID=
EXPO_PUBLIC_PIXIAN_API_SECRET=
EXPO_PUBLIC_RAILS_API_URL=
```

### Rails

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_JWT_SECRET=
THE_NEW_BLACK_API_KEY=
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
```

## Testing Commands

```bash
# React Native
npm test                    # Jest tests
npm run type-check          # TypeScript check

# Rails
bundle exec rspec           # RSpec tests
bin/rubocop                 # RuboCop linting
bin/brakeman --no-pager     # Security scan
```

## Development Commands

```bash
# React Native
npm start                   # Expo dev server
npm run ios                 # iOS simulator
npm run android             # Android emulator
npm run lint:fix            # Fix ESLint

# Rails
bin/dev                     # Start all processes
bin/rails console           # Rails console
bin/rails db:migrate        # Run migrations
```

## Debugging Tips

- **Auth issues:** Check `authStore.ts` + `supabase/client.ts` SafeStorage
- **Outfit not saving:** Verify `canvasSettings` in `outfitService.createOutfit()`
- **Custom tabs not loading:** Check `itemSelectionStepNew.tsx` AsyncStorage conditional
- **Gestures not working:** Ensure `react-native-gesture-handler` imported at root
- **Rails JWT errors:** Check `SUPABASE_JWT_SECRET` env var
- **Payment webhooks:** Check `webhook_events` table for errors
