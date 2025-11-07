# State Management Fix - React setState Side Effects

## Проблема

При запуске приложения возникала ошибка:

```
Error in components\outfit\ItemSelectionStepNew.tsx
setActiveCategories$argument_0
```

### Root Cause

**Side effects внутри setState** - нарушение правил React:

```typescript
// ❌ НЕПРАВИЛЬНО - side effect внутри setState
const handleCategoryToggle = (category) => {
  setActiveCategories((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(category)) {
      newSet.delete(category);
      selectItemForCategory(category, null); // ← SIDE EFFECT!
    } else {
      newSet.add(category);
    }
    return newSet;
  });
};
```

**Проблема:** `selectItemForCategory` вызывает другой state update (в Zustand store) во время выполнения текущего state update. Это создает race condition и нарушает React rules.

## Решение

### 1. ItemSelectionStepNew.tsx

Вынесли side effect из setState:

```typescript
// ✅ ПРАВИЛЬНО - side effect после setState
const handleCategoryToggle = useCallback(
  (category: ItemCategory) => {
    setActiveCategories((prev) => {
      const newSet = new Set(prev);
      const isDeactivating = newSet.has(category);

      if (isDeactivating) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });

    // Side effect ПОСЛЕ setState
    if (activeCategories.has(category)) {
      selectItemForCategory(category, null);
    }
  },
  [selectItemForCategory, activeCategories],
);
```

**Что изменилось:**

1. Удален вызов `selectItemForCategory` из setState
2. Вызов перенесен после `setActiveCategories`
3. Проверка `activeCategories.has(category)` для определения деактивации

### 2. CategorySelectorWithSmooth.tsx

Упростили логику обработчиков:

```typescript
// ❌ БЫЛО - множественные вызовы
onCategoryToggle={() => {
  if (isCategoryActive) {
    onItemSelect(category, null);  // ← Первый state update
  }
  onCategoryToggle(category);      // ← Второй state update
}}

// ✅ СТАЛО - один вызов
onCategoryToggle={() => {
  onCategoryToggle(category);
}}
```

**Логика перенесена** в родительский компонент `ItemSelectionStepNew`, где она обрабатывается правильно.

```typescript
// В ItemSelectionStepNew
const handleCategoryToggle = (category) => {
  // 1. Toggle категории
  setActiveCategories(...);

  // 2. Очистка выбора (если нужно)
  if (activeCategories.has(category)) {
    selectItemForCategory(category, null);
  }
};
```

### 3. onItemSelect handler

Изменен порядок вызовов:

```typescript
// ❌ БЫЛО
onItemSelect={(item) => {
  if (!isCategoryActive) {
    onCategoryToggle(category);    // ← Сначала toggle
  }
  onItemSelect(category, item);    // ← Потом select
}}

// ✅ СТАЛО
onItemSelect={(item) => {
  onItemSelect(category, item);    // ← Сначала select
  if (!isCategoryActive) {
    onCategoryToggle(category);    // ← Потом toggle
  }
}}
```

**Почему так лучше:**

1. Сначала обрабатываем основное действие (выбор элемента)
2. Потом side effect (активация категории)
3. Меньше шансов на race condition

## React Rules of setState

### ❌ Не делайте:

1. **Side effects в setState updater:**

```typescript
setState((prev) => {
  doSomething(); // ❌ BAD
  return newValue;
});
```

2. **Множественные state updates подряд:**

```typescript
setState1(value1);
setState2(value2); // Может не увидеть обновление state1
```

3. **Async операции в setState:**

```typescript
setState((prev) => {
  await fetch(...);  // ❌ BAD
  return newValue;
});
```

### ✅ Правильно:

1. **Чистые setState updaters:**

```typescript
setState((prev) => {
  // Только вычисления на основе prev
  return computeNewValue(prev);
});
```

2. **Side effects после setState:**

```typescript
setState(newValue);
// Side effect после
doSomething();
```

3. **useEffect для связанных updates:**

```typescript
useEffect(() => {
  if (condition) {
    doSideEffect();
  }
}, [dependency]);
```

## Результат

✅ Приложение больше не крашится  
✅ Правильный порядок state updates  
✅ Нет race conditions  
✅ Соблюдаются React best practices

## Lesson Learned

**Golden Rule:** setState updater function должна быть **чистой функцией**:

- Принимает `prev` state
- Возвращает `new` state
- **Никаких side effects!**

All side effects должны быть:

- После setState
- В useEffect
- В event handlers (но не в updater function)
