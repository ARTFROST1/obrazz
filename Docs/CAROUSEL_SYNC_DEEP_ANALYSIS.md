# 🔍 ГЛУБОКИЙ АНАЛИЗ: СИНХРОНИЗАЦИЯ ВЕЩЕЙ МЕЖДУ ВКЛАДКАМИ

**Дата:** 2025-11-09 22:52  
**Проблема:** При переходе между вкладками содержимое каруселей сбрасывается

---

## 🚨 ОПИСАНИЕ ПРОБЛЕМЫ

### Требования пользователя:

1. ✅ **Basic, Dress, All** должны синхронизировать вещи между собой
2. ✅ Если выбрать обувь (footwear) на Basic → она должна остаться на Dress и All
3. ✅ **Custom** - исключение, свои элементы, не синхронизируются
4. ✅ Ничего не должно сбрасываться при переходе между вкладками

### Текущее поведение:

❌ При переходе Basic → Dress → Basic карусели сбрасываются  
❌ Выбранные вещи теряются  
❌ Показываются дефолтные/пустые слоты

---

## 🔎 ROOT CAUSE ANALYSIS

### 🚨 ПРОБЛЕМА #1: Хранение по слотам вместо категорий

**Файл:** `store/outfit/outfitStore.ts`

**Текущая структура:**

```typescript
interface OutfitState {
  selectedItemsForCreation: (WardrobeItem | null)[]; // ❌ Массив по СЛОТАМ!
  activeTab: OutfitTabType;
  customTabCategories: ItemCategory[];
}
```

**Пример данных:**

```typescript
// Basic tab (tops, bottoms, footwear)
selectedItemsForCreation = [shirt, jeans, sneakers];
//                         [slot0, slot1, slot2]

// Dress tab (fullbody, footwear, accessories)
selectedItemsForCreation = [dress, heels, bag];
//                         [slot0, slot1, slot2]
```

**❌ ПРОБЛЕМА:** Одна и та же вещь (footwear) находится в РАЗНЫХ слотах на разных вкладках!

- Basic: footwear в slot 2
- Dress: footwear в slot 1

→ При переключении нет способа узнать какая вещь какой категории соответствует!

---

### 🚨 ПРОБЛЕМА #2: Неправильная синхронизация

**Файл:** `store/outfit/outfitStore.ts` (строки 418-456)

```typescript
setActiveTab: (tab) => {
  const currentTab = get().activeTab;
  const currentCategories = get().getActiveTabCategories();
  const currentSelected = get().selectedItemsForCreation;

  // Set new tab first
  set({ activeTab: tab });

  // Get new categories AFTER setting tab
  const newCategories = get().getActiveTabCategories();

  // ✅ FIX #2: Synchronize selectedItemsForCreation when switching tabs
  if (
    currentCategories.length !== newCategories.length ||
    !arraysEqual(currentCategories, newCategories)
  ) {
    const newSelected = createEmptySelection(newCategories.length); // ❌ ПУСТОЙ массив!

    // Try to preserve selections where category matches
    newCategories.forEach((newCat, newIndex) => {
      const oldIndex = currentCategories.indexOf(newCat);
      if (oldIndex !== -1 && currentSelected[oldIndex]) {
        // ❌ Если oldIndex=-1 или null → НЕ СОХРАНИТСЯ!
        newSelected[newIndex] = currentSelected[oldIndex];
        console.log(`  ↪️ Preserved ${newCat}: ${currentSelected[oldIndex]?.title || 'item'}`);
      }
    });

    set({ selectedItemsForCreation: newSelected });
  }
};
```

**Что происходит:**

#### Scenario: Basic → Dress

**Basic tab:**

```typescript
categories = ['tops', 'bottoms', 'footwear'];
selectedItemsForCreation = [shirt, jeans, sneakers];
//                          slot0   slot1   slot2
```

**Switch to Dress:**

```typescript
newCategories = ['fullbody', 'footwear', 'accessories']

newSelected = [null, null, null]  // создан пустой массив

// Итерация по newCategories:
newIndex=0, newCat='fullbody'
  oldIndex = currentCategories.indexOf('fullbody') = -1  ❌ НЕ НАЙДЕНО
  → newSelected[0] остается null

newIndex=1, newCat='footwear'
  oldIndex = currentCategories.indexOf('footwear') = 2  ✅ НАЙДЕНО
  currentSelected[2] = sneakers  ✅
  → newSelected[1] = sneakers  ✅ СОХРАНЕНО

newIndex=2, newCat='accessories'
  oldIndex = currentCategories.indexOf('accessories') = -1  ❌ НЕ НАЙДЕНО
  → newSelected[2] остается null

// РЕЗУЛЬТАТ:
selectedItemsForCreation = [null, sneakers, null]
```

**✅ ЧАСТИЧНО РАБОТАЕТ:** footwear сохранился!

**❌ НО:** tops и bottoms потерялись, хотя они должны сохраниться на случай возврата на Basic!

#### Scenario: Dress → Basic (возврат)

**Dress tab:**

```typescript
categories = ['fullbody', 'footwear', 'accessories'];
selectedItemsForCreation = [dress, sneakers, bag];
//                          slot0   slot1     slot2
```

**Switch back to Basic:**

```typescript
newCategories = ['tops', 'bottoms', 'footwear']

newSelected = [null, null, null]  // снова пустой массив

// Итерация:
newIndex=0, newCat='tops'
  oldIndex = currentCategories.indexOf('tops') = -1  ❌ НЕ НАЙДЕНО
  → newSelected[0] = null  ❌ SHIRT ПОТЕРЯН!

newIndex=1, newCat='bottoms'
  oldIndex = currentCategories.indexOf('bottoms') = -1  ❌ НЕ НАЙДЕНО
  → newSelected[1] = null  ❌ JEANS ПОТЕРЯНЫ!

newIndex=2, newCat='footwear'
  oldIndex = currentCategories.indexOf('footwear') = 1  ✅
  currentSelected[1] = sneakers  ✅
  → newSelected[2] = sneakers  ✅

// РЕЗУЛЬТАТ:
selectedItemsForCreation = [null, null, sneakers]
```

**❌ ПРОБЛЕМА:** tops и bottoms сброшены на null!  
**❌ User видит:** только sneakers, остальное пусто  
**❌ User думает:** "Всё сбросилось!"

---

### 🚨 ПРОБЛЕМА #3: Нет глобального хранилища

**Текущая архитектура:**

```
selectedItemsForCreation = [item1, item2, item3]  ← один массив для всех вкладок
```

**При смене вкладки:**

```
selectedItemsForCreation = createEmptySelection(newLength)  ← ПЕРЕСОЗДАЕТСЯ!
```

→ Старые выборы теряются навсегда!

---

## ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА

### Concept: Хранение по категориям

```typescript
interface OutfitState {
  // ✅ NEW: Global storage by category (synced across Basic, Dress, All)
  selectedItemsByCategory: Record<ItemCategory, WardrobeItem | null>;

  // ✅ NEW: Separate storage for Custom tab
  customTabSelectedItems: (WardrobeItem | null)[];

  // ✅ COMPUTED: Current view based on active tab
  selectedItemsForCreation: (WardrobeItem | null)[]; // derived from above

  activeTab: OutfitTabType;
  customTabCategories: ItemCategory[];
}
```

**Пример данных:**

```typescript
// Global storage (for Basic, Dress, All)
selectedItemsByCategory = {
  'tops': shirt,
  'bottoms': jeans,
  'footwear': sneakers,
  'fullbody': dress,
  'accessories': bag,
  'outerwear': null,
  'bags': null,
  'jewelry': null,
}

// Custom tab storage (independent)
customTabSelectedItems = [item1, item2, item3, ...]
customTabCategories = ['tops', 'accessories', 'outerwear', ...]

// Current view (computed)
// When activeTab = 'basic':
selectedItemsForCreation = [
  selectedItemsByCategory['tops'],     // shirt
  selectedItemsByCategory['bottoms'],  // jeans
  selectedItemsByCategory['footwear'], // sneakers
]

// When activeTab = 'dress':
selectedItemsForCreation = [
  selectedItemsByCategory['fullbody'],    // dress
  selectedItemsByCategory['footwear'],    // sneakers (same as Basic!)
  selectedItemsByCategory['accessories'], // bag
]

// When activeTab = 'custom':
selectedItemsForCreation = customTabSelectedItems  // independent!
```

---

## 🎯 НОВАЯ ЛОГИКА

### Initialize:

```typescript
// On mount or new outfit
selectedItemsByCategory = {
  tops: null,
  bottoms: null,
  footwear: null,
  fullbody: null,
  outerwear: null,
  accessories: null,
  bags: null,
  jewelry: null,
};
```

### Select item:

```typescript
selectItemForCategory(slotIndex, item) {
  const currentTab = get().activeTab;

  if (currentTab === 'custom') {
    // Custom tab: update custom storage
    const customItems = [...get().customTabSelectedItems];
    customItems[slotIndex] = item;
    set({ customTabSelectedItems: customItems });
  } else {
    // Basic/Dress/All: update global storage
    const categories = get().getActiveTabCategories();
    const category = categories[slotIndex];

    set({
      selectedItemsByCategory: {
        ...get().selectedItemsByCategory,
        [category]: item,
      }
    });
  }

  // Recompute selectedItemsForCreation
  get().updateSelectedItemsForCreation();
}
```

### Switch tab:

```typescript
setActiveTab(tab) {
  set({ activeTab: tab });

  // Recompute selectedItemsForCreation based on new tab
  get().updateSelectedItemsForCreation();
}
```

### Compute selectedItemsForCreation:

```typescript
updateSelectedItemsForCreation() {
  const tab = get().activeTab;

  if (tab === 'custom') {
    // Use custom storage
    set({ selectedItemsForCreation: get().customTabSelectedItems });
  } else {
    // Compute from global storage
    const categories = get().getActiveTabCategories();
    const selected = categories.map(cat =>
      get().selectedItemsByCategory[cat] ?? null
    );
    set({ selectedItemsForCreation: selected });
  }
}
```

---

## 📊 HOW IT WORKS

### Scenario 1: Basic → Dress → Basic

**Start on Basic:**

```typescript
activeTab = 'basic'
categories = ['tops', 'bottoms', 'footwear']

// User selects:
selectItemForCategory(0, shirt)   → selectedItemsByCategory.tops = shirt
selectItemForCategory(1, jeans)   → selectedItemsByCategory.bottoms = jeans
selectItemForCategory(2, sneakers) → selectedItemsByCategory.footwear = sneakers

// Current view:
selectedItemsForCreation = [shirt, jeans, sneakers]
```

**Switch to Dress:**

```typescript
setActiveTab('dress');
categories = ['fullbody', 'footwear', 'accessories'];

// Recompute:
selectedItemsForCreation = [
  selectedItemsByCategory['fullbody'], // null
  selectedItemsByCategory['footwear'], // sneakers ✅
  selectedItemsByCategory['accessories'], // null
];

// ✅ User sees: [empty, sneakers, empty]
// ✅ sneakers сохранились!
```

**Select on Dress:**

```typescript
selectItemForCategory(0, dress) → selectedItemsByCategory.fullbody = dress
selectItemForCategory(2, bag)   → selectedItemsByCategory.accessories = bag

// Current view:
selectedItemsForCreation = [dress, sneakers, bag]

// Global storage:
selectedItemsByCategory = {
  tops: shirt,      ← сохранено с Basic!
  bottoms: jeans,   ← сохранено с Basic!
  footwear: sneakers,
  fullbody: dress,
  accessories: bag,
}
```

**Switch back to Basic:**

```typescript
setActiveTab('basic');
categories = ['tops', 'bottoms', 'footwear'];

// Recompute:
selectedItemsForCreation = [
  selectedItemsByCategory['tops'], // shirt ✅
  selectedItemsByCategory['bottoms'], // jeans ✅
  selectedItemsByCategory['footwear'], // sneakers ✅
];

// ✅ User sees: [shirt, jeans, sneakers]
// ✅ ВСЁ ВОССТАНОВЛЕНО!
```

---

### Scenario 2: Custom tab isolation

**Select on Basic:**

```typescript
activeTab = 'basic';
selectedItemsByCategory.tops = shirt;
selectedItemsByCategory.bottoms = jeans;
```

**Switch to Custom:**

```typescript
setActiveTab('custom');
customTabCategories = ['tops', 'accessories', 'outerwear'];

// Recompute:
selectedItemsForCreation = customTabSelectedItems; // [null, null, null]

// ✅ Custom пустая, не затронута выборами Basic
```

**Select on Custom:**

```typescript
selectItemForCategory(0, tshirt)  → customTabSelectedItems[0] = tshirt
selectItemForCategory(1, bag)     → customTabSelectedItems[1] = bag

// customTabSelectedItems = [tshirt, bag, null]
// selectedItemsByCategory НЕ ИЗМЕНИЛИСЬ!
```

**Switch back to Basic:**

```typescript
setActiveTab('basic');

// Recompute:
selectedItemsForCreation = [
  selectedItemsByCategory['tops'], // shirt (не tshirt!)
  selectedItemsByCategory['bottoms'], // jeans
  selectedItemsByCategory['footwear'], // null
];

// ✅ Basic сохранил свои выборы
// ✅ Custom не повлиял на Basic
```

**Switch back to Custom:**

```typescript
setActiveTab('custom');

// Recompute:
selectedItemsForCreation = customTabSelectedItems; // [tshirt, bag, null]

// ✅ Custom сохранил свои выборы
```

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Add new state (HIGH PRIORITY)

1. ✅ Add `selectedItemsByCategory: Record<ItemCategory, WardrobeItem | null>`
2. ✅ Add `customTabSelectedItems: (WardrobeItem | null)[]`
3. ✅ Initialize both on mount

### Phase 2: Update selectItemForCategory

4. ✅ Check if activeTab === 'custom'
5. ✅ If custom: update customTabSelectedItems
6. ✅ Else: update selectedItemsByCategory
7. ✅ Call updateSelectedItemsForCreation()

### Phase 3: Add updateSelectedItemsForCreation

8. ✅ Compute selectedItemsForCreation based on activeTab
9. ✅ If custom: use customTabSelectedItems
10. ✅ Else: map from selectedItemsByCategory

### Phase 4: Update setActiveTab

11. ✅ Remove old sync logic
12. ✅ Just set activeTab
13. ✅ Call updateSelectedItemsForCreation()

### Phase 5: Update other functions

14. ✅ confirmItemSelection: use selectedItemsByCategory for non-custom
15. ✅ setCurrentOutfit: restore to selectedItemsByCategory
16. ✅ clearItemSelection: clear both storages

---

## 🧪 TEST CASES

### Test 1: Basic ↔ Dress synchronization

```
1. Basic: select shirt, jeans, sneakers
2. Switch to Dress
3. Verify: sneakers preserved in footwear ✅
4. Select: dress, change to heels, add bag
5. Switch back to Basic
6. Verify: shirt, jeans, heels (updated footwear!) ✅
7. Switch to Dress
8. Verify: dress, heels, bag ✅
```

### Test 2: Custom isolation

```
1. Basic: select shirt, jeans
2. Switch to Custom
3. Verify: empty (not affected by Basic) ✅
4. Select: tshirt, bag, jacket
5. Switch to Basic
6. Verify: shirt, jeans (not affected by Custom) ✅
7. Switch back to Custom
8. Verify: tshirt, bag, jacket ✅
```

### Test 3: All tab participation

```
1. Basic: select shirt, jeans, sneakers
2. Switch to All (8 categories)
3. Verify: shirt in tops, jeans in bottoms, sneakers in footwear ✅
4. Select: jacket (outerwear)
5. Switch to Basic
6. Verify: shirt, jeans, sneakers ✅
7. Switch to Dress
8. Verify: sneakers in footwear ✅
```

### Test 4: Edit mode

```
1. Edit outfit (created on Dress)
2. Verify: Dress tab opens ✅
3. Verify: Items loaded into selectedItemsByCategory ✅
4. Switch to Basic
5. Verify: Common items visible ✅
```

---

## 🚀 BENEFITS

### ✅ Clean Architecture

- Single source of truth: `selectedItemsByCategory`
- Clear separation: global vs custom
- No ambiguity: category → item mapping

### ✅ No Data Loss

- All selections preserved
- Switch tabs freely
- Return anytime

### ✅ Intuitive UX

- Footwear syncs across tabs
- Custom independent
- No surprises

### ✅ Maintainable Code

- Simple logic
- Easy to debug
- Clear responsibilities

---

**Готов к реализации Clean Architecture!**
