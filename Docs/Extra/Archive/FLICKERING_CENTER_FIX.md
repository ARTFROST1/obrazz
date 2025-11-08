# Flickering Center Item Fix - State vs Ref

## Проблема

Карусель входила в flickering состояние при прокрутке - флаг кнопка прыгала между элементами, не было понятно какой элемент активный.

### Root Cause: Ref в Render Function

```typescript
// ❌ ПРОБЛЕМА
const centerIndexRef = useRef(initialScrollIndex);

const renderItem = ({ item, index }) => {
  const isCenterItem = index === centerIndexRef.current; // ← Ref в render!

  return (
    <View>
      {isCenterItem && <FlagButton />} {/* ← Не обновляется! */}
    </View>
  );
};
```

**Почему это проблема:**

1. `centerIndexRef.current` обновляется в `handleScroll`
2. Но **ref не триггерит re-render**
3. `renderItem` не перевызывается когда ref меняется
4. Флаг кнопка остается на старом элементе
5. Визуально выглядит как flickering

## React Rules

### ❌ Не использовать Refs для UI State

**Refs предназначены для:**

- DOM references (ref={myRef})
- Mutable values без re-render (timers, flags)
- Предыдущие значения (prevValue)

**Refs НЕ для:**

- Данных которые влияют на render ❌
- UI состояния (показать/скрыть) ❌
- Активных элементов ❌

### ✅ Использовать State для UI

**State предназначен для:**

- Данных которые влияют на render
- UI состояния
- Активных элементов

**При изменении state:**

1. React триггерит re-render
2. Компонент перерисовывается
3. UI обновляется

## Решение

### Замена Ref на State

```typescript
// ✅ РЕШЕНИЕ
const [centerIndex, setCenterIndex] = useState(initialScrollIndex);

const renderItem = ({ item, index }) => {
  const isCenterItem = index === centerIndex; // ← State в render!

  return (
    <View>
      {isCenterItem && <FlagButton />} {/* ← Обновляется! */}
    </View>
  );
};
```

### Обновление во всех местах

#### 1. handleScroll

```typescript
// ❌ Было
const handleScroll = (event) => {
  const newCenterIndex = getCenterIndex(contentOffset.x);
  if (indexDiff >= 1) {
    centerIndexRef.current = newCenterIndex; // Не триггерит render
  }
};

// ✅ Стало
const handleScroll = (event) => {
  const newCenterIndex = getCenterIndex(contentOffset.x);
  if (indexDiff >= 1) {
    setCenterIndex(newCenterIndex); // Триггерит render
  }
}, [getCenterIndex, centerIndex]); // ← Добавили centerIndex в deps
```

#### 2. handleMomentumScrollEnd

```typescript
// ❌ Было
setTimeout(() => {
  flatListRef.current?.scrollToOffset({...});
  centerIndexRef.current = adjustedIndex; // Не триггерит render
}, 100);

// ✅ Стало
setTimeout(() => {
  flatListRef.current?.scrollToOffset({...});
  setCenterIndex(adjustedIndex); // Триггерит render
}, 100);
```

#### 3. renderItem dependencies

```typescript
// ❌ Было
}, [itemWidth, itemHeight, isCategoryActive, onCategoryToggle]);

// ✅ Стало
}, [itemWidth, itemHeight, isCategoryActive, onCategoryToggle, centerIndex]);
//                                                             ^^^^^^^^^^^^
//                                              Добавили centerIndex в deps
```

## Как это работает теперь

### Flow обновления центрального элемента:

```
1. User scrolls
   ↓
2. handleScroll fires
   ↓
3. getCenterIndex(offsetX) → newCenterIndex
   ↓
4. setCenterIndex(newCenterIndex) ← State update!
   ↓
5. React schedules re-render
   ↓
6. renderItem re-executed with new centerIndex
   ↓
7. isCenterItem calculated correctly
   ↓
8. Flag button appears on correct item ✓
```

### Без state (старая версия):

```
1. User scrolls
   ↓
2. handleScroll fires
   ↓
3. centerIndexRef.current = newIndex ← Ref update (no render)
   ↓
4. ... nothing happens
   ↓
5. renderItem NOT re-executed
   ↓
6. Flag button stays on old item ❌
```

## Performance Considerations

### Вопрос: Не будет ли слишком много re-renders?

**Ответ: Нет, потому что:**

1. **Anti-flickering protection:**

```typescript
const indexDiff = Math.abs(newCenterIndex - centerIndex);
if (indexDiff >= 1) {
  // Только при значительном изменении
  setCenterIndex(newCenterIndex);
}
```

2. **scrollEventThrottle={32}:**

- Ограничивает scroll events до ~30/sec
- Меньше событий = меньше updates

3. **useCallback optimization:**

```typescript
const renderItem = useCallback(
  ({ item, index }) => {
    // ...
  },
  [centerIndex],
); // Memo пока centerIndex не меняется
```

4. **FlatList optimization:**

- Только видимые элементы рендерятся
- `windowSize={21}` ограничивает область render

## Comparison

### Ref Approach (❌ Проблема)

```typescript
✗ Не триггерит re-render
✗ UI не синхронизирован с данными
✗ Flickering
✗ Confusion какой элемент активный
✓ Минимальные re-renders (но это не помогает)
```

### State Approach (✅ Решение)

```typescript
✓ Триггерит re-render
✓ UI синхронизирован с данными
✓ Плавное обновление
✓ Четко видно активный элемент
✓ Минимальные re-renders (благодаря throttling)
```

## Golden Rules

### 1. Refs для Non-Visual Data

```typescript
✓ const scrollOffsetRef = useRef(0);
✓ const isAdjustingRef = useRef(false);
✓ const timerRef = useRef<NodeJS.Timeout | null>(null);
```

### 2. State для Visual Data

```typescript
✓ const [centerIndex, setCenterIndex] = useState(0);
✓ const [isVisible, setIsVisible] = useState(false);
✓ const [selectedId, setSelectedId] = useState<string | null>(null);
```

### 3. Dependency Arrays

```typescript
// Если используете в render, добавьте в deps:
const renderItem = useCallback(
  (item, index) => {
    const isActive = index === centerIndex; // ← используем centerIndex
    // ...
  },
  [centerIndex],
); // ← добавили в deps
```

## Результат

✅ Нет flickering  
✅ Флаг кнопка всегда на правильном элементе  
✅ Четкая визуализация активного элемента  
✅ Плавные переходы между элементами  
✅ Правильная React архитектура  
✅ Оптимальная производительность

## Lesson Learned

**Важное правило React:**

> If it affects what's rendered, it should be state, not a ref.

Если данные влияют на то что отображается - это должен быть **state**, не **ref**.
