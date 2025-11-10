# 🗺️ OUTFIT SYSTEM - ПОШАГОВЫЙ ПЛАН ИСПРАВЛЕНИЙ

**Дата:** 2025-11-09  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Время на реализацию:** 2-3 часа

## 🎯 ЦЕЛЬ

Исправить критические проблемы с отображением вещей в каруселях при редактировании образов

## 📋 ПОРЯДОК ВЫПОЛНЕНИЯ ЗАДАЧ

### ⚡ PHASE 1: КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ (30 минут)

#### Task 1.1: Исправить populate items

**Файл:** `services/outfit/outfitService.ts`  
**Строки:** 166-174, 180-193

```typescript
// Строка 172 - исправить потерю данных
items: outfit.items.map((outfitItem) => ({
  ...outfitItem,
  item: itemsMap.get(outfitItem.itemId) || outfitItem.item, // ✅ Сохранить существующий item
}))

// Строка 192 - добавить populate в getOutfitById
async getOutfitById(outfitId: string): Promise<Outfit> {
  const { data, error } = await supabase
    .from(this.tableName)
    .select('*')
    .eq('id', outfitId)
    .single();

  if (error) throw error;

  const outfit = this.mapDatabaseToOutfit(data);

  // ✅ НОВОЕ: Populate items
  const [populatedOutfit] = await this.populateOutfitItems([outfit]);
  return populatedOutfit;
}
```

#### Task 1.2: Добавить загрузку wardrobeItems

**Файл:** `app/outfit/create.tsx`  
**После строки 54**

```typescript
// Добавить новый useEffect для загрузки wardrobeItems
useEffect(() => {
  const loadWardrobeItems = async () => {
    if (!user?.id) return;

    try {
      console.log('📦 [create.tsx] Loading wardrobe items from DB...');
      const items = await itemService.getUserItems(user.id);
      console.log(`✅ [create.tsx] Loaded ${items.length} wardrobe items`);

      // Импортировать useWardrobeStore если еще нет
      const { setWardrobeItems } = useWardrobeStore.getState();
      setWardrobeItems(items);
    } catch (error) {
      console.error('❌ [create.tsx] Failed to load wardrobe items:', error);
    }
  };

  loadWardrobeItems();
}, [user?.id]);
```

### 🔧 PHASE 2: PERSISTENCE ИСПРАВЛЕНИЯ (45 минут)

#### Task 2.1: Сохранение customTabCategories в canvasSettings

**Файл:** `store/outfit/outfitStore.ts`  
**Строки:** 247-286

```typescript
confirmItemSelection: () => {
  const selected = get().selectedItemsForCreation;
  const categories = get().customTabCategories;
  const currentSettings = get().canvasSettings; // ✅ Получить текущие settings

  // ... создание outfitItems ...

  set({
    currentItems: outfitItems,
    creationStep: 2,
    canvasSettings: {
      ...currentSettings,
      customTabCategories: categories, // ✅ Сохранить categories
    },
  });

  get().pushHistory();
};
```

#### Task 2.2: Восстановление customTabCategories при загрузке

**Файл:** `store/outfit/outfitStore.ts`  
**Строки:** 135-165

```typescript
setCurrentOutfit: (outfit) => {
  // ✅ НОВАЯ ЛОГИКА восстановления
  let customCategories: ItemCategory[];
  let reconstructedFromItems = false;

  if (outfit?.canvasSettings?.customTabCategories) {
    // Приоритет 1: Из сохраненных настроек
    customCategories = outfit.canvasSettings.customTabCategories;
    console.log('✅ [outfitStore] Using saved customTabCategories:', customCategories);
  } else if (outfit?.items && outfit.items.length > 0) {
    // Приоритет 2: Восстановить из items для backward compatibility
    const sortedItems = [...outfit.items].sort((a, b) => a.slot - b.slot);
    customCategories = sortedItems.map((item) => item.category);
    reconstructedFromItems = true;
    console.log('🔄 [outfitStore] Reconstructed customTabCategories from items:', customCategories);
  } else {
    // Приоритет 3: Default
    customCategories = DEFAULT_CUSTOM_CATEGORIES;
    console.log('📝 [outfitStore] Using default customTabCategories');
  }

  // Создать массив правильного размера
  const selectedItems: (WardrobeItem | null)[] = createEmptySelection(customCategories.length);

  // Заполнить items по slot позициям
  if (outfit?.items) {
    const sortedItems = [...outfit.items].sort((a, b) => a.slot - b.slot);
    sortedItems.forEach((outfitItem) => {
      if (outfitItem.item && outfitItem.slot < selectedItems.length) {
        selectedItems[outfitItem.slot] = outfitItem.item;
        console.log(`📍 [outfitStore] Placed item at slot ${outfitItem.slot}:`, {
          itemId: outfitItem.item.id,
          itemTitle: outfitItem.item.title,
          category: customCategories[outfitItem.slot],
        });
      }
    });
  }

  set({
    currentOutfit: outfit,
    currentItems: outfit?.items || [],
    currentBackground: outfit?.background || defaultBackground,
    selectedItemsForCreation: selectedItems,
    customTabCategories: customCategories, // ✅ Восстановить categories
    activeTab: customCategories.length === 3 ? 'basic' : 'custom', // Умный выбор таба
    canvasSettings: outfit?.canvasSettings || defaultCanvasSettings,
    error: null,
  });

  console.log('🔍 [outfitStore] setCurrentOutfit COMPLETE:', {
    outfitId: outfit?.id,
    itemsCount: outfit?.items?.length || 0,
    customCategoriesCount: customCategories.length,
    reconstructedFromItems,
  });
};
```

#### Task 2.3: Сохранение в БД

**Файл:** `services/outfit/outfitService.ts`  
**Строки:** 16-37, 198-217

```typescript
// createOutfit - добавить canvas_settings
async createOutfit(userId: string, params: OutfitCreationParams): Promise<Outfit> {
  const newOutfit = {
    // ... существующие поля ...
    canvas_settings: params.canvasSettings, // ✅ ДОБАВИТЬ
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // ... rest of function
}

// updateOutfit - добавить canvas_settings
async updateOutfit(outfitId: string, updates: Partial<Outfit>): Promise<Outfit> {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // ✅ Преобразовать canvasSettings в canvas_settings
  if (updates.canvasSettings) {
    updateData.canvas_settings = updates.canvasSettings;
    delete updateData.canvasSettings; // Удалить camelCase версию
  }

  // ... rest of function
}
```

#### Task 2.4: Передача canvasSettings при сохранении

**Файл:** `app/outfit/create.tsx`  
**Строки:** 137-194

```typescript
const confirmSave = useCallback(
  async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { currentBackground, canvasSettings } = useOutfitStore.getState(); // ✅ Получить canvasSettings

      if (isEditMode && id) {
        // Update existing
        await outfitService.updateOutfit(id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
          canvasSettings, // ✅ ДОБАВИТЬ
          occasions: selectedOccasion ? [selectedOccasion] : undefined,
          styles: selectedStyles.length > 0 ? selectedStyles : undefined,
          seasons: selectedSeason ? [selectedSeason] : undefined,
        });
        // ... alert success
      } else {
        // Create new
        await outfitService.createOutfit(user.id, {
          title: outfitTitle || 'My Outfit',
          items: currentItems,
          background: currentBackground,
          canvasSettings, // ✅ ДОБАВИТЬ
          visibility: 'private',
          occasions: selectedOccasion ? [selectedOccasion] : undefined,
          styles: selectedStyles.length > 0 ? selectedStyles : undefined,
          seasons: selectedSeason ? [selectedSeason] : undefined,
        });
        // ... alert success
      }
    } catch (error) {
      // ... error handling
    } finally {
      setIsSaving(false);
    }
  },
  [
    /* ... existing deps ... */
  ],
);
```

### 🛡️ PHASE 3: КОНФЛИКТЫ И ВАЛИДАЦИЯ (30 минут)

#### Task 3.1: Отключить AsyncStorage при редактировании

**Файл:** `components/outfit/ItemSelectionStepNew.tsx`  
**Найти useEffect с loadCustomTabConfig**

```typescript
// Добавить prop или определить isEditMode
const isEditMode = !!route.params?.outfitId; // или другой способ определения

useEffect(() => {
  // ✅ НЕ загружать при редактировании
  if (isEditMode) {
    console.log('🚫 [ItemSelection] Skipping AsyncStorage - edit mode');
    return;
  }

  const loadConfig = async () => {
    console.log('📂 [ItemSelection] Loading custom config from AsyncStorage');
    const config = await loadCustomTabConfig();
    if (config.categories.length > 0) {
      updateCustomTab(config.categories, config.order);
    }
  };

  loadConfig();
}, [updateCustomTab, isEditMode]); // ✅ Добавить isEditMode в deps
```

#### Task 3.2: Добавить валидацию данных

**Файл:** `services/outfit/outfitService.ts`  
**Добавить новый метод**

```typescript
/**
 * Validate outfit data integrity
 */
private validateOutfitData(outfit: any): boolean {
  // Проверить наличие items
  if (!outfit?.items || !Array.isArray(outfit.items)) {
    console.error('❌ [outfitService] Invalid outfit items:', outfit);
    return false;
  }

  // Проверить уникальность slots
  const slots = outfit.items.map(item => item.slot);
  const uniqueSlots = new Set(slots);
  if (slots.length !== uniqueSlots.size) {
    console.error('❌ [outfitService] Duplicate slots detected:', slots);
    return false;
  }

  // Проверить что все items имеют itemId
  const invalidItems = outfit.items.filter(item => !item.itemId);
  if (invalidItems.length > 0) {
    console.error('❌ [outfitService] Items without itemId:', invalidItems);
    return false;
  }

  return true;
}

// Использовать в mapDatabaseToOutfit
private mapDatabaseToOutfit(data: any): Outfit {
  // Валидировать перед маппингом
  if (!this.validateOutfitData(data)) {
    console.warn('⚠️ [outfitService] Outfit data validation failed, using safe defaults');
  }

  // ... existing mapping code
}
```

### ✅ PHASE 4: ТЕСТИРОВАНИЕ (45 минут)

#### Test Case 1: Новый outfit

1. Создать новый outfit
2. Выбрать вещи в Basic tab
3. Переключиться на Custom tab
4. Добавить accessories (создать дубль)
5. Перейти к композиции
6. Сохранить
7. Проверить в БД наличие canvas_settings

#### Test Case 2: Редактирование outfit

1. Открыть существующий outfit
2. Проверить логи:
   - "Loading wardrobe items from DB"
   - "Using saved customTabCategories"
   - "Placed item at slot X"
3. Проверить что вещи правильные
4. Изменить вещи
5. Сохранить
6. Открыть снова - проверить сохранение

#### Test Case 3: Старый outfit без canvas_settings

1. Найти или создать outfit без canvas_settings
2. Открыть на редактирование
3. Проверить лог "Reconstructed customTabCategories from items"
4. Убедиться что категории восстановлены правильно
5. Сохранить с новыми canvas_settings

#### Test Case 4: Дубли категорий

1. Создать outfit с ['accessories', 'tops', 'accessories']
2. Выбрать разные вещи в каждый accessories
3. Сохранить
4. Открыть на редактирование
5. Проверить что обе accessories вещи на месте

### 🚀 PHASE 5: ДЕПЛОЙ И МОНИТОРИНГ (30 минут)

#### Task 5.1: Очистка логов

После успешного тестирования - убрать избыточные console.log или заменить на систему логирования

#### Task 5.2: Migration для старых outfits

Опционально - создать скрипт для добавления canvas_settings к существующим outfits

#### Task 5.3: Мониторинг

Следить за ошибками в первые дни после деплоя

## 📊 ЧЕКЛИСТ ГОТОВНОСТИ

### Обязательные задачи

- [ ] Task 1.1: Исправить populate items ✅
- [ ] Task 1.2: Добавить загрузку wardrobeItems ✅
- [ ] Task 2.1: Сохранение customTabCategories ✅
- [ ] Task 2.2: Восстановление customTabCategories ✅
- [ ] Task 2.3: Сохранение в БД ✅
- [ ] Task 2.4: Передача при сохранении ✅
- [ ] Task 3.1: Отключить AsyncStorage ✅
- [ ] Test Cases 1-4 пройдены ✅

### Опциональные задачи

- [ ] Task 3.2: Валидация данных
- [ ] Task 5.1: Очистка логов
- [ ] Task 5.2: Migration скрипт
- [ ] Документация обновлена

## 💡 TIPS & TRICKS

1. **Делайте коммиты после каждой фазы** - легче откатиться если что-то пойдет не так
2. **Тестируйте на реальных данных** - создайте несколько тестовых outfits
3. **Следите за логами** - они помогут понять flow данных
4. **Не удаляйте логи сразу** - оставьте на несколько дней для отладки
5. **Backup БД перед migration** - если планируете обновлять старые outfits

## 🎯 ОПРЕДЕЛЕНИЕ УСПЕХА

✅ Outfit правильно отображается при редактировании  
✅ customTabCategories сохраняются и восстанавливаются  
✅ Нет конфликта между AsyncStorage и БД  
✅ Дубли категорий работают корректно  
✅ Backward compatibility для старых outfits

---

**Начните с Phase 1** - это решит большинство критических проблем!  
**Ожидаемое время:** 2-3 часа на полную реализацию  
**Сложность:** Средняя  
**Риск:** Низкий при следовании плану
