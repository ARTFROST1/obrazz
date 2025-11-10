# ✅ ИСПРАВЛЕНО: Custom Tab сбрасывается при создании нового образа

**Дата:** 2025-11-09 23:58  
**Статус:** ✅ FIXED  
**Критичность:** 🔴 CRITICAL

---

## 🎯 Проблема

**Требование:**

1. При создании **НОВОГО образа** → custom tab = `['tops', 'bottoms', 'footwear']` (дефолт или из AsyncStorage)
2. При **редактировании** → custom tab = категории из редактируемого образа
3. В каруселях должны отображаться **именно те вещи**, которые были сохранены

**Что было:**

- При создании нового образа custom tab имел категории от **последнего редактируемого образа**
- Например, редактировали образ с ['footwear'], потом создавали новый → custom tab = ['footwear'] ❌

---

## 🔍 Root Cause

### Проблема: AsyncStorage перезаписывался в edit mode

**ItemSelectionStepNew.tsx** (строки 62-69) сохранял customTabCategories в AsyncStorage **всегда**, даже при редактировании:

```typescript
useEffect(() => {
  if (activeTab === 'custom') {
    saveCustomTabConfig(customTabCategories, order); // ❌ Сохраняет даже в edit mode!
  }
}, [customTabCategories, activeTab]);
```

**Сценарий бага:**

1. Редактирование образа с ['footwear']
2. `setCurrentOutfit` устанавливает `customTabCategories = ['footwear']`
3. useEffect срабатывает → **сохраняет ['footwear'] в AsyncStorage** ❌
4. Создание нового образа
5. `loadCustomTabConfig()` загружает из AsyncStorage ['footwear']
6. Новый образ начинается с ['footwear'] вместо дефолта!

---

## ✅ Решение

### Fix #1: НЕ сохранять в AsyncStorage при edit mode

**ItemSelectionStepNew.tsx:62-74** (обновлено):

```typescript
useEffect(() => {
  // ✅ FIX: Only save to AsyncStorage in create mode
  if (activeTab === 'custom' && !isEditMode) {
    const order = customTabCategories.map((_, i) => i);
    console.log('💾 Saving custom tab to AsyncStorage (create mode):', customTabCategories);
    saveCustomTabConfig(customTabCategories, order).catch(...);
  } else if (activeTab === 'custom' && isEditMode) {
    console.log('🚫 Skipping AsyncStorage save (edit mode):', customTabCategories);
  }
}, [customTabCategories, activeTab, isEditMode]); // ✅ Added isEditMode
```

**Что изменилось:**

- ✅ Добавлена проверка `!isEditMode`
- ✅ Добавлена зависимость `isEditMode`
- ✅ Добавлено детальное логирование

### Fix #2: Улучшено логирование для отладки

**outfitStore.ts** - добавлены детальные логи в:

- `setCurrentOutfit()` - логирует edit mode
- `resetCurrentOutfit()` - логирует create mode

---

## 📊 Логика работы после исправления

### CREATE MODE (новый образ):

```
1. resetCurrentOutfit()
   ├─ customTabCategories = DEFAULT_CUSTOM_CATEGORIES (['tops', 'bottoms', 'footwear'])
   └─ LOG: "CREATE MODE: Resetting to initial state"

2. ItemSelectionStepNew mounts
   ├─ isEditMode = false
   ├─ loadCustomTabConfig() from AsyncStorage
   └─ LOG: "Loading custom tab config from AsyncStorage"

3. AsyncStorage содержит user preference (например, ['accessories', 'tops'])
   ├─ updateCustomTab(['accessories', 'tops'])
   └─ LOG: "Loaded custom config: ['accessories', 'tops']"

4. Пользователь меняет custom tab
   ├─ activeTab = 'custom', !isEditMode = true
   ├─ saveCustomTabConfig() → AsyncStorage
   └─ LOG: "💾 Saving custom tab to AsyncStorage (create mode)"

✅ РЕЗУЛЬТАТ: Новый образ использует user preference из AsyncStorage
```

### EDIT MODE (редактирование):

```
1. loadOutfitForEdit(id)
   ├─ outfit = await getOutfitById(id)
   └─ LOG: "EDIT MODE: outfitId=abc, totalItems=2"

2. setCurrentOutfit(outfit)
   ├─ Extract categories from outfit.items: ['footwear', 'tops']
   ├─ customTabCategories = ['footwear', 'tops']
   ├─ customTabSelectedItems = [shoe1, tshirt1]
   └─ LOG: "Restored items: [shoe1.title, tshirt1.title]"

3. ItemSelectionStepNew mounts
   ├─ isEditMode = true
   ├─ ✅ SKIP loadCustomTabConfig()
   └─ LOG: "🚫 Skipping AsyncStorage load - edit mode"

4. Пользователь переключает табы
   ├─ activeTab = 'custom', isEditMode = true
   ├─ ✅ SKIP saveCustomTabConfig()
   └─ LOG: "🚫 Skipping AsyncStorage save (edit mode)"

5. Пользователь сохраняет образ
   ├─ AsyncStorage НЕ изменился
   └─ ✅ User preference сохранён для следующего нового образа!

✅ РЕЗУЛЬТАТ: Edit mode не трогает AsyncStorage
```

---

## 🧪 Тест-кейсы

### Test 1: Базовый сценарий ✅

```
ШАГИ:
1. Создать образ A: custom tab = ['accessories', 'tops']
2. Сохранить образ A
3. Редактировать образ B с ['footwear']
4. Сохранить образ B
5. Создать новый образ C

ОЖИДАНИЕ:
✅ Custom tab образа C = ['accessories', 'tops'] (от образа A, не от B!)

ПРОВЕРКА ЛОГОВ:
- "💾 Saving custom tab to AsyncStorage (create mode): ['accessories', 'tops']" (образ A)
- "🚫 Skipping AsyncStorage save (edit mode): ['footwear']" (образ B)
- "Loading custom tab config from AsyncStorage"
- "Loaded custom config: ['accessories', 'tops']" (образ C)
```

### Test 2: Первое использование ✅

```
ШАГИ:
1. Очистить AsyncStorage (или первый запуск)
2. Создать первый образ

ОЖИДАНИЕ:
✅ Custom tab = ['tops', 'bottoms', 'footwear'] (дефолт)

ПРОВЕРКА ЛОГОВ:
- "Loading custom tab config from AsyncStorage"
- "Loaded custom config: ['tops', 'bottoms', 'footwear']" (fallback)
```

### Test 3: Edit mode не влияет на AsyncStorage ✅

```
ШАГИ:
1. Создать образ A: custom tab = ['tops', 'bottoms', 'footwear']
2. Сохранить → AsyncStorage = ['tops', 'bottoms', 'footwear']
3. Редактировать образ B: custom tab = ['accessories']
4. НЕ сохранять, просто закрыть
5. Создать новый образ C

ОЖИДАНИЕ:
✅ AsyncStorage всё ещё = ['tops', 'bottoms', 'footwear']
✅ Custom tab образа C = ['tops', 'bottoms', 'footwear']

ПРОВЕРКА ЛОГОВ:
- "🚫 Skipping AsyncStorage save (edit mode): ['accessories']"
- "Loaded custom config: ['tops', 'bottoms', 'footwear']"
```

### Test 4: Переключение табов в edit mode ✅

```
ШАГИ:
1. Редактировать образ с ['footwear']
2. Переключиться: Basic → Custom → Basic → Custom
3. Проверить AsyncStorage

ОЖИДАНИЕ:
✅ AsyncStorage не изменился

ПРОВЕРКА ЛОГОВ (несколько раз):
- "🚫 Skipping AsyncStorage save (edit mode): ['footwear']"
```

### Test 5: Правильные items в каруселях ✅

```
ШАГИ:
1. Создать образ: custom tab = ['footwear', 'tops']
2. Выбрать: footwear = shoe1, tops = tshirt1
3. Сохранить как образ A
4. Редактировать образ A

ОЖИДАНИЕ:
✅ Carousel 0 (footwear) показывает shoe1
✅ Carousel 1 (tops) показывает tshirt1

ПРОВЕРКА ЛОГОВ:
- "Restored items: ['shoe1 title', 'tshirt1 title']"
- "Cache lookup for abc-custom-footwear-0"
- "Cache lookup for abc-custom-tops-1"
```

---

## 📝 Изменённые файлы

### 1. `components/outfit/ItemSelectionStepNew.tsx`

**Строки 62-74:**

- ✅ Добавлена проверка `!isEditMode` перед сохранением
- ✅ Добавлена зависимость `isEditMode`
- ✅ Добавлено детальное логирование

### 2. `store/outfit/outfitStore.ts`

**Строки 210-243:**

- ✅ Улучшено логирование в `setCurrentOutfit()` для edit mode

**Строки 727-766:**

- ✅ Улучшено логирование в `resetCurrentOutfit()` для create mode

---

## 🎯 Ключевые принципы

### Разделение Create и Edit mode:

| Аспект                           | Create Mode              | Edit Mode             |
| -------------------------------- | ------------------------ | --------------------- |
| **customTabCategories источник** | AsyncStorage → DEFAULT   | outfit.items          |
| **Загрузка из AsyncStorage**     | ✅ Да                    | ❌ Нет                |
| **Сохранение в AsyncStorage**    | ✅ Да                    | ❌ Нет                |
| **User preference**              | ✅ Используется          | ❌ Игнорируется       |
| **Цель**                         | Быстрый старт с шаблоном | Точное восстановление |

---

## 🚀 Как тестировать

### Быстрая проверка:

```bash
# 1. Создайте образ A с custom categories
Create → Custom tab → Add accessories → Select items → Save

# 2. Проверьте логи
LOG: "💾 Saving custom tab to AsyncStorage (create mode): ['accessories', ...]"

# 3. Редактируйте образ B с другими категориями
Edit outfit B (has only footwear) → Observe carousels

# 4. Проверьте логи
LOG: "🚫 Skipping AsyncStorage save (edit mode): ['footwear']"

# 5. Создайте новый образ C
Create → Observe custom tab

# 6. Проверьте результат
✅ Custom tab должен иметь categories от образа A, не от B!
```

### Детальная проверка:

Откройте Developer Tools → Console и наблюдайте логи:

- 📝 `[outfitStore]` - операции store
- 📂/💾/🚫 `[ItemSelectionStepNew]` - AsyncStorage операции
- 📍 `[CategorySelector]` - cache операции

---

## ✅ Результат

**До исправления:**

- ❌ Новый образ получал категории от последнего edit
- ❌ User preference терялся
- ❌ Невозможно использовать шаблоны

**После исправления:**

- ✅ Новый образ использует user preference из AsyncStorage
- ✅ Edit mode не трогает AsyncStorage
- ✅ Каждый образ изолирован (outfitId в cache)
- ✅ User может создавать свой шаблон для быстрого старта

---

## 📚 Связанные документы

- `CUSTOM_TAB_ASYNCSTORAGE_BUG_ANALYSIS.md` - детальный технический анализ
- `CAROUSEL_SCROLL_CACHE_BUG.md` - фикс изоляции scroll cache
- `FIX_SUMMARY_CAROUSEL_CACHE.md` - краткое резюме carousel fix

---

**Готово к тестированию!** 🎉

Проверьте все 5 тест-кейсов и убедитесь, что логи показывают правильное поведение.
