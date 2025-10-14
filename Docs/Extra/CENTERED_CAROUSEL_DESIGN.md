# Centered Carousel Design - Ultra Minimalist Implementation

**Date:** January 14, 2025  
**Component:** `CategoryCarouselCentered.tsx`  
**Status:** ✅ ULTRA MINIMALIST

## 📋 Описание

Реализован **ультра-минималистичный** дизайн каруселей. Никаких надписей, никаких кнопок - только **чистая лента изображений одежды**. Карусели полностью **бесшовные**, **безрамочные**, с **центральным выбором элемента**.

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

## 📐 Размеры и отступы

```typescript
const VIEW_MODE_SIZES = {
  large: { itemWidth: 220, itemHeight: 290, spacing: 6 },
  medium: { itemWidth: 170, itemHeight: 226, spacing: 5 },
  small: { itemWidth: 130, itemHeight: 173, spacing: 4 },
};

const sidePadding = (SCREEN_WIDTH - itemWidth) / 2; // Центрирование
```

**Финальные размеры (оптимизированы для количества рядов):**

- **Large:** 220x290px - комфортный просмотр (1-2 ряда на экране)
- **Medium:** 170x226px - балансный режим (2-3 ряда на экране)
- **Small:** 130x173px - максимум контента (3-4 ряда на экране)

**Минимальные spacing:**

- Large: 6px
- Medium: 5px
- Small: 4px

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
<CategorySelectorList
  categories={CATEGORIES}
  wardrobeItems={wardrobeItems}
  selectedItems={selectedItemsForCreation}
  lockedCategories={lockedCategories}
  onItemSelect={handleItemSelect}
  onLockToggle={handleLockToggle}
/>
```

### Props интерфейс

```typescript
interface CategoryCarouselCenteredProps {
  category: ItemCategory;
  items: WardrobeItem[];
  selectedItemId: string | null;
  isLocked: boolean;
  onItemSelect: (item: WardrobeItem | null) => void;
  onLockToggle: () => void;
}
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

---

**Статус:** ✅ Реализовано  
**Референс:** Скриншот из приложения "Styling"  
**Дизайн-система:** Obrazz color palette
