# 🌐 План реализации мультиязычности (i18n) для Obrazz

**Дата:** 23 ноября 2025  
**Статус:** Планирование  
**Языки:** Русский (RU) + Английский (EN)

---

## 📋 Анализ текущего состояния

### ✅ Что уже есть

1. **Частичная поддержка языков:**
   - `constants/categories.ts` - есть `CATEGORY_LABELS` (ru) и `CATEGORY_LABELS_EN` (en)
   - `getCategoryLabel(category, lang)` функция с параметром языка
   - База данных: `users.locale` колонка в Supabase
   - `UserPreferences.language: 'en' | 'ru'` в типах

2. **Готовая структура:**
   - Папка `locales/` создана (пустая, только `.gitkeep`)
   - Path alias `@locales` настроен в `tsconfig.json` и `babel.config.js`
   - `STORAGE_KEYS.LANGUAGE` константа определена

3. **UI элементы:**
   - В `profile.tsx` есть кнопка "Language" (строка 125-131)
   - Пока функционал не реализован

### ❌ Чего нет

1. **Нет i18n библиотеки** - в `package.json` не установлены i18next пакеты
2. **Нет store для настроек** - `settingsStore` или `preferencesStore` отсутствует
3. **Хардкод текстов** - все строки в компонентах хардкожены
4. **Нет файлов переводов** - локали пустые

---

## 🎯 Архитектура решения

### Выбор библиотеки: i18next + react-i18next

**Обоснование:**

- Стандарт для React Native (упомянут в `Docs/TechStack.md`)
- Поддерживает namespace для масштабируемости
- Async загрузка переводов
- Плагин для определения языка устройства

**Пакеты для установки:**

```json
{
  "i18next": "^23.7.0",
  "react-i18next": "^13.5.0",
  "i18next-browser-languagedetector": "^7.2.0"
}
```

### Структура хранения переводов

```
locales/
├── ru/
│   ├── common.json          # Общие кнопки, действия
│   ├── auth.json            # Экраны авторизации
│   ├── wardrobe.json        # Гардероб
│   ├── outfit.json          # Создание образов
│   ├── profile.json         # Профиль и настройки
│   ├── categories.json      # Категории одежды
│   └── errors.json          # Ошибки и уведомления
└── en/
    ├── common.json
    ├── auth.json
    ├── wardrobe.json
    ├── outfit.json
    ├── profile.json
    ├── categories.json
    └── errors.json
```

**Преимущества:**

- Легко найти нужный перевод
- Удобно редактировать
- Автоматическое code-splitting

---

## 🔧 Пошаговая реализация

### **Шаг 1: Установка зависимостей**

**Файл:** `package.json`

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

**Время:** 5 минут

---

### **Шаг 2: Создание Settings Store**

**Файл:** `store/settings/settingsStore.ts` (новый)

**Что делает:**

- Хранит текущий язык (`language: 'ru' | 'en'`)
- Хранит тему (`theme: 'light' | 'dark' | 'system'`)
- Персистентность через `zustand + AsyncStorage`
- Синхронизация с Supabase `users.preferences`

**Пример:**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage';

interface SettingsState {
  language: 'ru' | 'en';
  theme: 'light' | 'dark' | 'system';
  setLanguage: (lang: 'ru' | 'en') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ru', // Дефолт
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
```

**Время:** 15 минут

---

### **Шаг 3: Настройка i18next**

**Файл:** `lib/i18n/config.ts` (новый)

**Что делает:**

- Инициализирует i18next
- Подключает все namespace
- Определяет язык из settingsStore или системы
- Fallback на русский

**Пример:**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '@store/settings/settingsStore';

// Импорты переводов
import ru_common from '@locales/ru/common.json';
import ru_auth from '@locales/ru/auth.json';
// ... остальные ru

import en_common from '@locales/en/common.json';
import en_auth from '@locales/en/auth.json';
// ... остальные en

const resources = {
  ru: {
    common: ru_common,
    auth: ru_auth,
    // ...
  },
  en: {
    common: en_common,
    auth: en_auth,
    // ...
  },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: useSettingsStore.getState().language || 'ru',
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

**Время:** 20 минут

---

### **Шаг 4: Создание JSON файлов переводов**

**Файлы:** `locales/ru/*.json` и `locales/en/*.json`

**Приоритет контента:**

1. **common.json** - кнопки (Save, Cancel, Delete, etc.)
2. **auth.json** - экраны входа/регистрации
3. **profile.json** - профиль и настройки
4. **wardrobe.json** - гардероб
5. **outfit.json** - создание образов
6. **categories.json** - категории (уже есть частично)
7. **errors.json** - Alert.alert тексты

**Пример `locales/ru/common.json`:**

```json
{
  "buttons": {
    "save": "Сохранить",
    "cancel": "Отмена",
    "delete": "Удалить",
    "edit": "Редактировать",
    "create": "Создать",
    "close": "Закрыть",
    "confirm": "Подтвердить",
    "back": "Назад",
    "next": "Далее",
    "done": "Готово"
  },
  "actions": {
    "loading": "Загрузка...",
    "saving": "Сохранение...",
    "deleting": "Удаление..."
  }
}
```

**Пример `locales/ru/auth.json`:**

```json
{
  "welcome": {
    "title": "Добро пожаловать в Obrazz",
    "subtitle": "Ваш личный модный ассистент",
    "features": {
      "ai": "AI-рекомендации образов",
      "wardrobe": "Управление цифровым гардеробом",
      "create": "Создавайте кастомные образы",
      "community": "Делитесь с сообществом"
    },
    "signIn": "Войти",
    "signUp": "Создать аккаунт"
  },
  "signIn": {
    "title": "С возвращением",
    "subtitle": "Войдите, чтобы продолжить",
    "email": "Email",
    "password": "Пароль",
    "forgotPassword": "Забыли пароль?",
    "signInButton": "Войти",
    "noAccount": "Нет аккаунта?",
    "signUpLink": "Зарегистрироваться"
  }
  // ... и т.д.
}
```

**Аналогично для английского в `locales/en/`**

**Время:** 2-3 часа (можно распределить по экранам)

---

### **Шаг 5: Создание хука useTranslation**

**Файл:** `hooks/useTranslation.ts` (новый)

**Что делает:**

- Обертка над `react-i18next` хуком
- Типобезопасность для namespace
- Удобный доступ к переводам

**Пример:**

```typescript
import { useTranslation as useI18nTranslation } from 'react-i18next';

export type Namespace =
  | 'common'
  | 'auth'
  | 'wardrobe'
  | 'outfit'
  | 'profile'
  | 'categories'
  | 'errors';

export const useTranslation = (ns?: Namespace) => {
  return useI18nTranslation(ns);
};
```

**Время:** 10 минут

---

### **Шаг 6: Интеграция в \_layout.tsx**

**Файл:** `app/_layout.tsx`

**Что добавить:**

- Импорт `lib/i18n/config`
- Синхронизация языка из settingsStore при запуске
- Слушатель изменений языка

**Изменения:**

```typescript
import '@lib/i18n/config'; // В начале файла

// В RootLayoutNav:
const { language } = useSettingsStore();

useEffect(() => {
  i18n.changeLanguage(language);
}, [language]);
```

**Время:** 10 минут

---

### **Шаг 7: Рефакторинг экранов авторизации**

**Файлы:**

- `app/(auth)/welcome.tsx`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(auth)/forgot-password.tsx`

**Пример до/после:**

**До:**

```tsx
<Text style={styles.title}>Welcome Back</Text>
<Text style={styles.subtitle}>Sign in to continue</Text>
```

**После:**

```tsx
const { t } = useTranslation('auth');

<Text style={styles.title}>{t('signIn.title')}</Text>
<Text style={styles.subtitle}>{t('signIn.subtitle')}</Text>
```

**Также заменить:**

- Alert.alert тексты
- Placeholder в Input
- Кнопки (title prop)

**Время:** 1 час

---

### **Шаг 8: Реализация Language Picker в профиле**

**Файл:** `app/(tabs)/profile.tsx`

**Что добавить:**

- Modal с выбором языка
- State для открытия/закрытия
- Обработчик смены языка

**Код:**

```tsx
import { useSettingsStore } from '@store/settings/settingsStore';
import { useTranslation } from '@hooks/useTranslation';

const { language, setLanguage } = useSettingsStore();
const { t, i18n } = useTranslation('profile');
const [showLanguagePicker, setShowLanguagePicker] = useState(false);

const handleLanguageChange = (newLang: 'ru' | 'en') => {
  setLanguage(newLang);
  i18n.changeLanguage(newLang);
  setShowLanguagePicker(false);
};

// В JSX:
<TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguagePicker(true)}>
  <View style={styles.menuItemLeft}>
    <Ionicons name="language-outline" size={24} color="#000" />
    <Text style={styles.menuItemText}>{t('settings.language')}</Text>
  </View>
  <Text style={styles.currentValue}>{language === 'ru' ? 'Русский' : 'English'}</Text>
  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
</TouchableOpacity>;

{
  /* Modal для выбора языка */
}
<Modal visible={showLanguagePicker} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.languageModal}>
      <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>

      <TouchableOpacity onPress={() => handleLanguageChange('ru')}>
        <Text style={language === 'ru' ? styles.selectedLang : styles.lang}>🇷🇺 Русский</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleLanguageChange('en')}>
        <Text style={language === 'en' ? styles.selectedLang : styles.lang}>🇬🇧 English</Text>
      </TouchableOpacity>

      <Button title={t('common:buttons.close')} onPress={() => setShowLanguagePicker(false)} />
    </View>
  </View>
</Modal>;
```

**Время:** 30 минут

---

### **Шаг 9: Рефакторинг Wardrobe экранов**

**Файлы:**

- `app/(tabs)/wardrobe.tsx`
- `app/add-item.tsx`
- `app/item/[id].tsx`
- `components/wardrobe/*`

**Что перевести:**

- Заголовки экранов
- Placeholder в поисках
- Кнопки фильтрации
- Empty states
- Alert messages

**Пример:**

```tsx
const { t } = useTranslation('wardrobe');

<Text style={styles.emptyTitle}>{t('empty.title')}</Text>
<Text style={styles.emptyMessage}>{t('empty.message')}</Text>
```

**Время:** 1.5 часа

---

### **Шаг 10: Рефакторинг Outfit экранов**

**Файлы:**

- `app/(tabs)/outfits.tsx`
- `app/outfit/create.tsx`
- `app/outfit/[id].tsx`
- `components/outfit/*`

**Что перевести:**

- Шаги создания ("Step 1", "Step 2")
- Названия табов (Basic, Dress, All, Custom)
- Модальные окна сохранения
- Dropdown опции (Occasion, Style, Season)
- Alert.alert тексты

**Особенность:**
Категории уже имеют функцию `getCategoryLabel(category, lang)` - использовать её!

**Пример:**

```tsx
const { language } = useSettingsStore();

{
  categories.map((cat) => <Text>{getCategoryLabel(cat, language)}</Text>);
}
```

**Время:** 2 часа

---

### **Шаг 11: Рефакторинг UI компонентов**

**Файлы:**

- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/outfit/OutfitEmptyState.tsx`

**Что сделать:**

- Добавить props для переводов (если нужно)
- Дефолтные значения через i18n

**Пример `OutfitEmptyState.tsx`:**

```tsx
const { t } = useTranslation('outfit');

interface OutfitEmptyStateProps {
  title?: string;
  message?: string;
  ctaText?: string;
}

export const OutfitEmptyState: React.FC<OutfitEmptyStateProps> = ({
  title = t('empty.title'),
  message = t('empty.message'),
  ctaText = t('empty.createButton'),
  ...
}) => { ... }
```

**Время:** 45 минут

---

### **Шаг 12: Синхронизация с Supabase**

**Файл:** `services/auth/authService.ts`

**Что добавить:**

- При signUp/signIn записывать `locale` в БД
- При getUser читать `preferences.language` и обновлять settingsStore

**Пример:**

```typescript
// При успешном входе:
const userPreferences = userData.preferences;
if (userPreferences?.language) {
  useSettingsStore.getState().setLanguage(userPreferences.language);
}

// При изменении языка в UI:
const updateUserLanguage = async (newLang: 'ru' | 'en') => {
  await supabase
    .from('users')
    .update({
      preferences: {
        ...currentPreferences,
        language: newLang,
      },
    })
    .eq('id', userId);
};
```

**Время:** 30 минут

---

### **Шаг 13: Обновление категорий**

**Файл:** `constants/categories.ts`

**Что изменить:**

- Убрать хардкод `CATEGORY_LABELS`
- Заменить на импорт из `locales/ru/categories.json`
- Использовать `i18n.t()` вместо объектов

**Опционально:** Можно оставить как есть, т.к. уже есть `getCategoryLabel(cat, lang)`

**Время:** 15 минут

---

### **Шаг 14: Тестирование**

**Что проверить:**

1. ✅ Переключение языка в профиле меняет все тексты
2. ✅ Язык сохраняется после перезапуска приложения
3. ✅ Новый пользователь видит язык по умолчанию (ru)
4. ✅ Категории отображаются на правильном языке
5. ✅ Alert.alert на правильном языке
6. ✅ Placeholder, кнопки, заголовки - всё переведено
7. ✅ Edit mode outfit сохраняет свой язык (не зависит от текущего)

**Методика:**

- Создать образ на русском
- Переключить язык на английский
- Открыть образ - все метаданные на русском (как сохранили)
- UI элементы на английском

**Время:** 1 час

---

### **Шаг 15: Документация**

**Файл:** `Docs/i18n_guide.md` (новый)

**Содержимое:**

- Как добавить новый перевод
- Как добавить новый язык
- Структура namespace
- Примеры использования

**Время:** 30 минут

---

## 📊 Общая оценка времени

| Этап                           | Время           |
| ------------------------------ | --------------- |
| Шаг 1: Установка               | 5 мин           |
| Шаг 2: Settings Store          | 15 мин          |
| Шаг 3: i18n config             | 20 мин          |
| Шаг 4: JSON переводы           | 3 часа          |
| Шаг 5: Хук                     | 10 мин          |
| Шаг 6: Layout интеграция       | 10 мин          |
| Шаг 7: Auth экраны             | 1 час           |
| Шаг 8: Language Picker         | 30 мин          |
| Шаг 9: Wardrobe экраны         | 1.5 часа        |
| Шаг 10: Outfit экраны          | 2 часа          |
| Шаг 11: UI компоненты          | 45 мин          |
| Шаг 12: Supabase синхронизация | 30 мин          |
| Шаг 13: Категории              | 15 мин          |
| Шаг 14: Тестирование           | 1 час           |
| Шаг 15: Документация           | 30 мин          |
| **ИТОГО**                      | **~11.5 часов** |

**Рекомендация:** Разделить на 2-3 сессии по 4 часа.

---

## 🎯 Приоритизация

### Фаза 1 (MVP - 4 часа):

- Шаги 1-6: Инфраструктура
- Шаг 8: Language Picker
- Шаг 7: Auth экраны
- Базовые переводы (common, auth, profile)

### Фаза 2 (Полная поддержка - 5 часов):

- Шаги 9-11: Все экраны
- Полные переводы (wardrobe, outfit, categories, errors)

### Фаза 3 (Доработка - 2.5 часа):

- Шаги 12-15: Синхронизация, тестирование, документация

---

## 🔍 Особенности реализации

### 1. Backward Compatibility

**Проблема:** Старые образы могут не иметь языковой метаданной.

**Решение:**

```typescript
// В outfitService.ts
const outfitLanguage = outfit.metadata?.language || 'ru'; // Дефолт
```

### 2. Категории в разных языках

**Текущая реализация:**

```typescript
getCategoryLabel(category, lang);
```

**Использование:**

```tsx
const { language } = useSettingsStore();

{
  categories.map((cat) => <Text>{getCategoryLabel(cat, language)}</Text>);
}
```

### 3. Alert.alert

**Проблема:** React Native Alert.alert принимает строки, не компоненты.

**Решение:**

```tsx
const { t } = useTranslation('errors');

Alert.alert(t('deleteOutfit.title'), t('deleteOutfit.message'), [
  { text: t('common:buttons.cancel'), style: 'cancel' },
  { text: t('common:buttons.delete'), style: 'destructive', onPress: handleDelete },
]);
```

### 4. Плюрализация

**Для случаев "1 item", "2 items", "5 items":**

```json
// locales/en/wardrobe.json
{
  "itemsCount": "{{count}} item",
  "itemsCount_other": "{{count}} items"
}
```

```tsx
t('wardrobe:itemsCount', { count: items.length });
```

### 5. Интерполяция

**Для динамических значений:**

```json
{
  "greeting": "Hello, {{name}}!"
}
```

```tsx
t('common:greeting', { name: user.name });
```

---

## 📝 Чеклист перед запуском

- [ ] package.json обновлен с i18next
- [ ] settingsStore создан
- [ ] i18n config инициализирован
- [ ] Все JSON файлы переводов созданы
- [ ] Хук useTranslation работает
- [ ] \_layout.tsx интегрирован
- [ ] Language Picker в профиле работает
- [ ] Все экраны переведены
- [ ] Категории на обоих языках
- [ ] Alert.alert переведены
- [ ] Supabase синхронизация настроена
- [ ] Тесты пройдены
- [ ] Документация написана

---

## 🚀 Запуск

После завершения всех шагов:

```bash
# 1. Установить зависимости
npm install

# 2. Очистить кэш
npx expo start -c

# 3. Запустить на эмуляторе
npx expo start --android
# или
npx expo start --ios
```

---

## 📚 Полезные ссылки

- [i18next документация](https://www.i18next.com/)
- [react-i18next документация](https://react.i18next.com/)
- [Expo локализация](https://docs.expo.dev/guides/localization/)

---

**Автор плана:** GitHub Copilot  
**Последнее обновление:** 23 ноября 2025
