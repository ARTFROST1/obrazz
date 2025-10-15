# Implementation Plan for Obrazz

## Feature Analysis

### Identified Features:

1. **Управление гардеробом** - добавление/редактирование вещей с автоудалением фона
2. **Создание образов вручную** - конструктор с drag&drop и scroll-каруселями
3. **AI-подборка образа** - автоматическая генерация луков
4. **Community Feed** - социальная лента с образами пользователей
5. **Профиль пользователя** - регистрация через email и управление аккаунтом
6. **Хранение данных** - гибридная система с локальным хранением изображений
7. **Подписка и монетизация** - freemium модель с ограничениями
8. **Настройки** - темы, локализация, уведомления
9. **Web Capture** - захват изображений с веб-сайтов
10. **Онбординг** - первичное знакомство с приложением

### Feature Categorization:

- **Must-Have Features:**
  - Email регистрация/авторизация
  - Добавление вещей в гардероб
  - Ручное создание образов
  - Сохранение образов
  - Просмотр гардероба
  - Базовая AI-подборка
- **Should-Have Features:**
  - Community feed
  - Удаление фона с изображений
  - Подписка и монетизация
  - Профиль пользователя
  - Онбординг
- **Nice-to-Have Features:**
  - Web capture
  - Расширенные настройки
  - Социальные функции (лайки, шеринг)
  - Множественные темы и языки

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

- **AI Services:** OpenAI API / Custom NestJS microservice - Генерация образов
- **Documentation:** [https://platform.openai.com/docs](https://platform.openai.com/docs)

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
- [ ] Добавление встроенных базовых вещей для новых пользователей (опционально)

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

### Stage 4.7: 3-Mode Category Display System ✅

**Dependencies:** Stage 4.6 completion
**Timeline:** 2-3 дня
**Status:** COMPLETED

**Purpose:** Переработка системы отображения категорий с 3 режимами фильтрации и автоматическим масштабированием

**Documentation:** `Docs/Extra/THREE_MODE_DISPLAY_SYSTEM.md`

#### Проблемы предыдущей версии:

- ViewMode менял только размер элементов
- Все 7 категорий всегда отображались
- Требовалась прокрутка для просмотра всех категорий
- Фиксированные размеры не оптимально использовали пространство

#### Новое решение:

**3 режима отображения категорий:**

1. **All (Все)** - 7 категорий (все)
2. **Main (Основные)** - 4 категории: outerwear, tops, bottoms, footwear
3. **Extra (Дополнительные)** - 3 категории: headwear, accessories, bags

**Ключевые особенности:**

- Динамическое вычисление размеров элементов
- Все категории режима помещаются без прокрутки
- Синхронизация выбора между режимами
- Автоматическое масштабирование под доступное пространство

#### Sub-steps:

- [x] Создание новых типов для DisplayMode
  - [x] CategoryDisplayMode = 'all' | 'main' | 'extra'
  - [x] CATEGORY_GROUPS константы для группировки

- [x] Реализация динамического расчёта размеров
  - [x] calculateItemDimensions функция
  - [x] Учет доступной высоты экрана
  - [x] Соотношение сторон 3:4 (width:height)
  - [x] Min/max ограничения размеров

- [x] Обновление CategoryCarouselCentered
  - [x] Замена viewMode на itemWidth/height/spacing props
  - [x] Удаление VIEW_MODE_SIZES константы
  - [x] Поддержка динамических размеров

- [x] Обновление CategorySelectorList
  - [x] Фильтрация категорий по displayMode
  - [x] useMemo для оптимизации
  - [x] Передача вычисленных размеров в карусели
  - [x] Фиксированная высота контейнера без scroll

- [x] Обновление ItemSelectionStep
  - [x] Новый UI для переключения режимов
  - [x] 3 кнопки с иконками и подписями
  - [x] All (apps), Main (shirt), Extra (diamond)
  - [x] Активное состояние с инверсией цвета

- [x] Синхронизация состояния
  - [x] Единый selectedItemsForCreation Record
  - [x] Выбор сохраняется при переключении режимов
  - [x] Независимая работа всех режимов

- [x] Обновление документации
  - [x] CENTERED_CAROUSEL_DESIGN.md - описание 3-mode системы
  - [x] THREE_MODE_DISPLAY_SYSTEM.md - полная техническая документация
  - [x] Implementation.md - добавление Stage 4.7

- [x] Тестирование
  - [x] Переключение между режимами
  - [x] Проверка автомасштабирования
  - [x] Синхронизация выбора
  - [x] Отсутствие прокрутки в каждом режиме

### Stage 5: AI Outfit Generation

**Dependencies:** Stage 4 completion
**Timeline:** 1-2 недели

#### Sub-steps:

- [ ] Создание NestJS микросервиса для AI логики
- [ ] Настройка API endpoints для генерации образов
- [ ] Реализация алгоритма подбора по цветовой гармонии
- [ ] Реализация алгоритма подбора по стилю
- [ ] Создание UI для выбора параметров генерации (стиль, сезон)
- [ ] Интеграция с OpenAI API (опционально)
- [ ] Визуализация результатов генерации (3 варианта)
- [ ] Сохранение сгенерированных образов
- [ ] Реализация квот и ограничений для free-tier
- [ ] Добавление пояснений к выбору AI

### Stage 6: Community & Social Features

**Dependencies:** Stage 4 completion
**Timeline:** 1 неделя

#### Sub-steps:

- [ ] Создание главного экрана с лентой
- [ ] Реализация карточек постов с образами
- [ ] Функционал лайков/реакций
- [ ] Возможность поделиться своим образом
- [ ] Копирование чужого образа в свою коллекцию
- [ ] Реализация бесконечной прокрутки ленты
- [ ] Фильтрация контента (все/тренды)
- [ ] Оптимизация загрузки изображений в ленте

### Stage 7: Subscription & Monetization

**Dependencies:** Stage 5 completion
**Timeline:** 1 неделя

#### Sub-steps:

- [ ] Интеграция React Native Purchases (RevenueCat)
- [ ] Создание экрана управления подпиской
- [ ] Настройка продуктов в App Store Connect
- [ ] Настройка продуктов в Google Play Console
- [ ] Реализация проверки статуса подписки
- [ ] Блокировка функций для free-tier
- [ ] Восстановление покупок
- [ ] Альтернативные методы оплаты для РФ (YooKassa)
- [ ] Обработка истечения подписки

### Stage 8: Polish & Optimization

**Dependencies:** Stage 7 completion
**Timeline:** 1-2 недели

#### Sub-steps:

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

### Stage 9: Testing & QA

**Dependencies:** Stage 8 completion
**Timeline:** 1 неделя

#### Sub-steps:

- [ ] Написание unit тестов для критичной логики
- [ ] E2E тестирование основных user flows (Detox)
- [ ] Тестирование на разных устройствах
- [ ] Performance testing с большими датасетами
- [ ] Проверка accessibility
- [ ] Security аудит
- [ ] Исправление найденных багов
- [ ] Финальная проверка всех функций

### Stage 10: Deployment & Launch

**Dependencies:** Stage 9 completion
**Timeline:** 1 неделя

#### Sub-steps:

- [ ] Подготовка production builds
- [ ] Настройка CI/CD с EAS
- [ ] Создание списков для App Store
- [ ] Создание списков для Google Play
- [ ] Подготовка маркетинговых материалов
- [ ] Отправка на review
- [ ] Настройка мониторинга (Sentry, Analytics)
- [ ] Подготовка документации для поддержки
- [ ] Soft launch и сбор обратной связи
- [ ] Публичный релиз

## Resource Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Pixian.ai API Documentation](https://ru.pixian.ai/api)

## Important Notes

- Все версии библиотек уже проверены на совместимость в TechStack.md
- Приоритет на оффлайн-first архитектуру с локальным хранением
- Фокус на производительности при работе с большими коллекциями
- Обязательная типизация всего кода с TypeScript
- Следование принципам React Native best practices
