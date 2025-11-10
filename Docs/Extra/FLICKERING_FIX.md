# Fix: Flickering при дублях категорий ✅

## 🐛 Проблема

**Симптом:**
Когда добавлены две карусели одной категории (например, два accessories), при изменении одной карусели, вторая тоже реагирует и появляется flickering.

**Пример:**

```
customTabCategories = ['accessories', 'tops', 'accessories']

Carousel 1 (accessories) - выбираем часы
→ Carousel 3 (accessories) тоже реагирует! ❌ FLICKERING
```

---

## 🔍 Корневая причина

### **Проблема #1: Общий scroll state**

В `CategorySelectorWithSmooth.tsx`:

```typescript
// БЫЛО:
const [categoryScrollIndexes, setCategoryScrollIndexes] = useState<Record<ItemCategory, number>>({
  // Ключ = category name
});

const handleScrollIndexChange = useCallback((category: ItemCategory, index: number) => {
  setCategoryScrollIndexes((prev) => ({
    ...prev,
    [category]: index,  // ❌ ОБА accessories используют ОДИН ключ!
  }));
}, []);

// При рендеринге:
{visibleCategories.map((category, slotIndex) => {
  const initialIndex = categoryScrollIndexes[category];  // ❌ ОБА читают ОДИН индекс!

  return (
    <SmoothCarousel
      onScrollIndexChange={(index) => handleScrollIndexChange(category, index)}
    />
  );
})}
```

**Что происходило:**

1. User скроллит первую карусель accessories (slot 0)
2. `handleScrollIndexChange('accessories', 5)` → сохраняет `{ accessories: 5 }`
3. React перерендеривает обе карусели
4. Вторая карусель accessories (slot 2) читает `categoryScrollIndexes['accessories'] = 5`
5. Вторая карусель **ТОЖЕ** скроллится на индекс 5! ❌
6. Flickering из-за одновременного скролла обеих каруселей

---

## ✅ Решение

### **Использовать slotIndex вместо category как ключ**

```typescript
// СТАЛО:
const [slotScrollIndexes, setSlotScrollIndexes] = useState<Record<number, number>>({
  // Ключ = slotIndex (уникальный для каждой карусели!)
});

const handleScrollIndexChange = useCallback((slotIndex: number, index: number) => {
  setSlotScrollIndexes((prev) => ({
    ...prev,
    [slotIndex]: index,  // ✅ Каждая карусель имеет свой ключ!
  }));
}, []);

// При рендеринге:
{visibleCategories.map((category, slotIndex) => {
  const initialIndex = slotScrollIndexes[slotIndex];  // ✅ Читают РАЗНЫЕ индексы!

  return (
    <SmoothCarousel
      onScrollIndexChange={(index) => handleScrollIndexChange(slotIndex, index)}
      //                                                       ^^^^^^^^^ уникальный!
    />
  );
})}
```

**Теперь:**

1. User скроллит первую карусель accessories (slot 0)
2. `handleScrollIndexChange(0, 5)` → сохраняет `{ 0: 5 }`
3. React перерендеривает карусели
4. Вторая карусель accessories (slot 2) читает `slotScrollIndexes[2] = undefined`
5. Вторая карусель **НЕ МЕНЯЕТСЯ**! ✅
6. Нет flickering - каждая карусель независима

---

## 📊 Изменения в коде

### **CategorySelectorWithSmooth.tsx**

```diff
- const [categoryScrollIndexes, setCategoryScrollIndexes] = useState<Record<ItemCategory, number>>({});
+ const [slotScrollIndexes, setSlotScrollIndexes] = useState<Record<number, number>>({});

- const handleScrollIndexChange = useCallback((category: ItemCategory, index: number) => {
+ const handleScrollIndexChange = useCallback((slotIndex: number, index: number) => {
-   setCategoryScrollIndexes((prev) => ({
+   setSlotScrollIndexes((prev) => ({
      ...prev,
-     [category]: index,
+     [slotIndex]: index,
    }));
  }, []);

  {visibleCategories.map((category, slotIndex) => {
-   const initialIndex = categoryScrollIndexes[category] !== undefined
+   const initialIndex = slotScrollIndexes[slotIndex] !== undefined
-     ? categoryScrollIndexes[category]
+     ? slotScrollIndexes[slotIndex]
      : getInitialScrollIndex(slotIndex, categoryItems);

    return (
      <SmoothCarousel
-       onScrollIndexChange={(index) => handleScrollIndexChange(category, index)}
+       onScrollIndexChange={(index) => handleScrollIndexChange(slotIndex, index)}
      />
    );
  })}
```

---

## 🎯 Результат

### **До исправления:**

```
State: { accessories: 5 }
        ↓           ↓
   Carousel 0   Carousel 2
   (accessories) (accessories)
        ↓           ↓
    Оба скроллятся на индекс 5! ❌ FLICKERING
```

### **После исправления:**

```
State: { 0: 5, 2: undefined }
        ↓           ↓
   Carousel 0   Carousel 2
   (accessories) (accessories)
        ↓           ↓
    Индекс 5    Не меняется ✅ НЕТ FLICKERING
```

---

## 🧪 Как проверить

### **Test Case 1: Независимые скроллы**

```
1. Custom Tab → Edit
2. Добавить: accessories → tops → accessories
3. Done
4. Скроллить первую карусель accessories → выбрать часы ⌚
5. Проверить: вторая карусель accessories НЕ должна скроллиться ✅
6. Скроллить вторую карусель accessories → выбрать браслет 📿
7. Проверить: первая карусель НЕ должна скроллиться ✅
```

### **Test Case 2: Независимые выборы**

```
1. Custom Tab с двумя accessories
2. Выбрать часы ⌚ в первой карусели
3. Выбрать браслет 📿 во второй карусели
4. Next → Canvas
5. Проверить: оба item на canvas ✅
6. selectedItemsForCreation = [watch, ..., bracelet] ✅
```

### **Test Case 3: Нет конфликтов**

```
1. Custom Tab: accessories → accessories → accessories (три!)
2. Скроллить первую → не влияет на остальные ✅
3. Скроллить вторую → не влияет на остальные ✅
4. Скроллить третью → не влияет на остальные ✅
5. Выбрать разные items в каждой ✅
```

---

## 📈 Технические детали

### **Ключевой момент:**

Когда React рендерит список компонентов, каждый компонент должен иметь уникальный идентификатор для правильного state management.

**Было:**

- Идентификатор = `category` (не уникален при дублях)
- State key = `category` (конфликт!)
- React не может различить два accessories

**Стало:**

- Идентификатор = `slotIndex` (всегда уникален)
- State key = `slotIndex` (нет конфликтов!)
- React корректно управляет каждой каруселью

### **Аналогия:**

```
Плохо:
const users = [
  { name: 'John', data: {...} },
  { name: 'Jane', data: {...} },
  { name: 'John', data: {...} },  // ❌ Конфликт!
];

users.map(user => <Component key={user.name} />);  // ❌ Два John!

Хорошо:
const users = [
  { id: 0, name: 'John', data: {...} },
  { id: 1, name: 'Jane', data: {...} },
  { id: 2, name: 'John', data: {...} },  // ✅ Уникальный ID
];

users.map(user => <Component key={user.id} />);  // ✅ Все уникальны!
```

---

## ✅ Статус

**Исправлено:** ✅  
**Файлы изменены:** 1 (CategorySelectorWithSmooth.tsx)  
**Строк кода:** ~10  
**Тестирование:** Готово к проверке

---

## 🚀 Готово!

**Flickering исправлен! Каждая карусель теперь полностью независима, даже если категории дублируются!** 🎉

**Запустите приложение и проверьте - две accessories карусели должны работать независимо без flickering!**
