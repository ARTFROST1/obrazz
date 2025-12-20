# 📋 ПЛАН ИСПРАВЛЕНИЯ WORKFLOW СОЗДАНИЯ ОБРАЗА

**Дата:** 2025-11-09 21:47  
**Основа:** OUTFIT_WORKFLOW_ANALYSIS_2025-11-09.md

---

## 🎯 ЦЕЛЬ

Реализовать правильный workflow:

1. ✅ Custom вкладка по умолчанию при создании
2. ✅ Синхронизация selectedItemsForCreation при смене вкладки
3. ✅ Использование активной вкладки при переходе на Step 2
4. ✅ Правильное сохранение и восстановление категорий

---

## 📊 ПРИОРИТЕТЫ

### 🔴 КРИТИЧЕСКИЕ (Phase 1) - ~30 минут

1. ✅ Fix #1: Initial activeTab → 'custom'
2. ✅ Fix #2: Синхронизация selectedItemsForCreation при смене вкладки
3. ✅ Fix #3: confirmItemSelection → использовать активную вкладку
4. ✅ Fix #4: Сохранять категории активной вкладки

### 🟠 СЕРЬЕЗНЫЕ (Phase 2) - ~20 минут

5. ✅ Fix #5: Smart tab detection для всех вкладок
6. ✅ Helper функции для определения типа вкладки

### 🟡 УЛУЧШЕНИЯ (Phase 3) - ~10 минут

7. ✅ Улучшенное логирование
8. ✅ Документация workflow

---

## 🔧 ДЕТАЛЬНЫЙ ПЛАН

### ✅ FIX #1: Initial activeTab = 'custom'

**Файл:** `store/outfit/outfitStore.ts`  
**Строка:** 123

**Было:**

```typescript
activeTab: 'basic',
```

**Должно быть:**

```typescript
activeTab: 'custom',
```

**Причина:** При создании нового outfit должна открываться Custom вкладка

**Тестирование:**

- Create new outfit → должна открыться Custom вкладка
- Custom должна иметь категории Basic по умолчанию

---

### ✅ FIX #2: Синхронизация selectedItemsForCreation при смене вкладки

**Файл:** `store/outfit/outfitStore.ts`  
**Строки:** 355-357

**Было:**

```typescript
setActiveTab: (tab) => {
  set({ activeTab: tab });
},
```

**Должно быть:**

```typescript
setActiveTab: (tab) => {
  const currentTab = get().activeTab;
  const currentCategories = get().getActiveTabCategories();
  const currentSelected = get().selectedItemsForCreation;

  // Set new tab
  set({ activeTab: tab });

  // Get new categories
  const newCategories = get().getActiveTabCategories();

  // Synchronize selectedItemsForCreation
  if (currentCategories.length !== newCategories.length ||
      !arraysEqual(currentCategories, newCategories)) {

    const newSelected = createEmptySelection(newCategories.length);

    // Try to preserve selections where category matches
    newCategories.forEach((newCat, newIndex) => {
      const oldIndex = currentCategories.indexOf(newCat);
      if (oldIndex !== -1 && currentSelected[oldIndex]) {
        newSelected[newIndex] = currentSelected[oldIndex];
      }
    });

    console.log('🔄 [outfitStore] Syncing selections on tab change:', {
      from: currentTab,
      to: tab,
      oldCategories: currentCategories,
      newCategories: newCategories,
      preserved: newSelected.filter(Boolean).length,
    });

    set({ selectedItemsForCreation: newSelected });
  }
},
```

**Helper функция (добавить в начало файла, после импортов):**

```typescript
// Helper to compare arrays
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}
```

**Причина:**

- selectedItemsForCreation должен всегда соответствовать размеру активной вкладки
- Нужно сохранять выборы где category совпадает

**Пример:**

```
Basic → Dress:
  ['tops', 'bottoms', 'footwear'] → ['fullbody', 'footwear', 'accessories']
  [shirt,  jeans,    sneakers]    → [null,     sneakers,   null]
                                             ↑ preserved footwear
```

**Тестирование:**

- Basic (3) → All (8): selectedItemsForCreation resize to 8
- Basic → Dress: footwear должен сохраниться
- All (8) → Basic (3): только совпадающие категории сохраняются

---

### ✅ FIX #3: confirmItemSelection → использовать активную вкладку

**Файл:** `store/outfit/outfitStore.ts`  
**Строки:** 280-323

**Было:**

```typescript
confirmItemSelection: () => {
  const selected = get().selectedItemsForCreation;
  const categories = get().customTabCategories; // ❌
  const currentSettings = get().canvasSettings;
  // ...
```

**Должно быть:**

```typescript
confirmItemSelection: () => {
  const selected = get().selectedItemsForCreation;
  const categories = get().getActiveTabCategories(); // ✅ Use active tab
  const activeTab = get().activeTab;
  const currentSettings = get().canvasSettings;

  console.log('✅ [outfitStore] Confirming selection from tab:', {
    activeTab,
    categories,
    selectedCount: selected.filter(Boolean).length,
  });
  // ...
```

**И изменить сохранение:**

```typescript
set({
  currentItems: outfitItems,
  creationStep: 2,
  canvasSettings: {
    ...currentSettings,
    customTabCategories: categories, // ✅ Now saves active tab categories
  },
});
```

**Причина:**

- Нужно брать категории именно той вкладки, где пользователь нажал "Далее"
- Эти категории сохраняются для последующего редактирования

**Тестирование:**

- Выбрать вещи на Dress → Next → должны передаться категории Dress
- Выбрать вещи на All → Next → должны передаться все 8 категорий

---

### ✅ FIX #4: Сохранять категории активной вкладки (уже исправлено в Fix #3)

Этот фикс уже включен в Fix #3, так как мы изменили `categories` на `getActiveTabCategories()`.

---

### ✅ FIX #5: Smart tab detection для всех вкладок

**Файл:** `store/outfit/outfitStore.ts`  
**Строки:** 194

**Добавить helper функции перед `export const useOutfitStore`:**

```typescript
// Helper functions for tab detection
function isBasicTab(categories: ItemCategory[]): boolean {
  return (
    categories.length === 3 &&
    categories[0] === 'tops' &&
    categories[1] === 'bottoms' &&
    categories[2] === 'footwear'
  );
}

function isDressTab(categories: ItemCategory[]): boolean {
  return (
    categories.length === 3 &&
    categories[0] === 'fullbody' &&
    categories[1] === 'footwear' &&
    categories[2] === 'accessories'
  );
}

function isAllTab(categories: ItemCategory[]): boolean {
  if (categories.length !== CATEGORIES.length) return false;
  return categories.every((cat, index) => cat === CATEGORIES[index]);
}

function detectTabType(categories: ItemCategory[]): OutfitTabType {
  if (isBasicTab(categories)) return 'basic';
  if (isDressTab(categories)) return 'dress';
  if (isAllTab(categories)) return 'all';
  return 'custom';
}
```

**Изменить в setCurrentOutfit (строка 194):**

```typescript
// Было:
activeTab: customCategories.length === 3 && customCategories[0] === 'tops' ? 'basic' : 'custom',

// Должно быть:
activeTab: detectTabType(customCategories),
```

**Причина:**

- При редактировании нужно открывать правильную вкладку
- Если outfit создан на Dress → открыть Dress, а не Custom

**Тестирование:**

- Создать outfit на Basic → Edit → должна открыться Basic
- Создать outfit на Dress → Edit → должна открыться Dress
- Создать outfit на All → Edit → должна открыться All
- Создать outfit на Custom с другими категориями → Edit → должна открыться Custom

---

### ✅ FIX #6: resetCurrentOutfit - правильный initial state

**Файл:** `store/outfit/outfitStore.ts`  
**Строки:** 543-554

**Было:**

```typescript
resetCurrentOutfit: () => {
  const categoriesCount = get().customTabCategories.length;
  set({
    currentOutfit: null,
    currentItems: [],
    currentBackground: defaultBackground,
    creationStep: 1,
    selectedItemsForCreation: createEmptySelection(categoriesCount),
    error: null,
  });
  get().clearHistory();
},
```

**Должно быть:**

```typescript
resetCurrentOutfit: () => {
  set({
    currentOutfit: null,
    currentItems: [],
    currentBackground: defaultBackground,
    canvasSettings: defaultCanvasSettings,
    creationStep: 1,
    selectedItemsForCreation: createEmptySelection(DEFAULT_CUSTOM_CATEGORIES.length),
    activeTab: 'custom', // ✅ Reset to custom
    customTabCategories: DEFAULT_CUSTOM_CATEGORIES, // ✅ Reset to basic-like
    customTabOrder: DEFAULT_CUSTOM_CATEGORIES.map((_, i) => i),
    isCustomTabEditing: false,
    error: null,
  });
  get().clearHistory();
},
```

**Причина:**

- При reset нужно вернуться к начальному состоянию
- activeTab = 'custom' с категориями Basic

**Тестирование:**

- Create outfit → Cancel → Create again → должна открыться Custom

---

## 📝 ИЗМЕНЕНИЯ В ФАЙЛАХ

### store/outfit/outfitStore.ts

1. ✅ Добавить helper функции:
   - `arraysEqual()`
   - `isBasicTab()`
   - `isDressTab()`
   - `isAllTab()`
   - `detectTabType()`

2. ✅ Изменить initial state:
   - `activeTab: 'custom'`

3. ✅ Изменить `setActiveTab()`:
   - Добавить синхронизацию selectedItemsForCreation

4. ✅ Изменить `confirmItemSelection()`:
   - Использовать `getActiveTabCategories()` вместо `customTabCategories`

5. ✅ Изменить `setCurrentOutfit()`:
   - Использовать `detectTabType()` для определения activeTab

6. ✅ Изменить `resetCurrentOutfit()`:
   - Полный reset к начальному состоянию

---

## 🧪 ТЕСТИРОВАНИЕ

### Test Case 1: Создание нового outfit на Custom

```
1. Open app → Create Outfit
2. Verify: Custom tab is active
3. Verify: 3 carousels (tops, bottoms, footwear)
4. Select items
5. Next → Verify: items transferred correctly
6. Save
7. Edit → Verify: Custom tab opens with same items
```

### Test Case 2: Создание на Basic

```
1. Create Outfit
2. Switch to Basic tab
3. Select items
4. Next → Verify: 3 items from Basic
5. Save
6. Edit → Verify: Basic tab opens (not Custom)
```

### Test Case 3: Создание на Dress

```
1. Create Outfit
2. Switch to Dress tab
3. Select fullbody, footwear, accessories
4. Next → Verify: 3 items from Dress
5. Save
6. Edit → Verify: Dress tab opens
```

### Test Case 4: Создание на All

```
1. Create Outfit
2. Switch to All tab
3. Select items in all 8 categories
4. Next → Verify: all items transferred
5. Save
6. Edit → Verify: All tab opens
```

### Test Case 5: Смена вкладок с сохранением

```
1. Create Outfit (on Custom)
2. Select: tops=shirt, bottoms=jeans, footwear=sneakers
3. Switch to Dress tab
4. Verify: footwear=sneakers preserved, fullbody=null, accessories=null
5. Select: fullbody=dress
6. Switch back to Basic
7. Verify: footwear=sneakers still preserved
```

### Test Case 6: Backward compatibility

```
1. Open old outfit (without proper canvasSettings)
2. Verify: Categories reconstructed from items
3. Verify: Tab detected correctly
4. Edit and save
5. Verify: Now has proper canvasSettings
```

---

## ⏱️ TIMELINE

### Phase 1: Critical Fixes (30 min)

- [ ] Fix #1: Initial activeTab (2 min)
- [ ] Fix #2: Sync selectedItemsForCreation (15 min)
- [ ] Fix #3: Use active tab in confirm (8 min)
- [ ] Fix #6: Reset current outfit (5 min)

### Phase 2: Improvements (20 min)

- [ ] Fix #5: Smart tab detection (15 min)
- [ ] Add helper functions (5 min)

### Phase 3: Testing (30 min)

- [ ] Test Case 1-6 (30 min)

### Phase 4: Documentation (10 min)

- [ ] Update implementation docs (10 min)

**Total:** ~90 minutes

---

## 🚀 ГОТОВНОСТЬ К ВЫПОЛНЕНИЮ

✅ **Анализ завершен**  
✅ **План детализирован**  
✅ **Код подготовлен**  
⏳ **Ожидание подтверждения для начала**

---

## 📌 NOTES

- Все изменения в одном файле: `store/outfit/outfitStore.ts`
- Backward compatibility обеспечена
- Тестирование обязательно перед деплоем
- Логирование добавлено для отладки

**Готов начать выполнение по команде!**
