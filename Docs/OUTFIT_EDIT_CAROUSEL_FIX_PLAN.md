# 📋 ПЛАН: ИСПРАВЛЕНИЕ ПРОКРУТКИ КАРУСЕЛЕЙ ПРИ EDIT

**Дата:** 2025-11-09 22:26  
**Проблема:** Карусели не прокручиваются к выбранным вещам при редактировании
**Основа:** OUTFIT_EDIT_CAROUSEL_SCROLL_ANALYSIS.md

---

## 🚨 ПРОБЛЕМА

При редактировании outfit карусели остаются на позиции 0 вместо того чтобы скроллиться к выбранным вещам.

### Root Cause:

Кеширование `slotScrollIndexes` в `CategorySelectorWithSmooth` блокирует пересчет `initialScrollIndex` после async загрузки outfit.

**Timeline:**

```
1. Component mount → selectedItems=[] → initialIndex=0
2. Карусель render → scrolls to index 0
3. handleScrollIndexChange → slotScrollIndexes[0]=0 (cached)
4. Async load outfit → selectedItems=[shirt, jeans, sneakers]
5. Re-render → slotScrollIndexes[0]=0 exists → uses 0 ❌
6. НЕ вызывает getInitialScrollIndex ❌
7. Карусель остается на 0 ❌
```

---

## ✅ РЕШЕНИЕ

Добавить отслеживание изменений `selectedItems` и очищать кеш `slotScrollIndexes` для изменившихся слотов.

### Логика:

```typescript
useEffect(() => {
  // Для каждого слота проверяем изменился ли selectedItem
  selectedItems.forEach((item, slotIndex) => {
    const prevItem = prevSelectedItemsRef.current[slotIndex];
    const itemChanged = item?.id !== prevItem?.id;

    if (itemChanged && item !== null) {
      // Очищаем кеш для этого слота
      delete slotScrollIndexes[slotIndex];
    }
  });

  prevSelectedItemsRef.current = selectedItems;
}, [selectedItems]);
```

---

## 🔧 IMPLEMENTATION

### File: `components/outfit/CategorySelectorWithSmooth.tsx`

#### Step 1: Добавить ref для отслеживания

```typescript
// After other state/refs
const prevSelectedItemsRef = useRef<(WardrobeItem | null)[]>([]);
```

#### Step 2: Добавить useEffect для отслеживания изменений

```typescript
// After getInitialScrollIndex callback, before handleScrollIndexChange

// ✅ Track selectedItems changes and reset scroll cache for changed slots
useEffect(() => {
  const changedSlots: number[] = [];

  selectedItems.forEach((item, slotIndex) => {
    const prevItem = prevSelectedItemsRef.current[slotIndex];

    // Check if item ID changed (handles null -> item and item1 -> item2)
    const prevId = prevItem?.id;
    const currentId = item?.id;
    const itemChanged = prevId !== currentId;

    // If item changed and is not null, mark slot for cache reset
    if (itemChanged && item !== null) {
      changedSlots.push(slotIndex);
    }
  });

  if (changedSlots.length > 0) {
    console.log(
      '🔄 [CategorySelector] Selected items changed, resetting scroll cache for slots:',
      changedSlots,
    );

    // Clear cache only for changed slots
    setSlotScrollIndexes((prev) => {
      const next = { ...prev };
      changedSlots.forEach((slot) => {
        console.log(
          `  ↪️ Clearing cache for slot ${slot}: ${selectedItems[slot]?.title || 'item'}`,
        );
        delete next[slot];
      });
      return next;
    });
  }

  // Update ref for next comparison
  prevSelectedItemsRef.current = [...selectedItems];
}, [selectedItems]);
```

---

## 🎯 EXPECTED BEHAVIOR

### Сценарий 1: Edit mode load

```
1. Mount → selectedItems=[]
2. Render → initialIndex=0 for all slots
3. Carousels scroll to 0
4. handleScrollIndexChange → cache [0,0,0]
5. ✅ Async load → selectedItems=[shirt, jeans, sneakers]
6. ✅ useEffect detects change → clears cache
7. ✅ Re-render → getInitialScrollIndex runs → finds [3, 7, 2]
8. ✅ initialScrollIndex updates → [3, 7, 2]
9. ✅ SmoothCarousel useEffect → scrolls to [3, 7, 2]
10. ✅ User sees correct items!
```

### Сценарий 2: User manual scroll (should not break)

```
1. User scrolls tops carousel to index 10
2. handleScrollIndexChange → slotScrollIndexes[0]=10
3. Re-render → uses cached 10 ✅
4. Carousel stays at 10 ✅
5. selectedItems[0] unchanged → useEffect does nothing ✅
```

### Сценарий 3: User changes item (clicks different item)

```
1. User clicks different item in tops carousel
2. selectItemForCategory → selectedItems[0] changes
3. useEffect detects change → clears cache[0]
4. Re-render → getInitialScrollIndex runs
5. Finds new item → scrolls to it ✅
```

---

## 🧪 TESTING

### Test 1: Basic Edit

```
Setup:
- Create outfit with shirt (index 5)
- Save

Test:
1. Edit outfit
2. Wait for load
3. Observe logs:
   "🔄 Selected items changed, resetting scroll cache for slots: [0, 1, 2]"
   "↪️ Clearing cache for slot 0: shirt"
4. Verify: tops carousel scrolled to index 5
5. Verify: shirt is in center
```

### Test 2: Dress Edit

```
Setup:
- Create outfit on Dress tab
- fullbody: dress (index 10)
- footwear: heels (index 5)
- accessories: bag (index 1)
- Save

Test:
1. Edit outfit
2. Verify: Dress tab active
3. Verify: All 3 carousels scrolled correctly
   - fullbody → 10
   - footwear → 5
   - accessories → 1
```

### Test 3: Manual scroll preserved

```
1. Edit outfit (shirt at index 5)
2. Wait for auto-scroll to shirt ✅
3. Manually scroll tops to index 10
4. Switch to Dress tab
5. Switch back to Basic
6. Verify: tops still at index 10 (cached) ✅
```

### Test 4: Empty slots

```
Setup:
- Create outfit with only tops and footwear (bottoms empty)

Test:
1. Edit outfit
2. Verify: tops scrolls to correct item
3. Verify: bottoms stays at 0 (no item selected)
4. Verify: footwear scrolls to correct item
5. No errors in console
```

---

## 📝 CODE CHANGES

### File: `components/outfit/CategorySelectorWithSmooth.tsx`

**Lines to add:** ~35
**Location:** After `getInitialScrollIndex`, before `handleScrollIndexChange`

**Changes:**

1. Import useRef (if not already)
2. Add `prevSelectedItemsRef`
3. Add `useEffect` for tracking changes

---

## ⚠️ EDGE CASES

### Case 1: Rapid selectedItems changes

**Scenario:** Multiple async updates in quick succession
**Handled:** ✅ useEffect runs on each change, clears cache correctly

### Case 2: selectedItems shrinks

**Scenario:** Categories count changes
**Handled:** ✅ Only checks existing slots in selectedItems array

### Case 3: Same item, different slot

**Scenario:** User moves item from slot 0 to slot 2
**Handled:** ✅ Both slots cleared and rescrolled

### Case 4: null → null

**Scenario:** Slot stays empty
**Handled:** ✅ No change detected, cache stays

---

## 🚀 ГОТОВНОСТЬ

**Status:** ✅ Готов к выполнению
**Risk:** 🟢 Низкий
**Time:** ~15 минут
**Testing:** ~15 минут
**Total:** ~30 минут

---

## 📊 SUCCESS CRITERIA

- [ ] При edit карусели скроллятся к выбранным вещам
- [ ] Ручная прокрутка сохраняется
- [ ] Смена вкладок не ломает прокрутку
- [ ] Логи показывают когда кеш очищается
- [ ] Нет лишних перерисовок
- [ ] Test cases 1-4 проходят

---

**Готов начать реализацию!**
