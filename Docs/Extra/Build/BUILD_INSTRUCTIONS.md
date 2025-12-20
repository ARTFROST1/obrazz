# Инструкция по сборке APK через EAS Build

## Предварительная подготовка

### 1. Проверьте наличие .env файла

Убедитесь, что файл `.env` существует в корне проекта и содержит все необходимые переменные:

```bash
# Обязательные переменные для работы приложения
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PIXIAN_API_ID=your_pixian_api_id
EXPO_PUBLIC_PIXIAN_API_SECRET=your_pixian_api_secret
```

### 2. Установите EAS CLI (если еще не установлен)

```bash
npm install -g eas-cli
```

### 3. Авторизуйтесь в Expo

```bash
eas login
```

## Сборка Preview APK (Рекомендуется для тестирования)

### Вариант 1: Локальная сборка (быстрее, но требует Android SDK)

```bash
eas build --profile preview --platform android --local
```

### Вариант 2: Облачная сборка (медленнее, но не требует локальной настройки)

```bash
eas build --profile preview --platform android
```

## Процесс сборки

1. EAS CLI загрузит ваш проект на серверы Expo
2. Будет создан APK с профилем preview
3. После завершения вы получите ссылку для скачивания APK
4. Скачайте APK и установите на Android устройство

## Что было настроено

✅ Добавлен `versionCode: 1` в Android конфигурацию  
✅ Настроены environment variables для каждого build profile  
✅ Preview profile настроен для создания APK (не AAB)  
✅ Gradle сконфигурирован для Release сборки

## Важные замечания

### Переменные окружения

Все переменные из `.env` файла **НЕ** загружаются автоматически в EAS Build.  
Вам нужно настроить secrets через EAS:

```bash
# Добавить секреты для preview профиля
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_value" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_value" --type string
eas secret:create --scope project --name EXPO_PUBLIC_PIXIAN_API_ID --value "your_value" --type string
eas secret:create --scope project --name EXPO_PUBLIC_PIXIAN_API_SECRET --value "your_value" --type string
```

Либо добавьте секреты через веб-интерфейс:
https://expo.dev/accounts/artfrost/projects/obrazz/secrets

### Debug Keystore

⚠️ **ВНИМАНИЕ:** Сейчас для production сборки используется debug keystore.  
Для публикации в Google Play нужно создать production keystore:

```bash
# Создание production keystore (когда будете готовы к публикации)
eas credentials
# Выберите Android -> Production -> Keystore -> Generate new keystore
```

### Размер APK

Ожидаемый размер APK: ~50-80 MB  
Если нужно уменьшить:

- Включите ProGuard (уже настроен в preview)
- Включите shrinkResources
- Используйте AAB вместо APK для Google Play

### Тестирование сборки

После получения APK:

1. Установите на физическое Android устройство
2. Проверьте работу всех функций (камера, галерея, Supabase)
3. Проверьте фоновое удаление (Pixian API)
4. Протестируйте создание и сохранение образов

## Решение проблем

### Ошибка "Build failed"

- Проверьте логи в EAS Dashboard
- Убедитесь, что все зависимости в package.json совместимы
- Попробуйте очистить кэш: `eas build:cancel` и запустить заново

### Ошибка "Application not installed"

- У вас уже установлена версия с другой подписью
- Удалите старую версию и установите заново

### APK не запускается

- Проверьте, что все secrets настроены в EAS
- Проверьте логи через `adb logcat`

## Следующие шаги

После успешной preview сборки:

1. Протестируйте APK на нескольких устройствах
2. Соберите feedback от тестеров
3. При необходимости создайте production keystore
4. Подготовьте приложение к публикации в Google Play

---

**Project ID:** 9d046cfa-467c-49e4-9098-9c864d1295c6  
**Owner:** artfrost  
**Package:** com.artfrost.obrazz
