# 🐛 CRITICAL BUG: Custom Tab AsyncStorage Перезаписывается при Edit Mode

**Дата:** 2025-11-09 23:58  
**Критичность:** 🔴 CRITICAL  
**Статус:** 🔍 ANALYZED

---

## 🎯 Описание проблемы

**Симптом:**  
При создании НОВОГО образа custom tab имеет категории от **предыдущего редактируемого образа**, а не дефолтные ['tops', 'bottoms', 'footwear'].

**Требование:**

1. ✅ **Новый образ:** custom tab = ['tops', 'bottoms', 'footwear'] (Basic)
2. ✅ **Редактирование:** custom tab = категории из редактируемого образа
3. ✅ **Карусели:** показывают именно те вещи, которые были сохранены

---

## 🔍 ROOT CAUSE ANALYSIS

### Проблема #1: AsyncStorage перезаписывается при edit mode

**Код в `ItemSelectionStepNew.tsx` (строки 62-69):**

```typescript
useEffect(() => {
  if (activeTab === 'custom') {
    const order = customTabCategories.map((_, i) => i);
    saveCustomTabConfig(customTabCategories, order).catch((error) => {
      console.error('[ItemSelectionStepNew] Failed to save custom tab:', error);
    });
  }
}, [customTabCategories, activeTab]);
```

**Проблемный сценарий:**

1. **Создание образа A:**
   - Пользователь создаёт образ с custom tab ['accessories', 'tops', 'bottoms']
   - Сохраняет → AsyncStorage = `['accessories', 'tops', 'bottoms']` ✅

2. **Редактирование образа B:**
   - Образ B имеет только ['footwear']
   - `setCurrentOutfit(B)` устанавливает `customTabCategories = ['footwear']`
   - **useEffect срабатывает!**
   - `saveCustomTabConfig(['footwear'])` → AsyncStorage = `['footwear']` ❌

3. **Создание нового образа C:**
   - `resetCurrentOutfit()` устанавливает `DEFAULT_CUSTOM_CATEGORIES = ['tops', 'bottoms', 'footwear']`
   - НО `loadCustomTabConfig()` загружает из AsyncStorage `['footwear']`!
   - **Результат:** новый образ начинается с `['footwear']` вместо дефолта! ❌

### Проблема #2: Неконтролируемая загрузка из AsyncStorage

**Код в `ItemSelectionStepNew.tsx` (строки 43-59):**

```typescript
useEffect(() => {
  if (isEditMode) {
    console.log('🚫 [ItemSelectionStepNew] Skipping AsyncStorage load - edit mode');
    return;
  }

  const loadCustomTab = async () => {
    console.log('📂 [ItemSelectionStepNew] Loading custom tab config from AsyncStorage');
    const config = await loadCustomTabConfig();
    if (config.categories.length > 0) {
      console.log('✅ [ItemSelectionStepNew] Loaded custom config:', config.categories);
      updateCustomTab(config.categories, config.order);
    }
  };
  loadCustomTab();
}, [isEditMode, updateCustomTab]);
```

**Проблема:**

- Загрузка происходит ВСЕГДА при создании нового образа
- НО AsyncStorage уже перезаписан при предыдущем редактировании!
- Пользователь не может начать с "чистого листа"

---

## 🔬 Детальный Data Flow Analysis

### Сценарий 1: Создание нового образа

```
1. Пользователь: "Create new outfit"
   ↓
2. create.tsx: NOT isEditMode
   ↓
3. resetCurrentOutfit():
   - customTabCategories = DEFAULT_CUSTOM_CATEGORIES (['tops', 'bottoms', 'footwear'])
   - customTabSelectedItems = []
   - activeTab = 'custom'
   ↓
4. ItemSelectionStepNew mounts:
   - isEditMode = false
   - loadCustomTabConfig() from AsyncStorage
   ↓
5. AsyncStorage содержит ['footwear'] (от прошлого edit!)
   ↓
6. updateCustomTab(['footwear'])
   ↓
7. ❌ РЕЗУЛЬТАТ: пользователь видит ['footwear'] вместо ['tops', 'bottoms', 'footwear']
```

### Сценарий 2: Редактирование образа

```
1. Пользователь: "Edit outfit with id='abc'"
   ↓
2. create.tsx: isEditMode = true
   ↓
3. loadOutfitForEdit('abc'):
   - outfit = { items: [...], canvasSettings: {...} }
   ↓
4. setCurrentOutfit(outfit):
   - Extract categories from visible items: ['footwear']
   - customTabCategories = ['footwear']
   - customTabSelectedItems = [shoe1]
   - activeTab = 'custom'
   ↓
5. ItemSelectionStepNew mounts:
   - isEditMode = true
   - ✅ Skips loadCustomTabConfig() (правильно!)
   ↓
6. ❌ НО useEffect сохраняет в AsyncStorage!
   - saveCustomTabConfig(['footwear'])
   - AsyncStorage = ['footwear']
   ↓
7. Пользователь видит правильные данные ✅
8. НО AsyncStorage испорчен для следующего нового образа ❌
```

### Сценарий 3: Переключение между табами (edit mode)

```
1. Edit mode, activeTab = 'custom', customTabCategories = ['footwear']
   ↓
2. Пользователь переключается на Basic tab
   ↓
3. setActiveTab('basic')
   - activeTab = 'basic'
   - customTabCategories остаётся ['footwear']
   ↓
4. useEffect НЕ срабатывает (activeTab != 'custom')
   ↓
5. Пользователь переключается обратно на Custom
   ↓
6. setActiveTab('custom')
   - activeTab = 'custom'
   ↓
7. ❌ useEffect срабатывает снова!
   - saveCustomTabConfig(['footwear'])
```

---

## 🎯 Все потенциальные проблемы

### Проблема A: AsyncStorage перезаписывается в edit mode

**Локация:** `ItemSelectionStepNew.tsx:62-69`  
**Симптом:** Новый образ начинается с категорий от прошлого edit  
**Критичность:** 🔴 CRITICAL

### Проблема B: Нет разделения между "user preference" и "outfit config"

**Концептуальная проблема:**

- AsyncStorage должен хранить **предпочтения пользователя** для новых образов
- Но сейчас перезаписывается при каждом edit
- Нет способа сохранить "мой любимый шаблон"

### Проблема C: Загрузка AsyncStorage при каждом новом образе

**Локация:** `ItemSelectionStepNew.tsx:43-59`  
**Симптом:** Пользователь не может начать с дефолта, даже если хочет  
**Критичность:** 🟡 MEDIUM

### Проблема D: Множественные сохранения при переключении табов

**Локация:** `ItemSelectionStepNew.tsx:62-69`  
**Симптом:** AsyncStorage сохраняется при каждом переключении на custom tab  
**Критичность:** 🟢 LOW (performance issue)

---

## ✅ РЕШЕНИЕ

### Принцип разделения:

```
1. НОВЫЙ ОБРАЗ (create mode):
   - Загрузить из AsyncStorage (user preference)
   - Если AsyncStorage пуст → DEFAULT_CUSTOM_CATEGORIES
   - Сохранять в AsyncStorage при изменении custom tab

2. РЕДАКТИРОВАНИЕ (edit mode):
   - Загрузить из outfit.canvasSettings.customTabCategories
   - НЕ загружать из AsyncStorage
   - НЕ сохранять в AsyncStorage
   - AsyncStorage остаётся нетронутым
```

### Исправления:

#### Fix #1: НЕ сохранять в AsyncStorage при edit mode

```typescript
// ItemSelectionStepNew.tsx:62-69
useEffect(() => {
  // ✅ FIX: Only save in create mode, not edit mode
  if (activeTab === 'custom' && !isEditMode) {
    const order = customTabCategories.map((_, i) => i);
    saveCustomTabConfig(customTabCategories, order).catch((error) => {
      console.error('[ItemSelectionStepNew] Failed to save custom tab:', error);
    });
  }
}, [customTabCategories, activeTab, isEditMode]); // ✅ Add isEditMode dependency
```

#### Fix #2: Очистить AsyncStorage при сохранении нового образа (опционально)

```typescript
// create.tsx: после создания нового образа
if (!isEditMode) {
  // Save user's custom tab preference for next time
  const { customTabCategories } = useOutfitStore.getState();
  await saveCustomTabConfig(
    customTabCategories,
    customTabCategories.map((_, i) => i),
  );
}
```

#### Fix #3: Добавить флаг для контроля загрузки

```typescript
// outfitStore.ts: добавить флаг
interface OutfitState {
  shouldLoadCustomTabFromStorage: boolean; // ✅ NEW
}

// При resetCurrentOutfit (новый образ):
resetCurrentOutfit: () => {
  set({
    shouldLoadCustomTabFromStorage: true, // ✅ Allow load from storage
    customTabCategories: DEFAULT_CUSTOM_CATEGORIES,
  });
};

// При setCurrentOutfit (edit mode):
setCurrentOutfit: (outfit) => {
  set({
    shouldLoadCustomTabFromStorage: false, // ✅ Don't load from storage
    customTabCategories: extractedCategories,
  });
};
```

---

## 📋 План исправлений

### Приоритет 1: Критические фиксы

- [ ] **Fix #1:** Добавить `!isEditMode` в useEffect сохранения (ItemSelectionStepNew.tsx:62)
- [ ] **Fix #2:** Добавить `isEditMode` в dependencies (ItemSelectionStepNew.tsx:69)
- [ ] **Test:** Редактировать образ с 1 категорией → создать новый → проверить custom tab

### Приоритет 2: Улучшения архитектуры

- [ ] Добавить документацию по разделению create/edit mode
- [ ] Рассмотреть отдельное хранилище для user preferences
- [ ] Добавить кнопку "Reset to default" в custom tab

---

## 🧪 Тест-кейсы

### Test 1: Базовый сценарий

```
1. Создать образ A: custom tab = ['accessories', 'tops']
2. Сохранить
3. Редактировать образ B с ['footwear']
4. Сохранить
5. Создать новый образ C
   ✅ ОЖИДАНИЕ: custom tab = ['accessories', 'tops'] (от образа A, не B!)
```

### Test 2: Дефолт для первого раза

```
1. Очистить AsyncStorage
2. Создать первый образ
   ✅ ОЖИДАНИЕ: custom tab = ['tops', 'bottoms', 'footwear'] (дефолт)
```

### Test 3: Edit mode не трогает AsyncStorage

```
1. Создать образ A: custom tab = ['tops', 'bottoms', 'footwear']
2. Сохранить → AsyncStorage = ['tops', 'bottoms', 'footwear']
3. Редактировать образ B: custom tab = ['accessories']
4. Сохранить
5. Проверить AsyncStorage
   ✅ ОЖИДАНИЕ: AsyncStorage всё ещё = ['tops', 'bottoms', 'footwear']
```

### Test 4: Переключение табов в edit mode

```
1. Редактировать образ с ['footwear']
2. Переключиться Basic → Custom → Basic → Custom
3. Проверить AsyncStorage
   ✅ ОЖИДАНИЕ: AsyncStorage не изменился
```

### Test 5: Карусели показывают правильные items

```
1. Образ с ['footwear', 'tops'] и items = [shoe1, tshirt1]
2. Редактировать образ
   ✅ ОЖИДАНИЕ:
   - Carousel 0 (footwear) показывает shoe1
   - Carousel 1 (tops) показывает tshirt1
```

---

## 🚀 Следующие шаги

1. ✅ **Анализ завершён** - все проблемы идентифицированы
2. ⏳ **Применить Fix #1 и #2** - критические исправления
3. ⏳ **Протестировать все 5 тест-кейсов**
4. ⏳ **Code review и документация**

---

**Статус:** Ready for implementation  
**Время выполнения:** ~30 минут  
**Риск:** LOW (изолированные изменения)
