# Centered Carousel Design - Ultra Minimalist Implementation with 3-Mode Display System

**Date:** January 15, 2025  
**Component:** `CategoryCarouselCentered.tsx`  
**Status:** ✅ ULTRA MINIMALIST + 3-MODE CATEGORY DISPLAY

## 📋 Описание

Реализован **ультра-минималистичный** дизайн каруселей с **системой 3-х режимов отображения категорий**. Никаких надписей, никаких кнопок - только **чистая лента изображений одежды**. Карусели полностью **бесшовные**, **безрамочные**, с **центральным выбором элемента** и **автоматическим масштабированием** под количество видимых категорий.

## 🎯 Ключевые особенности

### 1. Ультра-минимализм

- **❌ Никаких надписей** - убраны названия категорий
- **❌ Никаких кнопок** - убраны pin-кнопки
- **❌ Никаких индикаторов** - убраны точки под элементами
- **✅ Только лента изображений** - чистый визуальный ряд

### 2. Центральный выбор (Center-based Selection)

- **Центральный элемент = выбранный элемент**
- Автоматический выбор при прокрутке
- Snap-to-center анимация
- Легкий scale эффект (1.05x) для центрального элемента

### 3. "None" элемент слева

- **Самый левый элемент = "Нет выбора"**
- Только иконка "X" (без текста)
- Пунктирная рамка для отличия
- При выборе вызывает `onItemSelect(null)`

### 4. Максимальное использование пространства

- Элементы занимают **всю высоту** карусели
- Минимальный spacing между элементами (8/6/4px)
- Никаких padding или margin
- Items без закругленных углов (borderRadius: 0)

## 🎨 Система 3-х режимов отображения категорий

### Режимы отображения

#### 1. **All (Все категории)**

- **Категории:** Все 7 категорий
- **Иконка:** `apps` (сетка)
- **Поведение:** Отображает все категории, высота автоматически подгоняется так, чтобы все помещались без прокрутки
- **Категории:** headwear, outerwear, tops, bottoms, footwear, accessories, bags

#### 2. **Main (Основные)**

- **Категории:** 4 основные категории одежды
- **Иконка:** `shirt` (рубашка)
- **Поведение:** Показывает только основные элементы гардероба, высота увеличивается для лучшей видимости
- **Категории:** outerwear, tops, bottoms, footwear

#### 3. **Extra (Дополнительные)**

- **Категории:** 3 категории аксессуаров
- **Иконка:** `diamond` (бриллиант)
- **Поведение:** Показывает аксессуары и дополнения, максимальная высота элементов
- **Категории:** headwear, accessories, bags

### Динамическое вычисление размеров

```typescript
export function calculateItemDimensions(
  numberOfCategories: number,
  availableHeight: number,
): { itemWidth: number; itemHeight: number; spacing: number } {
  const heightPerCategory = availableHeight / numberOfCategories;
  const spacing = Math.max(4, Math.min(6, heightPerCategory * 0.02));
  const itemHeight = Math.floor(heightPerCategory - spacing);
  const itemWidth = Math.floor(itemHeight * 0.75); // 3:4 aspect ratio

  return {
    itemWidth: Math.max(100, Math.min(250, itemWidth)),
    itemHeight: Math.max(130, Math.min(330, itemHeight)),
    spacing: Math.floor(spacing),
  };
}
```

### Расчёт доступной высоты

```typescript
const HEADER_HEIGHT = 96;
const PROGRESS_HEIGHT = 50;
const FOOTER_HEIGHT = 160;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - PROGRESS_HEIGHT - FOOTER_HEIGHT;
```

**Примерные размеры элементов (на экране ~800px):**

- **All режим (7 категорий):** ~70px высота → ~52x70px элементы
- **Main режим (4 категории):** ~123px высота → ~92x123px элементы
- **Extra режим (3 категории):** ~165px высота → ~124x165px элементы

_Соотношение сторон 3:4 (ширина:высота) для естественного отображения одежды_

## 🎨 Цветовая палитра (Obrazz)

```typescript
// Background
Background: #FFFFFF
Surface: #F8F8F8

// Text
Primary: #000000
Secondary: #666666
Disabled: #999999

// Borders
Separator: #F0F0F0
Border: #E5E5E5

// Selection
Indicator: #000000 (черная точка)
```

## 🔄 Логика работы

### Scroll обработка

```typescript
const handleScroll = (event) => {
  const offsetX = event.nativeEvent.contentOffset.x;
  const index = Math.round(offsetX / (ITEM_SIZE + ITEM_SPACING));

  if (index === 0) {
    // "None" selected
    onItemSelect(null);
  } else {
    // Item selected
    const item = items[index - 1];
    onItemSelect(item);
  }
};
```

### Структура данных

```typescript
// First item is always "None"
const carouselItems = [
  { id: 'none', isNone: true },
  ...items, // actual wardrobe items
];
```

### Snap to center

```typescript
<FlatList
  snapToInterval={ITEM_SIZE + ITEM_SPACING}
  decelerationRate="fast"
  scrollEventThrottle={16}
/>
```

## 🎭 Визуальные эффекты

### 1. Scale эффект для центрального элемента

```typescript
itemContainerCentered: {
  transform: [{ scale: 1.05 }],
}
```

### 2. Индикатор выбора

```typescript
<View style={styles.centerIndicator}>
  <View style={styles.indicatorDot} />
</View>
```

### 3. Плавная прокрутка

- `decelerationRate="fast"` - быстрое замедление
- `snapToInterval` - snap к элементам
- `scrollEventThrottle={16}` - плавное отслеживание

## 📱 Ультра-минималистичный Layout

```
┌────────────────────────────────────┐
│ ████████████████████████████████  │ ← Только лента элементов
│ █ X █ █👔█ █👕█ █👖█ █👗█ █🧥█  │   (NO header, NO buttons)
│ ████████████████████████████████  │
│ ████████████████████████████████  │ ← Следующая карусель
│ █ X █ █👖█ █👖█ █👖█ █👖█ █👖█  │   (NO separator)
│ ████████████████████████████████  │
│ ████████████████████████████████  │ ← Следующая карусель
│ █ X █ █👟█ █👟█ █👟█ █👟█ █👟█  │   (Seamless flow)
│ ████████████████████████████████  │
└────────────────────────────────────┘
    ↑
    Центральный = Выбранный (scale 1.05x)
```

**Убрано:**

- ❌ Category Name (название категории)
- ❌ Pin-кнопка (📌)
- ❌ Индикатор под центром (●)
- ❌ Separator между каруселями
- ❌ Любые padding и отступы

**Осталось:**

- ✅ Только изображения одежды
- ✅ Центральный элемент слегка увеличен
- ✅ Левый элемент "X" для отмены выбора

## 🔧 Использование

### В ItemSelectionStep

```typescript
const [displayMode, setDisplayMode] = useState<CategoryDisplayMode>('all');

<CategorySelectorList
  categories={CATEGORIES}
  wardrobeItems={wardrobeItems}
  selectedItems={selectedItemsForCreation}
  lockedCategories={lockedCategories}
  displayMode={displayMode}
  onItemSelect={handleItemSelect}
  onLockToggle={handleLockToggle}
/>
```

### Переключатель режимов

```typescript
<View style={styles.displayModeSwitcher}>
  <TouchableOpacity onPress={() => setDisplayMode('all')}>
    <Ionicons name="apps" size={20} />
    <Text>All</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setDisplayMode('main')}>
    <Ionicons name="shirt" size={20} />
    <Text>Main</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setDisplayMode('extra')}>
    <Ionicons name="diamond" size={20} />
    <Text>Extra</Text>
  </TouchableOpacity>
</View>
```

### Props интерфейс

```typescript
interface CategoryCarouselCenteredProps {
  category: ItemCategory;
  items: WardrobeItem[];
  selectedItemId: string | null;
  isLocked: boolean;
  itemWidth: number;
  itemHeight: number;
  spacing: number;
  onItemSelect: (item: WardrobeItem | null) => void;
  onLockToggle: () => void;
}

interface CategorySelectorListProps {
  categories: ItemCategory[];
  wardrobeItems: WardrobeItem[];
  selectedItems: Record<ItemCategory, WardrobeItem | null>;
  lockedCategories: Set<ItemCategory>;
  displayMode: CategoryDisplayMode;
  onItemSelect: (category: ItemCategory, item: WardrobeItem | null) => void;
  onLockToggle: (category: ItemCategory) => void;
}
```

### Синхронизация выбора между режимами

**Важно:** Выбор элементов полностью синхронизирован между всеми режимами. Состояние хранится в `selectedItemsForCreation` (Record) в `outfitStore`:

```typescript
// При переключении между режимами выбор сохраняется
setDisplayMode('all'); // Показывает все 7 категорий с их выбором
setDisplayMode('main'); // Показывает 4 категории, но выбор тот же
setDisplayMode('extra'); // Показывает 3 категории, но выбор тот же

// Пример:
// Если в режиме 'main' выбрали tops и bottoms
// При переключении в 'all' эти элементы остаются выбранными
// При переключении в 'extra' можно выбрать headwear
// Возвращаясь в 'main' - tops и bottoms всё ещё выбраны
```

## ⚡ Performance оптимизации

### 1. getItemLayout

```typescript
getItemLayout={(data, index) => ({
  length: ITEM_SIZE + ITEM_SPACING,
  offset: (ITEM_SIZE + ITEM_SPACING) * index,
  index,
})}
```

- Улучшает производительность FlatList
- Быстрый скролл к элементам

### 2. Мемоизация callback

```typescript
const handleScroll = useCallback(
  (event) => {
    // ...
  },
  [centerIndex, items, onItemSelect],
);
```

### 3. scrollEventThrottle

```typescript
scrollEventThrottle={16}
```

- 60 FPS отслеживание
- Плавная анимация

## 📊 Отличия от старой версии

### Было (CategoryCarousel)

- ✗ Карусели в рамках
- ✗ Выбор по клику
- ✗ Маленькие items (80x80px)
- ✗ Кнопка lock в рамке
- ✗ Явное указание "selected"

### Стало (CategoryCarouselCentered)

- ✅ Бесшовные карусели
- ✅ Выбор по центрированию
- ✅ Большие items (200x200px)
- ✅ Минималистичная pin-кнопка
- ✅ Индикатор под центром

## 🎯 UX улучшения

1. **Интуитивность:** Центральный элемент всегда видно
2. **Быстрота:** Свайп для выбора вместо тапа
3. **Визуальная чистота:** Нет лишних рамок и borders
4. **Фокус:** Увеличенные items, лучшая видимость
5. **Feedback:** Точка под центром показывает выбор

## 🚀 Возможные улучшения

- [ ] Haptic feedback при snap
- [ ] Blur эффект на боковых элементах
- [ ] Анимация scale более плавная
- [ ] Lazy loading для больших коллекций
- [ ] Skeleton loaders при загрузке

## 📝 Примечания

### Совместимость

- Старый `CategoryCarousel` сохранен для других экранов
- Новый используется только в `ItemSelectionStep`
- Оба компонента работают параллельно

### Тестирование

Проверить:

- Скролл и snap
- Выбор "None"
- Pin/Unpin категорий
- Работа с пустыми категориями
- Performance на больших списках
- **Переключение между режимами отображения**
- **Сохранение выбора при переключении режимов**
- **Автоматическое масштабирование элементов**
- **Отсутствие прокрутки в каждом режиме**

## 🎯 Преимущества новой системы

### До изменений (ViewMode)

- ❌ 3 режима меняли только размер элементов
- ❌ Все категории всегда видны
- ❌ Требовалась прокрутка для просмотра всех категорий
- ❌ Фиксированные размеры не учитывали доступное пространство

### После изменений (DisplayMode)

- ✅ 3 режима фильтруют категории по смыслу
- ✅ Видны только нужные категории в каждом режиме
- ✅ Все категории текущего режима помещаются без прокрутки
- ✅ Динамическое масштабирование под доступное пространство
- ✅ Выбор синхронизирован между всеми режимами
- ✅ Улучшенный UX - быстрое переключение между группами категорий

### Примеры использования

1. **Создание базового образа:** Используйте режим "Main" для выбора основных элементов (верх, низ, обувь)
2. **Добавление аксессуаров:** Переключитесь в "Extra" для добавления шапки, сумки, украшений
3. **Общий обзор:** Режим "All" показывает весь выбор целиком

---

**Статус:** ✅ Реализовано (3-Mode Display System)  
**Дата обновления:** 15 января 2025  
**Референс:** Скриншот из приложения "Styling"  
**Дизайн-система:** Obrazz color palette
