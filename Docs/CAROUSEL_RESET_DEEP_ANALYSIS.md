# 🔍 ГЛУБОКИЙ АНАЛИЗ: СБРОС КАРУСЕЛЕЙ И ПРОКРУТКА

**Дата:** 2025-11-09 22:41  
**Проблема:** Карусели сбрасываются на 0-ой элемент при смене вкладок и редактировании

---

## 🚨 ОПИСАНИЕ ПРОБЛЕМ

### Проблема #1: Сброс при смене вкладок

```
1. User: Basic tab, scrolls tops to shirt (index 5)
2. User: Switch to Dress tab
3. User: Switch back to Basic tab
4. ❌ Result: tops carousel reset to index 0
```

### Проблема #2: Неправильная прокрутка при edit

```
1. User: Edit outfit (shirt should be at index 5)
2. ❌ Result: tops carousel at index 0
3. ❌ Shirt not visible
```

---

## 🔎 ROOT CAUSE ANALYSIS

### 🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА #1: React Component Reuse

**Файл:** `components/outfit/CategorySelectorWithSmooth.tsx` (строка 202)

```typescript
{visibleCategories.map((category, slotIndex) => {
  return (
    <View key={`carousel-${slotIndex}`} style={...}> {/* ❌ ПРОБЛЕМА! */}
      <SmoothCarousel
        category={category}
        items={categoryItems}
        initialScrollIndex={initialIndex}
      />
    </View>
  );
})}
```

**Что происходит:**

#### Scenario: Basic → Dress → Basic

**Basic tab:**

```
categories = ['tops', 'bottoms', 'footwear']
Keys:
  - carousel-0 → SmoothCarousel(tops, items=[20 tops])
  - carousel-1 → SmoothCarousel(bottoms, items=[15 bottoms])
  - carousel-2 → SmoothCarousel(footwear, items=[10 footwear])
```

**Switch to Dress:**

```
categories = ['fullbody', 'footwear', 'accessories']
Keys:
  - carousel-0 → SmoothCarousel(fullbody, items=[8 fullbody])
  - carousel-1 → SmoothCarousel(footwear, items=[10 footwear])
  - carousel-2 → SmoothCarousel(accessories, items=[5 accessories])

React reconciliation:
  ✅ carousel-0 exists → REUSE component (tops → fullbody)
  ✅ carousel-1 exists → REUSE component (bottoms → footwear)
  ✅ carousel-2 exists → REUSE component (footwear → accessories)
```

**❌ ПРОБЛЕМА:** React видит те же ключи и **переиспользует компоненты** вместо создания новых!

**Switch back to Basic:**

```
categories = ['tops', 'bottoms', 'footwear']
Keys:
  - carousel-0 → SmoothCarousel(tops, items=[20 tops])
  - carousel-1 → SmoothCarousel(bottoms, items=[15 bottoms])
  - carousel-2 → SmoothCarousel(footwear, items=[10 footwear])

React reconciliation:
  ✅ carousel-0 exists → REUSE component (fullbody → tops) ❌
      Internal state from fullbody сохранен!
      initialScrollIndex может быть старым!
```

**Результат:**

- Компонент SmoothCarousel НЕ размонтируется
- useEffect с initialScrollIndex может не запуститься
- Внутреннее состояние (scrollOffset, centerIndex) сохраняется
- Карусель показывает неправильную позицию

---

### 🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА #2: useEffect Dependencies

**Файл:** `components/outfit/SmoothCarousel.tsx` (строка 319)

```typescript
// Initialize scroll position
useEffect(() => {
  if (flatListRef.current && carouselItems.length > 0) {
    const initialIndex = indexOffset + (initialScrollIndex % items.length);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * (itemWidth + spacing),
        animated: false,
      });
      setCenterIndex(initialIndex);
    }, 50);
  }
}, [initialScrollIndex, itemWidth, spacing, indexOffset, items.length, carouselItems.length]);
//  ❌ НЕТ category!
//  ❌ НЕТ items themselves!
```

**Проблема:**

1. **Зависимость от items.length вместо items:**

   ```
   Basic tops: 20 items
   Dress fullbody: 20 items (тот же length!)

   → items.length не изменился
   → useEffect НЕ запустится ❌
   → Карусель не пересоздастся
   ```

2. **Нет category в зависимостях:**

   ```
   Component reused: tops → fullbody
   category prop changed: 'tops' → 'fullbody'

   → category не в dependencies
   → useEffect не знает что данные изменились ❌
   ```

3. **initialScrollIndex может не измениться:**

   ```
   Basic tops: initialScrollIndex=5 (shirt)
   Switch to Dress: initialScrollIndex=5 (из кеша slotScrollIndexes[0])

   → initialScrollIndex не изменился (оба 5)
   → useEffect НЕ запустится ❌
   ```

---

### 🚨 ПРОБЛЕМА #3: Cache Key Structure

**Файл:** `components/outfit/CategorySelectorWithSmooth.tsx` (строка 83)

```typescript
const [slotScrollIndexes, setSlotScrollIndexes] = useState<Record<number, number>>({});
```

**Структура кеша:**

```typescript
{
  0: 5,  // slotIndex 0 → scroll position 5
  1: 7,  // slotIndex 1 → scroll position 7
  2: 2,  // slotIndex 2 → scroll position 2
}
```

**Проблема при смене вкладок:**

**Basic tab:**

```typescript
slotScrollIndexes = {
  0: 5, // tops → shirt at index 5
  1: 7, // bottoms → jeans at index 7
  2: 2, // footwear → sneakers at index 2
};
```

**Switch to Dress:**

```typescript
// Categories change, но slotIndexes те же!
categories = ['fullbody', 'footwear', 'accessories']

// Карусель 0 (fullbody) получает initialIndex из кеша:
initialIndex = slotScrollIndexes[0] ?? getInitialScrollIndex(0, fullbodyItems)
            = 5 ❌ (было для tops!)

// Карусель fullbody скроллится к индексу 5
// Но там может быть совершенно другая вещь!
```

**❌ ПРОБЛЕМА:** Кеш использует slotIndex, который означает РАЗНЫЕ категории на разных вкладках!

---

### 🚨 ПРОБЛЕМА #4: Selected Items Tracking

**Текущая логика** (строки 131-167):

```typescript
useEffect(() => {
  const changedSlots: number[] = [];

  selectedItems.forEach((item, slotIndex) => {
    const prevItem = prevSelectedItemsRef.current[slotIndex];
    const itemChanged = item?.id !== prevItem?.id;

    if (itemChanged && item !== null) {
      changedSlots.push(slotIndex);
    }
  });

  if (changedSlots.length > 0) {
    // Clear cache for changed slots
    setSlotScrollIndexes((prev) => {
      const next = { ...prev };
      changedSlots.forEach((slot) => delete next[slot]);
      return next;
    });
  }

  prevSelectedItemsRef.current = [...selectedItems];
}, [selectedItems]);
```

**Проблема при смене вкладок:**

**Basic tab:**

```typescript
selectedItems = [shirt, jeans, sneakers];
prevSelectedItemsRef.current = [shirt, jeans, sneakers];
```

**Switch to Dress (with sync):**

```typescript
// outfitStore.setActiveTab синхронизирует selectedItems
selectedItems = [null, sneakers, null]  // сохранил footwear
prevSelectedItemsRef.current = [shirt, jeans, sneakers]  // старое

// useEffect detects changes:
slot 0: shirt?.id !== null?.id → changed ✅
slot 1: jeans?.id !== sneakers?.id → changed ✅
slot 2: sneakers?.id !== null?.id → changed ✅

// Clears cache for all slots: [0, 1, 2] ✅
```

**Switch back to Basic:**

```typescript
// outfitStore.setActiveTab синхронизирует обратно
selectedItems = [shirt, jeans, sneakers]  // восстановлено
prevSelectedItemsRef.current = [null, sneakers, null]  // из Dress

// useEffect detects changes:
slot 0: null?.id !== shirt?.id → changed ✅
slot 1: sneakers?.id !== jeans?.id → changed ✅
slot 2: null?.id !== sneakers?.id → changed ✅

// Clears cache: [0, 1, 2] ✅
```

**✅ ЭТА ЛОГИКА ПРАВИЛЬНАЯ!** Но она не помогает из-за проблем #1 и #2!

---

## 📊 COMBINED EFFECT

### Scenario: Basic → Dress → Basic (shirt at index 5)

```
1. Basic tab
   - carousel-0 (tops) scrolled to index 5 (shirt)
   - cache: {0: 5, 1: 7, 2: 2}
   - selectedItems: [shirt, jeans, sneakers]

2. Switch to Dress
   - selectedItems synced: [null, sneakers, null]
   - useEffect clears cache: {}
   - Re-render with initialIndex from getInitialScrollIndex

   BUT:
   ❌ React REUSES carousel-0 component (tops → fullbody)
   ❌ useEffect dependencies not changed (items.length same?)
   ❌ useEffect doesn't run
   ❌ Carousel keeps old scroll position

3. Switch back to Basic
   - selectedItems synced: [shirt, jeans, sneakers]
   - useEffect clears cache: {}
   - Re-render with initialIndex=5 from getInitialScrollIndex

   BUT:
   ❌ React REUSES carousel-0 component (fullbody → tops)
   ❌ initialScrollIndex=5 (same as before? depends on items.length)
   ❌ useEffect might not run
   ❌ Carousel at wrong position
```

---

## 🎯 ROOT CAUSES SUMMARY

1. **❌ React component reuse:** Ключи основаны на slotIndex, компоненты переиспользуются
2. **❌ Missing dependencies:** useEffect не зависит от category и items
3. **❌ Cache key collision:** slotScrollIndexes использует slotIndex вместо category+tab
4. **❌ Items.length ambiguity:** Разные категории могут иметь одинаковое количество items

---

## ✅ РЕШЕНИЯ

### Solution #1: Уникальные ключи каруселей

**Изменить:** `components/outfit/CategorySelectorWithSmooth.tsx` (строка 202)

```typescript
// Было:
<View key={`carousel-${slotIndex}`}>

// Должно быть:
<View key={`carousel-${tabType}-${category}-${slotIndex}`}>
```

**Почему это работает:**

- Каждая комбинация tab+category+slot получает уникальный ключ
- React создает НОВЫЙ компонент при смене вкладки
- Компонент размонтируется и заново монтируется
- useEffect с initialScrollIndex запускается заново
- Старое состояние не сохраняется

### Solution #2: Добавить category в dependencies

**Изменить:** `components/outfit/SmoothCarousel.tsx` (строка 319)

```typescript
// Было:
}, [initialScrollIndex, itemWidth, spacing, indexOffset, items.length, carouselItems.length]);

// Должно быть:
}, [category, initialScrollIndex, itemWidth, spacing, indexOffset, items.length, carouselItems.length]);
```

**Почему это работает:**

- Даже если React переиспользует компонент (не должно с fix #1)
- useEffect запустится при изменении category
- Карусель пересоздастся с новыми данными

### Solution #3: Улучшенная структура кеша

**Изменить:** `components/outfit/CategorySelectorWithSmooth.tsx` (строка 83)

```typescript
// Было:
const [slotScrollIndexes, setSlotScrollIndexes] = useState<Record<number, number>>({});

// Должно быть:
const [scrollCache, setScrollCache] = useState<Record<string, number>>({});

// Usage:
const cacheKey = `${tabType}-${category}-${slotIndex}`;
const initialIndex = scrollCache[cacheKey] ?? getInitialScrollIndex(slotIndex, categoryItems);

// On scroll:
setScrollCache((prev) => ({
  ...prev,
  [cacheKey]: newIndex,
}));
```

**Почему это работает:**

- Каждая комбинация tab+category+slot имеет свой кеш
- tops на Basic и fullbody на Dress - разные ключи
- Нет конфликтов при смене вкладок
- При возврате на Basic tops восстанавливается правильная позиция

### Solution #4: Clear cache on tab change

**Добавить:** `components/outfit/CategorySelectorWithSmooth.tsx`

```typescript
// Track tab changes
const prevTabTypeRef = useRef<OutfitTabType>(tabType);

useEffect(() => {
  if (prevTabTypeRef.current !== tabType) {
    console.log('🔄 [CategorySelector] Tab changed, preserving cache');
    prevTabTypeRef.current = tabType;
    // Cache automatically handled by new key structure
  }
}, [tabType]);
```

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Critical Fixes (высокий приоритет)

1. ✅ Fix #1: Уникальные ключи каруселей
2. ✅ Fix #2: Добавить category в dependencies
3. ✅ Fix #3: Улучшенная структура кеша

### Phase 2: Improvements

4. ✅ Добавить детальное логирование
5. ✅ Тестирование всех сценариев

---

## 🧪 TEST CASES

### Test 1: Tab switching preserves positions

```
1. Basic tab: scroll tops to index 5
2. Switch to Dress
3. Switch back to Basic
4. Verify: tops still at index 5 ✅
```

### Test 2: Edit mode scrolls to correct items

```
1. Edit outfit (shirt at index 5)
2. Verify: tops carousel scrolled to index 5 ✅
3. Verify: shirt visible in center ✅
```

### Test 3: Multiple tab switches

```
1. Basic: tops=5, bottoms=7, footwear=2
2. Dress: select items
3. All: select items
4. Custom: select items
5. Back to Basic
6. Verify: tops=5, bottoms=7, footwear=2 ✅
```

### Test 4: Cache isolation

```
1. Basic: tops=5
2. Dress: fullbody=10
3. Back to Basic
4. Verify: tops=5 (not 10) ✅
```

---

## 🚀 EXPECTED RESULTS

После всех фиксов:

### ✅ Tab switching:

- Позиции каруселей сохраняются для каждой вкладки
- Нет конфликтов между вкладками
- Быстрое переключение без сброса

### ✅ Edit mode:

- Карусели прокручиваются к правильным вещам
- Вещи видны в центре
- Правильная вкладка открывается

### ✅ Cache management:

- Независимые позиции для каждой tab+category
- Нет сбросов при переключении
- Правильная очистка при изменении selectedItems

---

**Готов к выполнению всех фиксов пошагово!**
