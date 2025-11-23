# 🌐 i18n Usage Guide - Obrazz

## Как использовать переводы в компонентах

### Базовое использование

```tsx
import { useTranslation } from '@hooks/useTranslation';

export default function MyScreen() {
  const { t } = useTranslation('common'); // namespace

  return (
    <View>
      <Text>{t('buttons.save')}</Text>
      <Text>{t('buttons.cancel')}</Text>
    </View>
  );
}
```

### Множественные namespace

```tsx
const { t } = useTranslation(['common', 'auth']);

<Text>{t('common:buttons.save')}</Text>
<Text>{t('auth:signIn.title')}</Text>
```

### С параметрами (интерполяция)

```tsx
<Text>{t('profile:version', { version: '1.0.0' })}</Text>
// Результат: "Версия 1.0.0"
```

### Смена языка

```tsx
import { useSettingsStore } from '@store/settings/settingsStore';
import { i18n } from '@hooks/useTranslation';

const { language, setLanguage } = useSettingsStore();

const changeLanguage = (newLang: 'ru' | 'en') => {
  setLanguage(newLang); // Сохраняет в AsyncStorage
  i18n.changeLanguage(newLang); // Применяет сразу
};
```

## Доступные namespace

- `common` - кнопки, общие действия, состояния
- `auth` - экраны авторизации
- `profile` - профиль и настройки

## Структура переводов

```
locales/
├── ru/
│   ├── common.json
│   ├── auth.json
│   └── profile.json
└── en/
    ├── common.json
    ├── auth.json
    └── profile.json
```

## Как добавить новый перевод

### 1. Добавьте в JSON файлы

**locales/ru/common.json:**

```json
{
  "buttons": {
    "newButton": "Новая кнопка"
  }
}
```

**locales/en/common.json:**

```json
{
  "buttons": {
    "newButton": "New Button"
  }
}
```

### 2. Используйте в компоненте

```tsx
const { t } = useTranslation('common');
<Button title={t('buttons.newButton')} />;
```

## Примеры из проекта

### Profile Screen

```tsx
const { t } = useTranslation('profile');

<Text>{t('header.title')}</Text> // "Мой профиль"
<Text>{t('menu.language')}</Text> // "Язык"
<Text>{t('settings.currentLanguage.ru')}</Text> // "Русский"
```

### Alert.alert с переводами

```tsx
const { t } = useTranslation('profile');

Alert.alert(t('signOut.title'), t('signOut.message'), [
  { text: t('signOut.cancel'), style: 'cancel' },
  { text: t('signOut.confirm'), style: 'destructive', onPress: handleSignOut },
]);
```

## Текущий язык

```tsx
import { useSettingsStore } from '@store/settings/settingsStore';

const { language } = useSettingsStore();
console.log(language); // 'ru' | 'en'
```

## Следующие шаги

1. ✅ Базовая инфраструктура готова
2. ⏳ Добавить переводы для Wardrobe экранов
3. ⏳ Добавить переводы для Outfit экранов
4. ⏳ Синхронизация с Supabase

---

**Автор:** GitHub Copilot  
**Дата:** 23 ноября 2025
