# 🔍 АНАЛИЗ: ПРОКРУТКА КАРУСЕЛЕЙ ПРИ РЕДАКТИРОВАНИИ

**Дата:** 2025-11-09 22:26  
**Цель:** Проверить что карусели прокручиваются к правильным вещам при редактировании

---

## 📋 ТРЕБОВАНИЯ

При редактировании outfit:

1. ✅ Открывается страница создания в режиме edit
2. ✅ Отображаются те же карусели/категории, что были при создании
3. ✅ В каждой карусели **уже выбрана** правильная вещь
4. ✅ Карусель **прокручена** к этой выбранной вещи

---

## 🔎 ТЕКУЩАЯ РЕАЛИЗАЦИЯ

### 1️⃣ Navigation to Edit

**Файл:** `app/outfit/[id].tsx`

```typescript
const handleEdit = useCallback(() => {
  if (!outfit) return;
  router.push(`/outfit/create?id=${outfit.id}`);
}, [outfit]);
```

✅ **ПРАВИЛЬНО** - переход на `/outfit/create?id=...`

---

### 2️⃣ Loading Outfit

**Файл:** `app/outfit/create.tsx` (строки 32-110)

```typescript
export default function CreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id; // ✅ Определяет edit mode

  // Load outfit if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadOutfitForEdit(id);
    }
  }, [id, isEditMode]);

  const loadOutfitForEdit = async (outfitId: string) => {
    try {
      setIsLoadingOutfit(true);
      const outfit = await outfitService.getOutfitById(outfitId); // ✅ Загружает с populate
      setCurrentOutfit(outfit); // ✅ Восстанавливает state
      setOutfitTitle(outfit.title || '');
      setCreationStep(1); // ✅ Начинает с Step 1
    } catch (error) {
      console.error('Error loading outfit:', error);
    } finally {
      setIsLoadingOutfit(false);
    }
  };
}
```

✅ **ПРАВИЛЬНО** - загружает outfit и вызывает `setCurrentOutfit`

---

### 3️⃣ Restore State in Store

**Файл:** `store/outfit/outfitStore.ts` (строки 173-246)

```typescript
setCurrentOutfit: (outfit) => {
  // ✅ Restore customTabCategories
  let customCategories: ItemCategory[];
  if (outfit?.canvasSettings?.customTabCategories) {
    customCategories = outfit.canvasSettings.customTabCategories;
  } else if (outfit?.items && outfit.items.length > 0) {
    customCategories = sortedItems.map((item) => item.category);
  } else {
    customCategories = DEFAULT_CUSTOM_CATEGORIES;
  }

  // ✅ Restore selectedItems
  const selectedItems: (WardrobeItem | null)[] = createEmptySelection(customCategories.length);

  if (outfit?.items) {
    const sortedItems = [...outfit.items].sort((a, b) => a.slot - b.slot);
    sortedItems.forEach((outfitItem) => {
      if (outfitItem.item && outfitItem.slot < selectedItems.length) {
        selectedItems[outfitItem.slot] = outfitItem.item; // ✅ Восстанавливает вещи
      }
    });
  }

  // ✅ Smart tab detection
  const detectedTab = detectTabType(customCategories);

  set({
    currentOutfit: outfit,
    currentItems: outfit?.items || [],
    currentBackground: outfit?.background || defaultBackground,
    selectedItemsForCreation: selectedItems, // ✅ Восстановленные вещи
    customTabCategories: customCategories,
    activeTab: detectedTab,
    canvasSettings: outfit?.canvasSettings || defaultCanvasSettings,
    error: null,
  });
};
```

✅ **ПРАВИЛЬНО** - восстанавливает:

- customTabCategories (категории каруселей)
- selectedItemsForCreation (выбранные вещи)
- activeTab (правильная вкладка)

---

### 4️⃣ Render Carousels

**Файл:** `components/outfit/CategorySelectorWithSmooth.tsx` (строки 109-172)

```typescript
// Get initial scroll index based on selected item at slotIndex
const getInitialScrollIndex = useCallback(
  (slotIndex: number, categoryItems: WardrobeItem[]): number => {
    const selectedItem = selectedItems[slotIndex]; // ✅ Берет выбранную вещь
    if (!selectedItem || categoryItems.length === 0) return 0;

    const index = categoryItems.findIndex((item) => item.id === selectedItem.id);

    console.log(`🔍 [CategorySelector] Initial scroll for slot ${slotIndex}:`, {
      selectedItemId: selectedItem?.id,
      foundAtIndex: index,
      totalItems: categoryItems.length,
    });

    return index >= 0 ? index : 0;
  },
  [selectedItems], // ⚠️ Зависит от selectedItems
);

// Render
{visibleCategories.map((category, slotIndex) => {
  const categoryItems = getItemsByCategory(category);
  const selectedItem = selectedItems[slotIndex];

  // ⚠️ ПРОБЛЕМА: Кеширование в slotScrollIndexes
  const initialIndex =
    slotScrollIndexes[slotIndex] !== undefined
      ? slotScrollIndexes[slotIndex] // ❌ Использует кешированный индекс
      : getInitialScrollIndex(slotIndex, categoryItems); // ✅ Вычисляет из selectedItem

  return (
    <SmoothCarousel
      // ...
      selectedItemId={selectedItem?.id || null}
      initialScrollIndex={initialIndex} // ⚠️ Может быть неправильным
    />
  );
})}
```

⚠️ **ПРОБЛЕМА #1:** Кеширование `slotScrollIndexes`

**Что происходит:**

1. Component mount → `selectedItems = []` (еще не загружены)
2. `getInitialScrollIndex(0)` → `selectedItems[0] = null` → return 0
3. `slotScrollIndexes[0] = undefined` → используется 0
4. Карусель скроллится к индексу 0
5. `handleScrollIndexChange(0, 0)` → `slotScrollIndexes[0] = 0` ✅ кеш сохранен
6. **Async загрузка outfit** → `selectedItems` обновляется → [shirt, jeans, sneakers]
7. Component re-render
8. `slotScrollIndexes[0] = 0` (уже есть) → использует 0 ❌
9. **НЕ пересчитывает** `getInitialScrollIndex` ❌
10. Карусель остается на индексе 0, **НЕ скроллится к shirt** ❌

---

### 5️⃣ Scroll in SmoothCarousel

**Файл:** `components/outfit/SmoothCarousel.tsx` (строки 291-319)

```typescript
// Initialize scroll position
useEffect(() => {
  if (flatListRef.current && carouselItems.length > 0) {
    const initialIndex = indexOffset + (initialScrollIndex % items.length);

    console.log(`🔍 [SmoothCarousel] Initializing ${category}:`, {
      initialScrollIndex,
      calculatedIndex: initialIndex,
      itemsCount: items.length,
      selectedItemId,
    });

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * (itemWidth + spacing),
        animated: false,
      });
      setCenterIndex(initialIndex);
    }, 50);
  }
}, [initialScrollIndex, itemWidth, spacing, indexOffset, items.length, carouselItems.length]);
```

✅ **ПРАВИЛЬНО** - useEffect зависит от `initialScrollIndex`

- Если `initialScrollIndex` изменится → перескроллит

⚠️ **НО:** `initialScrollIndex` НЕ меняется из-за кеша в `CategorySelectorWithSmooth`

---

## 🚨 ВЫЯВЛЕННАЯ ПРОБЛЕМА

### ❌ ПРОБЛЕМА: Карусели не скроллятся к выбранным вещам при edit

**Корень проблемы:** Кеширование `slotScrollIndexes` в `CategorySelectorWithSmooth`

**Timeline:**

```
1. Mount → selectedItems=[] → initialIndex=0 → slotScrollIndexes[0]=0
2. Async load → selectedItems=[shirt] → re-render
3. initialIndex = slotScrollIndexes[0] || getInitialScrollIndex(0)
              = 0 (cached) ❌ НЕ вычисляет заново
4. Карусель остается на индексе 0 ❌
```

**Ожидалось:**

```
1. Mount → selectedItems=[] → initialIndex=0 → render
2. Async load → selectedItems=[shirt] → re-render
3. initialIndex = getInitialScrollIndex(0) → находит shirt на индексе 5
4. initialScrollIndex=5 → SmoothCarousel re-scrolls ✅
```

---

## 🎯 РЕШЕНИЕ

### Fix #1: Убрать кеширование при первом рендере в edit mode

**Файл:** `components/outfit/CategorySelectorWithSmooth.tsx`

**Идея:**

- При edit mode НЕ использовать кеш до тех пор, пока selectedItems не загружены
- Или: очищать кеш при изменении selectedItems

**Вариант A: Очистка кеша при изменении selectedItems**

```typescript
// Reset cached scroll indexes when selectedItems change (e.g., on edit load)
useEffect(() => {
  // Clear cache if selectedItems changed significantly
  const hasSelections = selectedItems.some((item) => item !== null);
  const hasCachedIndexes = Object.keys(slotScrollIndexes).length > 0;

  if (hasSelections && hasCachedIndexes) {
    // On edit mode load, recalculate scroll positions
    console.log('🔄 [CategorySelector] Resetting scroll indexes for new selections');
    setSlotScrollIndexes({});
  }
}, [selectedItems]);
```

⚠️ **Проблема:** Может сбрасывать кеш даже когда пользователь скроллит

**Вариант B: Флаг первой загрузки**

```typescript
const [isInitialLoad, setIsInitialLoad] = useState(true);

useEffect(() => {
  const hasSelections = selectedItems.some((item) => item !== null);
  if (isInitialLoad && hasSelections) {
    setIsInitialLoad(false);
    // Force re-calculation by clearing cache
    setSlotScrollIndexes({});
  }
}, [selectedItems, isInitialLoad]);

// In render:
const initialIndex =
  !isInitialLoad && slotScrollIndexes[slotIndex] !== undefined
    ? slotScrollIndexes[slotIndex]
    : getInitialScrollIndex(slotIndex, categoryItems);
```

✅ **Лучше:** Очищает кеш только при первой загрузке selections

**Вариант C: Отслеживание изменений selectedItem для каждого слота**

```typescript
// Track previous selectedItems to detect changes
const prevSelectedItemsRef = useRef<(WardrobeItem | null)[]>([]);

useEffect(() => {
  // Check if any selectedItem changed
  const changedSlots: number[] = [];

  selectedItems.forEach((item, slotIndex) => {
    const prevItem = prevSelectedItemsRef.current[slotIndex];
    const itemChanged = item?.id !== prevItem?.id;

    if (itemChanged && item !== null) {
      changedSlots.push(slotIndex);
    }
  });

  if (changedSlots.length > 0) {
    console.log('🔄 [CategorySelector] Resetting scroll for changed slots:', changedSlots);

    // Clear cache only for changed slots
    setSlotScrollIndexes((prev) => {
      const next = { ...prev };
      changedSlots.forEach((slot) => {
        delete next[slot];
      });
      return next;
    });
  }

  prevSelectedItemsRef.current = selectedItems;
}, [selectedItems]);
```

✅✅ **ЛУЧШИЙ:** Очищает кеш только для изменившихся слотов

---

## 📝 ПЛАН ИСПРАВЛЕНИЙ

### Phase 1: Исправление прокрутки

1. ✅ Добавить отслеживание изменений selectedItems
2. ✅ Очищать кеш slotScrollIndexes для изменившихся слотов
3. ✅ Проверить что initialScrollIndex обновляется
4. ✅ Проверить что SmoothCarousel перескроллит

### Phase 2: Улучшения

5. ✅ Добавить детальное логирование
6. ✅ Тестирование

---

## 🧪 TEST CASES

### Test 1: Edit outfit с одной вещью

```
1. Create outfit: Basic tab, select shirt at index 5
2. Save
3. Edit outfit
4. Verify: tops carousel scrolled to index 5 (shirt visible)
```

### Test 2: Edit outfit с несколькими вещами

```
1. Create outfit: Basic tab
   - tops: shirt at index 3
   - bottoms: jeans at index 7
   - footwear: sneakers at index 2
2. Save
3. Edit outfit
4. Verify:
   - tops carousel → index 3 (shirt)
   - bottoms carousel → index 7 (jeans)
   - footwear carousel → index 2 (sneakers)
```

### Test 3: Edit outfit созданный на Dress

```
1. Create outfit: Dress tab
   - fullbody: dress at index 10
   - footwear: heels at index 5
   - accessories: bag at index 1
2. Save
3. Edit outfit
4. Verify: Dress tab открыта
5. Verify: все 3 карусели прокручены к правильным вещам
```

### Test 4: User скроллит, затем меняет вкладку, затем возвращается

```
1. Edit outfit
2. Scroll tops carousel to another item
3. Switch to Dress tab
4. Switch back to Basic
5. Verify: tops carousel сохранила позицию (cache работает)
```

---

## 🎯 ОЖИДАЕМОЕ ПОВЕДЕНИЕ

### При первой загрузке edit:

```
1. Mount → selectedItems=[] → carousels render at index 0
2. Async load → selectedItems=[shirt, jeans, sneakers]
3. Detect change → clear cache for changed slots
4. Re-render → getInitialScrollIndex вычисляет индексы
5. initialScrollIndex обновляется
6. SmoothCarousel скроллит к правильным вещам ✅
```

### При ручной прокрутке:

```
1. User скроллит tops carousel
2. handleScrollIndexChange → slotScrollIndexes[0] = newIndex
3. Cache сохранен ✅
4. Re-render → используется cached index ✅
5. Карусель сохраняет позицию ✅
```

---

## 🚀 ГОТОВ К ВЫПОЛНЕНИЮ

**Файлы для изменения:**

- `components/outfit/CategorySelectorWithSmooth.tsx` - добавить отслеживание изменений

**Время:** ~20 минут  
**Риск:** Низкий  
**Тестирование:** Обязательно

---

**Следующий шаг:** Реализация Fix #1 с Вариантом C (отслеживание изменений по слотам)
