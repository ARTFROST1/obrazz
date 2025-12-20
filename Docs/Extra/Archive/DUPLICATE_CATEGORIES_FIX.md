# Fix: Поддержка дублирующихся категорий

## 🔴 Проблема

**Текущая структура НЕ поддерживает дубли:**

```typescript
selectedItemsForCreation: Record<ItemCategory, WardrobeItem | null>;
```

Если `customTabCategories = ['accessories', 'tops', 'accessories']`:

- Первый accessories → `selected['accessories'] = item1`
- Второй accessories → `selected['accessories'] = item2` ❌ **ПЕРЕЗАПИСЬ!**

---

## ✅ Решение: Array-based selection

### **Новая структура данных:**

```typescript
// Вместо Record используем Array
selectedItemsForCreation: (WardrobeItem | null)[]

// Index в массиве соответствует index в customTabCategories
// customTabCategories[0] = 'accessories' → selectedItemsForCreation[0] = item1
// customTabCategories[1] = 'tops'        → selectedItemsForCreation[1] = item2
// customTabCategories[2] = 'accessories' → selectedItemsForCreation[2] = item3
```

---

## 📝 План изменений

### **1. outfitStore.ts - State**

```typescript
interface OutfitState {
  // БЫЛО:
  selectedItemsForCreation: Record<ItemCategory, WardrobeItem | null>;

  // СТАЛО:
  selectedItemsForCreation: (WardrobeItem | null)[];
}

// Initial state
selectedItemsForCreation: []; // Пустой массив

// При изменении customTabCategories - ресайзить массив
```

### **2. outfitStore.ts - selectItemForCategory**

```typescript
// БЫЛО:
selectItemForCategory: (category: ItemCategory, item: WardrobeItem | null)

// СТАЛО:
selectItemForCategory: (slotIndex: number, item: WardrobeItem | null) => {
  const selected = [...get().selectedItemsForCreation];

  // Ensure array is big enough
  while (selected.length <= slotIndex) {
    selected.push(null);
  }

  selected[slotIndex] = item;

  set({ selectedItemsForCreation: selected });
}
```

### **3. outfitStore.ts - getSelectedItemsCount**

```typescript
getSelectedItemsCount: () => {
  return get().selectedItemsForCreation.filter((item) => item !== null).length;
};
```

### **4. outfitStore.ts - confirmItemSelection**

```typescript
confirmItemSelection: () => {
  const selected = get().selectedItemsForCreation;
  const categories = get().customTabCategories;

  const outfitItems: OutfitItem[] = [];

  selected.forEach((item, slotIndex) => {
    if (item && categories[slotIndex]) {
      const category = categories[slotIndex];

      outfitItems.push({
        itemId: item.id,
        item,
        category, // ✅ Может повторяться!
        slot: slotIndex, // ✅ Уникальный slot
        transform: {
          x: calculateX(slotIndex),
          y: calculateY(slotIndex),
          scale: 1,
          rotation: 0,
          zIndex: slotIndex,
        },
        isVisible: true,
      });
    }
  });

  set({
    currentItems: outfitItems,
    creationStep: 2,
  });
};
```

### **5. outfitStore.ts - clearItemSelection**

```typescript
clearItemSelection: () => {
  const categoriesCount = get().customTabCategories.length;
  set({
    selectedItemsForCreation: new Array(categoriesCount).fill(null),
    creationStep: 1,
  });
};
```

### **6. outfitStore.ts - goBackToSelection**

```typescript
goBackToSelection: () => {
  const currentItems = get().currentItems;
  const categories = get().customTabCategories;

  // Создаем массив по размеру categories
  const selectedItems: (WardrobeItem | null)[] = new Array(categories.length).fill(null);

  // Заполняем по slot индексу
  currentItems.forEach((outfitItem) => {
    if (outfitItem.item && outfitItem.slot < selectedItems.length) {
      selectedItems[outfitItem.slot] = outfitItem.item;
    }
  });

  set({
    selectedItemsForCreation: selectedItems,
    creationStep: 1,
  });
};
```

### **7. outfitStore.ts - updateCustomTab**

```typescript
updateCustomTab: (categories: ItemCategory[], order: number[]) => {
  const oldCategories = get().customTabCategories;
  const oldSelected = get().selectedItemsForCreation;

  // Resize selection array if categories changed
  let newSelected: (WardrobeItem | null)[];

  if (categories.length !== oldCategories.length) {
    // Resize array
    newSelected = new Array(categories.length).fill(null);

    // Try to preserve selections where possible
    for (let i = 0; i < Math.min(oldSelected.length, newSelected.length); i++) {
      newSelected[i] = oldSelected[i];
    }
  } else {
    newSelected = oldSelected;
  }

  set({
    customTabCategories: categories,
    customTabOrder: order,
    selectedItemsForCreation: newSelected,
  });
};
```

### **8. outfitStore.ts - setCurrentOutfit (для Edit)**

```typescript
setCurrentOutfit: (outfit) => {
  const categories = get().customTabCategories;
  const selectedItems: (WardrobeItem | null)[] = new Array(categories.length).fill(null);

  if (outfit?.items) {
    // Sort by slot to match order
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
  });
};
```

### **9. CategorySelectorWithSmooth.tsx**

```typescript
interface CategorySelectorWithSmoothProps {
  // БЫЛО:
  // onItemSelect: (category: ItemCategory, item: WardrobeItem | null) => void;

  // СТАЛО:
  onItemSelect: (slotIndex: number, item: WardrobeItem | null) => void;

  // И передаем slotIndex вместо category
}

// В компоненте:
categories.map((category, index) => (
  <SmoothCarousel
    key={`carousel-${index}`}  // ✅ По индексу, не по category
    category={category}
    items={items}
    onItemSelect={(item) => onItemSelect(index, item)}  // ✅ Передаем index
    selectedItem={selectedItems[index]}  // ✅ По индексу!
  />
))
```

### **10. ItemSelectionStepNew.tsx**

```typescript
const handleItemSelect = useCallback(
  (slotIndex: number, item: WardrobeItem | null) => {
    selectItemForCategory(slotIndex, item);  // ✅ По индексу
  },
  [selectItemForCategory],
);

// Передаем в CategorySelectorWithSmooth
<CategorySelectorWithSmooth
  categories={currentTabCategories}
  wardrobeItems={wardrobeItems}
  selectedItems={selectedItemsForCreation}  // ✅ Теперь массив!
  onItemSelect={handleItemSelect}
/>
```

### **11. Randomize function**

```typescript
const handleRandomize = useCallback(() => {
  currentTabCategories.forEach((category, slotIndex) => {
    const categoryItems = wardrobeItems.filter((item) => item.category === category);

    if (categoryItems.length === 0) {
      selectItemForCategory(slotIndex, null);
    } else {
      const randomIndex = Math.floor(Math.random() * categoryItems.length);
      selectItemForCategory(slotIndex, categoryItems[randomIndex]);
    }
  });
}, [currentTabCategories, wardrobeItems, selectItemForCategory]);
```

---

## 🎯 Ключевые изменения

| Компонент                    | Было                     | Стало                 |
| ---------------------------- | ------------------------ | --------------------- |
| **selectedItemsForCreation** | `Record<category, item>` | `(item \| null)[]`    |
| **selectItemForCategory**    | `(category, item)`       | `(slotIndex, item)`   |
| **Ключ карусели**            | `key={category}`         | `key={index}`         |
| **onItemSelect**             | Передает category        | Передает slotIndex    |
| **Доступ к выбору**          | `selected[category]`     | `selected[slotIndex]` |

---

## ✅ Преимущества нового подхода

1. **Поддержка дублей** - индекс всегда уникален
2. **Простая синхронизация** - `selectedItems[i]` ↔ `categories[i]`
3. **Сохранение порядка** - позиция в массиве = позиция в UI
4. **Drag & drop ready** - легко переставлять с сохранением выбора
5. **Edit mode** - `slot` в DB соответствует индексу в массиве

---

## 📋 Checklist для реализации

- [ ] 1. Обновить OutfitState interface
- [ ] 2. Изменить selectItemForCategory signature
- [ ] 3. Обновить getSelectedItemsCount
- [ ] 4. Переписать confirmItemSelection
- [ ] 5. Переписать clearItemSelection
- [ ] 6. Переписать goBackToSelection
- [ ] 7. Обновить updateCustomTab с resize
- [ ] 8. Обновить setCurrentOutfit
- [ ] 9. Изменить CategorySelectorWithSmooth props
- [ ] 10. Обновить ItemSelectionStepNew handlers
- [ ] 11. Исправить handleRandomize
- [ ] 12. Протестировать с дублями категорий
- [ ] 13. Протестировать добавление/удаление категорий
- [ ] 14. Протестировать Edit mode существующих образов

---

## 🧪 Тестовые случаи

### Test 1: Дубли категорий

```
customTabCategories = ['accessories', 'tops', 'accessories']
1. Выбрать часы в первой accessories
2. Выбрать футболку в tops
3. Выбрать браслет во второй accessories
✅ Ожидание: Все три item сохранены
```

### Test 2: Добавление категории

```
Начальное состояние: ['tops', 'bottoms']
1. Выбрать футболку в tops
2. Выбрать джинсы в bottoms
3. Добавить 'accessories' → ['tops', 'bottoms', 'accessories']
✅ Ожидание: tops и bottoms выборы сохранены, accessories пустой
```

### Test 3: Удаление категории

```
Начальное состояние: ['tops', 'accessories', 'bottoms']
1. Выбрать items во всех трех
2. Удалить 'accessories' → ['tops', 'bottoms']
✅ Ожидание: tops и bottoms сохранены на правильных позициях
```

### Test 4: Randomize с дублями

```
customTabCategories = ['tops', 'tops', 'bottoms']
1. Нажать Randomize
✅ Ожидание: Два разных tops item, один bottoms item
```

---

## 🚀 После исправления

**Сценарий с дублями:**

```typescript
customTabCategories = ['accessories', 'tops', 'accessories', 'footwear'];
selectedItemsForCreation = [watch, tshirt, bracelet, sneakers];
//                          ↑      ↑       ↑        ↑
//                       slot 0  slot 1  slot 2   slot 3

// Сохранение в DB:
outfitItems = [
  { itemId: 'watch-id', category: 'accessories', slot: 0 },
  { itemId: 'tshirt-id', category: 'tops', slot: 1 },
  { itemId: 'bracelet-id', category: 'accessories', slot: 2 }, // ✅ Дубль!
  { itemId: 'sneakers-id', category: 'footwear', slot: 3 },
];
```

**Всё работает! 🎉**
