# 🔍 АНАЛИЗ WORKFLOW СОЗДАНИЯ ОБРАЗА

**Дата:** 2025-11-09 21:47  
**Цель:** Проверить соответствие текущей логики требуемой

---

## 📋 ТРЕБУЕМАЯ ЛОГИКА (ОТ ПОЛЬЗОВАТЕЛЯ)

### 1. Создание нового outfit

- ✅ Открывается **4-ая вкладка (Custom)** по умолчанию
- ✅ Она полностью повторяет **1-ую вкладку (Basic)** по категориям: `['tops', 'bottoms', 'footwear']`
- ✅ Пользователь может менять набор категорий и выбирать вещи

### 2. Смена вкладок

- ✅ Пользователь может переключаться между вкладками (Basic, Dress, All, Custom)
- ✅ Выбирать вещи на любой вкладке

### 3. Переход на Step 2 (Композиция)

- ✅ Передаются **ИМЕННО ТЕ ВЕЩИ**, которые были на **АКТИВНОЙ вкладке** в момент нажатия "Далее"
- ✅ Если на Custom → набор из Custom
- ✅ Если на Dress → те 3 вещи из Dress
- ✅ Если на Basic → те 3 вещи из Basic
- ✅ Если на All → все 8 вещей из All

### 4. На экране композиции

- ✅ Набор может измениться (вещи могут быть удалены)

### 5. При сохранении

- ✅ Сохраняются **какие карусели/категории** были в этом образе
- ✅ Сохраняется **какая именно вещь** была выбрана в каждой карусели
- ✅ Это важно для редактирования

### 6. При редактировании

- ✅ Открывается страница где все **карусели на своих местах**
- ✅ **Выбраны именно вещи**, которые уже в образе есть
- ✅ Пользователь видит тот же набор категорий, что был при создании

---

## 🔎 ТЕКУЩАЯ РЕАЛИЗАЦИЯ

### 📂 `store/outfit/outfitStore.ts`

#### Initial State (строки 117-132)

```typescript
currentOutfit: null,
currentItems: [],
currentBackground: defaultBackground,
canvasSettings: defaultCanvasSettings,
creationStep: 1,
selectedItemsForCreation: createEmptySelection(DEFAULT_CUSTOM_CATEGORIES.length),
activeTab: 'basic', // ❌ ПРОБЛЕМА #1
customTabCategories: DEFAULT_CUSTOM_CATEGORIES, // ✅ = ['tops', 'bottoms', 'footwear']
customTabOrder: DEFAULT_CUSTOM_CATEGORIES.map((_, i) => i),
isCustomTabEditing: false,
```

**ПРОБЛЕМА #1:** `activeTab: 'basic'` должно быть `activeTab: 'custom'`

---

#### setActiveTab() (строки 355-357)

```typescript
setActiveTab: (tab) => {
  set({ activeTab: tab });
},
```

**ПРОБЛЕМА #2:** При смене вкладки НЕ синхронизируется `selectedItemsForCreation` с новыми категориями!

**ЧТО ПРОИСХОДИТ:**

- User на Basic (3 категории), выбрал вещи → `selectedItemsForCreation` = [item1, item2, item3]
- User переключается на All (8 категорий)
- `selectedItemsForCreation` остается [item1, item2, item3] - только 3 элемента вместо 8! ❌
- Карусели 4-8 не имеют соответствующих слотов в `selectedItemsForCreation`

---

#### getActiveTabCategories() (строки 433-448)

```typescript
getActiveTabCategories: () => {
  const { activeTab, customTabCategories } = get();

  switch (activeTab) {
    case 'basic':
      return ['tops', 'bottoms', 'footwear'];
    case 'dress':
      return ['fullbody', 'footwear', 'accessories'];
    case 'all':
      return CATEGORIES; // 8 categories
    case 'custom':
      return customTabCategories;
    default:
      return CATEGORIES;
  }
};
```

✅ **ПРАВИЛЬНО** - возвращает категории активной вкладки

---

#### confirmItemSelection() (строки 280-323)

```typescript
confirmItemSelection: () => {
  const selected = get().selectedItemsForCreation;
  const categories = get().customTabCategories; // ❌ ПРОБЛЕМА #3

  const outfitItems: OutfitItem[] = [];

  selected.forEach((item, slotIndex) => {
    if (item && categories[slotIndex]) {
      const category = categories[slotIndex];
      // ... create outfitItem
      outfitItems.push({ ... });
    }
  });

  console.log('💾 [outfitStore] Saving customTabCategories to canvasSettings:', categories);

  set({
    currentItems: outfitItems,
    creationStep: 2,
    canvasSettings: {
      ...currentSettings,
      customTabCategories: categories, // ❌ ПРОБЛЕМА #4
    },
  });
}
```

**ПРОБЛЕМА #3:** Использует `customTabCategories` вместо `getActiveTabCategories()`

- Если пользователь выбрал вещи на вкладке Dress и нажал "Далее"
- Но `categories` = `customTabCategories` (например ['tops', 'bottoms', 'footwear'])
- А должно быть ['fullbody', 'footwear', 'accessories'] ❌

**ПРОБЛЕМА #4:** Сохраняет в `canvasSettings` только `customTabCategories`, а не категории активной вкладки

- Если outfit создан на вкладке Dress, в БД сохранятся категории custom, а не dress ❌

---

#### setCurrentOutfit() (строки 135-197)

```typescript
setCurrentOutfit: (outfit) => {
  // ✅ Восстанавливает customTabCategories
  let customCategories: ItemCategory[];

  if (outfit?.canvasSettings?.customTabCategories) {
    customCategories = outfit.canvasSettings.customTabCategories;
  } else if (outfit?.items && outfit.items.length > 0) {
    customCategories = sortedItems.map((item) => item.category);
  } else {
    customCategories = DEFAULT_CUSTOM_CATEGORIES;
  }

  // ✅ Восстанавливает selectedItems
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
    currentOutfit: outfit,
    currentItems: outfit?.items || [],
    currentBackground: outfit?.background || defaultBackground,
    selectedItemsForCreation: selectedItems,
    customTabCategories: customCategories, // ✅ Restore
    activeTab: customCategories.length === 3 && customCategories[0] === 'tops' ? 'basic' : 'custom', // ⚠️ ПРОБЛЕМА #5
    canvasSettings: outfit?.canvasSettings || defaultCanvasSettings,
    error: null,
  });
};
```

**ПРОБЛЕМА #5:** Smart detection неполный

- Проверяет только basic (3 категории + tops first)
- Не проверяет dress: ['fullbody', 'footwear', 'accessories']
- Не проверяет all: 8 категорий

**ЧТО ПРОИСХОДИТ:**

- Если outfit создан на Dress → при редактировании откроется Custom, а не Dress ❌

---

### 📂 `components/outfit/ItemSelectionStepNew.tsx`

#### Использование activeTab (строки 22-58)

```typescript
const {
  currentOutfit,
  selectedItemsForCreation,
  selectItemForCategory,
  // ...
  activeTab,
  setActiveTab,
  customTabCategories,
  updateCustomTab,
  getActiveTabCategories,
} = useOutfitStore();

const isEditMode = !!currentOutfit;
const currentTabCategories = getActiveTabCategories(); // ✅ Получает категории активной вкладки

const selectedCount = getSelectedItemsCount();
```

✅ **ПРАВИЛЬНО** - использует `getActiveTabCategories()` для отображения каруселей

---

## 🚨 ВЫЯВЛЕННЫЕ ПРОБЛЕМЫ

### ❌ ПРОБЛЕМА #1: Неправильная начальная вкладка

**Где:** `outfitStore.ts:123`

```typescript
activeTab: 'basic', // ❌ Должно быть 'custom'
```

**Влияние:**

- При создании нового outfit открывается Basic вместо Custom
- Пользователь видит не ту вкладку

---

### ❌ ПРОБЛЕМА #2: selectedItemsForCreation не синхронизируется при смене вкладки

**Где:** `outfitStore.ts:355-357`

```typescript
setActiveTab: (tab) => {
  set({ activeTab: tab });
  // ❌ НЕТ синхронизации selectedItemsForCreation!
},
```

**Влияние:**

- Если на Basic (3 слота), выбрано 3 вещи
- Переключаемся на All (8 слотов)
- selectedItemsForCreation остается размером 3
- Слоты 4-8 не имеют соответствия в массиве ❌
- При выборе вещи в слоте 5 → crash или неправильное поведение

**Что должно быть:**

- При смене вкладки ПЕРЕСОЗДАТЬ `selectedItemsForCreation` под размер новой вкладки
- ПОПЫТАТЬСЯ сохранить выборы где category совпадает
- Пример: Basic ['tops', 'bottoms', 'footwear'] → Dress ['fullbody', 'footwear', 'accessories']
  - 'footwear' совпадает → сохранить выбор footwear из Basic в Dress

---

### ❌ ПРОБЛЕМА #3: confirmItemSelection использует customTabCategories вместо активной вкладки

**Где:** `outfitStore.ts:282`

```typescript
const categories = get().customTabCategories; // ❌
// Должно быть:
// const categories = get().getActiveTabCategories();
```

**Влияние:**

- Пользователь выбирает вещи на вкладке Dress
- Нажимает "Далее"
- В outfitItems попадают категории из customTabCategories, а не из Dress ❌
- Неправильное соответствие вещь-категория

---

### ❌ ПРОБЛЕМА #4: Сохраняется customTabCategories вместо активных категорий

**Где:** `outfitStore.ts:288, 321`

```typescript
customTabCategories: categories, // ❌
// Должно сохраняться то, что было на активной вкладке
```

**Влияние:**

- Outfit создан на Dress
- В БД сохраняются customTabCategories (например ['tops', 'bottoms', 'footwear'])
- При редактировании восстанавливаются неправильные категории ❌

---

### ⚠️ ПРОБЛЕМА #5: Неполный smart tab detection при редактировании

**Где:** `outfitStore.ts:194`

```typescript
activeTab: customCategories.length === 3 && customCategories[0] === 'tops' ? 'basic' : 'custom',
```

**Влияние:**

- Проверяется только Basic
- Dress и All не определяются
- Outfit созданный на Dress → откроется Custom ⚠️

**Что должно быть:**

```typescript
// Check if matches preset tab
if (isBasic(customCategories)) activeTab = 'basic';
else if (isDress(customCategories)) activeTab = 'dress';
else if (isAll(customCategories)) activeTab = 'all';
else activeTab = 'custom';
```

---

## 📊 SUMMARY ПРОБЛЕМ

| #   | Проблема                                            | Критичность    | Файл           | Строка   |
| --- | --------------------------------------------------- | -------------- | -------------- | -------- |
| 1   | Начальная вкладка 'basic' вместо 'custom'           | 🟡 Средняя     | outfitStore.ts | 123      |
| 2   | selectedItemsForCreation не синхронизируется        | 🔴 КРИТИЧЕСКАЯ | outfitStore.ts | 355-357  |
| 3   | confirmItemSelection использует customTabCategories | 🔴 КРИТИЧЕСКАЯ | outfitStore.ts | 282      |
| 4   | Сохраняется customTabCategories вместо активных     | 🔴 КРИТИЧЕСКАЯ | outfitStore.ts | 288, 321 |
| 5   | Неполный smart tab detection                        | 🟠 Серьезная   | outfitStore.ts | 194      |

---

## ✅ ПРАВИЛЬНЫЙ WORKFLOW (ТРЕБУЕМЫЙ)

### Создание нового outfit:

```
1. User: Нажимает "Create Outfit"
2. System:
   - activeTab = 'custom'
   - customTabCategories = ['tops', 'bottoms', 'footwear'] (как Basic)
   - selectedItemsForCreation = [null, null, null]
3. User: Видит Custom вкладку с 3 каруселями (tops, bottoms, footwear)
```

### Смена вкладки:

```
1. User: Переключается с Basic на Dress
2. System:
   - activeTab = 'dress'
   - Пересоздать selectedItemsForCreation под новый размер
   - Попытаться сохранить выборы где category совпадает

Пример:
  Basic: ['tops', 'bottoms', 'footwear'] → [shirt, jeans, sneakers]
  Dress: ['fullbody', 'footwear', 'accessories'] → [null, sneakers, null]
                                                         ↑ сохранили footwear
```

### Переход на Step 2:

```
1. User: Нажимает "Далее" на вкладке Dress
2. System:
   - Берет категории активной вкладки: ['fullbody', 'footwear', 'accessories']
   - Берет выборы из selectedItemsForCreation: [dress, heels, bag]
   - Создает outfitItems только из выбранных вещей на Dress
   - Переходит на Step 2 с этими вещами
```

### Сохранение:

```
1. User: Нажимает "Save"
2. System:
   - Сохраняет в canvasSettings:
     - customTabCategories = ['fullbody', 'footwear', 'accessories'] (те что были на активной вкладке)
   - Сохраняет currentItems (могут быть изменены на Step 2)
   - Записывает в БД
```

### Редактирование:

```
1. User: Открывает outfit для редактирования
2. System:
   - Загружает outfit из БД
   - Читает canvasSettings.customTabCategories = ['fullbody', 'footwear', 'accessories']
   - Определяет что это Dress → activeTab = 'dress'
   - Восстанавливает selectedItemsForCreation из outfit.items
   - Открывает вкладку Dress с выбранными вещами
3. User: Видит вкладку Dress с теми же 3 каруселями и теми же вещами
```

---

## 🎯 ПЛАН ИСПРАВЛЕНИЙ

### Phase 1: Критические исправления

1. ✅ Изменить initial activeTab на 'custom'
2. ✅ Реализовать синхронизацию selectedItemsForCreation при смене вкладки
3. ✅ Изменить confirmItemSelection для использования активной вкладки
4. ✅ Сохранять категории активной вкладки, а не customTabCategories

### Phase 2: Улучшения

5. ✅ Реализовать полный smart tab detection (Basic, Dress, All, Custom)
6. ✅ Добавить helper функции для определения типа вкладки
7. ✅ Улучшить логирование для отладки

### Phase 3: Тестирование

8. ✅ Test Case 1: Создание на Custom
9. ✅ Test Case 2: Создание на Basic
10. ✅ Test Case 3: Создание на Dress
11. ✅ Test Case 4: Создание на All
12. ✅ Test Case 5: Смена вкладок с сохранением выборов
13. ✅ Test Case 6: Редактирование каждого типа

---

## 🚀 СЛЕДУЮЩИЙ ШАГ

Приступаю к Phase 1 - критические исправления.

**ETA:** ~30 минут  
**Риски:** Средние (изменения в core logic)  
**Тестирование:** Обязательно после каждого изменения
