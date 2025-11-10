# 📋 ПЛАН: ИСПРАВЛЕНИЕ СБРОСА КАРУСЕЛЕЙ

**Дата:** 2025-11-09 22:41  
**Основа:** CAROUSEL_RESET_DEEP_ANALYSIS.md

---

## 🎯 ЦЕЛЬ

Полностью исправить сброс каруселей:

1. ✅ Сохранение позиций при смене вкладок
2. ✅ Правильная прокрутка при редактировании
3. ✅ Изоляция кеша между вкладками

---

## 🔧 ДЕТАЛЬНЫЙ ПЛАН ИСПРАВЛЕНИЙ

### ✅ FIX #1: Уникальные ключи каруселей

**Файл:** `components/outfit/CategorySelectorWithSmooth.tsx`  
**Строка:** 202

**Было:**

```typescript
<View key={`carousel-${slotIndex}`} style={...}>
```

**Должно быть:**

```typescript
<View key={`carousel-${tabType}-${category}-${slotIndex}`} style={...}>
```

**Почему:**

- React создает новый компонент при смене вкладки
- Старое состояние не переиспользуется
- Каждая вкладка имеет свои компоненты

**Пример:**

```
Basic:
  - carousel-basic-tops-0
  - carousel-basic-bottoms-1
  - carousel-basic-footwear-2

Dress:
  - carousel-dress-fullbody-0
  - carousel-dress-footwear-1
  - carousel-dress-accessories-2

→ ВСЕ РАЗНЫЕ ключи → React создает новые компоненты ✅
```

---

### ✅ FIX #2: Category в dependencies

**Файл:** `components/outfit/SmoothCarousel.tsx`  
**Строка:** 319

**Было:**

```typescript
}, [initialScrollIndex, itemWidth, spacing, indexOffset, items.length, carouselItems.length]);
```

**Должно быть:**

```typescript
}, [category, initialScrollIndex, itemWidth, spacing, indexOffset, items.length, carouselItems.length]);
```

**Почему:**

- Даже если компонент переиспользуется (не должно после fix #1)
- useEffect запустится при изменении category
- Гарантия перескролла при смене данных

---

### ✅ FIX #3: Улучшенная структура кеша

**Файл:** `components/outfit/CategorySelectorWithSmooth.tsx`

#### 3.1 Изменить тип кеша (строка 83)

**Было:**

```typescript
const [slotScrollIndexes, setSlotScrollIndexes] = useState<Record<number, number>>({});
```

**Должно быть:**

```typescript
// Cache: "tab-category-slot" → scrollIndex
const [scrollCache, setScrollCache] = useState<Record<string, number>>({});
```

#### 3.2 Изменить получение initialIndex (строки 195-199)

**Было:**

```typescript
const initialIndex =
  slotScrollIndexes[slotIndex] !== undefined
    ? slotScrollIndexes[slotIndex]
    : getInitialScrollIndex(slotIndex, categoryItems);
```

**Должно быть:**

```typescript
// Create unique cache key
const cacheKey = `${tabType}-${category}-${slotIndex}`;
const initialIndex =
  scrollCache[cacheKey] !== undefined
    ? scrollCache[cacheKey]
    : getInitialScrollIndex(slotIndex, categoryItems);

console.log(`📍 [CategorySelector] Cache lookup for ${cacheKey}:`, {
  cached: scrollCache[cacheKey],
  willUse: initialIndex,
});
```

#### 3.3 Изменить handleScrollIndexChange (строки 169-175)

**Было:**

```typescript
const handleScrollIndexChange = useCallback((slotIndex: number, index: number) => {
  setSlotScrollIndexes((prev) => ({
    ...prev,
    [slotIndex]: index,
  }));
}, []);
```

**Должно быть:**

```typescript
const handleScrollIndexChange = useCallback(
  (slotIndex: number, index: number, category: ItemCategory) => {
    const cacheKey = `${tabType}-${category}-${slotIndex}`;
    console.log(`💾 [CategorySelector] Caching scroll position:`, {
      key: cacheKey,
      index,
    });

    setScrollCache((prev) => ({
      ...prev,
      [cacheKey]: index,
    }));
  },
  [tabType],
);
```

#### 3.4 Изменить вызов onScrollIndexChange (строка 210)

**Было:**

```typescript
onScrollIndexChange={(index) => handleScrollIndexChange(slotIndex, index)}
```

**Должно быть:**

```typescript
onScrollIndexChange={(index) => handleScrollIndexChange(slotIndex, index, category)}
```

#### 3.5 Обновить useEffect для очистки кеша (строки 131-167)

**Было:**

```typescript
if (changedSlots.length > 0) {
  setSlotScrollIndexes((prev) => {
    const next = { ...prev };
    changedSlots.forEach((slot) => {
      delete next[slot];
    });
    return next;
  });
}
```

**Должно быть:**

```typescript
if (changedSlots.length > 0) {
  console.log('🔄 [CategorySelector] Selected items changed, clearing cache for:', changedSlots);

  setScrollCache((prev) => {
    const next = { ...prev };
    changedSlots.forEach((slot) => {
      const category = categories[slot];
      const cacheKey = `${tabType}-${category}-${slot}`;
      const itemTitle = selectedItems[slot]?.title || 'item';
      console.log(`  ↪️ Clearing cache for ${cacheKey}: ${itemTitle}`);
      delete next[cacheKey];
    });
    return next;
  });
}
```

---

## 📊 КАК ЭТО БУДЕТ РАБОТАТЬ

### Scenario 1: Tab switching with cache

**Basic tab:**

```
User scrolls:
  - tops to index 5
  - bottoms to index 7
  - footwear to index 2

Cache:
  "basic-tops-0": 5
  "basic-bottoms-1": 7
  "basic-footwear-2": 2
```

**Switch to Dress:**

```
New components created (unique keys)
selectedItems synced: [null, sneakers, null]
useEffect clears cache for changed items

Cache:
  "basic-tops-0": 5         ← сохранен
  "basic-bottoms-1": 7      ← сохранен
  "basic-footwear-2": 2     ← сохранен
  "dress-fullbody-0": ?     ← новый, will be created
  "dress-footwear-1": 1     ← from sneakers
  "dress-accessories-2": ?  ← новый
```

**Switch back to Basic:**

```
Components unmount (Dress) and mount (Basic)
initialIndex from cache:
  - tops: cache["basic-tops-0"] = 5 ✅
  - bottoms: cache["basic-bottoms-1"] = 7 ✅
  - footwear: cache["basic-footwear-2"] = 2 ✅

Carousels scroll to saved positions! ✅
```

---

### Scenario 2: Edit mode

**Load outfit:**

```
setCurrentOutfit → selectedItems = [shirt, jeans, sneakers]
activeTab = 'basic' (smart detection)
categories = ['tops', 'bottoms', 'footwear']

Component mount:
  - selectedItems=[] (initial)
  - cache: {} (empty)
  - initialIndex=0 for all

Async complete:
  - selectedItems=[shirt, jeans, sneakers]
  - useEffect detects change
  - Clears cache for changed slots

Re-render:
  - cache: {} (cleared)
  - getInitialScrollIndex runs:
    - tops: find shirt → index 5
    - bottoms: find jeans → index 7
    - footwear: find sneakers → index 2
  - initialScrollIndex: [5, 7, 2]

SmoothCarousel useEffect:
  - Scrolls to [5, 7, 2] ✅

Cache updated:
  "basic-tops-0": 5
  "basic-bottoms-1": 7
  "basic-footwear-2": 2
```

---

## 🧪 TESTING

### Test 1: Basic tab switching

```
1. Basic: scroll tops to 5
2. Dress: (tops saved in cache)
3. Back to Basic
4. Verify: tops at 5 ✅
```

### Test 2: Multiple switches

```
1. Basic: tops=5, bottoms=7, footwear=2
2. Dress: fullbody=10, footwear=5, accessories=1
3. All: select items
4. Custom: select items
5. Back to Basic
6. Verify: tops=5, bottoms=7, footwear=2 ✅
7. Switch to Dress
8. Verify: fullbody=10, footwear=5, accessories=1 ✅
```

### Test 3: Edit mode

```
1. Edit outfit (shirt=5, jeans=7, sneakers=2)
2. Verify: все карусели прокручены ✅
3. Verify: вещи в центре ✅
```

### Test 4: Cache isolation

```
1. Basic: tops=5
2. Dress: fullbody=10
3. Verify: cache has both:
   - "basic-tops-0": 5
   - "dress-fullbody-0": 10
4. Switch Basic → Dress → Basic
5. Verify: tops=5 (not 10) ✅
```

---

## 📝 FILES TO MODIFY

### 1. `components/outfit/CategorySelectorWithSmooth.tsx`

- Change cache type: `slotScrollIndexes` → `scrollCache`
- Update cache key structure: `${tabType}-${category}-${slotIndex}`
- Update handleScrollIndexChange signature
- Update useEffect cache clearing
- Update carousel key
- Update initialIndex calculation

**Lines changed:** ~30

### 2. `components/outfit/SmoothCarousel.tsx`

- Add `category` to useEffect dependencies

**Lines changed:** ~1

---

## ⏱️ TIMELINE

**Phase 1:** Fix #1 + Fix #2 (10 min)
**Phase 2:** Fix #3 (15 min)
**Phase 3:** Testing (15 min)
**Total:** ~40 минут

---

## 🚀 READY

**Status:** ✅ Готов к выполнению  
**Risk:** 🟡 Средний (changes в cache structure)  
**Impact:** 🔴 Высокий (fixes critical UX issue)

---

**Начинаем выполнение пошагово!**
