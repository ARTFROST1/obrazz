# Infinite Loop Fix - Правильная Circular Buffer для Малых Массивов

## Проблема

В каруселях с 4 элементами:

- ❌ При прокрутке назад от первого элемента отображался **предпоследний** вместо последнего
- ❌ Легко возникал flickering
- ❌ Элементы не "зацикливались" правильно

**Пример проблемы:**

```
Элементы: [A, B, C, D]
Ожидается: ...B, C, D, A, B, C, D, A...
Было:      ...B, C, D, B, C, D, A, B...  ← B вместо A!
```

## Root Cause

### Было:

```typescript
const DUPLICATE_COUNT = Math.max(30, items.length * 2); // = 30 для 4 элементов

// Add duplicates at start
for (let i = 0; i < DUPLICATE_COUNT; i++) {
  result.push(items[i % items.length]);
}
```

**Проблема:** Для 4 элементов и DUPLICATE_COUNT=30:

```
i=0:  items[0] = A
i=1:  items[1] = B
i=2:  items[2] = C
i=3:  items[3] = D
i=4:  items[0] = A
...
i=29: items[29 % 4] = items[1] = B ← Последний дубликат перед оригиналами!
```

Массив получался:

```
[A,B,C,D, ..., A,B,C,D, A,B, (originals)A,B,C,D, A,B,C,D, ...]
                     ^^
              Перед оригиналом A стоит B вместо D!
```

## Решение

### 1. DUPLICATE_COUNT кратен items.length

```typescript
const DUPLICATE_COUNT = useMemo(() => {
  if (items.length === 0) return 0;
  // Use multiple of items.length for perfect alignment
  const minCopies = Math.ceil(20 / items.length); // At least 20 items
  return minCopies * items.length; // Always multiple of items.length
}, [items.length]);
```

**Для разных размеров:**

- 1 элемент: 20 копий × 1 = 20
- 2 элемента: 10 копий × 2 = 20
- 3 элемента: 7 копий × 3 = 21
- **4 элемента: 5 копий × 4 = 20** ✓
- 5 элементов: 4 копии × 5 = 20
- 10+ элементов: 2-3 копии

### 2. Простое циклическое заполнение

```typescript
const carouselItems = useMemo(() => {
  if (items.length === 0) return [];

  const result: WardrobeItem[] = [];
  const totalCopies = DUPLICATE_COUNT * 2 + items.length;

  // Fill entire array in circular fashion
  for (let i = 0; i < totalCopies; i++) {
    result.push(items[i % items.length]);
  }

  return result;
}, [items, DUPLICATE_COUNT]);
```

**Для 4 элементов [A, B, C, D]:**

```
DUPLICATE_COUNT = 20
totalCopies = 20 + 20 + 4 = 44

i=0:  items[0] = A
i=1:  items[1] = B
i=2:  items[2] = C
i=3:  items[3] = D
i=4:  items[0] = A
...
i=19: items[19 % 4] = items[3] = D ← Последний перед оригиналами!
i=20: items[20 % 4] = items[0] = A ← Первый оригинал
i=21: items[21 % 4] = items[1] = B
...
```

**Результат:**

```
[A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D,
 ↑ Position 0                              ↑ Position 19 (D)

 A,B,C,D,  ← Оригиналы (positions 20-23)
 ↑ indexOffset = 20

 A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D]
```

**Идеальная последовательность!**

- Position 19: D
- Position 20: A (первый оригинал) ✓
- Position 23: D (последний оригинал)
- Position 24: A ✓

### 3. Улучшенная логика adjustment

```typescript
// Map current position to equivalent position in safe zone
const relativeIndex = ((centerIndex % items.length) + items.length) % items.length;
const adjustedIndex = indexOffset + relativeIndex;
```

**Простая и надежная:** берем позицию по модулю и мапим в safe zone.

## Преимущества нового подхода

### ✅ Математически правильно

- DUPLICATE_COUNT всегда кратен items.length
- Нет "обрезанных" циклов
- Идеальная симметрия

### ✅ Работает для любого количества элементов

- 1 элемент: 20 копий (total 41)
- 2 элемента: 20 копий (total 42)
- 3 элемента: 21 копия (total 45)
- 4 элемента: 20 копий (total 44)
- 10 элементов: 20 копий (total 50)

### ✅ Нет flickering

- Правильная последовательность
- Плавные переходы
- Стабильный adjustment

### ✅ Простой код

- Одна простая формула вместо сложной логики
- Легко понять и поддерживать

## Визуализация для 4 элементов

### До исправления (DUPLICATE_COUNT = 30):

```
[A,B,C,D, ... (7.5 циклов), A,B,    ← Обрезано!
                              ^^
 A,B,C,D (originals),                ← Перед A стоит B

 A,B,C,D, ... (7.5 циклов), A,B]    ← Обрезано!
```

### После исправления (DUPLICATE_COUNT = 20):

```
[A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D,  ← Ровно 5 циклов
                                           D   ← Перед A стоит D ✓
 A,B,C,D (originals),

 A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D, A,B,C,D]  ← Ровно 5 циклов
```

## Тестирование

### Test Case 1: 4 элемента [A, B, C, D]

- Scroll вправо: A → B → C → D → A → B... ✓
- Scroll влево: A → D → C → B → A → D... ✓
- No flickering ✓

### Test Case 2: 3 элемента [X, Y, Z]

- DUPLICATE_COUNT = 21 (7 × 3)
- Scroll вправо: X → Y → Z → X → Y... ✓
- Scroll влево: X → Z → Y → X → Z... ✓

### Test Case 3: 1 элемент [A]

- DUPLICATE_COUNT = 20 (20 × 1)
- Всегда A (корректно) ✓

## Результат

✅ Карусели с 4 элементами работают идеально  
✅ Правильная последовательность в обе стороны  
✅ Нет flickering  
✅ Элементы "зациклены" корректно  
✅ Работает для любого количества элементов

## Golden Rule

**Для бесконечного loop с малыми массивами:**

- DUPLICATE_COUNT должен быть **кратен items.length**
- Используйте простое модульное заполнение: `items[i % items.length]`
- Это гарантирует идеальную циклическую последовательность
