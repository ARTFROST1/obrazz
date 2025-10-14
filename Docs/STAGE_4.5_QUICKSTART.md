# Stage 4.5: Quick Start Guide

**Для быстрого начала реализации Stage 4.5: Outfits Collection & Navigation**

---

## 📋 Pre-Implementation Checklist

Перед началом работы убедитесь:

- [x] ✅ Вся документация обновлена
- [x] ✅ Stage 4 (Manual Outfit Creator) завершён
- [x] ✅ Детальный план создан (`STAGE_4.5_OUTFITS_NAVIGATION_PLAN.md`)
- [ ] ⏳ Рабочая среда настроена и готова к кодированию
- [ ] ⏳ Git branch создан: `feature/stage-4.5-outfits-navigation`
- [ ] ⏳ Понимание текущей структуры навигации

---

## 🎯 Что мы делаем (кратко)

**Цель:** Заменить таб "Create" на "Outfits" и добавить FAB для создания образов

**Ключевые изменения:**

1. Новый таб "Outfits" с коллекцией сохранённых образов
2. FAB (Floating Action Button) для создания
3. Create screen переносится в отдельный stack
4. Новые компоненты: OutfitCard, OutfitGrid, FAB

---

## 🚀 Порядок реализации (по приоритету)

### 1️⃣ Начните с UI компонентов (легче всего)

#### Шаг 1.1: FAB Component

```bash
# Создайте файл
components/ui/FAB.tsx
```

**Зачем начать с FAB:**

- Простой компонент
- Не зависит от данных
- Можно тестировать независимо
- Понадобится сразу на Outfits screen

**Референс:** `UI_UX_doc.md` строки 176-200

#### Шаг 1.2: OutfitEmptyState Component

```bash
# Создайте файл
components/outfit/OutfitEmptyState.tsx
```

**Зачем:**

- Простой stateless компонент
- Нужен для Outfits screen
- Можно тестировать сразу

#### Шаг 1.3: OutfitCard Component

```bash
# Создайте файл
components/outfit/OutfitCard.tsx
types/components/OutfitCard.ts
```

**Референс:**

- `UI_UX_doc.md` строки 214-243
- `components/wardrobe/ItemCard.tsx` (похожий паттерн)

#### Шаг 1.4: OutfitGrid Component

```bash
# Создайте файл
components/outfit/OutfitGrid.tsx
```

**Использует:** OutfitCard и OutfitEmptyState

---

### 2️⃣ Обновите сервисы и состояние

#### Шаг 2.1: Outfit Service

```bash
# Обновите файл
services/outfit/outfitService.ts
```

**Добавьте функции:**

- `getOutfitsByUserId()`
- `getOutfitById()`
- `deleteOutfit()`
- `duplicateOutfit()`
- `searchOutfits()`

#### Шаг 2.2: Outfit Store

```bash
# Обновите файл
store/outfit/outfitStore.ts
```

**Добавьте состояние:**

- `outfits: Outfit[]`
- `searchQuery`, `filterBy`, `sortBy`
- Действия для загрузки и управления

---

### 3️⃣ Создайте Outfits Screen

#### Шаг 3.1: Создайте экран

```bash
# Создайте файл
app/(tabs)/outfits.tsx
```

**Структура:**

```tsx
- Header with search, filters, sort, action button
- OutfitGrid with data
- FAB for creating outfits
- Empty state when no outfits
- Loading/error states
```

**Референсы:**

- `app/(tabs)/wardrobe.tsx` (похожая структура с grid)
- `STAGE_4.5_OUTFITS_NAVIGATION_PLAN.md` Phase 6

---

### 4️⃣ Обновите навигацию

#### Шаг 4.1: Перенесите Create Screen

```bash
# Создайте директорию
mkdir -p app/outfit

# Скопируйте файл
cp app/(tabs)/create.tsx app/outfit/create.tsx

# Затем удалите старый
rm app/(tabs)/create.tsx
```

**Обновите в create.tsx:**

- Поддержку route params (для edit mode)
- Navigation (back должен идти на Outfits)
- Header title (Create/Edit динамически)

#### Шаг 4.2: Обновите Tab Layout

```bash
# Обновите файл
app/(tabs)/_layout.tsx
```

**Замените:**

```tsx
// Удалите
<Tabs.Screen name="create" ... />

// Добавьте
<Tabs.Screen
  name="outfits"
  options={{
    title: 'Outfits',
    tabBarIcon: ({ color }) => <Ionicons name="albums-outline" size={24} color={color} />,
    headerTitle: 'My Outfits',
    headerRight: () => (
      <TouchableOpacity onPress={() => router.push('/outfit/create')}>
        <Ionicons name="add" size={28} color={Colors.primary} />
      </TouchableOpacity>
    ),
  }}
/>
```

---

### 5️⃣ Создайте Detail Screen (опционально на первом этапе)

```bash
# Создайте файл
app/outfit/[id].tsx
```

**Можно отложить** если хотите быстро запустить основное.
Сначала сделайте так, чтобы tap на карточку просто логировал ID.

---

## 🧪 Как тестировать на каждом этапе

### После шага 1 (UI Components)

```bash
# Создайте временный test screen
app/test-components.tsx
```

Импортируйте и проверьте каждый компонент визуально.

### После шага 2 (Services)

```typescript
// В console или test file
import { outfitService } from '@services/outfit/outfitService';

// Проверьте
await outfitService.getOutfitsByUserId('test-user-id');
```

### После шага 3 (Outfits Screen)

1. Запустите app
2. Перейдите на таб Outfits
3. Проверьте empty state
4. Создайте образ через FAB
5. Вернитесь - образ должен появиться

### После шага 4 (Navigation)

1. Проверьте все 4 таба видны
2. FAB работает
3. Header button работает
4. Back navigation возвращает на Outfits

---

## 💡 Советы и Best Practices

### 1. Используйте существующий код

- **ItemCard** → паттерн для OutfitCard
- **wardrobe.tsx** → паттерн для outfits.tsx
- **itemService** → паттерн для outfitService updates

### 2. Начните с mock данных

Если API еще не готов, используйте:

```typescript
const mockOutfits: Outfit[] = [
  {
    id: '1',
    title: 'Test Outfit',
    items: [],
    visibility: 'private',
    created_at: new Date().toISOString(),
  },
];
```

### 3. Делайте коммиты часто

```bash
git commit -m "feat: add FAB component"
git commit -m "feat: add OutfitCard component"
git commit -m "feat: add Outfits screen"
# и т.д.
```

### 4. Тестируйте на реальном устройстве

Особенно:

- FAB touch target (должен быть удобным)
- Scroll performance с многими образами
- Gesture interactions (long press, tap)

### 5. Следуйте TypeScript строго

Все компоненты должны иметь типы Props.
Все функции должны иметь return types.

---

## ⚠️ Распространенные проблемы и решения

### Проблема: FlashList не установлен

```bash
npx expo install @shopify/flash-list
```

### Проблема: Navigation не работает после переноса create.tsx

**Решение:** Проверьте, что используете правильные пути:

```typescript
// Правильно
router.push('/outfit/create');

// Неправильно
router.push('/(tabs)/create');
```

### Проблема: FAB перекрывает контент

**Решение:** Добавьте padding внизу списка:

```typescript
contentContainerStyle={{ paddingBottom: 80 }}
```

### Проблема: Образы не загружаются

**Решение:** Проверьте:

1. User ID передаётся правильно
2. Supabase query работает
3. Data mapping корректен
4. TanStack Query настроен

---

## 📚 Ключевые файлы для референса

### Документация

- `STAGE_4.5_OUTFITS_NAVIGATION_PLAN.md` - полный детальный план
- `STAGE_4.5_SUMMARY.md` - краткое описание
- `UI_UX_doc.md` - все спецификации UI

### Существующий код

- `app/(tabs)/wardrobe.tsx` - пример screen с grid
- `app/(tabs)/create.tsx` - текущий create (будет перенесён)
- `components/wardrobe/ItemCard.tsx` - пример card
- `store/outfit/outfitStore.ts` - текущий store

### Типы

- `types/models/outfit.ts` - Outfit type
- `types/models/item.ts` - Item type для reference

---

## 🎯 Минимальный MVP для тестирования

Если нужно **очень быстро** проверить концепцию:

1. **Создайте только FAB** (30 мин)
2. **Создайте пустой outfits.tsx с EmptyState** (30 мин)
3. **Обновите navigation** (30 мин)
4. **Перенесите create.tsx** (30 мин)

**Итого: 2 часа** и у вас будет работающая навигация с FAB!

После этого добавляйте постепенно:

- OutfitCard
- OutfitGrid
- Data loading
- Detail screen

---

## ✅ Определение готовности (Definition of Done)

Stage 4.5 считается завершённым когда:

- [ ] Все 4 таба видны и работают
- [ ] Outfits screen показывает сохранённые образы
- [ ] FAB создаёт новый образ
- [ ] Create screen доступен из Outfits
- [ ] Navigation работает корректно (back, forward)
- [ ] Empty state отображается когда нет образов
- [ ] Search/filter/sort работают (можно базово)
- [ ] Edit outfit flow работает
- [ ] Delete outfit работает
- [ ] Нет критических багов
- [ ] Код прошёл review
- [ ] TypeScript errors = 0
- [ ] Документация обновлена (completion doc)

---

## 🚦 Приоритеты (если ограничено время)

### Must Have (P0)

1. ✅ Outfits tab в navigation
2. ✅ FAB для создания
3. ✅ Перенос create.tsx
4. ✅ Базовая OutfitCard
5. ✅ Базовый OutfitGrid
6. ✅ Empty state

### Should Have (P1)

1. Search функционал
2. Filter chips
3. Sort dropdown
4. Detail screen
5. Delete confirmation

### Nice to Have (P2)

1. Long press context menu
2. Duplicate outfit
3. Share outfit
4. Advanced animations
5. Pull-to-refresh

---

## 🏁 Готовы начать?

1. **Создайте branch:**

```bash
git checkout -b feature/stage-4.5-outfits-navigation
```

2. **Откройте план:**

```bash
code Docs/STAGE_4.5_OUTFITS_NAVIGATION_PLAN.md
```

3. **Начните с Phase 2** (Phase 1 документация уже готова)

4. **Двигайтесь последовательно по фазам**

5. **Тестируйте после каждой фазы**

6. **Делайте коммиты часто**

---

**Удачи! Вы готовы к Stage 4.5! 🚀**

_Если возникнут вопросы, обращайтесь к детальному плану или существующему коду для reference._
