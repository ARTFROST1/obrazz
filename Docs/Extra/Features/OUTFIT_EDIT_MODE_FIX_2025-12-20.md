# Исправление системы редактирования образов (Edit Mode)

**Дата:** 2025-12-20  
**Стадия:** Post-Stage 4.10  
**Проблема:** При редактировании образа в каруселях отображаются неправильные вещи

---

## 🔍 Описание проблемы

### Симптомы

При нажатии кнопки "Редактировать" на странице образа [outfit/[id].tsx](../../app/outfit/[id].tsx), открывается страница создания образа [outfit/create.tsx](../../app/outfit/create.tsx), но:

1. **В каруселях отображаются не те вещи**, которые есть в редактируемом образе
2. **Категории могут не соответствовать** тем, что в образе
3. **Scroll позиции сбрасываются** в начало вместо прокрутки к выбранным вещам

### Корневая причина

**Scroll cache в CategorySelectorWithSmooth фиксировал неправильные позиции:**

1. Когда outfit загружается асинхронно через `setCurrentOutfit()`, React рендерит карусели **до** того, как `selectedItemsForCreation` обновляется
2. В первом рендере `selectedItems` = `[]` (пустой массив)
3. `getInitialScrollIndex()` возвращает `0` для всех каруселей
4. Cache сохраняет эти неправильные позиции: `{ "outfit-id-custom-tops-0": 0, ... }`
5. При последующих рендерах cache имеет приоритет над `selectedItem`, поэтому карусели остаются на позиции 0

**Дополнительная проблема:**

- `scrollCache` не очищался при смене `outfitId` (переход из создания в редактирование)
- В edit mode можно было переключаться на другие вкладки (Basic, Dress, All), что вызывало конфликты

---

## 🛠️ Решение

### 1. Очистка scroll cache при смене outfitId

**Файл:** [CategorySelectorWithSmooth.tsx](../../components/outfit/CategorySelectorWithSmooth.tsx)

```typescript
// ✅ Track outfitId changes to clear cache when entering edit mode
const prevOutfitIdRef = useRef<string | undefined>(outfitId);

// ✅ Clear ALL scroll cache when outfitId changes (entering edit mode)
useEffect(() => {
  if (prevOutfitIdRef.current !== outfitId) {
    console.log('🔄 [CategorySelector] outfitId changed, clearing ALL scroll cache:', {
      prevOutfitId: prevOutfitIdRef.current,
      newOutfitId: outfitId,
    });
    setScrollCache({});
    prevOutfitIdRef.current = outfitId;
  }
}, [outfitId]);
```

**Зачем:** Гарантирует чистое состояние при входе в edit mode, предотвращая использование старого cache от предыдущих создания/редактирования.

### 2. Приоритет selectedItem над cache в edit mode

**Файл:** [CategorySelectorWithSmooth.tsx](../../components/outfit/CategorySelectorWithSmooth.tsx)

```typescript
// ✅ In edit mode (when outfitId exists), prioritize selectedItem over cache
const cacheKey = `${outfitId || 'new'}-${tabType}-${category}-${slotIndex}`;
const calculatedIndex = getInitialScrollIndex(slotIndex, categoryItems);

// Use calculated index if:
// 1. In edit mode (outfitId exists) - always use selectedItem
// 2. No cache exists
// 3. selectedItem exists (user has made a selection)
const shouldUseCalculated =
  outfitId || scrollCache[cacheKey] === undefined || selectedItem !== null;
const initialIndex = shouldUseCalculated ? calculatedIndex : scrollCache[cacheKey];
```

**Зачем:** В edit mode всегда используем реальный индекс выбранной вещи, игнорируя cache. Это гарантирует правильную прокрутку к нужным items.

### 3. Запрет переключения вкладок в edit mode

**Файл:** [ItemSelectionStepNew.tsx](../../components/outfit/ItemSelectionStepNew.tsx)

```typescript
const handleTabChange = useCallback(
  (tab: OutfitTabType) => {
    // ✅ In edit mode, prevent switching away from custom tab
    if (isEditMode && tab !== 'custom') {
      console.log('🚫 [ItemSelectionStepNew] Cannot switch tabs in edit mode');
      return;
    }
    // ... rest of logic
  },
  [activeTab, setActiveTab, isCustomTabEditing, toggleCustomTabEditing, isEditMode],
);
```

**Зачем:** Edit mode всегда использует custom tab с категориями из редактируемого образа. Переключение на Basic/Dress/All вызовет несоответствие данных.

### 4. Скрытие неактивных вкладок в edit mode

**Файл:** [OutfitTabBar.tsx](../../components/outfit/OutfitTabBar.tsx)

```typescript
// ✅ In edit mode, show only the custom tab
const visibleTabs = isEditMode ? tabs.filter((tab) => tab.id === 'custom') : tabs;

const handleTabPress = (tabId: OutfitTabType) => {
  // ✅ Prevent tab switching in edit mode
  if (isEditMode && tabId !== 'custom') {
    console.log('🚫 [OutfitTabBar] Tab switching disabled in edit mode');
    return;
  }
  onTabChange(tabId);
};
```

**Зачем:** UI ясно показывает, что в edit mode доступна только вкладка Custom, предотвращая попытки переключения.

---

## 📋 Изменённые файлы

### 1. `components/outfit/CategorySelectorWithSmooth.tsx`

**Изменения:**

- ✅ Добавлен `prevOutfitIdRef` для отслеживания смены outfitId
- ✅ Новый useEffect для очистки cache при смене outfitId
- ✅ Логика приоритета selectedItem над cache в edit mode
- ✅ Улучшенное логирование для отладки

**Строки:** ~107-110 (ref), ~155-165 (useEffect), ~210-230 (initialIndex calculation)

### 2. `components/outfit/ItemSelectionStepNew.tsx`

**Изменения:**

- ✅ Защита от переключения вкладок в edit mode в `handleTabChange`
- ✅ Передача `isEditMode` prop в OutfitTabBar

**Строки:** ~150-162 (handleTabChange), ~200 (OutfitTabBar prop)

### 3. `components/outfit/OutfitTabBar.tsx`

**Изменения:**

- ✅ Добавлен prop `isEditMode`
- ✅ Фильтрация вкладок: показывать только custom в edit mode
- ✅ Блокировка переключения вкладок в handleTabPress
- ✅ Использование `visibleTabs` вместо `tabs` везде

**Строки:** ~27 (prop), ~37 (visibleTabs), ~40-48 (useEffect), ~50-57 (handleTabPress), ~68 (map), ~142-148 (interpolate)

### 4. `types/components/OutfitCreator.ts`

**Изменения:**

- ✅ Добавлен prop `isEditMode?: boolean` в `OutfitTabBarProps`

**Строки:** ~44

---

## ✅ Проверка работы

### Сценарий 1: Редактирование существующего образа

1. Открыть образ: `/outfit/[id]`
2. Нажать "Редактировать"
3. **Ожидаемое поведение:**
   - ✅ Открывается вкладка Custom
   - ✅ Карусели показывают только категории из этого образа
   - ✅ В каждой карусели **автоматически прокручено к выбранной вещи**
   - ✅ Другие вкладки (Basic, Dress, All) скрыты
   - ✅ При клике на Custom переключается Edit/Done mode

### Сценарий 2: Создание нового образа

1. Открыть `/outfit/create`
2. **Ожидаемое поведение:**
   - ✅ Открывается вкладка Basic (или Custom, если последняя использованная)
   - ✅ Все 4 вкладки видимы
   - ✅ Scroll позиции восстанавливаются из AsyncStorage
   - ✅ Переключение между вкладками работает

### Сценарий 3: Редактирование → Сохранение → Снова редактирование

1. Редактировать образ
2. Изменить вещь в одной карусели
3. Сохранить
4. Снова открыть для редактирования
5. **Ожидаемое поведение:**
   - ✅ Карусель прокручена к **новой** выбранной вещи
   - ✅ Нет "залипания" на старой позиции из cache

---

## 🔍 Логирование (для отладки)

При входе в edit mode в консоли должно быть:

```
🔄 [CategorySelector] outfitId changed, clearing ALL scroll cache: {
  prevOutfitId: undefined,
  newOutfitId: "outfit-uuid-here"
}

📍 [CategorySelector] Scroll index for outfit-uuid-custom-tops-0: {
  cached: undefined,
  calculated: 3,
  willUse: 3,
  selectedItemTitle: "White T-shirt",
  isEditMode: true,
  category: "tops",
  tabType: "custom",
  outfitId: "outfit-uuid-here"
}

🚫 [ItemSelectionStepNew] Skipping AsyncStorage load - edit mode
```

---

## 📊 Архитектура Edit Mode

### Data Flow

```
1. outfit/[id].tsx
   ↓ router.push(`/outfit/create?id=${outfit.id}`)

2. outfit/create.tsx
   ↓ loadOutfitForEdit(id)
   ↓ outfitServiceOffline.getOutfitById(id)

3. outfitStore.setCurrentOutfit(outfit)
   ↓ Filter visible items
   ↓ Extract categories from items
   ↓ Set customTabSelectedItems
   ↓ Set activeTab: 'custom'
   ↓ updateSelectedItemsForCreation()

4. ItemSelectionStepNew renders
   ↓ isEditMode = true (outfit exists)
   ↓ Skip AsyncStorage load
   ↓ Show only Custom tab

5. CategorySelectorWithSmooth renders
   ↓ Clear scroll cache (outfitId changed)
   ↓ Calculate scroll index from selectedItem
   ↓ Scroll to correct position
```

### State Management

```typescript
// IN CREATE MODE (outfitId = undefined):
{
  activeTab: 'basic' | 'dress' | 'all' | 'custom',
  customTabCategories: from AsyncStorage or default,
  selectedItemsByCategory: { tops: item1, bottoms: item2, ... },
  customTabSelectedItems: [item1, item2, ...],
  selectedItemsForCreation: computed from above
}

// IN EDIT MODE (outfitId = "uuid"):
{
  activeTab: 'custom' (locked),
  customTabCategories: from outfit.items (visible only),
  selectedItemsByCategory: {} (cleared),
  customTabSelectedItems: [item1, item2, ...] (from outfit),
  selectedItemsForCreation: [...customTabSelectedItems]
}
```

---

## 🎯 Ключевые паттерны

### 1. Edit Mode Detection

```typescript
const isEditMode = !!currentOutfit;
```

### 2. Scroll Cache Isolation

```typescript
const cacheKey = `${outfitId || 'new'}-${tabType}-${category}-${slotIndex}`;
```

### 3. Prioritize selectedItem in Edit Mode

```typescript
const shouldUseCalculated =
  outfitId || scrollCache[cacheKey] === undefined || selectedItem !== null;
```

### 4. Tab Visibility Control

```typescript
const visibleTabs = isEditMode ? tabs.filter((tab) => tab.id === 'custom') : tabs;
```

---

## 🚀 Результат

✅ **Проблема полностью решена!**

- Карусели показывают правильные вещи из редактируемого образа
- Автоматическая прокрутка к выбранным items работает
- Категории соответствуют структуре образа
- Edit mode изолирован от create mode (нет конфликтов cache)
- UI блокирует невалидные действия (переключение вкладок)

---

## 📚 Связанные документы

- [AppMapobrazz.md](../AppMapobrazz.md) - Общая архитектура приложения
- [Bug_tracking.md](../Bug_tracking.md) - История багов
- [Implementation.md](../Implementation.md) - Roadmap стадий
- [CAROUSEL_SCROLL_CACHE_BUG.md](./Archive/CAROUSEL_SCROLL_CACHE_BUG.md) - Предыдущий fix scroll cache (Nov 2024)
- [STAGE_4_10_COMPLETION.md](./Archive/STAGE_4_10_COMPLETION.md) - Завершение Stage 4.10

---

## ✨ Уроки на будущее

1. **Всегда очищай cache при смене контекста** (new outfit → edit outfit)
2. **Отдавай приоритет реальным данным над cache** в критичных сценариях
3. **Изолируй UI в специальных режимах** (edit mode должен быть locked)
4. **Логируй ключевые decision points** для упрощения отладки
5. **Используй TypeScript флаги** (`isEditMode`) для явного разделения режимов
