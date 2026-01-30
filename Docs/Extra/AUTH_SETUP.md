# Настройка OAuth в Supabase для Obrazz

## Обзор

Obrazz использует Supabase Auth для аутентификации на всех платформах:

- **Мобильное приложение** (iOS/Android) — React Native + Expo
- **Веб-сайт** (Dashboard) — Ruby on Rails

Поддерживаемые методы входа:

1. ✅ Email + Password
2. ✅ Google OAuth
3. ✅ Apple Sign-In

---

## 1. Настройка Supabase Dashboard

### 1.1 Email Authentication

Email/Password включен по умолчанию. Проверьте настройки:

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект Obrazz
3. Перейдите в **Authentication** → **Providers**
4. Убедитесь, что **Email** включен
5. Настройки:
   - Enable email confirmations: **OFF** (для упрощения регистрации)
   - Secure email change: **ON**
   - Enable double confirm: **OFF**

### 1.2 Google OAuth

1. **Создайте Google OAuth credentials:**
   - Откройте [Google Cloud Console](https://console.cloud.google.com/)
   - Создайте проект или выберите существующий
   - Перейдите в **APIs & Services** → **Credentials**
   - Нажмите **Create Credentials** → **OAuth client ID**
   - Тип: **Web application**
   - Authorized redirect URIs:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
   - Скопируйте **Client ID** и **Client Secret**

2. **Настройте Supabase:**
   - В Supabase Dashboard → **Authentication** → **Providers**
   - Включите **Google**
   - Вставьте Client ID и Client Secret
   - Сохраните

### 1.3 Apple Sign-In

1. **Создайте Apple Sign-In credentials:**
   - Откройте [Apple Developer Console](https://developer.apple.com/account)
   - Перейдите в **Certificates, Identifiers & Profiles**
   - Выберите **Identifiers** → **+** → **Services IDs**
   - Создайте Service ID с:
     - Identifier: `com.artfrost.obrazz.auth` (или подобный)
     - Enable "Sign In with Apple"
     - Configure domains:
       - Domain: `YOUR_SUPABASE_PROJECT.supabase.co`
       - Return URL: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Создайте ключ в **Keys** → **+**:
     - Включите "Sign In with Apple"
     - Скачайте `.p8` файл
     - Запомните Key ID и Team ID

2. **Настройте Supabase:**
   - В Supabase Dashboard → **Authentication** → **Providers**
   - Включите **Apple**
   - Заполните:
     - Service ID: `com.artfrost.obrazz.auth`
     - Team ID: (из Apple Developer Account)
     - Key ID: (от созданного ключа)
     - Private Key: (содержимое `.p8` файла)
   - Сохраните

---

## 2. Настройка Rails Backend

### 2.1 Environment Variables

Добавьте в `.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

### 2.2 Redirect URLs

Добавьте в Supabase Dashboard → **Authentication** → **URL Configuration**:

**Site URL:**

```
https://your-domain.com
```

**Redirect URLs:**

```
https://your-domain.com/auth/oauth/callback
https://your-domain.com/auth/callback
http://localhost:3000/auth/oauth/callback
http://localhost:3000/auth/callback
```

---

## 3. Настройка Mobile App

### 3.1 Environment Variables

В `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3.2 URL Scheme

Приложение использует URL scheme `obrazz://` для OAuth callback.

Добавьте в Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**:

```
obrazz://auth/callback
exp://YOUR_IP:8081/--/auth/callback  (для Expo Go)
```

### 3.3 Apple Sign-In (iOS)

Для нативного Apple Sign-In на iOS:

1. В Apple Developer Console → **Identifiers** → выберите App ID
2. Включите **Sign In with Apple** capability
3. В Xcode → Target → **Signing & Capabilities** → **+ Capability** → **Sign In with Apple**

### 3.4 Сборка

После изменений в конфигурации:

```bash
# Очистить кэш
npx expo start --clear

# Для development builds
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

---

## 4. Архитектура аутентификации

### Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                      ПОЛЬЗОВАТЕЛЬ                           │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   MOBILE APP           │    │   WEB DASHBOARD (Rails)       │
│   (React Native)       │    │                               │
│                        │    │                               │
│ • Email/Password       │    │ • Email/Password             │
│ • Google (WebBrowser)  │    │ • Google (OAuth redirect)    │
│ • Apple (Native iOS)   │    │ • Apple (OAuth redirect)     │
└────────────────────────┘    └──────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH                             │
│                                                              │
│  • Единый источник истины для пользователей                 │
│  • JWT токены с 1 час expiry                                │
│  • Refresh tokens с 7 дней expiry                           │
│  • OAuth провайдеры (Google, Apple)                         │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    RAILS BACKEND                             │
│                                                              │
│  • Валидация JWT токенов                                    │
│  • Синхронизация пользователей в локальную БД              │
│  • Welcome bonus (3 токена новым пользователям)            │
└─────────────────────────────────────────────────────────────┘
```

### Важные файлы

**Mobile App:**

- `services/auth/authService.ts` — Email/Password аутентификация
- `services/auth/oauthService.ts` — Google/Apple OAuth
- `lib/supabase/client.ts` — Supabase клиент
- `store/auth/authStore.ts` — Состояние аутентификации

**Rails Backend:**

- `app/controllers/dashboard/sessions_controller.rb` — Вход
- `app/controllers/dashboard/registrations_controller.rb` — Регистрация
- `app/controllers/dashboard/oauth_controller.rb` — OAuth
- `app/services/auth/supabase_auth_client.rb` — Supabase API клиент
- `app/services/auth/supabase_jwt_service.rb` — JWT валидация

---

## 5. Тестирование

### 5.1 Local Development

**Mobile App:**

```bash
npx expo start
# Сканируйте QR код в Expo Go
# OAuth redirect работает через exp:// scheme
```

**Rails:**

```bash
bin/dev
# Откройте http://localhost:3000/login
```

### 5.2 Проверки

1. **Email регистрация:**
   - Зарегистрируйтесь на сайте
   - Войдите с теми же данными в приложении
   - ✅ Данные синхронизированы

2. **Google OAuth:**
   - Войдите через Google на сайте
   - Войдите через Google в приложении
   - ✅ Один и тот же пользователь

3. **Apple Sign-In:**
   - Войдите через Apple в приложении (iOS)
   - Войдите через Apple на сайте
   - ✅ Один и тот же пользователь

---

## 6. Troubleshooting

### OAuth не работает

1. Проверьте Redirect URLs в Supabase Dashboard
2. Проверьте credentials провайдера
3. Смотрите логи в Rails: `tail -f log/development.log`

### Apple Sign-In не работает на iOS

1. Проверьте entitlements в Xcode
2. Убедитесь, что App ID включает Sign In with Apple
3. Проверьте Service ID в Supabase

### "Invalid token" ошибка

1. Проверьте `SUPABASE_JWT_SECRET` в .env
2. Убедитесь, что используется тот же secret, что в Supabase Dashboard

---

## 7. Версии и зависимости

**Mobile:**

- expo: 55.0.0-preview.6
- @supabase/supabase-js: 2.51.0
- expo-auth-session: ~6.1.3
- expo-apple-authentication: ~7.2.3
- expo-web-browser: ~55.0.2

**Rails:**

- Ruby: 3.3.6
- Rails: 8.0.4
- jwt gem (для валидации Supabase JWT)
- httparty gem (для Supabase Auth API)
