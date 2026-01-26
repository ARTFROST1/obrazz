# 🧭 Navigation Refactor Plan — Unified Library Screen

> **Дата создания:** 26 января 2026  
> **Автор:** AI Assistant  
> **Статус:** Планирование  
> **Приоритет:** Высокий (следующий этап разработки)

---

## 📋 Executive Summary

Глобальный рефакторинг навигации приложения Obrazz:

1. **Объединение Гардероба и Образов** в единый экран "Библиотека" с верхними вкладками
2. **Новый Bottom Navigation:** 3 вкладки + отдельная кнопка "+"
3. **Контекстная кнопка "+":** разное поведение на разных экранах
4. **Плавные переходы:** смена темы (светлая ↔ тёмная) при переключении вкладок

---

## 🎯 Цели рефакторинга

### Бизнес-цели:

- Упростить навигацию (4 таба → 3 таба)
- Освободить место для AI-функций на главной странице
- Улучшить UX через контекстную кнопку "+"

### Технические цели:

- Создать переиспользуемую архитектуру для верхних вкладок
- Реализовать плавную анимацию смены темы
- Подготовить инфраструктуру для AI-функций

---

## 📐 Архитектура

### Текущая структура (Before)

```
Bottom Navigation (4 tabs):
┌──────────┬──────────┬──────────┬──────────┐
│   Home   │ Wardrobe │  Outfits │ Profile  │
└──────────┴──────────┴──────────┴──────────┘

Каждый таб — отдельный экран с FAB внутри
```

### Новая структура (After)

```
Bottom Navigation (3 tabs + отдельная кнопка)
┌──────────┬──────────┬──────────┬────┐
│   Home   │ Library  │ Profile  │ +  │
└──────────┴──────────┴──────────┴────┘
                                   ↑
                        Отдельная кнопка, не часть TabBar

Library Screen (внутри):
┌─────────────────────────────────────────┐
│  [Search] ••• [Menu]                    │  ← Общий header
├───────────────┬─────────────────────────┤
│   Гардероб    │        Образы           │  ← Segment Control / Tabs
├───────────────┴─────────────────────────┤
│                                         │
│   [Контент активной вкладки]            │
│                                         │
└─────────────────────────────────────────┘
     СВЕТЛАЯ тема        ТЁМНАЯ тема
```

---

## 🎨 Дизайн-спецификация

### 1. Bottom Navigation

**Структура:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌───────────────────────────────────┐   ┌─────────────────┐  │
│   │  🏠 Home  │  📚 Library │ 👤 Profile │   │       +       │  │
│   └───────────────────────────────────┘   └─────────────────┘  │
│                                                                 │
│   ← 3 вкладки TabBar →                       ← Отдельная кнопка │
└─────────────────────────────────────────────────────────────────┘
```

**Поведение кнопки "+":**

| Экран            | Действие кнопки "+"                                      |
| ---------------- | -------------------------------------------------------- |
| Home             | Раскрывает меню AI-функций (4 опции)                     |
| Library/Гардероб | Открывает `/add-item` (добавление вещи)                  |
| Library/Образы   | Открывает `/outfit/create` (создание образа)             |
| Profile          | **Скрывается** с плавной анимацией, TabBar растягивается |

**Анимация на Profile:**

```
Обычное состояние:           На Profile:
┌─────────────────┬────┐     ┌─────────────────────────┐
│ Tab1 Tab2 Tab3  │ +  │  →  │   Tab1   Tab2   Tab3    │
└─────────────────┴────┘     └─────────────────────────┘
```

### 2. Library Screen — Верхние вкладки

**Segment Control (iOS-like):**

```
Light Theme (Гардероб):              Dark Theme (Образы):
┌─────────────────────────┐          ┌─────────────────────────┐
│  ┌────────────┬───────┐ │          │  ┌───────┬────────────┐ │
│  │ 👕 Гардероб│ Образы│ │          │  │Гардероб│ 🎨 Образы │ │
│  └────────────┴───────┘ │          │  └───────┴────────────┘ │
│   Фон: белый            │          │   Фон: чёрный           │
└─────────────────────────┘          └─────────────────────────┘
```

**Параметры Segment Control:**

- Стиль: iOS 17+ Segmented Control с подсветкой
- Высота: 36-40pt
- Ширина: ~90% экрана с отступами
- Расположение: под search bar
- Анимация переключения: 300ms ease-in-out

### 3. Смена темы при переключении

**Анимируемые элементы:**

```typescript
const animatedTheme = {
  // Background
  backgroundColor: interpolate(progress, [0, 1], ['#FFFFFF', '#000000']),

  // Status Bar
  statusBarStyle: progress > 0.5 ? 'light-content' : 'dark-content',

  // Header
  headerBgColor: interpolate(progress, [0, 1], ['#FFFFFF', '#000000']),
  headerTextColor: interpolate(progress, [0, 1], ['#000000', '#FFFFFF']),

  // Segment Control
  segmentBgColor: interpolate(progress, [0, 1], ['#F2F2F7', '#2C2C2E']),
  segmentActiveColor: interpolate(progress, [0, 1], ['#FFFFFF', '#3A3A3C']),
  segmentTextColor: interpolate(progress, [0, 1], ['#000000', '#FFFFFF']),

  // Content
  cardBgColor: interpolate(progress, [0, 1], ['#F5F5F5', '#1C1C1E']),
  textColor: interpolate(progress, [0, 1], ['#000000', '#FFFFFF']),
};
```

---

## 🔧 Техническая реализация

### Файловая структура

```
app/
├── (tabs)/
│   ├── _layout.tsx           # ← ИЗМЕНИТЬ: 3 таба вместо 4
│   ├── index.tsx             # Home — без изменений
│   ├── library.tsx           # ← НОВЫЙ: объединённый экран
│   ├── profile.tsx           # Profile — без изменений
│   ├── wardrobe.tsx          # ← УДАЛИТЬ (перенести логику в library)
│   └── outfits.tsx           # ← УДАЛИТЬ (перенести логику в library)

components/
├── navigation/
│   ├── BottomNavigation.tsx  # ← НОВЫЙ: кастомный TabBar с кнопкой "+"
│   ├── FloatingPlusButton.tsx # ← НОВЫЙ: отдельная кнопка "+"
│   └── PlusActionSheet.tsx   # ← НОВЫЙ: раскрывающееся меню для Home
│
├── library/                  # ← НОВАЯ ПАПКА
│   ├── LibraryTabs.tsx       # Segment Control с анимацией
│   ├── LibraryHeader.tsx     # Общий header с поиском
│   ├── WardrobeTab.tsx       # Контент вкладки Гардероб
│   ├── OutfitsTab.tsx        # Контент вкладки Образы
│   └── ThemeProvider.tsx     # Context для анимированной темы
```

### Компоненты

#### 1. BottomNavigation.tsx

```typescript
interface BottomNavigationProps {
  currentRoute: 'home' | 'library' | 'profile';
  onPlusPress: () => void;
  showPlusButton: boolean; // false на Profile
}

// iOS: NativeTabs с кастомизацией
// Android: Custom implementation с анимацией
```

#### 2. FloatingPlusButton.tsx

```typescript
interface FloatingPlusButtonProps {
  visible: boolean;
  onPress: () => void;
  // Позиция привязана к правому краю TabBar
}

// Анимация появления/скрытия через react-native-reanimated
// При visible=false: scale + opacity → 0
// TabBar анимированно расширяется вправо
```

#### 3. LibraryTabs.tsx

```typescript
interface LibraryTabsProps {
  activeTab: 'wardrobe' | 'outfits';
  onTabChange: (tab: 'wardrobe' | 'outfits') => void;
}

// Использует react-native-pager-view для свайпов между вкладками
// Анимация темы через shared values
```

#### 4. ThemeProvider.tsx (для Library screen)

```typescript
interface AnimatedThemeContextValue {
  progress: SharedValue<number>; // 0 = wardrobe (light), 1 = outfits (dark)
  colors: {
    background: DerivedValue<string>;
    text: DerivedValue<string>;
    card: DerivedValue<string>;
    // ...
  };
}

// Все компоненты внутри Library используют этот context
// для плавной анимации цветов
```

---

## 🔄 Миграция данных

### Состояние

Текущие сторы остаются без изменений:

- `wardrobeStore.ts` — состояние гардероба
- `outfitStore.ts` — состояние образов

Новый стор:

```typescript
// store/library/libraryStore.ts
interface LibraryState {
  activeTab: 'wardrobe' | 'outfits';
  setActiveTab: (tab: 'wardrobe' | 'outfits') => void;
}
```

### Роутинг

```typescript
// Удаляемые роуты:
// - /(tabs)/wardrobe
// - /(tabs)/outfits

// Новые роуты:
// - /(tabs)/library (с внутренними вкладками)
```

---

## 📱 Поведение кнопки "+" на Home

### AI-функции из The New Black

При нажатии "+" на Home раскрывается ActionSheet/Bottom Sheet:

```
┌─────────────────────────────────────────┐
│                                         │
│   ✨ Создать с AI                       │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  👗 Virtual Try-On              │   │
│   │  Примерить вещь на своё фото    │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  🧍 AI Fashion Model            │   │
│   │  Создать образ на AI-модели     │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  🎨 Clothing Variations         │   │
│   │  Вариации дизайна вещи          │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  ✏️ Edit Photo                  │   │
│   │  Изменить одежду на фото        │   │
│   └─────────────────────────────────┘   │
│                                         │
│                [ Отмена ]               │
│                                         │
└─────────────────────────────────────────┘
```

**Пока AI не реализовано:** Показывать placeholder экраны с описанием будущего функционала и кнопкой "Скоро".

---

## 🏠 Изменения на Home Screen

На Home также будут карточки для быстрого доступа к AI-функциям:

```
┌─────────────────────────────────────────┐
│                                         │
│  Shopping Stories                       │
│  [карусель магазинов]                   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🤖 AI-функции           [Все →]        │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Try-On│ │Model │ │Variat│ │ Edit │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Остальной контент...]                 │
│                                         │
└─────────────────────────────────────────┘
```

Те же 4 функции, что и в ActionSheet от "+".

---

## 📋 План реализации по этапам

### Этап 1: Подготовка инфраструктуры (1-2 дня)

- [ ] Создать `components/navigation/` директорию
- [ ] Создать `components/library/` директорию
- [ ] Создать `store/library/libraryStore.ts`
- [ ] Добавить новые типы в `types/navigation/`

### Этап 2: Bottom Navigation с "+" (2-3 дня)

- [ ] Создать `FloatingPlusButton.tsx` с анимацией
- [ ] Модифицировать `app/(tabs)/_layout.tsx`:
  - [ ] Убрать wardrobe и outfits вкладки
  - [ ] Добавить library вкладку
  - [ ] Интегрировать FloatingPlusButton
- [ ] Реализовать анимацию скрытия кнопки "+" на Profile
- [ ] Тестирование на iOS и Android

### Этап 3: Library Screen с вкладками (3-4 дня)

- [ ] Создать `LibraryTabs.tsx` (Segment Control)
- [ ] Создать `ThemeProvider.tsx` для анимации темы
- [ ] Создать `app/(tabs)/library.tsx`:
  - [ ] Интегрировать PagerView для свайпов
  - [ ] Подключить анимацию смены темы
- [ ] Перенести логику из `wardrobe.tsx` в `WardrobeTab.tsx`
- [ ] Перенести логику из `outfits.tsx` в `OutfitsTab.tsx`
- [ ] Объединить общие элементы в `LibraryHeader.tsx`

### Этап 4: Контекстное поведение "+" (1-2 дня)

- [ ] Создать `PlusActionSheet.tsx` для Home
- [ ] Связать "+" с add-item на вкладке Гардероб
- [ ] Связать "+" с outfit/create на вкладке Образы
- [ ] Создать placeholder экраны для AI-функций

### Этап 5: Полировка и тестирование (2-3 дня)

- [ ] Оптимизация анимаций
- [ ] Тестирование на разных устройствах
- [ ] Проверка edge cases (быстрые переключения, прерывания)
- [ ] Accessibility review
- [ ] Удаление старых файлов (wardrobe.tsx, outfits.tsx)

### Этап 6: AI-функции placeholders (1 день)

- [ ] Создать экраны-заглушки для AI-функций
- [ ] Добавить AI-карточки на Home
- [ ] Обновить документацию

---

## ⚠️ Риски и митигация

### Риск 1: Сложность анимации смены темы

**Проблема:** Плавный переход между светлой и тёмной темой требует оптимизации
**Митигация:** Использовать `react-native-reanimated` worklets, избегать JS bridge

### Риск 2: Потеря состояния при переключении вкладок

**Проблема:** PagerView может пересоздавать компоненты
**Митигация:** Использовать `offscreenPageLimit` и правильное кэширование в Zustand

### Риск 3: Platform differences (iOS vs Android)

**Проблема:** Разное поведение TabBar на платформах
**Митигация:** Создать полностью кастомный TabBar для единообразия

### Риск 4: Performance на старых устройствах

**Проблема:** Анимации могут тормозить
**Митигация:** Тестирование на реальных устройствах, useNativeDriver везде

---

## 📊 Метрики успеха

- [ ] Плавная анимация (60fps) при переключении вкладок
- [ ] Время смены темы < 300ms
- [ ] Нет видимых glitches при быстром переключении
- [ ] Корректная работа на iOS 15+ и Android 10+
- [ ] Все существующие тесты проходят

---

## 📚 Связанная документация

- [PRDobrazz.md](../PRDobrazz.md) — Требования к продукту
- [Implementation.md](../Implementation.md) — План реализации
- [THE_NEW_BLACK_AI_SERVICE_ANALYSIS.md](../Extra/Features/THE_NEW_BLACK_AI_SERVICE_ANALYSIS.md) — AI-функции
- [UI_UX_doc.md](../UI_UX_doc.md) — Дизайн-система

---

## 🔄 История изменений

| Дата       | Версия | Изменения           |
| ---------- | ------ | ------------------- |
| 2026-01-26 | 1.0    | Первоначальный план |
