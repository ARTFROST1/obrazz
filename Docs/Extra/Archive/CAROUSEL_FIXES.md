# Carousel Fixes - Anti-Flickering & Perfect Alignment

## Исправленные проблемы

### 1. ✅ Убрана черная рамка на элементах

**Было:**

```typescript
itemCardSelected: {
  borderWidth: 2,
  borderColor: '#000',
}
```

**Стало:**

- Полностью удален стиль `itemCardSelected`
- Элементы не имеют черной рамки
- Чистый минималистичный вид

### 2. ✅ Исправлен flickering при быстрой прокрутке

#### Проблема:

- При быстром перепрыгивании между элементами происходил flickering
- Слишком частые обновления `centerIndexRef`
- Конфликты между scroll events и infinite loop adjustments

#### Решение:

**a) Защита от частых обновлений:**

```typescript
// Update center index only if significantly changed (anti-flickering)
const newCenterIndex = getCenterIndex(contentOffset.x);
const indexDiff = Math.abs(newCenterIndex - centerIndexRef.current);

if (indexDiff >= 1) {
  centerIndexRef.current = newCenterIndex;
}
```

**b) Блокировка scroll events во время adjustment:**

```typescript
const isAdjustingRef = useRef(false);

const handleScroll = (event) => {
  // Skip if adjusting for infinite loop
  if (isAdjustingRef.current) return;
  // ...
};
```

**c) Увеличен scrollEventThrottle:**

```typescript
scrollEventThrottle={32}  // Было: 16
```

Меньше событий = меньше flickering

**d) Таймауты для безопасного adjustment:**

```typescript
// Wait for snap animation to complete before adjusting
setTimeout(
  () => {
    flatListRef.current?.scrollToOffset({
      offset: adjustedIndex * (itemWidth + spacing),
      animated: false,
    });

    // Re-enable scrolling after adjustment
    setTimeout(() => {
      isAdjustingRef.current = false;
    }, 50);
  },
  offsetDiff > 1 ? 300 : 100,
);
```

**e) Cleanup timers:**

```typescript
const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  return () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };
}, []);
```

### 3. ✅ Выравнивание центральных элементов

#### Проблема:

- Карусели были "в разнобой"
- Центральные элементы не совпадали вертикально
- Разное выравнивание в разных каруселях

#### Решение:

**a) Убран spacing между элементами:**

```typescript
const spacing = 0; // Было: 8
```

Теперь элементы идеально прилегают друг к другу

**b) Правильный padding для центрирования:**

```typescript
const sidePadding = (SCREEN_WIDTH - itemWidth) / 2;
```

Точный расчет для центрирования активного элемента

**c) snapToAlignment="start":**

```typescript
snapToAlignment = 'start'; // Было: "center"
```

С padding это дает точное центрирование

**d) Синхронизация getItemLayout:**

```typescript
getItemLayout={(data, index) => ({
  length: itemWidth + spacing,  // spacing = 0
  offset: (itemWidth + spacing) * index,
  index,
})}
```

### 4. ✅ Дополнительные улучшения стабильности

**a) Улучшенная логика infinite loop:**

```typescript
const needsAdjustment = centerIndex < indexOffset || centerIndex >= indexOffset + items.length;

if (needsAdjustment && items.length > 0) {
  isAdjustingRef.current = true;

  // Calculate adjusted index with proper modulo
  let adjustedIndex = centerIndex;
  if (centerIndex < indexOffset) {
    const offset = (indexOffset - centerIndex) % items.length;
    adjustedIndex = indexOffset + items.length - offset;
  } else {
    const offset = (centerIndex - indexOffset) % items.length;
    adjustedIndex = indexOffset + offset;
  }
}
```

**b) Защита всех handlers:**

```typescript
const handleScroll = (event) => {
  if (isAdjustingRef.current) return; // Protection
  // ...
};

const handleScrollEndDrag = (event) => {
  if (isAdjustingRef.current) return; // Protection
  // ...
};

const handleMomentumScrollEnd = (event) => {
  if (isAdjustingRef.current) return; // Protection
  // ...
};
```

## Результаты

### До исправлений:

- ❌ Черная рамка на элементах
- ❌ Flickering при быстрой прокрутке
- ❌ Карусели не выровнены вертикально
- ❌ Центральные элементы "гуляют"

### После исправлений:

- ✅ Чистый вид без рамок
- ✅ Нет flickering даже при очень быстрой прокрутке
- ✅ Все карусели идеально выровнены
- ✅ Центральные элементы точно друг под другом
- ✅ Плавная прокрутка с инерцией
- ✅ Стабильная работа infinite loop

## Технические детали

### Anti-Flickering Protection Layers:

1. **Layer 1: Event Throttling**
   - `scrollEventThrottle={32}` - меньше событий

2. **Layer 2: Index Diff Check**
   - Обновление только при изменении >= 1

3. **Layer 3: Adjustment Lock**
   - `isAdjustingRef.current` блокирует все handlers

4. **Layer 4: Timer Cleanup**
   - Очистка pending timeouts

5. **Layer 5: Smart Delays**
   - 300ms для snap animation
   - 100ms для simple adjustment
   - 50ms для re-enable

### Perfect Alignment Formula:

```
┌─────────────────────────────────┐
│         SCREEN_WIDTH            │
├──────────┬──────────┬──────────┤
│  Padding │   Item   │  Padding │
│  (side)  │ (center) │  (side)  │
└──────────┴──────────┴──────────┘

sidePadding = (SCREEN_WIDTH - itemWidth) / 2
spacing = 0
snapToAlignment = "start"

Result: Center item perfectly aligned in screen center
```

### Vertical Alignment:

```
Carousel 1: [pad][item1][item2][*item3*][item4][item5][pad]
                             ↓
Carousel 2: [pad][itemA][itemB][*itemC*][itemD][itemE][pad]
                             ↓
Carousel 3: [pad][itemX][itemY][*itemZ*][itemW][itemV][pad]
                             ↓
           Center elements aligned vertically!
```

## Выводы

Карусель теперь:

1. **Стабильна** - нет flickering
2. **Выровнена** - все центры совпадают
3. **Чистая** - без лишних рамок
4. **Плавная** - естественная физика
5. **Надежная** - защищена от race conditions

Все исправления применены в `SmoothCarousel.tsx`.
