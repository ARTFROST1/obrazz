# 🚨 OUTFIT SYSTEM - КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ (EXECUTIVE SUMMARY)

**Дата:** 2025-11-09 15:22  
**Автор:** Cascade AI  
**Критичность:** 🔴 МАКСИМАЛЬНАЯ

## 🎯 ГЛАВНАЯ ПРОБЛЕМА

При редактировании образов вещи отображаются неправильно или вообще не отображаются в каруселях из-за каскада проблем в data flow.

## ⚡ ТОП-5 КРИТИЧЕСКИХ БАГОВ

### 1️⃣ **ПОТЕРЯ ДАННЫХ ПРИ POPULATE**

```javascript
// ГДЕ: services/outfit/outfitService.ts:172
// БЫЛО: item: itemsMap.get(outfitItem.itemId) // теряет title
// НАДО: item: itemsMap.get(outfitItem.itemId) || outfitItem.item
```

**Влияние:** itemTitle становится undefined → карусели не находят вещи

### 2️⃣ **НЕ ЗАГРУЖАЮТСЯ wardrobeItems**

```javascript
// ГДЕ: app/outfit/create.tsx
// ПРОБЛЕМА: При edit mode wardrobeItems пустой
// РЕШЕНИЕ: Добавить useEffect для загрузки из БД
```

**Влияние:** Карусели пустые, нечего выбирать

### 3️⃣ **customTabCategories НЕ СОХРАНЯЮТСЯ**

```javascript
// ГДЕ: store/outfit/outfitStore.ts:280
// ПРОБЛЕМА: canvasSettings не содержит customTabCategories
// РЕШЕНИЕ: Добавить при confirmItemSelection()
```

**Влияние:** Теряется конфигурация табов при сохранении

### 4️⃣ **customTabCategories НЕ ВОССТАНАВЛИВАЮТСЯ**

```javascript
// ГДЕ: store/outfit/outfitStore.ts:135
// ПРОБЛЕМА: Используются текущие, а не из outfit
// РЕШЕНИЕ: Загружать из outfit.canvasSettings
```

**Влияние:** При edit показываются не те категории

### 5️⃣ **AsyncStorage КОНФЛИКТ**

```javascript
// ГДЕ: components/outfit/ItemSelectionStepNew.tsx
// ПРОБЛЕМА: Перезаписывает данные из БД
// РЕШЕНИЕ: Отключить при isEditMode
```

**Влияние:** Загружаются категории от другого outfit

## 📋 ПОШАГОВЫЙ ПЛАН ИСПРАВЛЕНИЯ

### 🔥 ШАГ 1: Экстренные фиксы (15 минут)

```bash
# 1. Исправить populate
services/outfit/outfitService.ts:172
services/outfit/outfitService.ts:192 (добавить populate в getOutfitById)

# 2. Загрузить wardrobeItems
app/outfit/create.tsx:55 (добавить useEffect)
```

### 🔧 ШАГ 2: Persistence фиксы (30 минут)

```bash
# 3. Сохранение customTabCategories
store/outfit/outfitStore.ts:280 (в confirmItemSelection)
services/outfit/outfitService.ts:24 (canvas_settings в create)
services/outfit/outfitService.ts:202 (canvas_settings в update)

# 4. Восстановление customTabCategories
store/outfit/outfitStore.ts:135-165 (полная переработка setCurrentOutfit)

# 5. Передача при сохранении
app/outfit/create.tsx:142,167 (добавить canvasSettings)
```

### 🛡️ ШАГ 3: Конфликты (15 минут)

```bash
# 6. AsyncStorage отключение
components/outfit/ItemSelectionStepNew.tsx (найти loadCustomTabConfig)
```

## ✅ КОД ДЛЯ КОПИПАСТА

### Fix #1: Populate items

```typescript
// services/outfit/outfitService.ts:172
item: itemsMap.get(outfitItem.itemId) || outfitItem.item,

// services/outfit/outfitService.ts:192
async getOutfitById(outfitId: string): Promise<Outfit> {
  const { data, error } = await supabase
    .from(this.tableName)
    .select('*')
    .eq('id', outfitId)
    .single();
  if (error) throw error;
  const outfit = this.mapDatabaseToOutfit(data);
  const [populatedOutfit] = await this.populateOutfitItems([outfit]);
  return populatedOutfit;
}
```

### Fix #2: Load wardrobeItems

```typescript
// app/outfit/create.tsx - добавить после строки 54
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { itemService } from '@services/wardrobe/itemService';

useEffect(() => {
  const loadWardrobeItems = async () => {
    if (!user?.id) return;
    const items = await itemService.getUserItems(user.id);
    const { setWardrobeItems } = useWardrobeStore.getState();
    setWardrobeItems(items);
  };
  loadWardrobeItems();
}, [user?.id]);
```

### Fix #3: Save customTabCategories

```typescript
// store/outfit/outfitStore.ts:280
confirmItemSelection: () => {
  const categories = get().customTabCategories;
  const currentSettings = get().canvasSettings;
  // ... create outfitItems ...
  set({
    currentItems: outfitItems,
    creationStep: 2,
    canvasSettings: {
      ...currentSettings,
      customTabCategories: categories,
    },
  });
};
```

### Fix #4: Restore customTabCategories

```typescript
// store/outfit/outfitStore.ts:135
setCurrentOutfit: (outfit) => {
  let customCategories =
    outfit?.canvasSettings?.customTabCategories ||
    (outfit?.items ? outfit.items.sort((a, b) => a.slot - b.slot).map((i) => i.category) : null) ||
    DEFAULT_CUSTOM_CATEGORIES;

  const selectedItems = createEmptySelection(customCategories.length);
  // ... fill selectedItems ...

  set({
    // ... other fields ...
    customTabCategories: customCategories,
    activeTab: customCategories.length === 3 ? 'basic' : 'custom',
  });
};
```

### Fix #5: Disable AsyncStorage on edit

```typescript
// components/outfit/ItemSelectionStepNew.tsx
const isEditMode = !!route.params?.outfitId;

useEffect(() => {
  if (isEditMode) return; // Skip on edit mode

  const loadConfig = async () => {
    const config = await loadCustomTabConfig();
    if (config.categories.length > 0) {
      updateCustomTab(config.categories, config.order);
    }
  };
  loadConfig();
}, [updateCustomTab, isEditMode]);
```

## 🧪 ТЕСТИРОВАНИЕ

### Тест 1: Создание нового outfit

1. Create → выбрать вещи → сохранить
2. Проверить в БД наличие `canvas_settings`

### Тест 2: Редактирование outfit

1. Открыть существующий outfit
2. Проверить что вещи правильные
3. Изменить → сохранить → открыть снова

### Тест 3: Старый outfit

1. Открыть outfit без canvas_settings
2. Должны восстановиться категории из items

### Тест 4: Дубли категорий

1. Custom tab → добавить accessories 2 раза
2. Выбрать разные вещи → сохранить → проверить

## 📊 МЕТРИКИ УСПЕХА

| Проблема                 | До            | После                |
| ------------------------ | ------------- | -------------------- |
| itemTitle при populate   | ❌ undefined  | ✅ сохраняется       |
| wardrobeItems при edit   | ❌ пустой     | ✅ загружен          |
| customTabCategories save | ❌ теряются   | ✅ в canvas_settings |
| customTabCategories load | ❌ default    | ✅ из outfit         |
| AsyncStorage конфликт    | ❌ перезапись | ✅ отключен при edit |

## 🚦 СТАТУС ГОТОВНОСТИ

- [x] Проблемы идентифицированы
- [x] Решения разработаны
- [x] Код подготовлен
- [ ] **Фиксы применены** ⬅️ ВЫ ЗДЕСЬ
- [ ] Тестирование пройдено
- [ ] Деплой выполнен

## ⏱️ TIMELINE

- **15 минут** - критические фиксы
- **30 минут** - persistence фиксы
- **15 минут** - конфликты
- **30 минут** - тестирование
- **ИТОГО: 1.5 часа**

## 🎯 NEXT STEPS

1. **СЕЙЧАС:** Применить Fix #1 и #2 (самые критические)
2. **ДАЛЕЕ:** Применить Fix #3, #4, #5
3. **ТЕСТЫ:** Пройти все 4 тест-кейса
4. **CLEANUP:** Убрать лишние console.log
5. **DEPLOY:** Задеплоить и мониторить

## 💬 КОМАНДА ДЛЯ БЫСТРОГО СТАРТА

```bash
# Откройте все файлы для редактирования:
code services/outfit/outfitService.ts \
     app/outfit/create.tsx \
     store/outfit/outfitStore.ts \
     components/outfit/ItemSelectionStepNew.tsx
```

---

**⚠️ ВАЖНО:** Начните с Fix #1 и #2 - это решит 80% проблем!

**📱 Контакт:** При возникновении вопросов обращайтесь к документации:

- `OUTFIT_SYSTEM_FULL_AUDIT_2025-11-09.md` - детальный анализ
- `OUTFIT_DATA_FLOW_ANALYSIS.md` - поток данных
- `OUTFIT_IMPLEMENTATION_ROADMAP.md` - пошаговая инструкция
