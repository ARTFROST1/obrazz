# Outfit Creator Tabs System Refactor - Detailed Implementation Plan

**Date:** 2025-11-09  
**Author:** Cascade AI Assistant  
**Version:** 1.0  
**Status:** 📋 Planning

## Executive Summary

Полная переработка системы создания образов с переходом от 3 display modes (all/main/extra) к 4 вкладкам с различными комбинациями категорий. Четвертая вкладка будет кастомной с возможностью drag&drop каруселей, добавления/удаления категорий и изменения порядка.

## Current System Analysis

### Текущая архитектура (Stage 4.7)

```
ItemSelectionStepNew
├── Header (back, title, count)
├── CategorySelectorWithSmooth
│   ├── Display Mode: 'all' | 'main' | 'extra'
│   └── SmoothCarousel (с флажками)
└── Footer (display mode switcher + actions)
```

### Проблемы текущей системы

1. **Ограниченные комбинации** - только 3 предустановленных набора
2. **Флажки на каруселях** - занимают место, не интуитивны
3. **Нет кастомизации** - пользователь не может настроить под себя
4. **Неравномерное распределение** - в "all" mode 8 каруселей слишком сжаты

## New System Architecture

### Новая структура вкладок

```
ItemSelectionStepNew
├── Header (back, title, count)
├── TabBar (4 вкладки)
│   ├── Tab 1: Basic (👕) - tops, bottoms, footwear
│   ├── Tab 2: Dress (👗) - fullbody, footwear, accessories
│   ├── Tab 3: All (🔲) - все 8 категорий
│   └── Tab 4: Custom (⚙️) - настраиваемый набор
├── CarouselContainer
│   └── SmoothCarousel (без флажков)
└── Footer (randomize + next)
```

## Implementation Steps

### Phase 1: Core Architecture Changes

#### 1.1 Создание нового типа для вкладок

**File:** `types/components/OutfitCreator.ts` (новый)

```typescript
export type OutfitTabType = 'basic' | 'dress' | 'all' | 'custom';

export interface OutfitTab {
  id: OutfitTabType;
  label: string;
  icon: string;
  categories: ItemCategory[];
  isCustomizable?: boolean;
}

export interface CustomTabState {
  categories: ItemCategory[];
  order: number[]; // индексы для порядка
  isDragging: boolean;
  draggedIndex: number | null;
}
```

#### 1.2 Обновление constants для табов

**File:** `constants/outfitTabs.ts` (новый)

```typescript
export const DEFAULT_OUTFIT_TABS: OutfitTab[] = [
  {
    id: 'basic',
    label: 'Basic',
    icon: 'shirt',
    categories: ['tops', 'bottoms', 'footwear'],
  },
  {
    id: 'dress',
    label: 'Dress',
    icon: 'woman', // или custom icon
    categories: ['fullbody', 'footwear', 'accessories'],
  },
  {
    id: 'all',
    label: 'All',
    icon: 'grid',
    categories: CATEGORIES, // все 8
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: 'settings',
    categories: [], // загружается из storage
    isCustomizable: true,
  },
];
```

### Phase 2: Component Updates

#### 2.1 Обновление SmoothCarousel - убрать флажки

**File:** `components/outfit/SmoothCarousel.tsx`

**Изменения:**

1. ❌ Убрать `isCategoryActive` prop
2. ❌ Убрать `onCategoryToggle` prop
3. ❌ Убрать flag button overlay из CarouselItem
4. ✅ Оставить всю логику плавной прокрутки
5. ✅ Оставить infinite loop и momentum physics

#### 2.2 Создание TabBar компонента

**File:** `components/outfit/OutfitTabBar.tsx` (новый)

```typescript
interface OutfitTabBarProps {
  activeTab: OutfitTabType;
  onTabChange: (tab: OutfitTabType) => void;
  customItemCount?: number;
}
```

**Features:**

- Горизонтальный скролл если табов много
- Анимированный индикатор активного таба
- Badge с количеством для custom таба

#### 2.3 Создание CustomTabManager

**File:** `components/outfit/CustomTabManager.tsx` (новый)

**Функционал:**

- Долгое нажатие (500ms) активирует режим редактирования
- Drag & drop для изменения порядка (react-native-draggable-flatlist)
- Крестик в углу для удаления категории
- Кнопка "+" для добавления категории
- Модалка выбора категории для добавления
- Анимации как в iOS home screen editing

### Phase 3: State Management Updates

#### 3.1 Обновление outfitStore

**File:** `store/outfit/outfitStore.ts`

**Добавить:**

```typescript
interface OutfitStoreState {
  // existing...
  activeTab: OutfitTabType;
  customTabCategories: ItemCategory[];
  customTabOrder: number[];
  isCustomTabEditing: boolean;

  // actions
  setActiveTab: (tab: OutfitTabType) => void;
  updateCustomTab: (categories: ItemCategory[], order: number[]) => void;
  toggleCustomTabEditing: () => void;
  addCategoryToCustom: (category: ItemCategory) => void;
  removeCategoryFromCustom: (category: ItemCategory) => void;
  reorderCustomCategories: (fromIndex: number, toIndex: number) => void;
}
```

#### 3.2 Persist custom tab configuration

**File:** `utils/storage/customTabStorage.ts` (новый)

```typescript
const CUSTOM_TAB_KEY = '@obrazz_custom_tab';

export const saveCustomTabConfig = async (categories: ItemCategory[], order: number[]) => {
  await AsyncStorage.setItem(CUSTOM_TAB_KEY, JSON.stringify({ categories, order }));
};

export const loadCustomTabConfig = async () => {
  const stored = await AsyncStorage.getItem(CUSTOM_TAB_KEY);
  return stored ? JSON.parse(stored) : { categories: [], order: [] };
};
```

### Phase 4: Layout Calculations

#### 4.1 Динамический расчет высоты каруселей

**File:** `components/outfit/CategorySelectorWithSmooth.tsx`

**Обновить функцию calculateItemDimensions:**

```typescript
function calculateItemDimensions(
  numberOfCategories: number,
  availableHeight: number,
  tabType: OutfitTabType,
): { itemWidth: number; itemHeight: number; carouselHeight: number } {
  // Специальная логика для разных табов
  if (tabType === 'basic' || tabType === 'dress') {
    // 3 карусели - больше места каждой
    const carouselHeight = Math.floor(availableHeight / 3);
    const itemHeight = Math.floor(carouselHeight - 20);
    const itemWidth = Math.floor(itemHeight * 0.75);

    return {
      itemWidth: Math.min(180, itemWidth), // больше max размер
      itemHeight: Math.min(240, itemHeight),
      carouselHeight,
    };
  } else if (tabType === 'all') {
    // 8 каруселей - динамический расчет
    const minCarouselHeight = 80;
    const maxCarouselHeight = 120;
    const calculatedHeight = Math.floor(availableHeight / numberOfCategories);
    const carouselHeight = Math.max(
      minCarouselHeight,
      Math.min(maxCarouselHeight, calculatedHeight),
    );

    // Если не помещаются - добавить вертикальный скролл
    const needsScroll = carouselHeight * numberOfCategories > availableHeight;

    // Размеры элементов
    const itemHeight = Math.floor(carouselHeight - 16);
    const itemWidth = Math.floor(itemHeight * 0.75);

    return {
      itemWidth: Math.max(60, Math.min(120, itemWidth)),
      itemHeight: Math.max(80, Math.min(160, itemHeight)),
      carouselHeight,
      needsVerticalScroll: needsScroll,
    };
  }
  // custom tab - аналогично all
}
```

### Phase 5: UI/UX Enhancements

#### 5.1 Анимации переключения табов

**File:** `components/outfit/ItemSelectionStepNew.tsx`

**Использовать react-native-reanimated:**

- Fade анимация при смене таба
- Slide анимация для индикатора
- Spring physics для interactive gestures

#### 5.2 Drag & Drop для Custom Tab

**Dependencies:**

```json
"react-native-draggable-flatlist": "^4.0.1",
"react-native-haptic-feedback": "^2.2.0"
```

**Features:**

- Haptic feedback при начале drag
- Scale анимация при поднятии элемента
- Auto-scroll при приближении к краям
- Smooth reordering animation

### Phase 6: Edge Cases & Optimizations

#### 6.1 Обработка пустых состояний

- Custom tab без категорий - показать onboarding
- Категория без элементов - показать placeholder
- Все категории удалены - автоматически добавить базовые

#### 6.2 Ограничения

- Минимум 1 категория в custom tab
- Максимум 8 категорий (все доступные)
- Нельзя добавить уже существующую категорию

#### 6.3 Производительность

- Lazy loading для неактивных табов
- Memoization для тяжелых вычислений
- Virtual scrolling для all tab если > 6 категорий

### Phase 7: Migration & Backwards Compatibility

#### 7.1 Миграция activeCategories

**Логика:**

1. При первом запуске конвертировать activeCategories в custom tab
2. Если были активны main categories → preset на basic tab
3. Если были активны extra → preset на dress tab
4. Иначе → all tab

#### 7.2 Сохранение состояния между сессиями

- Запоминать последний активный таб
- Сохранять конфигурацию custom tab
- Восстанавливать выбранные элементы

## Technical Challenges & Solutions

### Challenge 1: Высота каруселей в "All" табе

**Проблема:** 8 каруселей не помещаются на экране

**Решения:**

1. ✅ **ScrollView wrapper** - вертикальная прокрутка всего контейнера
2. ❌ Mini mode - слишком маленькие элементы
3. ❌ Pagination - усложняет UX

**Выбрано:** ScrollView с sticky header

### Challenge 2: Drag & Drop производительность

**Проблема:** Лаги при перетаскивании с 8+ каруселями

**Решения:**

1. ✅ **Placeholder рендеринг** - при drag показывать упрощенную версию
2. ✅ **RAF batching** - группировка обновлений
3. ✅ **Native driver** - использовать нативные анимации

### Challenge 3: Состояние между табами

**Проблема:** Выбранные элементы должны синхронизироваться

**Решение:**

- Единый `selectedItemsForCreation` для всех табов
- Табы только фильтруют отображение категорий
- При переключении табов selection сохраняется

## Testing Plan

### Unit Tests

- [ ] Tab switching logic
- [ ] Custom tab CRUD operations
- [ ] Height calculations for different tab types
- [ ] Storage persistence

### Integration Tests

- [ ] Tab navigation flow
- [ ] Drag & drop in custom tab
- [ ] Selection synchronization
- [ ] Memory leaks при частом переключении

### E2E Tests

- [ ] Complete outfit creation with each tab
- [ ] Custom tab configuration and usage
- [ ] Persistence after app restart

## Performance Metrics

### Target Metrics

- Tab switch: < 150ms
- Drag start: < 100ms
- Reorder animation: 60fps
- Memory usage: < 150MB with all tabs

### Monitoring

- React DevTools Profiler
- Flipper performance monitor
- Custom performance marks

## Rollout Strategy

### Phase 1 (Week 1)

- [ ] Core architecture changes
- [ ] Basic tab implementation
- [ ] Remove flag buttons

### Phase 2 (Week 1-2)

- [ ] Custom tab base functionality
- [ ] Drag & drop implementation
- [ ] Animations

### Phase 3 (Week 2)

- [ ] Polish & optimizations
- [ ] Edge cases handling
- [ ] Testing & QA

## Risk Assessment

### High Risk

- **Drag & drop library compatibility** - может не работать с нашими каруселями
  - Mitigation: Fallback на простой list reordering

### Medium Risk

- **Performance с 8 каруселями** - возможны лаги
  - Mitigation: Lazy loading, virtualization

### Low Risk

- **Миграция существующих данных** - простая логика
  - Mitigation: Default values, graceful degradation

## Success Criteria

1. ✅ 4 рабочих таба с разными наборами категорий
2. ✅ Флажки убраны, карусели чистые
3. ✅ Custom tab полностью настраиваемый
4. ✅ Drag & drop работает плавно
5. ✅ Состояние сохраняется между сессиями
6. ✅ Performance metrics достигнуты
7. ✅ Backward compatibility maintained

## Dependencies

### NPM Packages

```json
{
  "react-native-draggable-flatlist": "^4.0.1",
  "react-native-haptic-feedback": "^2.2.0",
  "@react-native-async-storage/async-storage": "^1.19.3"
}
```

### Existing Components

- SmoothCarousel.tsx - требует minor refactoring
- CategorySelectorWithSmooth.tsx - требует major refactoring
- ItemSelectionStepNew.tsx - требует major refactoring

## Post-Launch Improvements

1. **Анимированные иконки** для табов
2. **Presets для custom tab** (спорт, офис, вечеринка)
3. **Экспорт/импорт** конфигурации custom tab
4. **AI suggestions** для оптимальной конфигурации
5. **A/B testing** различных default configurations

## Conclusion

Этот план обеспечивает плавный переход от текущей системы к новой архитектуре с минимальными рисками. Основные преимущества:

1. **Улучшенный UX** - интуитивные табы вместо dropdown
2. **Больше гибкости** - custom tab для power users
3. **Лучше производительность** - меньше категорий на экране
4. **Чище интерфейс** - убраны флажки
5. **Персонализация** - каждый настраивает под себя

Estimated time: 1-2 недели для полной реализации
Risk level: Medium
Impact: High

---

**Note:** Этот документ является living document и будет обновляться по мере реализации.
