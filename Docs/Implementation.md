# Implementation Plan for Obrazz

**Last Updated:** December 20, 2025  
**Current Stage:** Stage 4.12 Complete ✅ (Offline-First Architecture реализована)  
**Next Stage:** Stage 5 - AI-анализ вещей при загрузке

---

## 📊 Feature Analysis

### Реализованные функции (Stage 1-4):

1. ✅ **Управление гардеробом** - добавление/редактирование вещей с автоудалением фона
2. ✅ **Создание образов вручную** - конструктор с drag&drop, 4-Tab System, SmoothCarousel
3. ✅ **Профиль и авторизация** - email регистрация, JWT токены
4. ✅ **Хранение данных** - локальные изображения + Supabase метаданные
5. ✅ **ImageCropper** - кастомная обрезка 3:4 с pinch-to-zoom
6. ✅ **Shopping Browser** - добавление вещей из интернет-магазинов (9 default stores)
7. ✅ **Default Items** - 24 встроенные вещи для новых пользователей
8. ✅ **Offline-First Architecture** - мгновенная загрузка, работа без интернета, фоновая синхронизация

### Планируемые функции (Stage 5+):

8. 🚧 **AI-анализ вещей** - автозаполнение полей при загрузке
9. 🚧 **AI-стилист** - автоматический подбор образов
10. 🚧 **AI-примерка** - примерка образа на фото пользователя
11. 🚧 **Подписки и биллинг** - YooMoney (РФ), IAP (глобально)
12. 🚧 **Push-уведомления** - напоминания, streak, новости
13. 🚧 **Геймификация** - streak, челленджи, достижения
14. 🚧 **Onboarding & Paywall** - первичный тур, конверсия
15. 🚧 **Реклама** - VK Ads, РСЯ, Google AdMob

### ❌ Убрано из планов:

- **Community Feed** - социальная лента НЕ будет реализована
- **Социальные функции** - лайки, подписки, шеринг образов

---

## Feature Categorization:

**Must-Have (для релиза):**

- ✅ Email регистрация/авторизация
- ✅ Добавление вещей в гардероб
- ✅ Ручное создание образов
- 🚧 AI-стилист (базовый)
- 🚧 Подписка и биллинг
- 🚧 Onboarding

**Should-Have:**

- 🚧 AI-анализ вещей
- 🚧 AI-примерка
- 🚧 Push-уведомления
- 🚧 Геймификация

**Nice-to-Have (post-MVP):**

- Web Capture
- Синхронизация между устройствами
- Темная тема
- Расширенная локализация

## Recommended Tech Stack

### Frontend:

- **Framework:** React Native 0.81.4 with Expo SDK 54 - Кроссплатформенная разработка с быстрым прототипированием
- **Documentation:** [https://docs.expo.dev/](https://docs.expo.dev/)

### Backend:

- **Framework:** Supabase (PostgreSQL + Auth + Storage) - Готовое backend решение с авторизацией
- **Documentation:** [https://supabase.com/docs](https://supabase.com/docs)

### Database:

- **Database:** PostgreSQL via Supabase - Надежная реляционная БД с real-time возможностями
- **Documentation:** [https://supabase.com/docs/guides/database](https://supabase.com/docs/guides/database)

### Additional Tools:

- **State Management:** Zustand 5.x - Простое и эффективное управление состоянием
- **Documentation:** [https://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)

- **Navigation:** React Navigation 7.x + Expo Router - Декларативная навигация
- **Documentation:** [https://reactnavigation.org/docs/getting-started](https://reactnavigation.org/docs/getting-started)

- **Data Fetching:** TanStack Query 5.x - Мощное кэширование и синхронизация
- **Documentation:** [https://tanstack.com/query/latest](https://tanstack.com/query/latest)

- **Animations:** React Native Reanimated 4.x - Нативные 60fps анимации
- **Documentation:** [https://docs.swmansion.com/react-native-reanimated/](https://docs.swmansion.com/react-native-reanimated/)

- **Image Processing:** Pixian.ai API - Автоматическое удаление фона
- **Documentation:** [https://ru.pixian.ai/api](https://ru.pixian.ai/api)

- **AI Services:** The New Black Fashion AI API - Virtual Try-On, Fashion Models, Variations
- **Documentation:** [https://thenewblack.ai/clothing_fashion_api_integrations](https://thenewblack.ai/clothing_fashion_api_integrations)

- **Backend:** Ruby on Rails 7.x - Единый backend (подписки, токены, AI proxy, admin)
- **Documentation:** [Docs/Extra/Features/Backend.md](./Extra/Features/Backend.md)

## Implementation Stages

### Stage 1: Foundation & Setup ✅

**Dependencies:** None
**Timeline:** 1-2 недели
**Status:** COMPLETED

#### Sub-steps:

- [x] Инициализация Expo проекта с TypeScript
- [x] Настройка структуры папок и алиасов путей
- [x] Установка и конфигурация всех основных зависимостей из TechStack.md
- [x] Настройка Supabase проекта и подключение клиента
- [x] Создание базовой схемы БД (users, items, outfits, posts)
- [x] Настройка ESLint, Prettier и Husky для code quality
- [x] Создание базовых типов TypeScript для всех сущностей
- [x] Настройка переменных окружения (.env)
- [x] Конфигурация навигации с Expo Router
- [x] Создание базовой структуры экранов-заглушек

### Stage 2: Authentication & User Management ✅

**Dependencies:** Stage 1 completion
**Timeline:** 3-5 дней
**Status:** COMPLETED

#### Sub-steps:

- [x] Реализация экрана приветствия (Splash/Welcome)
- [x] Создание формы регистрации с валидацией (email + password)
- [x] Создание формы входа с восстановлением пароля
- [x] Интеграция Supabase Auth с JWT токенами
- [x] Настройка Zustand store для хранения состояния авторизации
- [x] Реализация автоматического refresh токенов
- [x] Создание HOC для защищенных маршрутов
- [x] Базовый экран профиля с возможностью выхода
- [x] Обработка ошибок авторизации с user-friendly сообщениями
- [x] Создание онбординга для новых пользователей

### Stage 3: Wardrobe Management Core ✅

**Dependencies:** Stage 2 completion
**Timeline:** 1-2 недели
**Status:** COMPLETED

#### Sub-steps:

- [x] Создание экрана гардероба с сеткой элементов
- [x] Реализация добавления вещей через камеру (expo-camera)
- [x] Реализация добавления вещей из галереи (expo-image-picker)
- [x] Настройка локального хранения изображений (expo-file-system)
- [x] Создание формы метаданных для вещей (категория, цвет, стиль, сезон)
- [x] Интеграция Pixian.ai API для удаления фона
- [x] Реализация просмотра детальной информации о вещи
- [x] Функционал редактирования метаданных вещи
- [x] Реализация удаления вещей с подтверждением
- [x] Фильтрация и сортировка вещей по категориям/цветам
- [x] Оптимизация производительности для больших коллекций (>100 items)
- [x] Добавление встроенных базовых вещей для новых пользователей (Default Items)

#### Default Items Feature (November 2025) ✅

**Purpose:** Предоставить новым пользователям 24 готовых вещи для быстрого старта

**Key Features:**

- 24 встроенные вещи с изображениями в Supabase Storage
- Видимы всем пользователям автоматически
- Пользователи могут скрыть (не удалить) default items
- Отслеживание скрытых вещей в таблице `hidden_default_items`

**Implemented Components:**

- Database migrations:
  - `001_create_hidden_default_items.sql` - таблица для отслеживания скрытых вещей
  - `002_insert_default_items.sql` - вставка 24 default items
- Service methods (`itemService.ts`):
  - `getUserItems()` - загрузка с учетом видимых default items
  - `getDefaultItems()`, `hideDefaultItem()`, `unhideDefaultItem()`
- State management (`wardrobeStore.ts`):
  - `hiddenDefaultItemIds` state
  - Actions для управления скрытыми вещами
- UI updates (`wardrobe.tsx`):
  - Разное поведение удаления для default vs user items
  - "Hide Items" vs "Delete Items" confirmations

**Documentation:** `Docs/Extra/DEFAULT_ITEMS_GUIDE.md`

### Stage 4: Manual Outfit Creator ✅

**Dependencies:** Stage 3 completion
**Timeline:** 2 недели
**Status:** COMPLETED

#### Sub-steps:

- [x] Создание экрана конструктора образов
- [x] Реализация горизонтальных scroll-каруселей для категорий
- [x] Создание canvas с поддержкой drag & drop (gesture-handler)
- [x] Реализация масштабирования и поворота элементов (pinch/rotate)
- [x] Функция блокировки категорий при рандомизации
- [x] Кнопка "Рандом" для случайной генерации
- [x] Выбор и смена фонов коллажа
- [x] Сохранение позиций и трансформаций элементов
- [x] Сохранение готового образа в БД
- [x] Редактирование сохраненных образов
- [ ] Экспорт образа как изображения (будет в Stage 8)
- [x] Undo/Redo функционал для действий

### Stage 4.5: Outfits Collection & Navigation ✅

**Dependencies:** Stage 4 completion
**Timeline:** 3-5 дней
**Status:** COMPLETED

#### Sub-steps:

- [x] Создание OutfitCard компонента для отображения сохранённых образов
- [x] Создание страницы Outfits (outfits.tsx) с сеткой сохранённых образов
- [x] Реорганизация навигации: замена таба Create на Outfits
- [x] Перенос create.tsx в отдельный stack экран
- [x] Добавление FAB (Floating Action Button) на странице Outfits
- [x] Реализация навигации из Outfits -> Create
- [x] Добавление кнопки в хедер для создания нового образа (альтернативный способ)
- [x] Фильтрация и сортировка образов (новые, избранные, часто используемые)
- [x] Быстрые действия: редактировать, дублировать, удалить, поделиться
- [x] Обновление документации и структуры проекта

### Stage 4.6: Outfit Creator UX Refactoring ✅

**Dependencies:** Stage 4.5 completion
**Timeline:** 1 неделя
**Status:** COMPLETED

**Purpose:** Рефакторинг страницы создания образа на двухэтапный процесс для улучшения UX

#### Текущие проблемы:

- Слишком много элементов на одном экране (canvas + карусели)
- Требуется скроллинг между canvas и выбором вещей
- Неинтуитивный процесс создания образа

#### Целевой UX:

- **Step 1: Выбор одежды** - вертикальная прокрутка с каруселями категорий
- **Step 2: Композиция** - размещение вещей на canvas с инструментами

#### Sub-steps:

- [x] Обновление outfitStore для поддержки двухэтапного процесса
  - [x] Добавить состояние creationStep (1 | 2)
  - [x] Добавить selectedItemsForCreation Map
  - [x] Реализовать actions для управления шагами

- [x] Создание компонентов для Step 1 (Выбор одежды)
  - [x] CategorySelectorList - вертикальный список каруселей
  - [x] ItemSelectionStep - обертка для Step 1
  - [x] ProgressIndicator - индикатор прогресса выбора
  - [x] Обновить CategoryCarousel для увеличенного размера

- [x] Создание компонентов для Step 2 (Композиция)
  - [x] ItemMiniPreviewBar - нижняя панель с мини-превью
  - [x] CompositionStep - обертка для Step 2
  - [x] Toolbar с контролами (Undo/Redo/Background/Clear)

- [x] Рефакторинг create.tsx
  - [x] Реализовать переключение между шагами
  - [x] Навигация между Step 1 и Step 2
  - [x] Сохранить Randomize функциональность на обоих шагах
  - [x] Edit mode: загрузка outfit сразу на Step 2

- [x] UI/UX полировка
  - [x] Плавные анимации переходов между шагами
  - [x] Responsive layout для разных экранов
  - [x] Accessibility improvements

- [x] Обновление документации
  - [x] AppMapobrazz.md - новый flow создания образа
  - [x] UI_UX_doc.md - спецификации для новых компонентов
  - [x] OUTFIT_CREATOR_REFACTOR_PLAN.md - детальный план

- [x] Тестирование
  - [x] Создание нового образа через 2 шага
  - [x] Редактирование существующего образа
  - [x] Randomize на обоих шагах
  - [x] Навигация между шагами

### Stage 4.7: SmoothCarousel System ✅

**Dependencies:** Stage 4.6 completion
**Timeline:** 1 неделя
**Status:** COMPLETED (November 2025)

**Purpose:** Полная замена системы каруселей на современную реализацию с реалистичной физикой и плавной прокруткой

**Documentation:**

- Memory system entry about SmoothCarousel implementation
- `Docs/Extra/CURRENT_STATUS.md` - Current implementation details
- Archived: `Docs/Extra/Archive/` - Historical carousel evolution

#### Предыдущая Проблема:

- Старые карусели (CategoryCarousel, CategoryCarouselCentered) работали нестабильно
- Flickering при прокрутке
- Недостаточно плавная физика
- Сложная архитектура с множественными state updates

#### Новая Реализация:

**SmoothCarousel System - Ключевые Компоненты:**

1. **SmoothCarousel.tsx** - Современная карусель с реалистичной физикой
   - Deceleration: 0.985 (natural momentum)
   - Infinite loop с 30+ duplicates buffer
   - Full-width edge-to-edge design
   - Seamless прокрутка как в CS:GO case opening
   - Border highlight на центральном элементе

2. **CategorySelectorWithSmooth.tsx** - Container для управления каруселями
   - Dynamic sizing на основе доступного пространства
   - Support для различных наборов категорий
   - Синхронизация выбора между режимами

3. **ItemSelectionStepNew.tsx** - Новый selection step
   - Убран ProgressIndicator (показ count в header)
   - Tab system для переключения наборов категорий
   - Randomize функция для текущего таба

**Технические Улучшения:**

- Минимум state updates (ref-based tracking)
- Native snap с momentum
- Smooth velocity-based snapping
- Anti-flickering protection
- Items поддерживают 3:4 aspect ratio

#### Sub-steps:

- [x] Анализ проблем предыдущей системы
- [x] Создание SmoothCarousel.tsx с realistic physics
- [x] Infinite loop с buffer из 30+ duplicates
- [x] Ref-based tracking вместо state
- [x] Velocity-based smart snapping
- [x] Anti-flickering с isAdjustingRef guard
- [x] Создание CategorySelectorWithSmooth.tsx
- [x] Dynamic dimension calculation
- [x] Обновление ItemSelectionStepNew.tsx
- [x] Удаление устаревших компонентов (5 файлов)
- [x] Обновление exports
- [x] Документация и архивация (33 файла в Archive)
- [x] Bug_tracking.md - CLEANUP-001 entry
- [x] Тестирование и верификация

---

### Stage 4.8: Outfit Creator 4-Tab System ✅

**Dependencies:** Stage 4.7 completion
**Timeline:** 1-2 недели
**Status:** COMPLETED (November 2025)

**Purpose:** Переход от 3 display modes к 4 вкладкам с различными комбинациями категорий + кастомизируемая вкладка

**Documentation:** `Docs/Extra/OUTFIT_CREATOR_TABS_REFACTOR.md`

#### Новая Архитектура:

**4 Вкладки:**

1. **Tab 1: Basic** (👕) - tops, bottoms, footwear (3 карусели)
2. **Tab 2: Dress** (👗) - fullbody, footwear, accessories (3 карусели)
3. **Tab 3: All** (🔲) - все 8 категорий с вертикальным скроллом
4. **Tab 4: Custom** (⚙️) - пользовательский набор категорий

#### Key Features:

- ✅ **OutfitTabBar.tsx** - новый компонент tab navigation
- ✅ **CustomTabManager.tsx** - управление кастомными категориями
- ✅ **Inline editing** в Custom tab - добавление/удаление категорий
- ✅ **AsyncStorage persistence** - сохранение конфигурации Custom tab
- ✅ **Duplicates allowed** - возможность добавить одну категорию несколько раз
- ✅ **Dynamic height calculation** - адаптация высоты каруселей под кол-во категорий
- ✅ **Clean carousels** - убраны flag buttons, карусели без overlays

#### Technical Changes:

**Новые типы:**

- `OutfitTabType = 'basic' | 'dress' | 'all' | 'custom'`
- `CustomTabState` - состояние кастомного таба

**Новые файлы:**

- `types/components/OutfitCreator.ts` - типы для табов
- `constants/outfitTabs.ts` - конфигурация табов
- `utils/storage/customTabStorage.ts` - persistence logic
- `components/outfit/OutfitTabBar.tsx` - tab navigation
- `components/outfit/CustomTabManager.tsx` - inline editing

**Обновленные компоненты:**

- `ItemSelectionStepNew.tsx` - интеграция tab system
- `CategorySelectorWithSmooth.tsx` - динамический sizing
- `SmoothCarousel.tsx` - убраны flag buttons
- `outfitStore.ts` - tab state management

#### Sub-steps:

- [x] Создание типов и констант для табов
- [x] Реализация OutfitTabBar компонента
- [x] Создание CustomTabManager с inline editing
- [x] Обновление SmoothCarousel - удаление flag buttons
- [x] Интеграция tab system в ItemSelectionStepNew
- [x] AsyncStorage persistence для Custom tab
- [x] Обновление outfitStore с tab state
- [x] Dynamic height calculation для разных табов
- [x] Обработка edge cases (пустой custom tab, дубликаты)
- [x] Тестирование всех табов и переключения

---

### Stage 4.9: ImageCropper Refactor ✅

**Dependencies:** Stage 3 completion
**Timeline:** 3-5 дней
**Status:** COMPLETED (November 2025)

**Purpose:** Улучшение UX обрезки изображений с нативным pinch-to-zoom и elastic boundaries

**Documentation:** `Docs/Bug_tracking.md` - BUG-005, BUG-006

#### Проблемы до рефакторинга:

- iOS UIImagePickerController игнорирует `aspect: [3, 4]`
- Всегда показывает квадратную область обрезки
- Неконтролируемый pinch gesture
- Изображение "прыгает" при масштабировании

#### Новая Реализация:

**Компонент:** `components/common/ImageCropper.tsx`

**Key Features:**

- ✅ **Custom 3:4 crop overlay** - кастомная область обрезки 3:4
- ✅ **react-native-zoom-toolkit** - библиотека для pinch-to-zoom
- ✅ **CropOverlay.tsx** - визуальный overlay с затемнением
- ✅ **Focal-point anchored pinch** - масштабирование к точке между пальцами
- ✅ **Elastic boundaries** - временный выход за границы с плавным возвратом
- ✅ **Simultaneous gestures** - одновременный pinch (2 пальца) + pan (1 палец)
- ✅ **Double-tap zoom** - быстрый зум по двойному тапу
- ✅ **Spring animations** - плавные анимации возврата (damping: 20, stiffness: 300)
- ✅ **No clamping during gesture** - клампы только после отпускания

#### Technical Implementation:

```typescript
// Elastic bounds: allow temporary over-zoom/over-pan
onUpdate: scale.value = pinchStartScale * e.scale (no clamp)
onEnd: animate back to [minScale, MAX_SCALE] with spring

// Spring config для нативного feel
{ damping: 20, stiffness: 300 }
```

**Integration:**

- Используется в `app/add-item.tsx` после выбора камеры/галереи
- Работает на iOS и Android
- Финальная обрезка через `expo-image-manipulator`

#### Sub-steps:

- [x] Интеграция react-native-zoom-toolkit
- [x] Создание CropOverlay компонента
- [x] Создание ImageCropper с pinch gestures
- [x] Focal-point anchored scaling
- [x] Elastic boundaries implementation
- [x] Spring animations для возврата к границам
- [x] Double-tap zoom функционал
- [x] Интеграция с expo-image-manipulator
- [x] Тестирование на iOS/Android
- [x] Bug tracking documentation (BUG-005, BUG-006)

---

### Stage 4.10: Outfit Data Persistence Architecture ✅

**Dependencies:** Stage 4.8 completion
**Timeline:** 2-3 дня  
**Status:** COMPLETED (November 2025)

**Purpose:** Исправление критической проблемы с загрузкой данных при редактировании образов

#### Проблема:

При редактировании любого образа загружались `customTabCategories` из **последнего созданного образа** (из AsyncStorage), а не из редактируемого. Вещи отображались не в тех каруселях и позициях.

#### Root Cause:

- `ItemSelectionStepNew.tsx` автоматически загружал custom tab из AsyncStorage при каждом открытии
- В edit mode это перезаписывало данные редактируемого образа
- AsyncStorage содержал конфигурацию последнего **созданного** образа

#### Решение:

**Архитектура загрузки данных:**

1. **Новый образ:**
   - `customTabCategories = BASIC_CATEGORIES` (default)
   - Загрузка из AsyncStorage для User Preferences

2. **Редактирование:**
   - `customTabCategories` загружаются из `canvasSettings` образа
   - AsyncStorage НЕ загружается в edit mode
   - Backward compatibility: восстановление из `items` если нет `canvasSettings`

3. **Независимое хранение:**
   - Каждый образ хранит свою конфигурацию в DB
   - AsyncStorage используется только для user preferences (новые образы)

#### Technical Changes:

**Файлы:**

1. **ItemSelectionStepNew.tsx:**

```typescript
// ✅ Skip AsyncStorage load in edit mode
useEffect(() => {
  if (isEditMode) {
    console.log('🚫 Skipping AsyncStorage load - edit mode');
    return;
  }
  loadCustomTabConfig(); // Only for create mode
}, [isEditMode]);

// ✅ Only save to AsyncStorage in create mode
useEffect(() => {
  if (activeTab === 'custom' && !isEditMode) {
    saveCustomTabConfig(customTabCategories, order);
  }
}, [customTabCategories, activeTab, isEditMode]);
```

2. **outfitService.ts:**

```typescript
// ✅ Load full item data with categories
const getOutfitById = async (id: string) => {
  const { data, error } = await supabase
    .from('outfits')
    .select('*, items(*)') // ✅ Load full items
    .eq('id', id)
    .single();

  return data;
};
```

3. **outfitStore.ts:**

```typescript
// ✅ Priority: canvasSettings > items restoration > defaults
setCurrentOutfit: (outfit) => {
  if (outfit?.canvasSettings?.customTabCategories) {
    // Load from canvasSettings (primary source)
    set({ customTabCategories: outfit.canvasSettings.customTabCategories });
  } else if (outfit?.items) {
    // Restore from items (backward compatibility)
    const restored = restoreCategoriesFromItems(outfit.items);
    set({ customTabCategories: restored });
  }
};
```

#### Sub-steps:

- [x] Отключить автозагрузку AsyncStorage в edit mode
- [x] Добавить загрузку полных данных items в getOutfitById()
- [x] Улучшить логику setCurrentOutfit() с приоритетами
- [x] Добавить детальное логирование на всех этапах
- [x] Backward compatibility для старых образов
- [x] Тестирование create mode
- [x] Тестирование edit mode
- [x] Документация архитектуры

---

### Stage 4.11: Shopping Browser & Web Capture ✅

**Dependencies:** Stage 4.10 completion
**Timeline:** 2-3 недели
**Status:** COMPLETED (December 2025)

**Цель:** Добавление вещей в гардероб напрямую из интернет-магазинов с автоматическим определением изображений

**Documentation:**

- `Docs/WEB_CAPTURE_SHOPPING_BROWSER.md`
- `Docs/WEB_CAPTURE_STATE_MANAGEMENT_FIXES.md`
- `Docs/WEBVIEW_PERFORMANCE_OPTIMIZATION.md`

#### Key Features:

**Shopping Browser Screen** (`/shopping/browser.tsx`):

- Full WebView integration с mobile user-agent
- Multi-tab system (до 5 tabs одновременно)
- Автоматическое определение изображений при загрузке страницы
- Кнопка "Scan" для manual detection
- Forward/backward навигация с жестами
- Tab carousel с favicons

**Intelligent Image Detection**:

- JavaScript injection для автоматического сканирования product images
- Фильтрация по размеру (min 200x200px, max 2000x2000px)
- Дедупликация по URL и dimensions
- Category confidence scoring
- Gallery bottom sheet с detected items

**Shopping Cart** (`/shopping/cart.tsx`):

- Persistent cart storage через AsyncStorage
- Добавление detected items в корзину для последующего использования
- Batch upload - добавление всех вещей из корзины за раз
- Individual item management (delete, add to wardrobe)
- Clear cart функционал

**Manual Crop Mode**:

- WebViewCropOverlay для manual screenshot capture
- Fallback когда auto-detection ничего не находит
- Прямая интеграция с add-item screen

**Default Stores** (9 интернет-магазинов):

- ZARA, H&M, ASOS, Nike, Adidas
- Reserved, Mango, Pull&Bear, Bershka
- Favicon support для визуальной идентификации
- Возможность добавления custom stores

#### Implemented Components:

**Components:**

- `components/shopping/GalleryBottomSheet.tsx` ✅ - Gallery с detected items
- `components/shopping/MasonryGallery.tsx` ✅ - Masonry grid layout
- `components/shopping/DetectedItemSheet.tsx` ✅ - Bottom sheet для item details
- `components/shopping/WebViewCropOverlay.tsx` ✅ - Manual crop overlay
- `components/shopping/CartItemRow.tsx` ✅ - Cart item display
- `components/shopping/CartButton.tsx` ✅ - Header cart button
- `components/shopping/TabsCarousel.tsx` ✅ - Tab switching carousel
- `components/shopping/ShoppingStoriesCarousel.tsx` ✅ - Store carousel
- `components/shopping/DetectionFAB.tsx` ✅ - Floating action button
- `components/shopping/GalleryImageItem.tsx` ✅ - Gallery item component

**Services & State:**

- `services/shopping/storeService.ts` ✅ - Store management (CRUD, history)
- `services/shopping/webCaptureService.ts` ✅ - Screenshot capture
- `store/shoppingBrowserStore.ts` ✅ - Full state management:
  - Tabs, active tab, detected images
  - Cart items с AsyncStorage persistence
  - Scan state (isScanning, hasScanned)
  - Batch upload queue management
  - Selection state для multi-select

**Utilities:**

- `utils/shopping/imageDetection.ts` ✅ - Image detection script injection
- `utils/shopping/webviewOptimization.ts` ✅ - Performance optimizations

**Types:**

- `types/models/store.ts` ✅ - Store, BrowserTab, DetectedImage, CartItem

#### Technical Implementation:

```typescript
// WebView с injected JavaScript для detection
<WebView
  source={{ uri: activeTab.url }}
  injectedJavaScript={imageDetectionScript}
  onMessage={handleDetectedImages}
  userAgent="Mozilla/5.0..." // Mobile user-agent
/>

// Auto-detection на page load
onLoadEnd={() => {
  if (!hasScanned) {
    injectImageDetectionScript();
  }
}}

// Cart persistence
AsyncStorage.setItem('@shopping_cart', JSON.stringify(cartItems));
```

#### User Flow:

1. User открывает Shopping Browser из home/wardrobe
2. Tabs открываются для всех 9 default stores
3. User выбирает store и просматривает товары
4. Изображения auto-detected при загрузке страницы
5. User кликает "Scan" для manual detection (если нужно)
6. Gallery sheet открывается с detected items
7. User может:
   - Добавить selected items в cart
   - Добавить напрямую в wardrobe (открывает add-item screen)
   - Использовать manual crop если detection не сработал
8. Cart сохраняется между сессиями
9. Batch upload всех cart items одной кнопкой

#### Sub-steps:

- [x] Создание Shopping Browser screen с WebView
- [x] Multi-tab architecture с tab carousel
- [x] Автоматическое image detection при page load
- [x] Manual scan button с JavaScript injection
- [x] Gallery bottom sheet с masonry grid
- [x] Cart system с AsyncStorage persistence
- [x] Batch upload functionality
- [x] Manual crop fallback
- [x] 9 default stores с favicons
- [x] Store service (CRUD, history)
- [x] WebView optimization для performance
- [x] Integration с add-item flow
- [x] State management с shoppingBrowserStore
- [x] Comprehensive documentation
- [x] Bug fixing и state management improvements

---

### Stage 4.12: Offline-First Architecture ✅

**Dependencies:** Stage 4.11 completion
**Timeline:** 1 день
**Status:** COMPLETED (December 20, 2025)

**Цель:** Мгновенная загрузка данных, работа без интернета, фоновая синхронизация

#### Проблемы до внедрения:

- UI зависал при добавлении вещей/создании образов (ожидание ответа сервера)
- Медленная загрузка detail screens (каждый раз fetch с сервера)
- Невозможность работы без интернета
- Network errors блокировали работу приложения

#### Реализованное решение:

**1. Optimistic UI Strategy** - все операции выполняются локально мгновенно:

- Создание вещей/образов → сразу в Zustand store
- Обновление → сразу в локальном состоянии
- Удаление → мгновенное удаление из UI
- Синхронизация с сервером в фоне (неблокирующая)

**2. Offline Services** (новые файлы):

- `services/wardrobe/itemServiceOffline.ts` ✅ - Offline-first для вещей
  - `createItem()` - мгновенное локальное создание + фоновая sync
  - `updateItem()` - мгновенное обновление + фоновая sync
  - `deleteItem()` - мгновенное удаление + фоновая sync
  - `toggleFavorite()` - мгновенное изменение + фоновая sync
  - `getUserItems()` - возврат кеша + фоновая sync
  - `getItemById()` - проверка кеша first, fallback на server

- `services/outfit/outfitServiceOffline.ts` ✅ - Offline-first для образов
  - `createOutfit()` - мгновенное создание + фоновая sync
  - `updateOutfit()` - мгновенное обновление + фоновая sync
  - `deleteOutfit()` - мгновенное удаление + фоновая sync
  - `toggleFavorite()` - мгновенное изменение + фоновая sync
  - `getUserOutfits()` - возврат кеша + фоновая sync
  - `getOutfitById()` - проверка кеша first, fallback на server
  - `duplicateOutfit()` - работает через createOutfit (offline-ready)

**3. Sync Infrastructure** (используется существующая):

- `services/sync/syncQueue.ts` ✅ - Очередь операций для offline
- `services/sync/networkMonitor.ts` ✅ - Отслеживание состояния сети
- AsyncStorage для персистентности очереди

**4. Store Updates**:

- `store/wardrobe/wardrobeStore.ts` ✅ - sync state (syncStatus, lastSyncedAt)
- `store/outfit/outfitStore.ts` ✅ - sync state (syncStatus, lastSyncedAt)

**5. Screen Updates** (все экраны теперь используют offline сервисы):

- `app/add-item.tsx` ✅ - itemServiceOffline вместо itemService
- `app/outfit/create.tsx` ✅ - outfitServiceOffline + itemServiceOffline
- `app/(tabs)/wardrobe.tsx` ✅ - itemServiceOffline
- `app/(tabs)/outfits.tsx` ✅ - outfitServiceOffline
- `app/item/[id].tsx` ✅ - кеш-first загрузка, itemServiceOffline
- `app/outfit/[id].tsx` ✅ - кеш-first загрузка, outfitServiceOffline

**6. Bug Fixes**:

- Исправлена ошибка сортировки дат (Date vs string при десериализации)
- Добавлены проверки на null при загрузке данных
- Удалены дубликаты кода после рефакторинга

#### Технические детали:

```typescript
// Паттерн: мгновенное локальное обновление + фоновая sync
async createItem(input: CreateItemInput): Promise<WardrobeItem> {
  // 1. Создать локально с temp ID
  const tempId = generateTempId();
  const localItem = this.inputToLocalItem(input, tempId);

  // 2. Добавить в store СРАЗУ - UI обновляется мгновенно
  store.addItem(localItem);

  // 3. Синхронизация в фоне - НЕ блокирует UI
  if (isOnline()) {
    this.syncCreateItemInBackground(tempId, input, store).catch(...);
  } else {
    await syncQueue.add({...}); // Очередь для offline
  }

  // 4. Вернуть локальный item сразу
  return localItem;
}

// Фоновая синхронизация - неблокирующая
private async syncCreateItemInBackground(...): Promise<void> {
  try {
    const serverItem = await itemService.createItem(input);
    store.removeItemLocally(tempId);
    store.addItem(serverItem); // Замена temp → real
  } catch (error) {
    await syncQueue.add({...}); // Retry через очередь
  }
}
```

#### Результаты:

✅ **UI больше не зависает** - все операции мгновенные
✅ **Instant loading** - detail screens открываются мгновенно (кеш)
✅ **Работа офлайн** - все CRUD операции доступны без интернета
✅ **Фоновая sync** - изменения синхронизируются когда есть сеть
✅ **Очередь операций** - при offline все изменения сохраняются и применяются позже
✅ **TypeScript** - все типы корректны, компиляция без ошибок

#### Sub-steps:

- [x] Создание itemServiceOffline.ts с optimistic UI
- [x] Создание outfitServiceOffline.ts с optimistic UI
- [x] Замена всех вызовов itemService → itemServiceOffline
- [x] Замена всех вызовов outfitService → outfitServiceOffline
- [x] Обновление экранов (add-item, create, detail screens)
- [x] Исправление ошибки сортировки дат
- [x] Добавление null checks
- [x] Тестирование offline режима
- [x] TypeScript type checking
- [x] Обновление документации

---

### Stage 5: AI-функции (The New Black API)

**Dependencies:** Stage 4.12 completion
**Timeline:** 2-3 недели
**Status:** PLANNED

**Цель:** Интеграция AI-генерации через The New Black Fashion API

**Документация:** [Backend.md](./Extra/Features/Backend.md) — полная архитектура

#### Sub-steps:

- [ ] Создание экранов AI-функций в приложении:
  - [ ] Virtual Try-On экран
  - [ ] AI Fashion Model экран
  - [ ] Clothing Variations экран
- [ ] Интеграция с Rails Backend API:
  - [ ] POST /api/v1/ai/virtual_tryon
  - [ ] POST /api/v1/ai/fashion_model
  - [ ] POST /api/v1/ai/variation
  - [ ] GET /api/v1/ai/generations/:id (polling статуса)
- [ ] UI для отображения прогресса генерации
- [ ] Галерея AI-генераций пользователя
- [ ] Обработка ошибок и retry logic
- [ ] Интеграция с системой токенов (проверка баланса)

**API:** The New Black (1 токен/генерация)

---

### Stage 6: Ruby on Rails Backend

**Dependencies:** Stage 5 (можно параллельно)
**Timeline:** 4-6 недель
**Status:** PLANNED

**Цель:** Единый backend для подписок, токенов, AI proxy, admin

**Документация:** [Backend.md](./Extra/Features/Backend.md)

#### Sub-steps:

**Phase 1: Foundation (1-2 недели)**

- [ ] Инициализация Rails 7.2 проекта
- [ ] JWT аутентификация (Supabase интеграция)
- [ ] Модели: User, Subscription, TokenBalance, TokenTransaction
- [ ] API endpoints: /subscription, /tokens

**Phase 2: The New Black Integration (1-2 недели)**

- [ ] HTTP клиент к The New Black API
- [ ] Wrapper services: VirtualTryon, FashionModels, Variations
- [ ] Background jobs (Sidekiq) для AI генерации
- [ ] Сохранение результатов в Supabase Storage

**Phase 3: Dashboard (1 неделя)**

- [ ] Hotwire + Tailwind setup
- [ ] Личный кабинет: профиль, подписка, токены
- [ ] История генераций

**Phase 4: Admin (3-5 дней)**

- [ ] Administrate setup
- [ ] CRUD для Curated Collections
- [ ] Управление пользователями

---

### Stage 7: Подписки и биллинг

**Dependencies:** Stage 6 completion
**Timeline:** 2-3 недели
**Status:** PLANNED

**Цель:** Гибридная система — веб-биллинг для РФ, IAP для остального мира + токены

**Документация:** [Backend.md](./Extra/Features/Backend.md)

#### Система токенов:

| План | Токенов/мес | Подписка/мес |
| ---- | ----------- | ------------ |
| FREE | 5           | бесплатно    |
| PRO  | 50          | 399₽         |
| MAX  | 150         | 799₽         |

**Пакеты токенов (докупка):**

- 10 токенов — 99₽
- 30 токенов — 249₽
- 100 токенов — 699₽
- 300 токенов — 1799₽

#### Sub-steps:

- [ ] YooKassa интеграция (Россия)
- [ ] Stripe интеграция (глобально)
- [ ] IAP валидация (Apple/Google)
- [ ] Webhook обработка (security + идемпотентность)
  - [ ] Signature verification: Stripe webhook secret; для YooKassa/Apple/Google — официальная проверка/верификация payload
  - [ ] DB idempotency: таблица `webhook_events` + unique index `(provider,event_id)`; повторные события → `200 OK` без side effects
  - [ ] Anti double-grant: выдача токенов/активация подписки строго один раз на событие/платёж
- [ ] Покупка токенов (одноразовая)
- [ ] Ежемесячное начисление токенов по подписке
- [ ] UI Paywall в приложении

---

### Stage 8: Push-уведомления и геймификация

**Dependencies:** Stage 7 completion
**Timeline:** 1-2 недели
**Status:** PLANNED

**Цель:** Вовлечение пользователей через streak и уведомления

#### Sub-steps:

- [ ] Expo Notifications setup
- [ ] Push-сервер (Rails Sidekiq)
- [ ] Streak система (ежедневный вход)
- [ ] Бонусные токены за streak
- [ ] Настройки уведомлений в профиле

---

### Stage 9: Onboarding и Paywall

**Dependencies:** Stage 8 completion
**Timeline:** 1-2 недели
**Status:** PLANNED

**Цель:** Конверсия новых пользователей

#### Sub-steps:

├─────────────────────────────────────────────────────────────────┤
│ 🇷🇺 РОССИЯ │ 🌍 ОСТАЛЬНОЙ МИР │
│ ═══════════ │ ════════════════ │
│ Web Billing │ In-App Purchase │
│ (YooMoney ~3.5%) │ (Apple/Google 15-30%) │
│ Личный кабинет │ Нативный IAP flow │
│ на Rails │ Валидация на Rails │
└─────────────────────────────────────────────────────────────────┘

```

#### Sub-steps:

**Ruby on Rails Backend (Fullstack):**

- [ ] Инициализация Rails 7.2 проекта
- [ ] Интеграция с Supabase Auth (JWT валидация)
- [ ] Модели: User, Subscription, Payment, UsageLimit
- [ ] API endpoints для мобильного приложения
- [ ] Личный кабинет пользователя (Hotwire + Tailwind):
  - Профиль и настройки
  - Текущая подписка и статус
  - Лимиты использования и статистика
  - История платежей
  - Управление автопродлением

**Для РФ (веб-биллинг):**

- [ ] Интеграция YooMoney/YooKassa API
- [ ] Payment flow: редирект → оплата → webhook → активация
- [ ] Автопродление через сохранённую карту
- [ ] Webhook обработка (payment.succeeded, refund)
- [ ] Синхронизация с Supabase

**Для глобального рынка (IAP):**

- [ ] React Native Purchases (RevenueCat) или expo-in-app-purchases
- [ ] App Store receipt validation на Rails
- [ ] Google Play purchase validation на Rails
- [ ] Server-to-Server notifications
- [ ] Настройка продуктов в App Store Connect
- [ ] Настройка продуктов в Google Play Console
- [ ] Восстановление покупок

**Определение региона:**

- [ ] IP geolocation
- [ ] Accept-Language header
- [ ] Timezone detection
- [ ] Сохранение страны пользователя

**Mobile App:**

- [ ] Paywall экран с региональной логикой
- [ ] Для РФ: кнопка "Оформить на сайте" → WebView/браузер
- [ ] Для других: нативные IAP кнопки
- [ ] Экран управления подпиской
- [ ] Проверка статуса при запуске
- [ ] Блокировка функций при превышении лимитов

**Лимиты и трекинг:**

- [ ] Middleware проверки лимитов в Rails
- [ ] UsageLog для отслеживания расходов
- [ ] Ежемесячный сброс лимитов (Sidekiq job)
- [ ] Уведомления при приближении к лимиту

**Тарифы:**
| План | Месяц | Год |
|------|-------|-----|
| PRO | 399₽ | 3,299₽ (–17%) |
| MAX | 799₽ | 5,699₽ (–41%) |

---

### Stage 9: Push-уведомления и геймификация

**Dependencies:** Stage 8 completion
**Timeline:** 1-2 недели
**Status:** PLANNED

#### Push-уведомления:

- [ ] Интеграция expo-notifications
- [ ] Настройка Firebase Cloud Messaging (Android)
- [ ] Настройка APNs (iOS)
- [ ] Типы уведомлений:
  - Напоминание о создании образа
  - Streak reminder
  - Новые функции
- [ ] Настройки предпочтений пользователя

#### Геймификация:

- [ ] Streak система (серия дней использования)
- [ ] UI для отображения streak на главном экране
- [ ] Челленджи (еженедельные задания)
- [ ] Достижения и награды
- [ ] Хранение прогресса в Supabase

---

### Stage 10: Onboarding, Paywall, Реклама

**Dependencies:** Stage 9 completion
**Timeline:** 1-2 недели
**Status:** PLANNED

#### Onboarding:

- [ ] Интерактивный тур (3-5 экранов)
- [ ] Демонстрация AI-возможностей
- [ ] Настройка предпочтений
- [ ] Skip для повторных пользователей

#### Paywall:

- [ ] Экран подписки после исчерпания лимитов
- [ ] A/B тестирование вариантов
- [ ] Soft paywall с возможностью пропуска
- [ ] Отображение преимуществ подписки

#### Реклама:

- [ ] Интеграция VK Ads SDK (РФ)
- [ ] Интеграция РСЯ (Yandex, РФ)
- [ ] Интеграция Google AdMob (глобально)
- [ ] Форматы: баннер, interstitial, rewarded video
- [ ] Логика показа рекламы для FREE пользователей

---

### Stage 11: Полировка и оптимизация

**Dependencies:** Stage 10 completion
**Timeline:** 1-2 недели

#### Sub-steps:

- [ ] Темная тема
- [ ] Локализация (en, ru)
- [ ] Оптимизация размера приложения
- [ ] Профилирование и устранение утечек памяти
- [ ] Анимации переходов
- [ ] Skeleton loading
- [ ] Offline режим (базовый)
- [ ] Кэширование с TanStack Query
- [ ] Подготовка к релизу (иконки, splash screens)

- [ ] Реализация темной темы
- [ ] Добавление локализации (en, ru)
- [ ] Настройка push-уведомлений
- [ ] Оптимизация размера приложения
- [ ] Профилирование и устранение утечек памяти
- [ ] Добавление анимаций переходов
- [ ] Реализация skeleton loading
- [ ] Обработка offline режима
- [ ] Кэширование данных с TanStack Query
- [ ] Web Capture функционал (in-app browser)
- [ ] Экспорт/импорт данных пользователя
- [ ] Подготовка к релизу (иконки, splash screens)

---

### Stage 12: Testing & QA

**Dependencies:** Stage 11 completion
**Timeline:** 1 неделя

#### Sub-steps:

- [ ] Unit тесты для критичной логики
- [ ] E2E тестирование основных flows (Detox)
- [ ] Тестирование на разных устройствах
- [ ] Performance testing
- [ ] Accessibility проверка
- [ ] Security аудит
- [ ] Исправление найденных багов

---

### Stage 13: Deployment & Launch

**Dependencies:** Stage 12 completion
**Timeline:** 1-2 недели

#### Sub-steps:

- [ ] Production builds
- [ ] CI/CD с EAS
- [ ] App Store listing (скриншоты, описание)
- [ ] Google Play listing
- [ ] Маркетинговые материалы
- [ ] Отправка на review
- [ ] Мониторинг (Sentry, Analytics)
- [ ] Soft launch
- [ ] Публичный релиз

---

## 💰 Unit Economics

### The New Black API Credits

| Пакет         | Credits | Цена    | $/credit |
| ------------- | ------- | ------- | -------- |
| Mini Pack     | 40      | $5.00   | $0.125   |
| Small Pack    | 100     | $10.00  | $0.10    |
| Medium Pack   | 200     | $19.00  | $0.095   |
| Big Pack      | 500     | $45.00  | $0.09    |
| Black Pack    | 1000    | $80.00  | $0.08    |

### Стоимость AI-операций (наша)

| Операция            | Токены | Себестоимость* | Наценка |
| ------------------- | ------ | -------------- | ------- |
| Virtual Try-On      | 1      | ~8₽            | 2-3x    |
| AI Fashion Model    | 1      | ~8₽            | 2-3x    |
| Clothing Variation  | 1      | ~8₽            | 2-3x    |
| Pixian (bg removal) | 0      | ~0.08₽         | включено|

*При Big Pack ($45/500 = $0.09 ≈ 8₽/credit)

### Токены — ценообразование

| Пакет       | Токены | Цена РФ  | Цена USD |
| ----------- | ------ | -------- | -------- |
| Mini        | 10     | 99₽      | $1.49    |
| Standard    | 30     | 249₽     | $3.49    |
| Pro         | 100    | 699₽     | $9.99    |
| Max         | 300    | 1799₽    | $24.99   |

### Себестоимость по тарифам

| Тариф      | Токенов/мес | Себестоимость | Чистая маржа |
| ---------- | ----------- | ------------- | ------------ |
| FREE       | 5           | ~40₽          | убыток       |
| PRO (399₽) | 50          | ~400₽         | ~0% (LTV!)   |
| MAX (799₽) | 150         | ~1200₽        | убыток*      |

*Модель предполагает, что пользователи не используют все токены + докупают

### Key Metrics Target

| Метрика             | Цель          |
| ------------------- | ------------- |
| Конверсия Free→Paid | 10%           |
| Churn               | 5%/мес        |
| LTV                 | ~5,000-6,000₽ |
| CAC                 | ~500₽         |
| LTV/CAC             | 10:1+         |

---

## Resource Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [Ruby on Rails Documentation](https://guides.rubyonrails.org/)
- [The New Black Fashion AI](https://thenewblack.ai/) — Virtual Try-On, Fashion Models, Variations
- [YooMoney API](https://yookassa.ru/developers)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Pixian.ai API](https://ru.pixian.ai/api)

## **Current Project Statistics (December 14, 2025)**

**Code Metrics:**

- Total Screens: 20 (added shopping/browser.tsx, shopping/cart.tsx)
- Total Components: 43+ (active)
  - 4 UI components (Button, Input, Loader, FAB)
  - 5 common components (ImageCropper, CropOverlay, ResizableCropOverlay, DismissKeyboardView, KeyboardAwareScrollView)
  - 7 wardrobe components
  - 14 outfit components
  - 10 shopping components (NEW - Stage 4.11)
  - 4 root/utility components
- Total Services: 6 (added storeService, webCaptureService)
- Total Stores: 6 (added shoppingBrowserStore, settingsStore)
- Total Type Definitions: 13 files (added store.ts)
- Categories: 8 (unified system)
- Default Stores: 9 (ZARA, H&M, ASOS, Nike, Adidas, Reserved, Mango, Pull&Bear, Bershka)

**Tech Stack Versions:**

- React Native: 0.81.4
- Expo SDK: 54.0.13
- React: 19.1.0
- TypeScript: 5.9.2
- Zustand: 5.0.3
- Supabase: 2.51.0
- TanStack Query: 5.71.0
- React Native Reanimated: 4.1.1
- React Native Gesture Handler: 2.28.0

**Implementation Status:**

- Stages 1-4.11: ✅ Completed (All core functionality + Shopping Browser)
- Stages 5-10: 🚧 Planned (AI, Community, Monetization)

**Key Completed Features:**

- ✅ Full authentication system
- ✅ Wardrobe management with ImageCropper
- ✅ 4-Tab outfit creator with SmoothCarousel
- ✅ Outfit collection and management
- ✅ Data persistence architecture
- ✅ Shopping Browser with auto-detection & cart (Stage 4.11)

**Recent Improvements (November-December 2025):**

1. **SmoothCarousel System** (Stage 4.7)
   - 5 obsolete components removed (31KB)
   - 33 documentation files archived
   - Realistic physics with deceleration: 0.985

2. **4-Tab System** (Stage 4.8)
   - Basic, Dress, All, Custom tabs
   - CustomTabManager with inline editing
   - AsyncStorage persistence
   - Dynamic height calculation

3. **ImageCropper Refactor** (Stage 4.9)
   - Focal-point anchored pinch-to-zoom
   - Elastic boundaries с spring animations
   - react-native-zoom-toolkit integration
   - Custom 3:4 crop overlay

4. **Data Persistence Fix** (Stage 4.10)
   - Fixed critical edit mode bug
   - Proper canvasSettings persistence
   - Backward compatibility для старых образов

5. **Shopping Browser & Web Capture** (Stage 4.11)
   - Multi-tab WebView browser (9 default stores)
   - Automatic image detection with JavaScript injection
   - Shopping cart with AsyncStorage persistence
   - Batch upload functionality
   - Manual crop fallback mode
   - 10 new shopping components
   - Full integration with add-item flow

**Dependencies Added:**

- `react-native-zoom-toolkit` - для ImageCropper
- `react-native-webview` - для Shopping Browser
- `react-native-view-shot` - для screenshot capture
- Custom utilities: `customTabStorage.ts`, `imageDetection.ts`, `webviewOptimization.ts`

## Important Notes

- Все версии библиотек проверены на совместимость (см. package.json)
- Приоритет на оффлайн-first архитектуру с локальным хранением
- Фокус на производительности при работе с большими коллекциями
- Обязательная типизация всего кода с TypeScript
- Следование принципам React Native best practices
- **SmoothCarousel** - единственная активная система каруселей (Stage 4.7)
- **4-Tab System** - актуальная архитектура создания образов (Stage 4.8)
- **ImageCropper** - нативный UX для обрезки изображений (Stage 4.9)
- **Data Persistence** - исправлена критическая проблема с edit mode (Stage 4.10)
- **Shopping Browser** - добавление вещей из интернет-магазинов (Stage 4.11)
- **Default Items** - 24 встроенные вещи для новых пользователей
- Документация синхронизирована с кодовой базой (December 14, 2025)
```
