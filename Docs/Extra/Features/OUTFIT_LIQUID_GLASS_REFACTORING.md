# Outfit Screen: Liquid Glass (iOS 26+) — Implementation Notes

> **Дата:** 2025-12-21  
> **Статус:** ✅ Реализовано (без флика классического UI + стабильное поведение при навигации)

Этот документ описывает текущую реализацию Liquid Glass на экране Outfits. Реализация следует тем же паттернам, что и Wardrobe screen.

---

## 🎯 Цели

- iOS 26+ (если Liquid Glass реально доступен) — стеклянный header (поиск + меню) и стеклянный FAB.
- iOS < 26 и Android — fallback UI без потери функциональности: custom search bar + custom dropdown menu trigger.
- Убрать баг первого холодного открытия: когда `GlassView` рендерит контент, но без стеклянного фона.
- Убрать мерцание/флик классического хедера на iOS 26+.
- После первого успешного включения не «переинициализировать» glass UI на возвратах.

---

## ✅ Текущее решение (как устроено)

### 1) Единая проверка платформы/поддержки

Используем общий модуль:

- `utils/platform.ts`
  - `IS_IOS_26_OR_NEWER`
  - `CAN_USE_LIQUID_GLASS` (учитывает и iOS 26+, и `isLiquidGlassAvailable()`)

Все glass-компоненты и экран Outfits используют эти константы (без локальных хелперов).

### 2) Deferred enable на Outfits (фикс "первого открытия")

В `app/(tabs)/outfits.tsx` стеклянная ветка UI включается не сразу.

Алгоритм включения:

1. экран в фокусе (`useFocusEffect`)
2. корневой контейнер сделал первый layout (`onLayout`)
3. завершились первичные взаимодействия (`InteractionManager.runAfterInteractions`)
4. два кадра `requestAnimationFrame`
5. `setUseLiquidGlassUI(true)`

Это снижает вероятность раннего монтирования `GlassView` в момент, когда нативный слой ещё «не готов».

### 3) Run-once: без выключения на blur

После первого успешного включения `useLiquidGlassUI` больше не сбрасывается при уходе с таба — чтобы не было пересоздания glass-компонентов и визуального «обновления».

### 4) Без флика классического хедера

На iOS 26+ при `CAN_USE_LIQUID_GLASS === true` классический хедер не рендерится даже временно.

---

## 🧩 Компоненты

Файлы:

- `components/outfit/OutfitHeader.tsx` — unified header (glass + custom версии)
- `components/ui/glass/GlassSearchBar.tsx` — поиск в стеклянном стиле
- `components/ui/glass/GlassDropdownMenu.tsx` — триггер-кнопка + меню
- `components/ui/FAB.tsx` — стеклянный FAB по умолчанию на iOS 26+ (при доступном Liquid Glass)

### OutfitHeader: автоматическое переключение

`OutfitHeader` работает аналогично `WardrobeHeader`:

- На iOS 26+ с Liquid Glass: использует `GlassSearchBar` + `GlassDropdownMenu`
- На iOS < 26 / Android: использует custom `SearchBar` + `DropdownMenu` с визуально похожим стилем

### Dropdown menu

В `GlassDropdownMenu.tsx` по умолчанию используется custom dropdown (работает в Expo Go). В файле есть флаг `USE_NATIVE_MENU`, который можно включить после сборки с `@react-native-menu/menu`.

---

## 📐 Layout Pattern

Структура экрана Outfits:

```tsx
<DismissKeyboardView style={[styles.container, supportsLiquidGlass && styles.containerTransparent]}>
  {/* 1. Outfit Grid с отступом для header */}
  <OutfitGrid contentContainerStyle={{ paddingTop: headerContentPadding }} {...props} />

  {/* 2. FAB (Liquid Glass на iOS 26+) */}
  {!isSelectionMode && <FAB liquidGlassEnabled={supportsLiquidGlass} />}

  {/* 3. Unified Header (абсолютное позиционирование) */}
  <OutfitHeader
    searchValue={searchQuery}
    onSearchChange={handleSearch}
    menuItems={headerMenuItems}
    liquidGlassEnabled={supportsLiquidGlass}
  />

  {/* 4. Selection Mode Actions (ниже header) */}
  {isSelectionMode && (
    <View style={styles.glassSelectionBar}>{/* Select All / Delete buttons */}</View>
  )}
</DismissKeyboardView>
```

### Ключевые особенности:

1. **Container background**: экран Outfits намеренно всегда тёмный (`#000`). `containerTransparent` остаётся как условный стиль для совместимости, но сейчас он тоже `#000`.
2. **Header padding**: `headerContentPadding` = `(isSelectionMode ? 140 : 110) + (Platform.OS === 'android' ? 12 : 0)`
3. **Z-index hierarchy**:
   - OutfitGrid: default (0)
   - FAB: default stacking
   - OutfitHeader: 9999
   - Selection bar: 99 (ниже header)

---

## 🔧 Где смотреть в коде

- Outfit screen: `app/(tabs)/outfits.tsx`
- Платформенные константы: `utils/platform.ts`
- Glass-компоненты: `components/ui/glass/*`
- OutfitHeader: `components/outfit/OutfitHeader.tsx`
- OutfitGrid (с contentContainerStyle prop): `components/outfit/OutfitGrid.tsx`

---

## 🧪 Тестирование

1. **Полный kill приложения → запуск → сразу Outfits**:
   - стеклянный фон должен быть виден сразу.

2. **Переключение табов туда-сюда**:
   - glass UI не должен «переинициализироваться»/мигать.

3. **Dropdown (… menu)**:
   - открыть/закрыть; пункты должны срабатывать; нет «пропадания» стекла.

4. **FAB**:
   - появляется/скрывается как и раньше (в т.ч. в selection mode), при этом на iOS 26+ выглядит как glass.

5. **Поиск**:
   - вводить текст; очистка работает; фильтрация срабатывает.

6. **Selection mode**:
   - кнопки "Select All" / "Delete" появляются ниже header; работают корректно.

7. **Тёмная тема (Outfits — всегда тёмный)**:
   - Экран Outfits принудительно рендерится в тёмной палитре на всех платформах (фон `#000`, `StatusBar` — `light-content`).
   - В fallback-ветке (`SearchBar`, `DropdownMenu`) используется `forceDark`, чтобы не зависеть от системной темы.
   - На iOS 26+ glass-контролы используют системные цвета (`PlatformColor`). Dropdown (custom внутри `GlassDropdownMenu`) оставлен стабильным по цветам.

---

## 📊 Отличия от Wardrobe Screen

| Аспект           | Wardrobe                     | Outfits                    |
| ---------------- | ---------------------------- | -------------------------- |
| Header component | `WardrobeHeader`             | `OutfitHeader`             |
| Grid component   | `ItemGrid`                   | `OutfitGrid`               |
| Menu items       | Filter, Select, Grid columns | Filter, Select             |
| Filter modal     | `ItemFilter`                 | `OutfitFilter`             |
| Empty state      | "Add your first item"        | "Create your first outfit" |

Всё остальное идентично: платформенная детекция, deferred enable, run-once, layout pattern.

---

## 🔗 Связанные документы

- [Liquid Glass Implementation Plan](./LIQUID_GLASS_IMPLEMENTATION_PLAN.md) - общий план
- [Wardrobe Liquid Glass Refactoring](./WARDROBE_LIQUID_GLASS_REFACTORING.md) - аналогичная реализация для Wardrobe
- [OutfitHeader README](../../components/outfit/README_OUTFIT_HEADER.md) - документация компонента

---

**Автор:** GitHub Copilot  
**Дата:** 2025-12-21
