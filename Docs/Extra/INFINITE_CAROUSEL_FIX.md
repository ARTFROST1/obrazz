# Infinite Carousel Implementation

**Date:** January 14, 2025  
**Issue:** BUG-003  
**Status:** ✅ Resolved

## Problem

Карусели в создании образа имели критические проблемы:

1. **Баги при быстрой прокрутке** - странное поведение, глитчи
2. **Отсутствие бесконечной прокрутки** - невозможность циклически прокручивать элементы
3. **Плохой gesture handling** - резкая прокрутка без инерции
4. **Неправильная позиция** - пустой элемент не в центре

## Solution Overview

Реализована бесконечная карусель с использованием техники **дублирования элементов** (duplicate items technique) для создания seamless infinite scroll эффекта.

### Key Features

✅ **Infinite Looping** - после последнего элемента идет первый  
✅ **Smooth Scrolling** - плавная прокрутка с инерцией  
✅ **Fast Scroll Support** - нет багов при быстрой прокрутке  
✅ **Performance Optimized** - оптимизированный рендеринг

## Technical Implementation

### 1. Item Duplication Strategy

```typescript
// Базовый массив элементов
const baseItems = [{ id: 'none', isNone: true }, ...items];

// Количество дубликатов (минимум 5 или меньше если элементов мало)
const DUPLICATE_COUNT = Math.min(5, baseItems.length);

// Копируем последние элементы в начало
const duplicatedStart = baseItems.slice(-DUPLICATE_COUNT);

// Копируем первые элементы в конец
const duplicatedEnd = baseItems.slice(0, DUPLICATE_COUNT);

// Итоговый массив: [end copies, original, start copies]
const carouselItems = [...duplicatedStart, ...baseItems, ...duplicatedEnd];
```

**Пример:** Если есть элементы [A, B, C, D, E]:

- `duplicatedStart` = [A, B, C, D, E] (последние 5)
- `baseItems` = [None, A, B, C, D, E]
- `duplicatedEnd` = [None, A, B, C, D] (первые 5)
- **Result** = [A,B,C,D,E, None,A,B,C,D,E, None,A,B,C,D]

### 2. Index Mapping

```typescript
// Offset для учета дубликатов в начале
const indexOffset = DUPLICATE_COUNT;

// При скролле: визуальный индекс → логический индекс
const originalIndex =
  (((index - indexOffset) % baseItems.length) + baseItems.length) % baseItems.length;

// При инициализации: логический индекс → визуальный индекс
const targetIndex = indexOffset + initialScrollIndex;
```

### 3. Seamless Jump Handler

```typescript
const handleMomentumScrollEnd = useCallback(
  (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (itemWidth + spacing));

    // Проверяем достигли ли дубликатов
    if (index < indexOffset) {
      // В начале массива → прыгаем в конец
      isAdjustingRef.current = true;
      const adjustedIndex = baseItems.length + index;
      flatListRef.current?.scrollToIndex({
        index: adjustedIndex,
        animated: false, // БЕЗ АНИМАЦИИ = seamless
      });
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 50);
    } else if (index >= indexOffset + baseItems.length) {
      // В конце массива → прыгаем в начало
      isAdjustingRef.current = true;
      const adjustedIndex = index - baseItems.length;
      flatListRef.current?.scrollToIndex({
        index: adjustedIndex,
        animated: false,
      });
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 50);
    }
  },
  [itemWidth, spacing, indexOffset, baseItems.length],
);
```

### 4. Optimized Scroll Handler

```typescript
const handleScroll = useCallback(
  (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Пропускаем обновления во время adjustment
    if (isAdjustingRef.current) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (itemWidth + spacing));

    if (index !== centerIndex) {
      setCenterIndex(index);

      // Маппим визуальный индекс на логический
      const originalIndex =
        (((index - indexOffset) % baseItems.length) + baseItems.length) % baseItems.length;

      onScrollIndexChange?.(originalIndex);

      // Выбираем элемент по логическому индексу
      if (originalIndex === 0) {
        onItemSelect(null); // None
      } else if (originalIndex > 0 && originalIndex <= items.length) {
        const item = items[originalIndex - 1];
        if (item) onItemSelect(item);
      }
    }
  },
  [centerIndex, items, onItemSelect, itemWidth, spacing, indexOffset, baseItems.length],
);
```

### 5. FlatList Configuration

```typescript
<FlatList
  ref={flatListRef}
  data={carouselItems}
  renderItem={renderItem}
  keyExtractor={(item, index) => `${item.id}-${index}`} // Уникальные ключи!
  horizontal
  showsHorizontalScrollIndicator={false}

  // Snap behavior
  snapToInterval={itemWidth + spacing}
  decelerationRate="normal" // Изменено с "fast" для плавности

  // Scroll handlers
  onScroll={handleScroll}
  onMomentumScrollEnd={handleMomentumScrollEnd} // КЛЮЧЕВОЙ HANDLER
  scrollEventThrottle={16}

  // Layout optimization
  getItemLayout={(data, index) => ({
    length: itemWidth + spacing,
    offset: (itemWidth + spacing) * index,
    index,
  })}

  // Performance optimization
  removeClippedSubviews={false} // Важно для дубликатов!
  initialNumToRender={carouselItems.length}
  maxToRenderPerBatch={carouselItems.length}
  windowSize={carouselItems.length}
/>
```

## How It Works

### Visual Flow

```
User scrolls right continuously:
[... C D E] [None A B C D E] [None A B ...] →

When reaching duplicates at end:
                               ↓ Reached duplicate
[... C D E] [None A B C D E] [None A B C D E]
                               ↑ Jump to real item (seamless)
             [None A B C D E] [None A B ...]
```

### State Management

1. **isAdjustingRef** - флаг для предотвращения лишних обновлений во время jump
2. **centerIndex** - текущий визуальный индекс в карусели
3. **originalIndex** - логический индекс элемента (без учета дубликатов)

## Benefits

### Before Fix ❌

- Карусель останавливалась на краях
- Баги при быстрой прокрутке
- Резкая прокрутка без инерции
- Плохой UX

### After Fix ✅

- Бесконечная прокрутка в обе стороны
- Плавная работа при любой скорости прокрутки
- Естественная инерция
- Отличный UX

## Performance Considerations

### Why These Settings?

**`removeClippedSubviews={false}`**

- Предотвращает проблемы с дубликатами
- Все элементы остаются в памяти для seamless jump

**`initialNumToRender={carouselItems.length}`**

- Рендерит все элементы сразу
- Нет delay при прокрутке к дубликатам

**`decelerationRate="normal"`**

- Более естественная физика прокрутки
- Пользователь чувствует инерцию

**`keyExtractor={(item, index) => \`${item.id}-${index}\``**

- Уникальные ключи для дубликатов
- React не путает одинаковые элементы

## Edge Cases Handled

### 1. Few Items (< 5)

```typescript
const DUPLICATE_COUNT = Math.min(5, baseItems.length);
```

Если элементов меньше 5, дублируем столько, сколько есть.

### 2. Single Item

Карусель все равно работает, просто jump происходит чаще.

### 3. Fast Scrolling

`isAdjustingRef` предотвращает race conditions.

### 4. Mode Switching

При переключении режимов (all/main/extra) карусель корректно перескакивает на нужную позицию.

## Testing Guide

### Test Scenarios

1. **Slow Scroll Test**

   ```
   - Медленно прокручивайте вправо
   - После последнего элемента должен появиться первый
   - Прокрутка должна быть плавной
   ```

2. **Fast Scroll Test**

   ```
   - Быстро прокручивайте влево-вправо
   - Не должно быть глитчей или зависаний
   - Jump должен быть незаметным
   ```

3. **Momentum Test**

   ```
   - Сделайте быстрый swipe (flick)
   - Карусель должна продолжить движение по инерции
   - Остановиться на элементе (snap)
   ```

4. **Infinite Loop Test**

   ```
   - Прокрутите вправо 20+ элементов
   - Элементы должны циклически повторяться
   - Никаких ошибок или остановок
   ```

5. **Selection Test**
   ```
   - Прокрутите через границу дубликатов
   - Выбранный элемент должен корректно обновляться
   - Логический индекс должен соответствовать элементу
   ```

## Code Files Changed

### Modified Files

**`components/outfit/CategoryCarouselCentered.tsx`** - Complete refactor

Key changes:

- Lines 91-101: Item duplication logic
- Lines 86: Added `isAdjustingRef`
- Lines 103-128: Updated initialization logic
- Lines 130-157: Enhanced `handleScroll` with index mapping
- Lines 160-193: New `handleMomentumScrollEnd` handler
- Lines 260-283: Optimized FlatList props

## Best Practices for Infinite Carousels

### ✅ DO

- Use item duplication technique for true infinite scroll
- Implement `onMomentumScrollEnd` for seamless jumps
- Use refs to prevent race conditions during adjustments
- Set `animated: false` for jump operations
- Map visual indices to logical indices correctly
- Use unique keys including index: `${item.id}-${index}`

### ❌ DON'T

- Don't use `scrollEnabled={false}` during adjustments (causes jank)
- Don't use `animated: true` for seamless jumps (user sees transition)
- Don't forget to handle edge cases (few items, single item)
- Don't use `removeClippedSubviews={true}` with duplicated items
- Don't forget to account for `indexOffset` in all calculations

## Future Enhancements

Potential improvements:

- [ ] Dynamic duplicate count based on scroll velocity
- [ ] Preload adjacent items for ultra-smooth scrolling
- [ ] Add haptic feedback on snap
- [ ] Implement custom spring physics for more natural feel

## References

- [FlatList API](https://reactnative.dev/docs/flatlist)
- [Infinite Carousel Pattern](https://reactnative.dev/docs/scrollview#scrollto)
- React Native Gesture Handler docs

## Update: Smooth Momentum Scrolling (v2)

**Date:** January 14, 2025 (Evening)  
**Enhancement:** Improved carousel smoothness

### Problem with v1

Хотя бесконечная прокрутка работала, карусель была слишком резкой:

- Элементы слишком быстро "защелкивались" (snap) в центр
- `snapToInterval` создавал резкий переход
- Отсутствовала плавная инерция при быстрой прокрутке

### Solution v2: Custom Momentum-Based Snapping

#### Key Changes

1. **Удален `snapToInterval`** - источник резкого поведения
2. **Кастомный snap через `snapToNearestItem`** - плавная прокрутка к элементу
3. **Улучшенный `decelerationRate={0.988}`** - более медленное естественное замедление
4. **`handleScrollEndDrag`** - snap при низкой скорости
5. **Delayed infinite loop adjustment** - сначала snap, потом jump (через 300ms)

#### Implementation

```typescript
// Custom smooth snap function
const snapToNearestItem = useCallback(
  (offsetX: number, animated: boolean = true) => {
    const index = Math.round(offsetX / (itemWidth + spacing));
    const snapOffset = index * (itemWidth + spacing);

    flatListRef.current?.scrollToOffset({
      offset: snapOffset,
      animated, // Плавная анимация!
    });

    return index;
  },
  [itemWidth, spacing],
);

// Handle drag end - snap if velocity is low
const handleScrollEndDrag = useCallback(
  (event) => {
    const { contentOffset, velocity } = event.nativeEvent;

    // If velocity is low, snap immediately
    if (Math.abs(velocity?.x || 0) < 0.5) {
      snapToNearestItem(contentOffset.x, true);
    }
  },
  [snapToNearestItem],
);

// Handle momentum end - smooth snap then infinite loop adjust
const handleMomentumScrollEnd = useCallback(
  (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;

    // First, snap to nearest item smoothly
    const index = snapToNearestItem(offsetX, true);

    // Then check for infinite loop (after snap completes)
    setTimeout(() => {
      if (index < indexOffset || index >= indexOffset + baseItems.length) {
        // Jump to corresponding position (seamless)
        isAdjustingRef.current = true;
        const adjustedIndex = /* calculate adjusted index */;
        scrollToOffset(adjustedIndex, animated: false);
      }
    }, 300); // Wait for snap animation
  },
  [snapToNearestItem],
);
```

#### FlatList Configuration

```typescript
<FlatList
  // Removed: snapToInterval={itemWidth + spacing}
  decelerationRate={0.988} // Slower deceleration (was "normal")
  onScrollEndDrag={handleScrollEndDrag} // New handler
  onMomentumScrollEnd={handleMomentumScrollEnd}
  disableIntervalMomentum={false} // Allow natural momentum
  scrollEventThrottle={16}
  // ... other props
/>
```

### Behavior Now

**Fast Scroll:**

- User swipes quickly
- Elements scroll with momentum
- Speed gradually decreases (0.988 rate)
- When momentum ends, smoothly snaps to nearest element
- After snap completes (300ms), infinite loop adjustment happens seamlessly

**Slow Scroll:**

- User drags slowly
- When finger lifts (velocity < 0.5), immediate smooth snap
- Natural and responsive

**Benefits:**

- 🌊 **Smooth as butter** - natural physics-based motion
- ⚡ **Fast scroll friendly** - no jarring snaps during momentum
- 🎯 **Precise** - always snaps to center when stopped
- 🔄 **Seamless loop** - infinite scroll works perfectly
- 💯 **Modern UX** - feels like native iOS/Android carousels

### Technical Details

**`decelerationRate={0.988}`**

- Value between 0-1 (higher = slower deceleration)
- 0.988 provides natural feel
- iOS "normal" = 0.998, "fast" = 0.99
- Android "normal" = 0.985, "fast" = 0.9
- We use 0.988 for cross-platform smoothness

**Snap Timing**

- Snap happens in `onMomentumScrollEnd` (when momentum naturally ends)
- OR in `onScrollEndDrag` if velocity is low (< 0.5)
- Infinite loop adjustment delayed by 300ms to let snap animation finish

**Memory Management**

- `scrollEndTimerRef` for delayed adjustments
- Cleanup in useEffect to prevent memory leaks
- Clears timer on unmount and when new scroll starts

## Conclusion

Реализация бесконечной карусели через дублирование элементов обеспечивает:

- 🔄 Seamless infinite scrolling
- ⚡ Smooth performance even with fast scrolling
- 🎯 Accurate item selection
- 💯 Great UX with natural momentum
- 🌊 **v2: Buttery smooth physics-based scrolling**

Все баги с быстрой прокруткой устранены, карусель работает плавно и стабильно с естественной инерцией.
