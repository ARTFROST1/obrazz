# 📋 ПЛАН: CLEAN ARCHITECTURE ДЛЯ СИНХРОНИЗАЦИИ КАРУСЕЛЕЙ

**Дата:** 2025-11-09 22:52  
**Основа:** CAROUSEL_SYNC_DEEP_ANALYSIS.md

---

## 🎯 ЦЕЛЬ

Реализовать **Clean Architecture** для синхронизации вещей между вкладками:

- ✅ Basic, Dress, All синхронизируют вещи между собой
- ✅ Custom независим и имеет свои вещи
- ✅ Ничего не сбрасывается при переходах

---

## 🏗️ НОВАЯ АРХИТЕКТУРА STATE

### Current (bad):

```typescript
interface OutfitState {
  selectedItemsForCreation: (WardrobeItem | null)[]; // ❌ Один массив по слотам
  activeTab: OutfitTabType;
  customTabCategories: ItemCategory[];
}
```

### New (clean):

```typescript
interface OutfitState {
  // ✅ Global storage: synced across Basic, Dress, All
  selectedItemsByCategory: Record<ItemCategory, WardrobeItem | null>;

  // ✅ Custom tab storage: independent
  customTabSelectedItems: (WardrobeItem | null)[];

  // ✅ Derived state: computed from above based on activeTab
  selectedItemsForCreation: (WardrobeItem | null)[];

  activeTab: OutfitTabType;
  customTabCategories: ItemCategory[];
}
```

---

## 📝 ДЕТАЛЬНЫЙ ПЛАН ИЗМЕНЕНИЙ

### STEP 1: Add new state properties

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** 15-30 (interface OutfitState)

**Add:**

```typescript
interface OutfitState {
  // ... existing props ...

  // ✅ NEW: Global item storage (synced across Basic, Dress, All)
  selectedItemsByCategory: Record<ItemCategory, WardrobeItem | null>;

  // ✅ NEW: Custom tab storage (independent)
  customTabSelectedItems: (WardrobeItem | null)[];

  // ... rest of props ...
}
```

---

### STEP 2: Initialize new state

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~160-190 (initial state in createStore)

**Add initialization:**

```typescript
export const useOutfitStore = create<OutfitState>()(
  persist(
    (set, get) => ({
      // ... existing state ...

      // ✅ NEW: Initialize global storage
      selectedItemsByCategory: {
        tops: null,
        bottoms: null,
        footwear: null,
        fullbody: null,
        outerwear: null,
        accessories: null,
        bags: null,
        jewelry: null,
      },

      // ✅ NEW: Initialize custom storage
      customTabSelectedItems: [],

      // ... rest of state ...
    }),
    // ... persist config ...
  ),
);
```

---

### STEP 3: Add helper function updateSelectedItemsForCreation

**Файл:** `store/outfit/outfitStore.ts`  
**Добавить после interface, перед createStore**

```typescript
// ✅ NEW: Compute selectedItemsForCreation based on active tab
function computeSelectedItemsForCreation(
  activeTab: OutfitTabType,
  categories: ItemCategory[],
  selectedByCategory: Record<ItemCategory, WardrobeItem | null>,
  customSelected: (WardrobeItem | null)[],
): (WardrobeItem | null)[] {
  if (activeTab === 'custom') {
    // Custom tab uses its own storage
    return [...customSelected];
  } else {
    // Basic, Dress, All: map from global storage
    return categories.map((cat) => selectedByCategory[cat] ?? null);
  }
}
```

---

### STEP 4: Add action updateSelectedItemsForCreation

**Файл:** `store/outfit/outfitStore.ts`  
**Добавить в interface OutfitState (actions section)**

```typescript
interface OutfitState {
  // ... existing actions ...

  // ✅ NEW: Update derived state
  updateSelectedItemsForCreation: () => void;
}
```

**Реализация (в createStore):**

```typescript
updateSelectedItemsForCreation: () => {
  const state = get();
  const categories = state.getActiveTabCategories();

  const computed = computeSelectedItemsForCreation(
    state.activeTab,
    categories,
    state.selectedItemsByCategory,
    state.customTabSelectedItems,
  );

  console.log('🔄 [outfitStore] Recomputing selectedItemsForCreation:', {
    activeTab: state.activeTab,
    categories,
    computed: computed.map(item => item?.title || 'null'),
  });

  set({ selectedItemsForCreation: computed });
},
```

---

### STEP 5: Update selectItemForCategory

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~312-323

**Было:**

```typescript
selectItemForCategory: (slotIndex, item) => {
  const selected = [...get().selectedItemsForCreation];

  // Ensure array is big enough
  while (selected.length <= slotIndex) {
    selected.push(null);
  }

  selected[slotIndex] = item;

  set({ selectedItemsForCreation: selected });
},
```

**Стало:**

```typescript
selectItemForCategory: (slotIndex, item) => {
  const state = get();
  const activeTab = state.activeTab;
  const categories = state.getActiveTabCategories();
  const category = categories[slotIndex];

  if (activeTab === 'custom') {
    // ✅ Custom tab: update custom storage
    const customItems = [...state.customTabSelectedItems];

    // Ensure array is big enough
    while (customItems.length <= slotIndex) {
      customItems.push(null);
    }

    customItems[slotIndex] = item;

    console.log(`✏️ [outfitStore] Custom tab: slot ${slotIndex} → ${item?.title || 'null'}`);

    set({ customTabSelectedItems: customItems });
  } else {
    // ✅ Basic/Dress/All: update global storage
    console.log(`✏️ [outfitStore] Global: ${category} → ${item?.title || 'null'}`);

    set({
      selectedItemsByCategory: {
        ...state.selectedItemsByCategory,
        [category]: item,
      },
    });
  }

  // ✅ Recompute derived state
  get().updateSelectedItemsForCreation();
},
```

---

### STEP 6: Update setActiveTab

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~418-456

**Было:**

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
  if (currentCategories.length !== newCategories.length ||
      !arraysEqual(currentCategories, newCategories)) {

    const newSelected = createEmptySelection(newCategories.length);

    // Try to preserve selections where category matches
    newCategories.forEach((newCat, newIndex) => {
      const oldIndex = currentCategories.indexOf(newCat);
      if (oldIndex !== -1 && currentSelected[oldIndex]) {
        newSelected[newIndex] = currentSelected[oldIndex];
        console.log(`  ↪️ Preserved ${newCat}: ${currentSelected[oldIndex]?.title || 'item'}`);
      }
    });

    console.log('🔄 [outfitStore] Syncing selections on tab change:', {
      from: currentTab,
      to: tab,
      oldCategories: currentCategories,
      newCategories: newCategories,
      oldSize: currentSelected.length,
      newSize: newSelected.length,
      preserved: newSelected.filter(Boolean).length,
    });

    set({ selectedItemsForCreation: newSelected });
  }
},
```

**Стало (CLEAN!):**

```typescript
setActiveTab: (tab) => {
  const currentTab = get().activeTab;

  console.log(`🔄 [outfitStore] Switching tab: ${currentTab} → ${tab}`);

  // ✅ Just set the tab
  set({ activeTab: tab });

  // ✅ Recompute derived state
  get().updateSelectedItemsForCreation();
},
```

---

### STEP 7: Update confirmItemSelection

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~329-380

**Изменить логику получения категорий:**

**Было:**

```typescript
confirmItemSelection: () => {
  // Use active tab categories
  const categories = get().getActiveTabCategories();
  const selectedItems = get().selectedItemsForCreation;
  // ...
},
```

**Стало:**

```typescript
confirmItemSelection: () => {
  const state = get();
  const activeTab = state.activeTab;

  // ✅ Use correct storage based on tab
  let categories: ItemCategory[];
  let selectedItems: (WardrobeItem | null)[];

  if (activeTab === 'custom') {
    categories = state.customTabCategories;
    selectedItems = state.customTabSelectedItems;
  } else {
    categories = state.getActiveTabCategories();
    selectedItems = state.selectedItemsForCreation;
  }

  console.log('✅ [outfitStore] Confirming selection:', {
    activeTab,
    categories,
    itemCount: selectedItems.filter(Boolean).length,
  });

  // ... rest of logic ...

  // ✅ Save categories to canvasSettings
  set({
    customTabCategories: categories,
    canvasSettings: {
      ...state.canvasSettings,
      customTabCategories: categories,
    },
  });

  // ... create items ...
},
```

---

### STEP 8: Update setCurrentOutfit (for edit mode)

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~173-246

**Добавить восстановление в selectedItemsByCategory:**

**Было:**

```typescript
setCurrentOutfit: (outfit) => {
  // ... restore customTabCategories ...

  // Restore selectedItems
  const selectedItems: (WardrobeItem | null)[] = createEmptySelection(customCategories.length);

  if (outfit?.items) {
    const sortedItems = [...outfit.items].sort((a, b) => a.slot - b.slot);
    sortedItems.forEach((outfitItem) => {
      if (outfitItem.item && outfitItem.slot < selectedItems.length) {
        selectedItems[outfitItem.slot] = outfitItem.item;
      }
    });
  }

  set({
    selectedItemsForCreation: selectedItems,
    // ...
  });
};
```

**Стало:**

```typescript
setCurrentOutfit: (outfit) => {
  // ... restore customTabCategories ...

  // ✅ Restore to proper storage
  let selectedItemsByCategory = { ...get().selectedItemsByCategory };
  let customTabSelectedItems: (WardrobeItem | null)[] = [];

  if (outfit?.items) {
    const sortedItems = [...outfit.items].sort((a, b) => a.slot - b.slot);

    const detectedTab = detectTabType(customCategories);

    if (detectedTab === 'custom') {
      // Restore to custom storage
      customTabSelectedItems = createEmptySelection(customCategories.length);
      sortedItems.forEach((outfitItem) => {
        if (outfitItem.item && outfitItem.slot < customTabSelectedItems.length) {
          customTabSelectedItems[outfitItem.slot] = outfitItem.item;
        }
      });
    } else {
      // Restore to global storage
      sortedItems.forEach((outfitItem, index) => {
        if (outfitItem.item) {
          const category = customCategories[index];
          selectedItemsByCategory[category] = outfitItem.item;
        }
      });
    }
  }

  set({
    currentOutfit: outfit,
    currentItems: outfit?.items || [],
    currentBackground: outfit?.background || defaultBackground,
    selectedItemsByCategory,
    customTabSelectedItems,
    customTabCategories: customCategories,
    activeTab: detectedTab,
    canvasSettings: outfit?.canvasSettings || defaultCanvasSettings,
    error: null,
  });

  // ✅ Recompute derived state
  get().updateSelectedItemsForCreation();
};
```

---

### STEP 9: Update clearItemSelection

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~391-397

**Было:**

```typescript
clearItemSelection: () => {
  const categoriesCount = get().customTabCategories.length;
  set({
    selectedItemsForCreation: createEmptySelection(categoriesCount),
    creationStep: 1,
  });
},
```

**Стало:**

```typescript
clearItemSelection: () => {
  console.log('🗑️ [outfitStore] Clearing all selections');

  // ✅ Clear both storages
  set({
    selectedItemsByCategory: {
      tops: null,
      bottoms: null,
      footwear: null,
      fullbody: null,
      outerwear: null,
      accessories: null,
      bags: null,
      jewelry: null,
    },
    customTabSelectedItems: [],
    creationStep: 1,
  });

  // ✅ Recompute derived state
  get().updateSelectedItemsForCreation();
},
```

---

### STEP 10: Update resetCurrentOutfit

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** ~643-660

**Добавить очистку новых storage:**

```typescript
resetCurrentOutfit: () => {
  console.log('🔄 [outfitStore] Resetting outfit to initial state');

  set({
    currentOutfit: null,
    currentItems: [],
    currentBackground: defaultBackground,
    canvasSettings: defaultCanvasSettings,
    creationStep: 1,

    // ✅ Clear both storages
    selectedItemsByCategory: {
      tops: null,
      bottoms: null,
      footwear: null,
      fullbody: null,
      outerwear: null,
      accessories: null,
      bags: null,
      jewelry: null,
    },
    customTabSelectedItems: [],

    selectedItemsForCreation: [],
    activeTab: 'custom',
    customTabCategories: DEFAULT_CUSTOM_CATEGORIES,
    customTabOrder: DEFAULT_CUSTOM_CATEGORIES.map((_, i) => i),
    isCustomTabEditing: false,
    error: null,
  });
},
```

---

## 🧪 TESTING PLAN

### Test 1: Basic ↔ Dress sync

```typescript
// Basic
selectItemForCategory(0, shirt)   // tops
selectItemForCategory(1, jeans)   // bottoms
selectItemForCategory(2, sneakers) // footwear

// Check global storage:
selectedItemsByCategory.tops = shirt ✅
selectedItemsByCategory.bottoms = jeans ✅
selectedItemsByCategory.footwear = sneakers ✅

// Switch to Dress
setActiveTab('dress')

// Check view:
selectedItemsForCreation = [
  null,     // fullbody (empty)
  sneakers, // footwear (synced!) ✅
  null,     // accessories (empty)
]

// Select on Dress
selectItemForCategory(0, dress) // fullbody
selectItemForCategory(2, bag)   // accessories

// Check global storage:
selectedItemsByCategory.fullbody = dress ✅
selectedItemsByCategory.accessories = bag ✅
selectedItemsByCategory.tops = shirt ✅ (still there!)

// Switch back to Basic
setActiveTab('basic')

// Check view:
selectedItemsForCreation = [
  shirt,    // tops ✅
  jeans,    // bottoms ✅
  sneakers, // footwear ✅
]

// ✅ ALL PRESERVED!
```

### Test 2: Custom isolation

```typescript
// Basic
selectItemForCategory(0, shirt) // tops

// Check:
selectedItemsByCategory.tops = shirt ✅
customTabSelectedItems = [] ✅

// Switch to Custom
setActiveTab('custom')

// Check view:
selectedItemsForCreation = [] ✅ (empty, not affected)

// Select on Custom
selectItemForCategory(0, tshirt)

// Check:
customTabSelectedItems[0] = tshirt ✅
selectedItemsByCategory.tops = shirt ✅ (unchanged!)

// Switch to Basic
setActiveTab('basic')

// Check view:
selectedItemsForCreation = [shirt, null, null] ✅

// Switch back to Custom
setActiveTab('custom')

// Check view:
selectedItemsForCreation = [tshirt, ...] ✅
```

---

## 📊 BENEFITS

### ✅ Clean Separation

- Global: `selectedItemsByCategory`
- Custom: `customTabSelectedItems`
- View: `selectedItemsForCreation` (computed)

### ✅ No Data Loss

- All selections preserved
- Switch tabs freely
- No resets

### ✅ Simple Logic

- `setActiveTab`: just set + recompute
- `selectItemForCategory`: update storage + recompute
- No complex synchronization

### ✅ Easy Debugging

- Clear storage structure
- Detailed logging
- Predictable behavior

---

## ⏱️ TIMELINE

**Phase 1:** State + Helper (10 min)
**Phase 2:** selectItemForCategory + updateSelectedItemsForCreation (10 min)
**Phase 3:** setActiveTab + confirmItemSelection (10 min)
**Phase 4:** setCurrentOutfit + clear functions (10 min)
**Phase 5:** Testing (20 min)
**Total:** ~60 минут

---

**Готов к реализации Clean Architecture пошагово!**
