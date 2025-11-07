# Унификация категорий одежды

**Дата:** 7 ноября 2025  
**Статус:** Завершено ✅

## Обзор

Проведена полная унификация категорий одежды во всем приложении. Теперь используется единый список категорий, который определен в одном месте и используется везде - в базе данных, TypeScript типах, UI компонентах и бизнес-логике.

## Унифицированный список категорий

```typescript
const CATEGORIES: ItemCategory[] = [
  'headwear', // головной убор
  'outerwear', // верхняя одежда
  'tops', // верх
  'bottoms', // низ
  'footwear', // обувь
  'accessories', // аксессуары
  'fullbody', // FullBody
  'other', // Другое
];
```

## Изменения в категориях

### Удалено

- `dresses` → объединено в `fullbody`
- `suits` → объединено в `fullbody`
- `bags` → объединено в `other`

### Сохранено

Все остальные категории остались без изменений:

- `headwear` (головной убор)
- `outerwear` (верхняя одежда)
- `tops` (верх)
- `bottoms` (низ)
- `footwear` (обувь)
- `accessories` (аксессуары)
- `fullbody` (FullBody - платья, костюмы)
- `other` (Другое)

## Файлы с изменениями

### 1. Константы (новый файл)

**`constants/categories.ts`** - единый источник истины для категорий

- Экспортирует `CATEGORIES` - массив всех категорий
- Экспортирует `CATEGORY_LABELS` - русские названия
- Экспортирует `CATEGORY_LABELS_EN` - английские названия
- Экспортирует `CATEGORY_ICONS` - эмодзи иконки
- Экспортирует `CATEGORY_GROUPS` - группировка для outfit creation
- Вспомогательные функции: `getCategoryLabel()`, `getCategoryIcon()`, `getCategoryInfo()`, `getAllCategoriesInfo()`

### 2. База данных

**`lib/supabase/schema.sql`**

- Обновлен CHECK constraint таблицы `items`
- Теперь допускает только 8 унифицированных категорий
- Добавлены русские комментарии

**`lib/supabase/migrations/unify_categories_2025.sql`** (новый)

- Миграция данных: `dresses` → `fullbody`
- Миграция данных: `suits` → `fullbody`
- Миграция данных: `bags` → `other`
- Обновление constraint

**`lib/supabase/migrations/fix_items_category_constraint.sql`**

- Помечен как DEPRECATED
- Заменен на `unify_categories_2025.sql`

### 3. TypeScript типы

**`types/models/item.ts`**

- Тип `ItemCategory` уже содержал правильные категории
- Никаких изменений не требуется

### 4. UI Компоненты

**`components/wardrobe/CategoryPicker.tsx`**

- Импортирует `getAllCategoriesInfo()` из `@constants/categories`
- Использует русские названия категорий
- Отображает иконки из общего источника

**`components/outfit/CategoryCarousel.tsx`**

- Импортирует `CATEGORY_LABELS` из `@constants/categories`
- Использует единые названия

**`components/outfit/CategorySelectorWithSmooth.tsx`**

- Импортирует `CATEGORY_GROUPS` из `@constants/categories`
- Использует единые группы категорий

**`components/outfit/CategoryCarouselCentered.tsx`**

- Импортирует и реэкспортирует `CATEGORY_GROUPS`

**`components/outfit/ItemSelectionStep.tsx`**

- Импортирует `CATEGORIES` из `@constants/categories`

**`components/outfit/ItemSelectionStepNew.tsx`**

- Импортирует `CATEGORIES` из `@constants/categories`

### 5. Store

**`store/outfit/outfitStore.ts`**

- Импортирует `CATEGORIES` из `@constants/categories`
- Использует для генерации начальных позиций элементов
- Использует для итерации по категориям

### 6. Конфигурация

**`tsconfig.json`**

- Добавлен alias `@constants/*` для `constants/*`

**`babel.config.js`**

- Добавлен alias `@constants` → `./constants`

**`metro.config.js`**

- Уже поддерживает все `@/*` импорты

## Инструкции по применению

### Для разработчиков

1. **Всегда импортируйте категории из `@constants/categories`:**

```typescript
import { CATEGORIES, CATEGORY_LABELS, getCategoryLabel } from '@constants/categories';
```

2. **Не создавайте локальные определения категорий** - используйте импорт

3. **Для отображения названий используйте:**

```typescript
// Русские названия (по умолчанию)
const label = getCategoryLabel(category);
// или
const label = CATEGORY_LABELS[category];

// Английские названия
const labelEn = getCategoryLabel(category, 'en');
```

4. **Для иконок:**

```typescript
const icon = getCategoryIcon(category);
// или
const icon = CATEGORY_ICONS[category];
```

### Для БД администраторов

**Необходимо выполнить миграцию:**

```sql
-- Выполните файл:
lib/supabase/migrations/unify_categories_2025.sql
```

Эта миграция:

1. Конвертирует существующие данные
2. Обновляет constraint
3. Безопасна для повторного запуска

### Проверка после применения

```sql
-- Проверьте, что все записи используют только разрешенные категории
SELECT DISTINCT category FROM public.items;

-- Должно вернуть только:
-- headwear, outerwear, tops, bottoms, footwear, accessories, fullbody, other
```

## Преимущества унификации

1. **Единый источник истины** - все категории определены в одном месте
2. **Консистентность** - одинаковые категории везде (БД, типы, UI)
3. **Легкость поддержки** - изменения в одном месте
4. **Локализация** - поддержка русских и английских названий
5. **Типобезопасность** - TypeScript проверяет использование категорий

## Будущие улучшения

- [ ] Добавить поддержку дополнительных языков (если потребуется)
- [ ] Рассмотреть возможность динамических категорий (если потребуется)
- [ ] Добавить метаданные для категорий (приоритет, порядок сортировки и т.д.)

## Контакты

При возникновении вопросов или проблем с категориями, обратитесь к этому документу и файлу `constants/categories.ts`.
