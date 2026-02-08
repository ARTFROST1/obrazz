# 🚀 Obrazz - Полный технический стек

> **Дата создания:** 12 января 2025  
> **Последнее обновление:** 8 февраля 2026  
> **Версия документа:** 1.5.0  
> **Статус:** Актуальный

## 📋 Оглавление

1. [Общий обзор](#общий-обзор)
2. [Frontend - React Native & Expo](#frontend---react-native--expo)
3. [Backend - Supabase & Node.js](#backend---supabase--nodejs)
4. [UI библиотеки и компоненты](#ui-библиотеки-и-компоненты)
5. [Навигация](#навигация)
6. [State Management](#state-management)
7. [Анимации и жесты](#анимации-и-жесты)
8. [Работа с изображениями](#работа-с-изображениями)
9. [AI и Machine Learning](#ai-и-machine-learning)
10. [Платежи и подписки](#платежи-и-подписки)
11. [Инструменты разработки](#инструменты-разработки)
12. [Тестирование](#тестирование)
13. [CI/CD и деплой](#cicd-и-деплой)

---

## 🎯 Общий обзор

Приложение **Obrazz** построено на современном стеке технологий с акцентом на производительность, масштабируемость и отличный пользовательский опыт. Все версии библиотек проверены на совместимость друг с другом.

### Основные принципы выбора технологий:

- ✅ Кроссплатформенность (iOS, Android, Web)
- ✅ Типобезопасность (TypeScript)
- ✅ Производительные нативные анимации
- ✅ Оффлайн-first архитектура
- ✅ Модульность и переиспользуемость

---

## 💻 Frontend - React Native & Expo

### Основной фреймворк

```json
{
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "react-native": "0.83.1",
  "expo": "^55.0.0-preview.6",
  "typescript": "~5.9.2"
}
```

### Expo SDK модули

**✅ Установлено (Stage 1):**

```json
{
  "expo-constants": "~55.0.2",
  "expo-font": "~55.0.2",
  "expo-linking": "~55.0.3",
  "expo-router": "~55.0.0-beta.3",
  "expo-splash-screen": "~55.0.2",
  "expo-status-bar": "~55.0.2",
  "expo-web-browser": "~55.0.2"
}
```

**✅ Установлено (Stage 3+):**

```json
{
  "expo-blur": "~55.0.2",
  "expo-camera": "~55.0.2",
  "expo-dev-client": "~55.0.2",
  "expo-file-system": "~55.0.2",
  "expo-glass-effect": "~55.0.2",
  "expo-image-manipulator": "~55.0.2",
  "expo-image-picker": "~55.0.2",
  "expo-linear-gradient": "~55.0.2",
  "expo-symbols": "~55.0.2"
}

Примечание:
- `expo-glass-effect` используется для iOS 26+ Liquid Glass UI (с graceful fallback на iOS < 26 / Android).
- Для нативного контекстного меню (UIMenu) есть опциональный модуль `@react-native-menu/menu`, но он требует нативной сборки (не работает в Expo Go).
```

**📋 Для будущих стадий:**

```json
{
  "expo-media-library": "~17.0.0",
  "expo-image": "~2.0.0",
  "expo-localization": "~16.0.9",
  "expo-notifications": "~0.30.9",
  "expo-secure-store": "~14.0.9",
  "expo-updates": "~0.27.9",
  "expo-device": "~7.0.0",
  "expo-haptics": "~14.0.0"
}
```

---

## 🗄️ Backend - Node.js/Hono & Rails & Supabase

### obrazz-api (Node.js + Hono — основной бэкенд API)

> **Статус:** ✅ Реализовано. Основной бэкенд для мобильного приложения.

```json
{
  "hono": "^4.7.0",
  "@hono/node-server": "^1.13.0",
  "@supabase/supabase-js": "^2.51.0",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.4.0"
}
```

**Назначение:** AI-генерации (proxy к FASHN AI), токены, платежи (YooKassa), подписки, пользователи.

**Деплой:** Docker на Render (Frankfurt).

### obrazz-admin (Rails 8 — админ-панель)

> **Статус:** ✅ Реализовано. Отдельная Rails-приложение для администрирования.

```ruby
# Gemfile - основные зависимости
gem 'rails', '~> 8.0.4'
gem 'puma', '>= 5.0'
gem 'pg', '~> 1.1'
gem 'kaminari', '~> 1.2'
gem 'bcrypt', '~> 3.1.7'
gem 'sentry-ruby', '~> 5.21'
gem 'sentry-rails', '~> 5.21'
```

**Примечание:** Админка использует HTTP Basic Auth, Kaminari для пагинации. Деплой — Docker на Render (Frankfurt).

> ⚠️ **Архивированный проект `obrazz-rails`** (`archived/obrazz-rails/`) — старый Rails-монолит, который ранее совмещал API + Dashboard + Admin. Заменён на образ-api (Hono) + образ-admin (Rails 8). **Не используется.**

### Supabase клиент и библиотеки

**✅ Установлено:**

```json
{
  "@supabase/supabase-js": "^2.51.0"
}
```

**Примечание:** `@supabase/supabase-js` включает клиентов для Auth / PostgREST / Realtime / Storage.

`@supabase/auth-helpers-react` — отдельный пакет и в текущем проекте не используется.

### FASHN AI (Внешний API)

> **Статус:** ✅ Интеграция реализована в obrazz-api (Stage 5).

> **Архитектура:** Mobile → obrazz-api (Hono) → FASHN AI (api.fashn.ai/v1).
> Мобильный клиент **не** обращается к FASHN AI напрямую.
> obrazz-api выступает proxy: проверяет токены, дебитует баланс, отправляет запрос в FASHN AI, сохраняет результат.

**API Endpoints (FASHN AI):**

- Virtual Try-On: `POST https://api.fashn.ai/v1/run` (1 токен)
- Статус: `GET https://api.fashn.ai/v1/status/{pred_id}`
- AI Fashion Models: через тот же endpoint с другими параметрами (1 токен)
- Clothing Variation: через тот же endpoint (1 токен)

**Реализация в obrazz-api:** `src/services/ai/fashn.service.ts` (API-клиент), `src/services/ai/generation.service.ts` (оркестрация)

**Документация:** https://docs.fashn.ai/

````

---

## 🎨 UI библиотеки и компоненты

### Основные UI компоненты

**✅ Установлено:**

```json
{
  "@expo/vector-icons": "^15.0.2",
  "@callstack/liquid-glass": "^0.7.0",
  "@gorhom/bottom-sheet": "^5.2.8",
  "@react-native-menu/menu": "^2.0.0",
  "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.20.0",
  "react-native-svg": "15.15.1"
}
```

**📋 Для будущих стадий:**

```json
{
  "react-native-elements": "^4.0.0-rc.9",
  "react-native-paper": "^5.14.0",
  "react-native-vector-icons": "^10.3.0",
  "@shopify/react-native-skia": "^1.8.0"
}
```

### Стилизация

> **Примечание:** NativeWind и Tamagui не установлены в текущем проекте.
> Стилизация выполняется через стандартные React Native StyleSheet.

```json
// 📋 Опционально для будущего:
{
  "nativewind": "^4.2.0",
  "tailwindcss": "^3.5.0",
  "@tamagui/core": "^1.117.0"
}
```

### UI утилиты

> **Статус:** 📋 Опционально для будущих стадий. В текущей кодовой базе эти пакеты **не установлены**.

---

## 🧭 Навигация

**✅ Установлено:**

```json
{
  "@react-navigation/native": "^7.1.8",
  "@react-navigation/native-stack": "^7.2.0",
  "@react-navigation/bottom-tabs": "^7.2.0",
  "@react-navigation/stack": "^7.1.0",
  "expo-router": "~55.0.0-beta.3"
}
```

**📋 Для будущих стадий:**

```json
{
  "@react-navigation/drawer": "^7.2.0",
  "@react-navigation/material-top-tabs": "^7.1.0",
  "@react-navigation/elements": "^2.2.0",
  "react-native-tab-view": "^4.0.1",
  "react-native-pager-view": "^7.0.3"
}
```

---

## 📦 State Management

**✅ Установлено:**

```json
{
  "zustand": "^5.0.3",
  "immer": "^10.1.1",
  "@tanstack/react-query": "^5.71.0",
  "@tanstack/query-async-storage-persister": "^5.71.0"
}
```

**📋 Опционально (для будущих стадий):**

```json
{
  "@tanstack/query-sync-storage-persister": "^5.71.0",
  "@tanstack/react-query-devtools": "^5.71.0",
  "valtio": "^2.2.0",
  "jotai": "^2.11.0"
}
```

---

## ✨ Анимации и жесты

**✅ Установлено:**

```json
{
  "react-native-reanimated": "~4.2.1",
  "react-native-worklets": "0.7.2",
  "react-native-gesture-handler": "~2.30.0",
  "react-native-draggable-flatlist": "^4.0.3",
  "react-native-reanimated-carousel": "^4.0.3",
  "react-native-haptic-feedback": "^2.3.3"
}
```

**📋 Для будущих стадий:**

```json
{
  "lottie-react-native": "^7.2.0",
  "react-native-animatable": "^1.5.0",
  "react-native-spring-scrollview": "^3.1.0",
  "react-native-shared-element": "^0.9.0-alpha.3",
  "react-native-magic-move": "^0.8.2"
}
```

---

## 🖼️ Работа с изображениями

**✅ Установлено:**

```json
{
  "@react-native-async-storage/async-storage": "^2.1.0",
  "react-native-zoom-toolkit": "^5.0.1",
  "react-native-view-shot": "^4.0.3"
}
```

**📋 Для будущих стадий:**

```json
{
  "react-native-fast-image": "^8.7.0",
  "react-native-image-resizer": "^3.1.0",
  "react-native-image-zoom-viewer": "^3.1.2",
  "react-native-super-grid": "^6.1.0",
  "react-native-masonry-list": "^2.16.2",
  "react-native-fs": "^2.21.0"
}
```

### Обработка изображений и удаление фона

> **Реализовано:** Двойной pipeline:
> - **Primary:** Apple Vision через native module `subject-lifter` (iOS 16+, on-device, бесплатно)
> - **Fallback:** Pixian.ai API через `fetch` (для Android или старых iOS)
>
> **Код:** `services/wardrobe/backgroundRemover.ts`, `modules/subject-lifter/`.

**📋 Опционально для будущих стадий (не установлено):** локальная сегментация/фильтры/редакторы.

---

## 🤖 AI и Machine Learning

### AI интеграции (Stage 5+)

> **Статус:** ✅ Частично реализовано (Stage 5). В мобильной кодовой базе SDK для OpenAI/Anthropic/Google **не установлены** (не нужны).
>
> **Архитектура:** Mobile → obrazz-api (Hono) → FASHN AI (api.fashn.ai/v1). Клиент **не ходит** в FASHN AI напрямую.

### Обработка стилей и цветов

```json
{
  "color": "^4.3.0",
  "chroma-js": "^3.2.0",
  "colorjs.io": "^0.6.0",
  "react-native-color-picker": "^1.0.0",
  "react-native-color-palette": "^2.3.0",
  "tinycolor2": "^1.7.0"
}
```

---

## 💳 Платежи и подписки

> **Статус:** ✅ Частично реализовано (IAP инфраструктура готова)

**✅ Установлено:**

```json
{
  "react-native-iap": "^14.7.7"
}
```

**Реализованные сервисы:**

- `services/iap/iapService.ts` — In-App Purchases (iOS App Store / Google Play)
- `services/subscription/subscriptionService.ts` — синхронизация статуса подписки/токенов с backend API (**env var сейчас называется `EXPO_PUBLIC_RAILS_API_URL` — историческое имя**)
- `store/subscription/subscriptionStore.ts` — локальное состояние подписок и токенов

### Планы/пакеты: backend vs mobile

В репозитории сейчас есть **два источника правды**, которые нужно привести к одному:

1) **Backend entitlements (реально в `obrazz-api`)** — что сервер поддерживает сегодня.
2) **Mobile product IDs (реально в `obrazz/`)** — какие IAP-продукты и цены ожидает текущий код UI/сервисов.

#### 1) Backend entitlements (`obrazz-api`)

| План | ID | Токенов/мес | Цена (RUB) |
|------|----|-------------|------------|
| Free | `free` | 0 | 0 |
| Pro Monthly | `pro_monthly` | 100 | 499 |
| Pro Yearly | `pro_yearly` | 100 | 3 999 |

> **Бонус при регистрации:** 3 токена (срок действия 30 дней).

**Пакеты токенов (единоразовая покупка, `obrazz-api`):**

| Пакет | ID | Токенов | Цена (RUB) |
|-------|----|---------|------------|
| 10 токенов | `pack_10` | 10 | 99 |
| 50 токенов | `pack_50` | 50 | 399 |
| 100 токенов | `pack_100` | 100 | 699 |
| 500 токенов | `pack_500` | 500 | 2 999 |

#### 2) Mobile IAP product IDs (текущее состояние кода)

> ⚠️ В мобильном коде сейчас всё ещё присутствуют **legacy** продукты (`max_*`, `tokens_30`, `tokens_300`) и формулировки про “Rails backend”.
> Серверная часть `obrazz-api` **не поддерживает** `max_*` и использует **`pack_*`** вместо **`tokens_*`**.

- Subscriptions (mobile): `com.obrazz.pro_monthly`, `com.obrazz.pro_yearly`, **legacy:** `com.obrazz.max_monthly`, `com.obrazz.max_yearly`
- Token packs (mobile): `com.obrazz.tokens_10`, `com.obrazz.tokens_30`, `com.obrazz.tokens_100`, `com.obrazz.tokens_300`

**Рекомендуемая цель для унификации:** mobile → `pro_monthly`/`pro_yearly` и token packs → `pack_10`/`pack_50`/`pack_100`/`pack_500` (как в `obrazz-api`).

**Документация:** см. [Docs/Implementation.md](obrazz/Docs/Implementation.md) и API README: [obrazz-api/README.md](obrazz-api/README.md)

---

## 🔐 OAuth Authentication

> **Статус:** ✅ Реализовано (Stage 4.13)

**✅ Установлено:**

```json
{
  "expo-apple-authentication": "~55.0.2",
  "expo-auth-session": "~55.0.2",
  "expo-web-browser": "~55.0.2"
}
```

**Реализованные сервисы:**

- `services/auth/oauthService.ts` — Google OAuth + Apple Sign In
- Native Apple Authentication на iOS (Face ID/Touch ID)
- Fallback на Supabase OAuth flow для других платформ

**Поддерживаемые провайдеры:**

- ✅ Google OAuth (все платформы)
- ✅ Apple Sign In (iOS native + web fallback)

---

## 🛠️ Инструменты разработки

### Линтинг и форматирование

**✅ Установлено (Stage 1):**

```json
{
  "@typescript-eslint/eslint-plugin": "^7.18.0",
  "@typescript-eslint/parser": "^7.18.0",
  "eslint": "^8.57.0",
  "eslint-config-expo": "~55.0.0",
  "eslint-plugin-import": "^2.31.0",
  "eslint-plugin-prettier": "^5.2.1",
  "eslint-plugin-react": "^7.37.2",
  "eslint-plugin-react-hooks": "^5.1.0",
  "eslint-plugin-react-native": "^4.1.0",
  "prettier": "^3.5.0",
  "husky": "^9.1.7",
  "lint-staged": "^15.2.10"
}
```

### Сборка и оптимизация

**✅ Установлено:**

```json
{
  "@babel/core": "^7.27.0",
  "babel-plugin-module-resolver": "^5.0.2"
}
```

**📋 Входит в Expo (не требуется):**

```json
{
  "@babel/preset-env": "включено в babel-preset-expo",
  "@babel/runtime": "включено в Expo",
  "@react-native/babel-preset": "включено в babel-preset-expo",
  "metro-react-native-babel-preset": "включено в Expo"
}
```

**📋 Для будущих стадий:**

```json
{
  "react-native-dotenv": "^3.5.0"
}
```

### Отладка

> **Статус:** 📋 Опционально для будущих стадий. В текущем проекте эти инструменты **не установлены**.

---

## 🧪 Тестирование

**✅ Установлено (Stage 1):**

```json
{
  "react-test-renderer": "19.1.0"
}
```

**📋 Для Stage 9 (Testing & QA):**

```json
{
  "jest": "^29.7.0",
  "jest-expo": "~54.0.16",
  "@testing-library/react-native": "^13.3.3",
  "@testing-library/jest-native": "^5.4.3"
}
```

**📋 Для будущих стадий (не установлено):** Detox / Maestro / MSW.

---

## 🚀 CI/CD и деплой

### EAS (Expo Application Services)

> **Примечание:** `eas-cli` обычно ставится глобально (или через `npx`). В `package.json` как зависимость он не закреплён.
>
> **Установлено в проекте:** `expo-dev-client` `~6.0.20`.

### Мониторинг и аналитика

> **Статус:** 📋 Опционально для будущих стадий. В текущем проекте эти SDK **не установлены**.

---

## 📚 Дополнительные утилиты

### Формы и валидация

**✅ Установлено (Stage 1):**

```json
{
  "react-hook-form": "^7.56.0",
  "yup": "^1.6.0",
  "zod": "^3.24.0"
}
```

**📋 Для будущих стадий:**

```json
{
  "react-native-form-validator": "^0.6.0",
  "@hookform/resolvers": "^3.10.0"
}
```

### Сеть и API

**✅ Установлено:**

```json
{
  "@react-native-community/netinfo": "11.4.1",
  "react-native-webview": "13.15.0"
}
```

**📋 Для будущих стадий:**

```json
{
  "axios": "^1.8.0",
  "ky": "^1.8.0",
  "react-native-url-polyfill": "^2.0.1",
  "react-native-background-fetch": "^5.0.0",
  "react-native-background-upload": "^7.1.0",
  "react-native-offline": "^7.0.0"
}
```

### Локализация

**✅ Установлено:**

```json
{
  "i18next": "^25.6.3",
  "react-i18next": "^16.3.5"
}
```

**📋 Для будущих стадий:**

```json
{
  "i18next-react-native-language-detector": "^1.1.0",
  "react-native-localize": "^3.3.0"
}
```

### Утилиты даты и времени

> **Статус:** 📋 Опционально для будущих стадий. В текущем проекте эти пакеты **не установлены**.

---

## 🔒 Безопасность и хранение

> **Статус:** 📋 Опционально для будущих стадий. В текущем проекте эти пакеты **не установлены**.

---

## 📊 База данных и схемы

### ORM и работа с базой данных

> **Статус:** 📋 Опционально для будущих стадий. В текущем проекте эти пакеты **не установлены**.

### Валидация схем

> **Статус:** 📋 Опционально для будущих стадий. В текущем проекте эти пакеты **не установлены**.

---

## 🎯 Совместимость версий

### Критически важные зависимости

| Библиотека       | Версия   | Совместимость         |
| ---------------- | -------- | --------------------- |
| React Native     | 0.83.1   | ✅ Expo SDK 55        |
| Expo             | ^55.0.0  | ✅ RN 0.83.1          |
| React            | 19.2.0   | ✅ RN 0.83.1          |
| TypeScript       | ~5.9.2   | ✅ Все библиотеки     |
| React Navigation | ^7.1.8   | ✅ RN 0.83.1          |
| Reanimated       | ~4.2.1   | ✅ RN 0.83.1, Expo 55 |
| Gesture Handler  | ~2.30.0  | ✅ Reanimated 4       |
| Zustand          | ^5.0.3   | ✅ React 19           |
| TanStack Query   | ^5.71.0  | ✅ React 19           |
| Supabase JS      | ^2.51.0  | ✅ Все версии         |

---

## 📝 Примечания по установке

### Базовая установка (Stage 1 - Выполнено ✅)

```bash
# Проект уже создан и настроен
cd obrazz

# Установка зависимостей (уже выполнено)
npm install

# Запуск проекта
npm start
```

**Stage 1 выполнено:**

- ✅ Все core dependencies установлены
- ✅ TypeScript настроен
- ✅ Babel сконфигурирован
- ✅ ESLint и Prettier настроены
- ✅ Husky pre-commit hooks активны

### Конфигурация для iOS

```bash
# Установка pods для iOS
cd ios && pod install
```

### Конфигурация для Android

```gradle
// android/app/build.gradle
android {
    compileSdkVersion 35
    buildToolsVersion "35.0.0"

    defaultConfig {
        minSdkVersion 23
        targetSdkVersion 35
    }
}
```

### Настройка Babel ✅

**Текущая конфигурация (Stage 1):**

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Path aliases
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@app': './app',
            '@components': './components',
            '@services': './services',
            '@store': './store',
            '@hooks': './hooks',
            '@utils': './utils',
            '@types': './types',
            '@assets': './assets',
            '@lib': './lib',
            '@config': './config',
            '@contexts': './contexts',
            '@styles': './styles',
            '@locales': './locales',
          },
        },
      ],
      // React Native Reanimated must be last (includes worklets)
      'react-native-reanimated/plugin',
    ],
  };
};
```

**Важно:**

- ✅ `expo-router/babel` НЕ нужен (включен в babel-preset-expo SDK 55)
- ✅ `react-native-worklets/plugin` НЕ нужен (включен в Reanimated 4)
- ✅ `react-native-reanimated/plugin` должен быть последним

---

## 🚨 Важные замечания (обновлено Stage 1)

1. **React Native 0.83.1** - версия, используемая в Expo SDK 55 ✅
2. **React 19.2.0** - текущая версия в проекте ✅
3. **Reanimated 4** - worklets уже включены, отдельный пакет НЕ нужен ✅
4. **Zustand 5** - breaking changes учтены, работает с React 19 ✅
5. **TanStack Query v5** - установлена с async-storage persister ✅
6. **Supabase** - v2.51.0 установлена, клиент настроен ✅
7. **Expo Router** - babel plugin НЕ нужен (включен в babel-preset-expo) ✅
8. **ESLint 8.57** - используется вместо v9 для совместимости ✅

---

## 📞 Контакты и поддержка

При возникновении проблем с совместимостью версий обращайтесь к официальной документации каждой библиотеки или создавайте issue в репозитории проекта.

**Актуальные версии:**

- Все версии проверены и установлены в Stage 1-4
- См. `package.json` для точных версий
- См. документы в `Docs/Extra/Stages/` для деталей по стадиям

---

_Последнее обновление: 27 января 2026 (Документация синхронизирована с кодом)_

## 📊 Новые Зависимости (Stages 4.8-4.12)

**Stage 4.8 - 4-Tab System:**

- Custom utilities: `utils/storage/customTabStorage.ts`
- Types: `types/components/OutfitCreator.ts`
- Constants: `constants/outfitTabs.ts`

**Stage 4.9 - ImageCropper:**

- ✅ `react-native-zoom-toolkit@^5.0.1` - Pinch-to-zoom for crop
- Components: `ImageCropper.tsx`, `CropOverlay.tsx`, `ResizableCropOverlay.tsx`

**Stage 4.10 - Data Persistence:**

- Enhanced `outfitService.ts` with full item data loading
- Enhanced `outfitStore.ts` with priority-based restoration
- AsyncStorage conditional loading logic

**Stage 4.11 - Shopping Browser:**

- ✅ `react-native-webview@13.15.0` - WebView для браузера магазинов
- ✅ `@gorhom/bottom-sheet@^5.2.8` - Bottom sheet для gallery
- Services: `storeService.ts`, `webCaptureService.ts`
- Store: `shoppingBrowserStore.ts`
- 10 новых компонентов в `components/shopping/`

**Stage 4.12 - Offline-First:**

- ✅ `@react-native-community/netinfo@11.4.1` - Network monitoring
- Offline services: `itemServiceOffline.ts`, `outfitServiceOffline.ts`
- Sync infrastructure: `syncQueue.ts`, `networkMonitor.ts`, `syncService.ts`
````
