# Быстрые команды для сборки APK

## 🚀 Основные команды

### Локальная сборка (быстрее)

```bash
eas build --profile preview --platform android --local
```

### Облачная сборка

```bash
eas build --profile preview --platform android
```

### Проверить статус сборки

```bash
eas build:list
```

### Просмотреть подробности последней сборки

```bash
eas build:view
```

## 🔑 Настройка secrets (один раз)

Через CLI:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_supabase_url" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_anon_key" --type string
eas secret:create --scope project --name EXPO_PUBLIC_PIXIAN_API_ID --value "your_pixian_id" --type string
eas secret:create --scope project --name EXPO_PUBLIC_PIXIAN_API_SECRET --value "your_pixian_secret" --type string
```

Или через веб: https://expo.dev/accounts/artfrost/projects/obrazz/secrets

## 📦 Что было исправлено

✅ Добавлен `versionCode: 1` для Android  
✅ Настроены environment variables в `eas.json`  
✅ Preview profile сконфигурирован для APK сборки  
✅ Создана документация в [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)

## ⚠️ Важно перед первой сборкой

1. Убедитесь, что авторизованы: `eas whoami`
2. Если нет: `eas login`
3. Настройте secrets (см. выше)
4. Запустите сборку

## 🔍 Полная документация

Смотрите [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) для детальных инструкций и решения проблем.
