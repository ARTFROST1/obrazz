# 🚀 Obrazz — Roadmap & Next Steps

> **Дата обновления:** 8 февраля 2026  
> **Автор:** AI Assistant (анализ документации и кода)  
> **Статус:** Stage 4.13 завершён (Navigation Refactor + OAuth + Expo SDK 55 migration). Следующий этап: Stage 5 (AI Features + Backend Integration).

---

## 🆕 Бэкенд экосистема

> **Актуально:** Монолитный Rails backend (`obrazz-rails`) архивирован и заменён на два отдельных сервиса:

| Сервис          | Стек                        | Назначение                                                         |
| --------------- | --------------------------- | ------------------------------------------------------------------ |
| `obrazz-api/`   | Node.js + Hono + TypeScript | API для мобильного: AI (FASHN AI proxy), токены, платежи, подписки |
| `obrazz-admin/` | Rails 8.0.4                 | Админ-панель: аналитика, модерация, управление пользователями      |

> ℹ️ Документ [RAILS_BACKEND_IMPLEMENTATION_PLAN.md](./RAILS_BACKEND_IMPLEMENTATION_PLAN.md) описывает **архивированный** Rails-монолит. Актуальная архитектура — см. obrazz-api/ и obrazz-admin/.

---

## 📊 Executive Summary

Obrazz находится на ключевом этапе развития. **Базовый функционал полностью реализован** (Stage 1-4.12):

- ✅ Авторизация и профиль (Supabase Auth)
- ✅ Гардероб с добавлением вещей, удалением фона (Pixian.ai), фильтрацией
- ✅ Создание образов вручную (2-step flow, canvas, gestures, undo/redo)
- ✅ Shopping Browser (Web Capture) — добавление вещей из интернет-магазинов
- ✅ Offline-first архитектура — локальное хранение, очередь синхронизации

**🎯 Текущий приоритет:** Stage 5 — AI-функции (через obrazz-api → FASHN AI)

**Ближайшие этапы:**

1. ✅ **Stage 4.13: Navigation Refactor** — объединение Гардероба и Образов, кнопка "+" (завершено)
2. **Stage 5: AI-функции** — интеграция FASHN AI (api.fashn.ai/v1)
3. **Stage 6: Backend Integration** — подписки, токены, AI proxy (через obrazz-api)
4. **Stage 7: Платежи** — IAP + YooKassa

---

## 📋 Оглавление

1. [Что уже сделано](#что-уже-сделано-stage-1-412)
2. [Что ещё не сделано](#что-ещё-не-сделано)
3. [Ближайшие шаги](#ближайшие-шаги-что-делаем-сейчас)
4. [Navigation Refactor (Stage 4.13)](#navigation-refactor-stage-413)
5. [AI-функции и примерка](#ai-функции-и-примерка-образов)
6. [Анализ Backend стека](#анализ-backend-стека)
7. [Нативные функции iOS](#нативные-функции-ios)
8. [Платежная система](#платежная-система)
9. [Хранение данных и политика](#хранение-данных-и-политика)
10. [Детальный Roadmap по стадиям](#детальный-roadmap-по-стадиям)

---

## ✅ Что уже сделано (Stage 1-4.13)

### Stage 1: Foundation & Setup ✅

- Expo SDK 55 (preview) + React Native 0.83.1 + TypeScript
- Supabase проект (PostgreSQL + Auth + Storage)
- Структура папок, алиасы путей (@components, @services, @store)
- ESLint, Prettier, Husky pre-commit hooks
- Zustand stores с persistence, TanStack Query

### Stage 2: Authentication ✅

- Email регистрация/вход через Supabase Auth
- **Google OAuth** + **Apple Sign In** (native на iOS)
- JWT токены с auto-refresh
- Protected routes (isAuthenticated check)
- Экран профиля с logout

### Stage 3: Wardrobe Management ✅

- Добавление вещей из камеры/галереи
- ImageCropper с кастомной обрезкой 3:4
- Удаление фона через Pixian.ai API + **Apple Vision (iOS 16+)**
- Категории, цвета, стили, сезоны
- Фильтрация и сортировка
- Default Items (24 встроенных вещи для новых пользователей)
- Локальное хранение изображений (expo-file-system)

### Stage 4: Outfit Creator ✅

- 2-step flow: выбор вещей → композиция на canvas
- 4-Tab система (Basic, Dress, All, Custom)
- SmoothCarousel с реалистичной физикой
- Drag & drop, масштабирование, поворот (gesture-handler + reanimated)
- Undo/Redo функционал
- Сохранение/редактирование образов
- canvasSettings для восстановления позиций при edit mode

### Stage 4.7-4.10: Shopping Browser ✅

- Встроенный браузер для интернет-магазинов
- Shopping Stories карусель на главной
- Автодетект изображений одежды на сайте
- Один тап для добавления в гардероб

### Stage 4.12: Offline-First Architecture ✅

- Мгновенная загрузка из локального кеша
- CRUD без интернета
- Очередь операций (sync queue)
- Фоновая синхронизация
- Optimistic UI

### Stage 4.13: Navigation Refactor ✅

- 3-tab bottom navigation + floating "+" button
- Unified Library screen (Wardrobe + Outfits)
- Native iOS Liquid Glass segment control
- Context-sensitive "+" button behavior
- Theme transition animation (light ↔ dark)

---

## ❌ Что ещё не сделано

### Высокий приоритет (Core для MVP/релиза):

| Функция                      | Статус         | Зависимости  |
| ---------------------------- | -------------- | ------------ |
| **Navigation Refactor**      | ✅ Завершён    | —            |
| **Backend API (obrazz-api)** | ✅ Реализовано | Nav Refactor |
| **AI Virtual Try-On**        | 📋 Не начато   | Backend      |
| **AI Fashion Models**        | 📋 Не начато   | Backend      |
| **Система токенов**          | 📋 Не начато   | Backend      |
| **Подписки (IAP)**           | 📋 Не начато   | Backend      |
| **Веб-биллинг (YooMoney)**   | 📋 Не начато   | Backend      |
| **Onboarding**               | 📋 Не начато   | —            |
| **Paywall**                  | 📋 Не начато   | Подписки     |

### Средний приоритет (Should-have):

| Функция                             | Статус             | Зависимости       |
| ----------------------------------- | ------------------ | ----------------- |
| **Push-уведомления**                | 📋 Не начато       | Backend           |
| **Apple Vision (удаление фона)**    | 📋 Документировано | Development build |
| **Контекстные меню iOS (UIMenu)**   | 📋 Документировано | Development build |
| **Геймификация (streak)**           | 📋 Не начато       | Backend           |
| **Экспорт образов как изображения** | 📋 Отложено        | —                 |

### Низкий приоритет (Nice-to-have):

| Функция                          | Статус              |
| -------------------------------- | ------------------- |
| Реклама (VK Ads, РСЯ, AdMob)     | 📋 Планируется      |
| Расширенная локализация          | 📋 Структура готова |
| Синхронизация между устройствами | 📋 Планируется      |
| Clothing Variations (AI)         | 📋 Планируется      |

---

## 🎯 Ближайшие шаги (что делаем сейчас)

### 🎯 Этап C: Navigation Refactor (Stage 4.13) — ✅ ЗАВЕРШЕН

**Статус:** ✅ **ЗАВЕРШЕН**  
**Timeline:** завершено (январь 2026)  
**Документация:** [NAVIGATION_REFACTOR_PLAN.md](./Features/NAVIGATION_REFACTOR_PLAN.md)

**Цель:** Глобальный рефакторинг навигации приложения

#### Что будет сделано:

**1. Bottom Navigation: 4 → 3 вкладки + кнопка "+"**

```
БЫЛО:                          СТАНЕТ:
┌──────────────────────────┐   ┌──────────────────────┬──────┐
│ Home │ Ward │ Out │ Prof │   │ Home │ Library │ Prof │   +  │
└──────────────────────────┘   └──────────────────────┴──────┘
```

**2. Library Screen (объединённый):**

- Верхние вкладки: **Гардероб** (светлая) ↔ **Образы** (тёмная)
- Плавная анимация смены темы при переключении (300ms)
- Общий header с поиском и меню

**3. Контекстная кнопка "+":**

| Экран              | Действие                              |
| ------------------ | ------------------------------------- |
| Home               | Раскрывает меню AI-функций (4 опции)  |
| Library / Гардероб | Открывает добавление вещи             |
| Library / Образы   | Открывает создание образа             |
| Profile            | Открывает настройки (иконка меняется) |

**5. Скрытие TabBar на Add экране:**

- Add screen открывается без видимого TabBar.
- iOS: нативный `NativeTabs hidden` (Expo SDK 55)
- Android: `tabBarStyle` → `{ display: 'none' }`

**4. AI-функции на Home (placeholder):**

При нажатии "+" на Home раскрывается меню:

- 👗 Virtual Try-On — примерить вещь на фото
- 🧍 AI Fashion Model — модель в вещах
- 🎨 Clothing Variations — вариации дизайна
- ✏️ Edit Photo — изменить одежду

#### Этапы реализации:

- [x] **Этап C.1:** Подготовка инфраструктуры
- [x] **Этап C.2:** Bottom Navigation с "+"
- [x] **Этап C.3:** Library Screen с вкладками
- [x] **Этап C.4:** Контекстное поведение "+"
- [x] **Этап C.5:** Полировка и тестирование

---

### Этап A: Development Build для iOS (1-2 дня) ✅

**Статус:** ✅ **ЗАВЕРШЕН** (26 января 2026)

**Что было сделано:**

- ✅ Создан development build (`npx expo prebuild -p ios`)
- ✅ Разблокированы нативные модули

**Документация:** [iOS_OnDevice_Background_Removal.md](./Features/iOS_OnDevice_Background_Removal.md)

---

### Этап B: Apple Vision Background Removal (3-5 дней) ✅

**Статус:** ✅ **ЗАВЕРШЕН** (26 января 2026)

**Что было сделано:**

- ✅ Создан Expo Native Module `subject-lifter`
- ✅ Реализован Swift код для Apple Vision (Vision.framework) (SubjectLifterModule + SubjectLifterService)
- ✅ Интегрирован в `backgroundRemoverService` с автоматическим fallback
- ✅ Обновлен UI в `add-item.tsx` с индикацией метода
- ✅ Настроен `app.config.js` (iOS deployment target 16.0)

**Преимущества:**

- ⚡ Скорость: 0.5-2 сек (было 2-10 сек)
- 🆓 Бесплатно для iOS 16+ (экономия ~$0.02 за запрос)
- 📱 Работает офлайн
- 🔄 Автоматический fallback на Pixian для Android/старых iOS

**Зачем:**

- Pixian.ai работает нестабильно в РФ (возможны блокировки) ✅ Решено
- Apple Vision — бесплатно и работает офлайн ✅ Реализовано
- Скорость: 0.5-2 сек локально vs 2-10 сек через API ✅ Достигнуто

**Документация:**

- [iOS On-Device Background Removal](./Features/iOS_OnDevice_Background_Removal.md) - Актуальная инструкция и ограничения (включая Simulator)
- [Module README](../modules/subject-lifter/README.md) - Документация модуля

**Структура нативного модуля (реализовано):**

```
modules/
└── subject-lifter/
    ├── ios/
    │   ├── SubjectLifterModule.swift      # Expo module definition
    │   ├── SubjectLifterService.swift     # Apple Vision (Vision.framework) logic
    │   └── ImageUtils.swift               # Image helpers
    ├── android/
    │   └── (placeholder — пока используем Pixian)
    ├── src/
    │   └── index.ts                       # JS interface
    └── expo-module.config.json
```

**Использование в коде:**

```typescript
// services/wardrobe/backgroundRemover.ts
import { SubjectLifter } from 'subject-lifter';

async removeBackground(imageUri: string): Promise<string> {
  if (Platform.OS === 'ios' && (await SubjectLifter.isAvailable())) {
    // Бесплатно, офлайн, быстро
    return await SubjectLifter.liftSubject(imageUri);
  }

  // Fallback на Pixian.ai для Android и старых iOS
  return await this.removeBackgroundViaPixian(imageUri);
}
```

---

### Этап C: Backend API (реализовано)

> ✅ **Реализовано в obrazz-api/** (Node.js + Hono + TypeScript)

**Почему Hono (Node.js):**

- Единый язык с мобильным приложением (TypeScript)
- Меньше памяти, быстрый cold start на Render free tier
- Hono — лёгкий фреймворк с отличной производительностью
- JWT верификация через jsonwebtoken

**MVP Backend (реализован):**

```typescript
// obrazz-api структура
src / routes / ai.routes.ts; // AI генерации (proxy к FASHN AI)
tokens.routes.ts; // Баланс и история токенов
payments.routes.ts; // YooKassa платежи
subscriptions.routes.ts; // Подписки
users.routes.ts; // Профиль пользователя
webhooks.routes.ts; // YooKassa + FASHN AI коллбэки
services / ai / fashn.service.ts; // HTTP клиент к FASHN AI
ai / generation.service.ts; // Оркестрация AI-генераций
tokens / balance.service.ts; // Check/spend токены
payments / yookassa.service.ts; // YooKassa интеграция
```

---

## 🔧 Анализ Backend стека

### Текущий план: Ruby on Rails 7.x

**Преимущества:**

- ✅ Быстрая разработка fullstack (API + Dashboard)
- ✅ Hotwire/Turbo — современный frontend без SPA
- ✅ Отличные gems для платежей (pay, stripe, yookassa)
- ✅ Solid Queue для background jobs (Sidekiq опционально)
- ✅ Admin panel: custom Rails views (Administrate/ActiveAdmin опционально)
- ✅ Проверенный стек для SaaS

**Недостатки:**

- ⚠️ Ruby разработчики менее распространены
- ⚠️ Потребление памяти выше чем у Node.js
- ⚠️ На free tier Render может быть медленным

### Альтернатива 1: Node.js (Express/Fastify/NestJS)

**Преимущества:**

- ✅ Единый язык с frontend (TypeScript)
- ✅ Меньше памяти, быстрее cold start
- ✅ Огромная экосистема npm
- ✅ Хорошо для serverless

**Недостатки:**

- ⚠️ Нет "rails-like" convention over configuration
- ⚠️ Платёжные библиотеки менее зрелые
- ⚠️ Больше boilerplate для типичных задач

### Альтернатива 2: Python (FastAPI/Django)

**Преимущества:**

- ✅ Отлично для AI/ML интеграций
- ✅ FastAPI — современный async API
- ✅ Django — полноценный fullstack

**Недостатки:**

- ⚠️ Django медленнее Rails в разработке для SaaS
- ⚠️ FastAPI требует больше настройки для dashboard

### Альтернатива 3: Supabase Edge Functions (Deno)

**Преимущества:**

- ✅ Уже используем Supabase
- ✅ Serverless, платишь за использование
- ✅ Быстрый деплой

**Недостатки:**

- ⚠️ Ограниченный runtime (Deno)
- ⚠️ Сложнее для background jobs
- ⚠️ Нет dashboard из коробки

---

### 🏆 Рекомендация по Backend

> ✅ **Решение принято:** Разделение на два сервиса:

1. **obrazz-api** (Node.js + Hono) — API для мобильного приложения (AI, токены, платежи)
2. **obrazz-admin** (Rails 8) — Админ-панель (аналитика, модерация)
3. **AI интеграция** — HTTP запросы к FASHN AI (api.fashn.ai/v1), obrazz-api выступает proxy

**Хостинг:** Render Frankfurt (Docker, free tier для старта).

**Хостинг:**

| Платформа       | Free Tier                | Рекомендация          |
| --------------- | ------------------------ | --------------------- |
| **Render**      | 750 часов/мес, spin-down | ✅ Отлично для старта |
| **Railway**     | $5 credit/мес            | ✅ Простой деплой     |
| **Fly.io**      | 3 shared VMs             | ✅ Edge deployment    |
| **Heroku**      | Нет free tier            | ⚠️ Дорого для MVP     |
| **VPS + Kamal** | ~$5/мес (Hetzner)        | ✅ Полный контроль    |

**Решение:** Начать с **Render free tier**, позже мигрировать на VPS + Kamal для production.

---

## 🤖 AI-функции и примерка образов

### Архитектура AI Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AI GENERATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Mobile App                                                             │
│  ──────────                                                             │
│  1. User uploads photo + selects outfit/item                           │
│  2. POST /api/v1/ai/virtual_tryon { model_photo, clothing_photo }      │
│  3. Receive { generationId, status: "processing" }                     │
│  4. Poll GET /api/v1/ai/generations/:id until completed                │
│  5. Display resultUrl                                                   │
│                                                                         │
│  obrazz-api (Node.js + Hono)                                           │
│  ───────────────────────────                                           │
│  1. Validate JWT (Supabase Auth)                                       │
│  2. Check token balance (can_generate?)                                │
│  3. Debit tokens                                                       │
│  4. Call FASHN AI (api.fashn.ai/v1/run)                                │
│  5. Save result to Supabase Storage                                    │
│  6. Return generation status                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### UI/UX для AI-примерки

**Экран "AI Try-On" (примерка на фото):**

```
┌─────────────────────────────────────────┐
│  ← AI Try-On                      ⓘ    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │      [Tap to add your photo]   │   │
│  │                                 │   │
│  │         📷 or 🖼️              │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Select from wardrobe:                  │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 👗  │ │ 👔  │ │ 👖  │ │ 👟  │ →    │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│                                         │
│  OR select saved outfit:                │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ 🎨  │ │ 🎨  │ │ 🎨  │ →            │
│  └─────┘ └─────┘ └─────┘              │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         🪄 Try On               │   │
│  │           (1 token)             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Tokens: 15 remaining                   │
│                                         │
└─────────────────────────────────────────┘
```

**Экран генерации (loading):**

```
┌─────────────────────────────────────────┐
│                                         │
│           ✨ Creating magic...          │
│                                         │
│         [Animated progress ring]        │
│                                         │
│     This usually takes 10-30 seconds    │
│                                         │
│     ─────────────────────────────────   │
│                                         │
│     Did you know?                       │
│     AI analyzes your photo and          │
│     realistically places the clothes    │
│                                         │
└─────────────────────────────────────────┘
```

**Экран результата:**

```
┌─────────────────────────────────────────┐
│  ← Result                    💾  📤    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │    [Generated try-on image]    │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │  Try another │  │ Save to album │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Share to Instagram        │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Структура файлов для AI

```
app/
├── ai/
│   ├── try-on.tsx           # AI Try-On screen
│   ├── fashion-model.tsx    # AI Fashion Model screen
│   └── result/[id].tsx      # Generation result screen

components/
├── ai/
│   ├── PhotoUploader.tsx    # Upload/capture photo
│   ├── ItemSelector.tsx     # Select item/outfit
│   ├── GenerationLoader.tsx # Loading animation
│   └── ResultView.tsx       # Display result

services/
├── ai/
│   ├── aiService.ts         # API calls to obrazz-api backend
│   └── types.ts             # AI-related types

store/
├── ai/
│   └── aiStore.ts           # AI generation state
```

---

## 📱 Нативные функции iOS

### 1. Apple Vision (Background Removal)

**Требования:**

- iOS 16+ (Vision.framework)
- Development build (не Expo Go)

**План реализации:**

1. `npx expo prebuild -p ios`
2. Создать Expo Module в `modules/subject-lifter/`
3. Реализовать Swift код для Apple Vision (Vision.framework)
4. Добавить JS bindings
5. Интегрировать в `backgroundRemover.ts` как primary method для iOS

**Документация:** [iOS_OnDevice_Background_Removal.md](./Features/iOS_OnDevice_Background_Removal.md)

### 2. UIMenu (Контекстные меню)

**Статус:** ✅ **ЗАВЕРШЕН** (26 января 2026)

**Что было сделано:**

- ✅ Включен нативный UIMenu для iOS в `GlassDropdownMenu.tsx`
- ✅ Создан компонент `ContextMenuView` для long press контекстных меню
- ✅ Добавлен long press на вещи в гардеробе → Edit, Delete, Hide
- ✅ Добавлен long press на образы → Edit, Duplicate, Share, Delete
- ✅ Кнопка "..." в header использует нативный UIMenu на iOS

**Требования:**

- iOS 13+
- Нативный модуль (`@react-native-menu/menu` v2.0.0)
- Development build

**Где используется:**

- Long press на вещи в гардеробе → Edit, Delete, Hide
- Long press на образе → Edit, Duplicate, Share, Delete
- Кнопка "..." в header → нативное контекстное меню

**Компоненты:**

- `components/ui/ContextMenuView.tsx` — обёртка для long press меню
- `components/ui/glass/GlassDropdownMenu.tsx` — меню в header (USE_NATIVE_MENU = true для iOS)
- `components/wardrobe/ItemCard.tsx` — карточка вещи с context menu
- `components/outfit/OutfitCard.tsx` — карточка образа с context menu

**Установка (уже выполнено):**

```bash
npx expo install @react-native-menu/menu
```

После этого нужен development build:

```bash
npx expo prebuild
npx expo run:ios
```

### 3. Liquid Glass (iOS 26+)

**Статус:** ✅ Уже реализовано с fallback

Используется `expo-glass-effect` для:

- FAB кнопки
- Headers на Wardrobe и Outfits
- На iOS < 26 и Android — fallback версии

---

## 💳 Платежная система

### Гибридная модель

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🇷🇺 RUSSIA                           🌍 REST OF WORLD                  │
│  ════════                            ════════════════                   │
│                                                                         │
│  WEB BILLING                         IN-APP PURCHASE                    │
│  ───────────                         ────────────────                   │
│  • YooMoney/YooKassa                 • App Store (iOS)                 │
│  • ~3.5% commission                  • Google Play (Android)           │
│  • Full control                      • 15-30% commission               │
│  • Dashboard on Rails                • Required by Apple/Google        │
│                                                                         │
│  Why: Apple allows web billing       Why: Platform requirement         │
│  for Russian users (workaround)      for non-Russian users             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Тарифные планы

| Параметр          | FREE | PRO (399₽/мес) | MAX (799₽/мес) |
| ----------------- | ---- | -------------- | -------------- |
| Вещи в каталоге   | 100  | 250            | 500            |
| Удаление фона/мес | 50   | 100            | 200            |
| AI-токенов/мес    | 5    | 50             | 150            |
| Реклама           | Да   | Нет            | Нет            |

### Токены (AI операции)

| Пакет  | Токенов | Цена (₽) | Цена ($) |
| ------ | ------- | -------- | -------- |
| Small  | 10      | 99₽      | $1.49    |
| Medium | 30      | 249₽     | $3.49    |
| Large  | 100     | 699₽     | $9.99    |
| XL     | 300     | 1799₽    | $24.99   |

**Стоимость операций:**

- Virtual Try-On: 1 токен
- Fashion Model: 1 токен
- Variation: 1 токен
- Outfit Generation: 2 токена (сложнее)

---

## 💾 Хранение данных и политика

### Текущая архитектура

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA STORAGE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LOCAL (on device)                   CLOUD (Supabase)                  │
│  ─────────────────                   ────────────────                  │
│  • Wardrobe images                   • User metadata                   │
│  • Outfit previews                   • Item metadata                   │
│  • Cached data                       • Outfit metadata                 │
│                                      • AI generation results           │
│                                                                         │
│  expo-file-system                    PostgreSQL + Storage              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Политика хранения AI-генераций

**Проблема:** FASHN AI удаляет изображения через ограниченное время.

**Решение:**

1. **obrazz-api скачивает результат сразу** после генерации
2. **Сохраняет в Supabase Storage** (bucket: `ai-generations`)
3. **На сервере храним 3 дня** (политика retention)
4. **Пользователь может сохранить** в свою коллекцию (тогда хранится дольше)

```ruby
# app/jobs/cleanup_ai_generations_job.rb
class CleanupAiGenerationsJob < ApplicationJob
  def perform
    # Удаляем AI-генерации старше 3 дней, которые не сохранены пользователем
    AiGeneration
      .where('created_at < ?', 3.days.ago)
      .where(saved_to_collection: false)
      .find_each do |generation|
        # Удаляем файл из Storage
        Supabase::SyncService.new.delete_file(generation.result_url)
        generation.destroy
      end
  end
end

# config/schedule.rb (опционально: если используем Sidekiq-scheduler)
cleanup_ai_generations:
  cron: '0 3 * * *'  # Каждый день в 3:00
  class: CleanupAiGenerationsJob
```

### Privacy & Security

1. **Фото пользователей:**
   - Временные (для AI) — хранятся max 3 дня
   - При удалении аккаунта — всё удаляется
   - Не передаём третьим лицам (кроме FASHN AI для генерации)

2. **Supabase RLS:**
   - Users видят только свои данные
   - Service-role key только на backend

3. **Signed URLs:**
   - Для private bucket — временные ссылки
   - TTL: 1 час для просмотра, 24 часа для download

---

## 📅 Детальный Roadmap по стадиям

### Stage 5: AI Functions (2-3 недели)

#### 5.1 obrazz-api Backend (✅ реализовано)

- [x] Инициализация Node.js + Hono проекта
- [x] JWT authentication (Supabase integration)
- [x] API endpoints: /tokens, /subscriptions, /payments, /users
- [x] Деплой на Render (Docker, Frankfurt)

#### 5.2 FASHN AI Integration (1 неделя)

- [x] FASHN AI API client (fashn.service.ts)
- [ ] VirtualTryon, FashionModels, Variations эндпоинты
- [ ] Сохранение результатов в Supabase Storage
- [ ] API endpoints: /ai/virtual_tryon, /ai/fashion_model, /ai/generations/:id

#### 5.3 Mobile AI UI (1 неделя)

- [ ] AI Try-On screen
- [ ] PhotoUploader component
- [ ] ItemSelector component
- [ ] GenerationLoader animation
- [ ] ResultView с сохранением/шерингом
- [ ] aiService.ts + aiStore.ts

### Stage 6: Subscriptions & Payments (2-3 недели)

#### 6.1 Web Billing (Russia) (1 неделя)

- [ ] YooKassa integration
- [ ] Payment flow (redirect → webhook)
- [ ] Subscription activation
- [ ] Token purchase flow
- [ ] Dashboard: subscription page

#### 6.2 In-App Purchase (1-2 недели)

- [ ] iOS StoreKit configuration
- [ ] Android Play Billing configuration
- [ ] Receipt validation on obrazz-api
- [ ] Server-to-Server notifications
- [ ] Mobile IAP screens

#### 6.3 Paywall (3-5 дней)

- [ ] Paywall component
- [ ] Region detection (Russia vs other)
- [ ] A/B testing setup
- [ ] Soft paywall logic

### Stage 7: Native Features (1 неделя)

#### 7.1 Development Build Setup (1-2 дня)

- [ ] `npx expo prebuild -p ios`
- [ ] EAS Build configuration
- [ ] Test development build

#### 7.2 Apple Vision Background Removal (3-5 дней)

- [x] Create subject-lifter Expo module
- [x] Implement Apple Vision (Vision.framework) logic
- [x] Integrate into backgroundRemover.ts
- [x] Test on real device

#### 7.3 UIMenu (1-2 дня)

- [x] Install @react-native-menu/menu
- [x] Add context menus to wardrobe items
- [x] Add context menus to outfits

### Stage 8: Onboarding & Polish (1-2 недели)

#### 8.1 Onboarding (3-5 дней)

- [ ] Welcome screens
- [ ] AI demo/preview
- [ ] Style preferences quiz (optional)
- [ ] First item adding prompt

#### 8.2 Push Notifications (3-5 дней)

- [ ] expo-notifications setup
- [ ] Backend integration
- [ ] Streak reminders
- [ ] New feature announcements

#### 8.3 Gamification (3-5 дней)

- [ ] Streak system
- [ ] Achievements
- [ ] Daily challenges

### Stage 9: Testing & Release (1-2 недели)

#### 9.1 Testing

- [ ] Unit tests (Jest)
- [ ] Integration tests (backend)
- [ ] E2E tests (Maestro/Detox)
- [ ] Manual QA

#### 9.2 App Store Preparation

- [ ] Screenshots
- [ ] App description
- [ ] Privacy policy
- [ ] Review guidelines compliance

#### 9.3 Release

- [ ] TestFlight beta
- [ ] Google Play beta
- [ ] Soft launch
- [ ] Full release

---

## 📊 Timeline Summary

| Stage                 | Duration  | Dependencies |
| --------------------- | --------- | ------------ |
| **Stage 5: AI**       | 2-3 weeks | —            |
| **Stage 6: Payments** | 2-3 weeks | Stage 5      |
| **Stage 7: Native**   | 1 week    | Stage 5      |
| **Stage 8: Polish**   | 1-2 weeks | Stage 6      |
| **Stage 9: Release**  | 1-2 weeks | Stage 8      |

**Total estimated time to release: 8-12 weeks**

---

## ⚡ Quick Wins (можно сделать параллельно)

1. **Development build** — разблокирует нативные фичи
2. **Apple Vision** — улучшит UX для iOS пользователей
3. **Onboarding screens** — не требует backend
4. **Export outfit as image** — react-native-view-shot уже установлен

---

## 📚 Связанные документы

- [Backend.md](./Extra/Features/Backend.md) — Детальная архитектура backend
- [RAILS_BACKEND_IMPLEMENTATION_PLAN.md](./RAILS_BACKEND_IMPLEMENTATION_PLAN.md) — ⚠️ Архивный документ (старый Rails-монолит)
- [iOS_OnDevice_Background_Removal_Plan.md](./Features/iOS_OnDevice_Background_Removal_Plan.md) — Apple Vision план
- [Implementation.md](./Implementation.md) — Общий roadmap проекта
- [TechStack.md](./TechStack.md) — Технический стек
- [PRDobrazz.md](./PRDobrazz.md) — Product Requirements

---

> **Следующий шаг:** Завершить AI-интеграцию в obrazz-api (FASHN AI endpoints), реализовать AI UI в мобильном приложении, затем платежи (YooKassa + IAP).
