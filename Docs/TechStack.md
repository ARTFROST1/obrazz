# 🚀 Obrazz - Полный технический стек

> **Дата создания:** 12 января 2025  
> **Версия документа:** 1.0.0  
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
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.4",
  "expo": "~54.0.13",
  "typescript": "~5.9.2"
}
```

### Expo SDK модули

```json
{
  "expo-constants": "~18.0.9",
  "expo-font": "~14.0.9",
  "expo-linking": "~8.0.8",
  "expo-router": "~6.0.11",
  "expo-splash-screen": "~31.0.10",
  "expo-status-bar": "~3.0.8",
  "expo-web-browser": "~15.0.8",
  "expo-camera": "~16.0.9",
  "expo-media-library": "~17.0.9",
  "expo-image-picker": "~16.0.9",
  "expo-file-system": "~18.0.8",
  "expo-image": "~2.0.9",
  "expo-image-manipulator": "~13.0.9",
  "expo-localization": "~16.0.9",
  "expo-notifications": "~0.30.9",
  "expo-secure-store": "~14.0.9",
  "expo-updates": "~0.27.9",
  "expo-device": "~7.0.9",
  "expo-haptics": "~14.0.9",
  "expo-blur": "~14.0.9"
}
```

---

## 🗄️ Backend - Supabase & Node.js

### Supabase клиент и библиотеки

```json
{
  "@supabase/supabase-js": "^2.51.0",
  "@supabase/auth-helpers-react": "^0.5.0",
  "@supabase/storage-js": "^2.8.0",
  "@supabase/realtime-js": "^2.14.0",
  "@supabase/postgrest-js": "^1.18.0",
  "@supabase/functions-js": "^2.5.0"
}
```

### Node.js Backend (для AI сервисов)

```json
{
  "@nestjs/core": "^10.5.0",
  "@nestjs/common": "^10.5.0",
  "@nestjs/platform-express": "^10.5.0",
  "@nestjs/swagger": "^8.0.0",
  "@nestjs/config": "^3.3.0",
  "@nestjs/jwt": "^10.3.0",
  "@nestjs/passport": "^10.1.0",
  "passport": "^0.8.0",
  "passport-jwt": "^4.0.1",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1",
  "helmet": "^8.0.0",
  "compression": "^1.7.6"
}
```

---

## 🎨 UI библиотеки и компоненты

### Основные UI компоненты

```json
{
  "react-native-elements": "^4.0.0-rc.9",
  "react-native-paper": "^5.14.0",
  "react-native-vector-icons": "^10.3.0",
  "@expo/vector-icons": "^15.0.2",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "^15.10.0",
  "@shopify/react-native-skia": "^1.8.0"
}
```

### Стилизация

```json
{
  "nativewind": "^4.2.0",
  "tailwindcss": "^3.5.0",
  "@tamagui/core": "^1.117.0",
  "@tamagui/config": "^1.117.0",
  "@tamagui/animations-react-native": "^1.117.0",
  "react-native-unistyles": "^3.0.0-rc.9"
}
```

### UI утилиты

```json
{
  "react-native-modal": "^13.0.2",
  "react-native-toast-message": "^2.3.0",
  "react-native-flash-message": "^0.5.0",
  "react-native-skeleton-placeholder": "^5.3.0",
  "react-native-shimmer-placeholder": "^2.0.10",
  "react-native-loading-spinner-overlay": "^3.0.2"
}
```

---

## 🧭 Навигация

```json
{
  "@react-navigation/native": "^7.1.8",
  "@react-navigation/native-stack": "^7.2.0",
  "@react-navigation/bottom-tabs": "^7.2.0",
  "@react-navigation/drawer": "^7.2.0",
  "@react-navigation/material-top-tabs": "^7.1.0",
  "@react-navigation/stack": "^7.1.0",
  "@react-navigation/elements": "^2.2.0",
  "react-native-tab-view": "^4.0.1",
  "react-native-pager-view": "^7.0.3"
}
```

---

## 📦 State Management

```json
{
  "zustand": "^5.0.3",
  "immer": "^10.2.0",
  "@tanstack/react-query": "^5.71.0",
  "@tanstack/query-sync-storage-persister": "^5.71.0",
  "@tanstack/react-query-devtools": "^5.71.0",
  "@tanstack/query-async-storage-persister": "^5.71.0",
  "valtio": "^2.2.0",
  "jotai": "^2.11.0"
}
```

---

## ✨ Анимации и жесты

```json
{
  "react-native-reanimated": "~4.1.1",
  "react-native-worklets": "^1.0.0-beta.29",
  "react-native-gesture-handler": "~2.24.0",
  "lottie-react-native": "^7.2.0",
  "react-native-animatable": "^1.5.0",
  "react-native-spring-scrollview": "^3.1.0",
  "react-native-shared-element": "^0.9.0-alpha.3",
  "react-native-magic-move": "^0.8.2"
}
```

---

## 🖼️ Работа с изображениями

```json
{
  "react-native-fast-image": "^8.7.0",
  "react-native-image-crop-picker": "^0.42.0",
  "react-native-image-resizer": "^3.1.0",
  "react-native-image-zoom-viewer": "^3.1.2",
  "react-native-super-grid": "^6.1.0",
  "react-native-masonry-list": "^2.16.2",
  "react-native-draggable-flatlist": "^4.1.0",
  "react-native-sortable-list": "^0.0.27",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "react-native-fs": "^2.21.0"
}
```

### Обработка изображений и удаление фона

```json
{
  "remove.bg": "^2.0.2",
  "@segment-anything/segmentation": "^1.0.0",
  "sharp": "^0.34.0",
  "jimp": "^1.8.0",
  "react-native-image-filter-kit": "^0.9.0",
  "react-native-photo-editor": "^1.1.0"
}
```

---

## 🤖 AI и Machine Learning

### OpenAI и другие AI сервисы

```json
{
  "openai": "^4.82.0",
  "@anthropic-ai/sdk": "^0.37.0",
  "@google/generative-ai": "^0.25.0",
  "replicate": "^1.2.0",
  "@huggingface/inference": "^2.9.0",
  "llamaindex": "^1.5.0"
}
```

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

```json
{
  "react-native-purchases": "^8.4.0",
  "react-native-iap": "^13.2.0",
  "stripe": "^17.7.0",
  "@stripe/stripe-react-native": "^0.41.0",
  "react-native-yookassa": "^1.1.0",
  "react-native-paymaster": "^1.0.5"
}
```

---

## 🛠️ Инструменты разработки

### Линтинг и форматирование

```json
{
  "@typescript-eslint/eslint-plugin": "^8.20.0",
  "@typescript-eslint/parser": "^8.20.0",
  "eslint": "^9.20.0",
  "eslint-config-expo": "^8.0.0",
  "eslint-plugin-react": "^7.38.0",
  "eslint-plugin-react-hooks": "^5.1.0",
  "eslint-plugin-react-native": "^4.2.0",
  "prettier": "^3.5.0",
  "husky": "^9.3.0",
  "lint-staged": "^16.0.0"
}
```

### Сборка и оптимизация

```json
{
  "@babel/core": "^7.27.0",
  "@babel/preset-env": "^7.27.0",
  "@babel/runtime": "^7.27.0",
  "@react-native/babel-preset": "^0.81.0",
  "babel-plugin-module-resolver": "^5.0.2",
  "metro-react-native-babel-preset": "^0.81.0",
  "react-native-dotenv": "^3.5.0"
}
```

### Отладка

```json
{
  "react-native-debugger": "^1.2.0",
  "flipper-plugin-react-native-performance": "^0.5.0",
  "react-devtools": "^6.0.0",
  "reactotron-react-native": "^5.2.0",
  "react-native-logs": "^5.2.0",
  "@sentry/react-native": "^6.7.0"
}
```

---

## 🧪 Тестирование

```json
{
  "jest": "^30.0.0-alpha.9",
  "jest-expo": "~54.0.0",
  "@testing-library/react-native": "^13.0.0",
  "@testing-library/jest-native": "^6.0.0",
  "detox": "^20.32.0",
  "maestro": "^1.42.0",
  "react-test-renderer": "19.1.0",
  "@testing-library/react-hooks": "^9.0.0",
  "msw": "^2.8.0"
}
```

---

## 🚀 CI/CD и деплой

### EAS (Expo Application Services)

```json
{
  "eas-cli": "^14.1.0",
  "expo-dev-client": "~5.0.9",
  "expo-build-properties": "~0.14.9"
}
```

### Мониторинг и аналитика

```json
{
  "expo-analytics": "^1.2.0",
  "@amplitude/analytics-react-native": "^3.1.0",
  "@segment/analytics-react-native": "^3.5.0",
  "@mixpanel/react-native": "^3.2.0",
  "react-native-firebase": "^21.10.0",
  "@react-native-firebase/analytics": "^21.10.0",
  "@react-native-firebase/crashlytics": "^21.10.0",
  "@react-native-firebase/performance": "^21.10.0"
}
```

---

## 📚 Дополнительные утилиты

### Формы и валидация

```json
{
  "react-hook-form": "^7.56.0",
  "yup": "^1.6.0",
  "zod": "^3.24.0",
  "react-native-form-validator": "^0.6.0",
  "@hookform/resolvers": "^3.10.0"
}
```

### Сеть и API

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

```json
{
  "i18next": "^24.5.0",
  "react-i18next": "^16.2.0",
  "i18next-react-native-language-detector": "^1.1.0",
  "react-native-localize": "^3.3.0"
}
```

### Утилиты даты и времени

```json
{
  "date-fns": "^4.2.0",
  "dayjs": "^1.12.0",
  "moment": "^2.31.0",
  "react-native-calendars": "^1.1308.0",
  "react-native-date-picker": "^5.1.0"
}
```

---

## 🔒 Безопасность и хранение

```json
{
  "react-native-keychain": "^9.1.0",
  "react-native-encrypted-storage": "^5.0.0",
  "react-native-biometrics": "^3.1.0",
  "react-native-mmkv": "^3.2.0",
  "react-native-sqlite-storage": "^7.0.0",
  "watermelondb": "^0.28.0"
}
```

---

## 📊 База данных и схемы

### ORM и работа с базой данных

```json
{
  "prisma": "^6.2.0",
  "@prisma/client": "^6.2.0",
  "drizzle-orm": "^0.38.0",
  "drizzle-kit": "^0.30.0",
  "@supabase/ssr": "^0.6.0",
  "kysely": "^0.28.0"
}
```

### Валидация схем

```json
{
  "zod-to-json-schema": "^3.24.0",
  "json-schema-to-typescript": "^15.1.0",
  "@sinclair/typebox": "^0.35.0"
}
```

---

## 🎯 Совместимость версий

### Критически важные зависимости

| Библиотека | Версия | Совместимость |
|------------|--------|---------------|
| React Native | 0.81.4 | ✅ Expo SDK 54 |
| Expo | ~54.0.13 | ✅ RN 0.81.4 |
| React | 19.1.0 | ✅ RN 0.81.4 |
| TypeScript | ~5.9.2 | ✅ Все библиотеки |
| React Navigation | ^7.1.8 | ✅ RN 0.81.4 |
| Reanimated | ~4.1.1 | ✅ RN 0.81.4, Expo 54 |
| Gesture Handler | ~2.24.0 | ✅ Reanimated 4 |
| Zustand | ^5.0.3 | ✅ React 19 |
| TanStack Query | ^5.71.0 | ✅ React 19 |
| Supabase JS | ^2.51.0 | ✅ Все версии |

---

## 📝 Примечания по установке

### Базовая установка

```bash
# Создание нового проекта
npx create-expo-app obrazz --template

# Переход в директорию
cd obrazz

# Установка всех зависимостей
npm install

# Или через yarn
yarn install
```

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

### Настройка Babel

```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin',
      'nativewind/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@screens': './screens',
            '@utils': './utils',
            '@hooks': './hooks',
            '@api': './api',
            '@assets': './assets',
            '@types': './types'
          }
        }
      ]
    ]
  };
};
```

---

## 🚨 Важные замечания

1. **React Native 0.81.4** - последняя стабильная версия, полностью совместимая с Expo SDK 54
2. **React 19.1.0** - последняя версия с улучшенной производительностью
3. **Reanimated 4** требует обязательной установки `react-native-worklets`
4. **Zustand 5** имеет breaking changes по сравнению с v4, проверьте миграцию
5. **TanStack Query v5** - значительные улучшения производительности
6. **Supabase** - используйте последние версии для лучшей совместимости с Edge Functions

---

## 📞 Контакты и поддержка

При возникновении проблем с совместимостью версий обращайтесь к официальной документации каждой библиотеки или создавайте issue в репозитории проекта.

---

*Последнее обновление: 12 января 2025*
