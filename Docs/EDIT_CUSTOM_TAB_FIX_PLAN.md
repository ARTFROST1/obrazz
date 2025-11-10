# 📋 ПЛАН: РЕДАКТИРОВАНИЕ ВСЕГДА НА CUSTOM TAB

**Дата:** 2025-11-09 23:22  
**Проблема:** При edit outfit открывается не Custom tab, показываются не те категории

---

## 🚨 ТЕКУЩЕЕ ПОВЕДЕНИЕ

```typescript
setCurrentOutfit(outfit) {
  // 1. Restore customTabCategories from canvasSettings or reconstruct
  customCategories = outfit.canvasSettings?.customTabCategories
    || outfit.items.map(item => item.category)
    || DEFAULT_CATEGORIES;

  // 2. Detect tab type (может быть basic/dress/all/custom)
  detectedTab = detectTabType(customCategories);

  // 3. Restore based on detected tab
  if (detectedTab === 'custom') {
    customTabSelectedItems = [...items];
  } else {
    selectedItemsByCategory[category] = item;
  }

  // 4. Set detected tab
  activeTab = detectedTab;
}
```

**Проблемы:**

1. ❌ Может открыть Basic/Dress/All вместо Custom
2. ❌ Использует сохраненные categories, не смотрит на реальные currentItems
3. ❌ Если удалили элемент на canvas → все равно показывает старые categories

---

## ✅ ТРЕБУЕМОЕ ПОВЕДЕНИЕ

**Пользователь говорит:**

> "например я создал образ из вкладки 1, их там было 3 элемента, потом на странице компановки образа на холсте я убрал 1 элемент, и следовательно получилось всего 2 элемента в образе. Значит при открытии в дальнейшем редактирования этого образа, откроется вкладка 4, и там будут всего 2 карусели, именно с теми самыми вещами."

**Требования:**

1. ✅ ВСЕГДА открывать **Custom tab** (вкладка 4)
2. ✅ Показывать карусели ТОЛЬКО для **реально присутствующих** items в currentItems
3. ✅ Учитывать isVisible флаг (если есть)
4. ✅ Порядок каруселей = порядок slot в currentItems

---

## 🔍 АНАЛИЗ ДАННЫХ

### OutfitItem Structure:

```typescript
interface OutfitItem {
  itemId: string;
  item?: WardrobeItem;
  category: ItemCategory;
  slot: number;
  transform: ItemTransform;
  isVisible: boolean; // ← ВАЖНО!
}
```

### Примеры:

**Scenario 1: Создали на Basic (3 элемента), удалили 1 на canvas**

```typescript
// После создания:
outfit.items = [
  { slot: 0, category: 'tops', item: shirt, isVisible: true },
  { slot: 1, category: 'bottoms', item: jeans, isVisible: true },
  { slot: 2, category: 'footwear', item: sneakers, isVisible: true },
];

// Пользователь удалил jeans на canvas:
outfit.items = [
  { slot: 0, category: 'tops', item: shirt, isVisible: true },
  { slot: 1, category: 'bottoms', item: jeans, isVisible: false }, // ← скрыт!
  { slot: 2, category: 'footwear', item: sneakers, isVisible: true },
];

// ИЛИ полностью удален:
outfit.items = [
  { slot: 0, category: 'tops', item: shirt, isVisible: true },
  { slot: 1, category: 'footwear', item: sneakers, isVisible: true }, // slot изменился!
];
```

**При edit должно открыться:**

```
Custom tab
2 карусели:
  - Carousel 0: tops (shirt)
  - Carousel 1: footwear (sneakers)
```

---

## 📝 НОВАЯ ЛОГИКА

### Algorithm:

```typescript
setCurrentOutfit(outfit) {
  // 1. Get VISIBLE items from currentItems
  const visibleItems = outfit.items
    .filter(item => item.isVisible !== false) // включаем items без флага
    .sort((a, b) => a.slot - b.slot);

  // 2. Extract categories from visible items IN ORDER
  const customCategories = visibleItems.map(item => item.category);

  console.log('📍 [Edit Mode] Visible items:', {
    total: outfit.items.length,
    visible: visibleItems.length,
    categories: customCategories,
  });

  // 3. ALWAYS set activeTab to 'custom' for edit mode
  const activeTab = 'custom';

  // 4. Restore to customTabSelectedItems
  const customTabSelectedItems = visibleItems.map(item => item.item || null);

  // 5. Clear global storage (not used in custom tab)
  const selectedItemsByCategory = {
    headwear: null,
    outerwear: null,
    tops: null,
    bottoms: null,
    footwear: null,
    accessories: null,
    fullbody: null,
    other: null,
  };

  set({
    currentOutfit: outfit,
    currentItems: outfit.items, // все items (включая невидимые)
    customTabCategories: customCategories, // только видимые категории
    customTabSelectedItems: customTabSelectedItems, // только видимые items
    selectedItemsByCategory: selectedItemsByCategory, // очищен
    activeTab: 'custom', // ВСЕГДА custom
    // ...
  });

  updateSelectedItemsForCreation();
}
```

---

## 🎯 ПРИМЕРЫ РАБОТЫ

### Example 1: Удалили 1 элемент

**Input:**

```typescript
outfit.items = [
  { slot: 0, category: 'tops', item: shirt, isVisible: true },
  { slot: 1, category: 'bottoms', item: jeans, isVisible: false },
  { slot: 2, category: 'footwear', item: sneakers, isVisible: true },
];
```

**Processing:**

```typescript
visibleItems = [
  { slot: 0, category: 'tops', item: shirt },
  { slot: 2, category: 'footwear', item: sneakers },
];

customCategories = ['tops', 'footwear']; // 2 categories
customTabSelectedItems = [shirt, sneakers]; // 2 items
```

**Result:**

```
Custom tab opens
2 carousels:
  - tops: shirt
  - footwear: sneakers
```

---

### Example 2: Все элементы видимы

**Input:**

```typescript
outfit.items = [
  { slot: 0, category: 'fullbody', item: dress, isVisible: true },
  { slot: 1, category: 'footwear', item: heels, isVisible: true },
  { slot: 2, category: 'accessories', item: bag, isVisible: true },
];
```

**Processing:**

```typescript
visibleItems = all 3 items

customCategories = ['fullbody', 'footwear', 'accessories']
customTabSelectedItems = [dress, heels, bag]
```

**Result:**

```
Custom tab opens
3 carousels:
  - fullbody: dress
  - footwear: heels
  - accessories: bag
```

---

### Example 3: Backward compatibility (нет isVisible)

**Input:**

```typescript
outfit.items = [
  { slot: 0, category: 'tops', item: shirt }, // no isVisible field
  { slot: 1, category: 'bottoms', item: jeans },
];
```

**Processing:**

```typescript
// filter(item => item.isVisible !== false) включит все items без флага
visibleItems = all items

customCategories = ['tops', 'bottoms']
customTabSelectedItems = [shirt, jeans]
```

**Result:**

```
Custom tab opens
2 carousels:
  - tops: shirt
  - bottoms: jeans
```

---

## 🔧 IMPLEMENTATION

### Step 1: Update setCurrentOutfit

**File:** `store/outfit/outfitStore.ts` (строка 210)

**Changes:**

1. Remove `detectTabType()` call
2. Filter visible items
3. Extract categories from visible items
4. Always set `activeTab = 'custom'`
5. Restore to `customTabSelectedItems` only

**Code:**

```typescript
setCurrentOutfit: (outfit) => {
  if (!outfit) {
    // Handle null case
    set({
      currentOutfit: null,
      currentItems: [],
      customTabCategories: DEFAULT_CUSTOM_CATEGORIES,
      customTabSelectedItems: [],
      activeTab: 'custom',
      // ...
    });
    return;
  }

  console.log('📝 [outfitStore] setCurrentOutfit - Edit Mode:', {
    outfitId: outfit.id,
    totalItems: outfit.items?.length || 0,
  });

  // ✅ NEW: Filter VISIBLE items for edit mode
  const allItems = outfit.items || [];
  const visibleItems = allItems
    .filter(item => item.isVisible !== false) // include items without flag
    .sort((a, b) => a.slot - b.slot);

  // ✅ NEW: Extract categories from visible items IN ORDER
  const customCategories = visibleItems.map(item => item.category);

  console.log('📍 [Edit Mode] Visible items analysis:', {
    totalItems: allItems.length,
    visibleItems: visibleItems.length,
    hiddenItems: allItems.length - visibleItems.length,
    categories: customCategories,
    slots: visibleItems.map(item => item.slot),
  });

  // ✅ NEW: Restore to customTabSelectedItems (edit mode is always custom)
  const customTabSelectedItems = visibleItems.map(item => item.item || null);

  console.log('📍 [Edit Mode] Restored items:', {
    items: customTabSelectedItems.map(item => item?.title || 'null'),
  });

  // ✅ NEW: Clear global storage (not used in custom tab)
  const selectedItemsByCategory = {
    headwear: null,
    outerwear: null,
    tops: null,
    bottoms: null,
    footwear: null,
    accessories: null,
    fullbody: null,
    other: null,
  };

  set({
    currentOutfit: outfit,
    currentItems: allItems, // все items (включая скрытые)
    currentBackground: outfit.background || defaultBackground,
    customTabCategories: customCategories, // только видимые категории
    customTabSelectedItems: customTabSelectedItems, // только видимые items
    selectedItemsByCategory: selectedItemsByCategory, // очищен
    activeTab: 'custom', // ✅ ВСЕГДА custom для edit
    canvasSettings: outfit.canvasSettings || defaultCanvasSettings,
    error: null,
  });

  // ✅ Recompute derived state
  get().updateSelectedItemsForCreation();

  console.log('✅ [Edit Mode] Setup complete:', {
    activeTab: 'custom',
    carouselsCount: customCategories.length,
    categories: customCategories,
  });
},
```

---

## 🧪 TESTING

### Test 1: Delete 1 item on canvas

```
1. Create outfit on Basic: shirt, jeans, sneakers
2. Go to canvas step
3. Delete jeans
4. Save outfit
5. Edit outfit
6. Expected:
   ✅ Custom tab opens
   ✅ 2 carousels: tops (shirt), footwear (sneakers)
   ✅ No jeans carousel
```

### Test 2: All items visible

```
1. Create outfit on Dress: dress, heels, bag
2. Don't delete anything
3. Save outfit
4. Edit outfit
5. Expected:
   ✅ Custom tab opens
   ✅ 3 carousels: fullbody, footwear, accessories
```

### Test 3: Backward compatibility

```
1. Open old outfit (created before isVisible flag)
2. Edit outfit
3. Expected:
   ✅ Custom tab opens
   ✅ All items shown in carousels
```

---

## 📊 BENEFITS

### ✅ Always Custom Tab

- Предсказуемо
- Не зависит от количества категорий
- Проще для пользователя

### ✅ Real Items Only

- Показываются только реально присутствующие items
- Нет пустых каруселей
- Соответствует реальности

### ✅ Correct Count

- Удалили 1 → показывается на 1 меньше
- Динамически подстраивается

### ✅ Backward Compatible

- Работает со старыми outfits
- Не ломает существующие данные

---

**Готов к реализации!**
