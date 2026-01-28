# 🚀 Параллельная разработка Obrazz - Roadmap для 2 разработчиков

> ⚠️ NOTE (2026-01-26): этот документ — исторический план (Jan 2025). Текущий scope и нумерация стадий изменились; Community/социальные фичи удалены из проекта. Актуальный статус и roadmap: `Docs/CURRENT_STATUS.md` и `Docs/Implementation.md`.

**Дата создания:** 13 января 2025  
**Текущий статус (на момент создания):** Stage 2 ✅ завершён, готовы к Stage 3  
**Цель:** Максимально эффективное распределение задач между двумя разработчиками

---

## 📊 Анализ зависимостей

### Критический путь (последовательные этапы)

```
Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5 → Stage 7 → Stage 9 → Stage 10
   ✅        ✅        🎯
```

### Возможности параллельной работы

```
Stage 3 (Wardrobe)
    ├─ Разработчик A: UI + Image handling
    └─ Разработчик B: Backend services + API integration

Stage 4 (Manual Creator) ──┐
                           ├─ Оба разработчика могут работать параллельно
Stage 6 (Removed: Community) ─┘   (исторически планировалось после Stage 4)

Stage 5 (AI) ──┐
               ├─ Можно делать параллельно
Stage 6 (Tokens/Monetization foundations) ─┘

Stage 8 (Polish) - можно начинать параллельно с Stage 5-7
```

---

## 👥 Распределение ролей

### Разработчик A (Frontend Focus)

**Специализация:** UI/UX, анимации, пользовательские взаимодействия

- Экраны и компоненты
- Gesture handling и canvas
- Анимации и transitions
- Form validation

### Разработчик B (Backend/Integration Focus)

**Специализация:** Backend, API, сервисы, data flow

- Supabase интеграция
- API endpoints
- State management
- Image processing services
- AI microservice

---

## 📅 Детальный Roadmap

## НЕДЕЛЯ 1: Stage 3 - Wardrobe Management (Параллельно)

### 🔵 Разработчик A (5-6 дней)

**День 1-2: Wardrobe Screen UI**

- [ ] Создать экран Wardrobe с сеткой (`app/(tabs)/wardrobe.tsx`)
- [ ] Компонент ItemCard (`components/wardrobe/ItemCard.tsx`)
- [ ] Компонент ItemGrid с FlashList (`components/wardrobe/ItemGrid.tsx`)
- [ ] FAB для добавления вещей
- [ ] Базовые анимации появления

**День 3-4: Add Item Screen**

- [ ] Экран добавления вещи (`app/(modals)/add-item.tsx`)
- [ ] Интеграция expo-camera
- [ ] Интеграция expo-image-picker
- [ ] Preview компонент для изображения
- [ ] Form для метаданных (категория, цвет, стиль, сезон)

**День 5-6: Filters & Item Detail**

- [ ] Компонент CategoryPicker (`components/wardrobe/CategoryPicker.tsx`)
- [ ] Компонент ColorPicker (`components/wardrobe/ColorPicker.tsx`)
- [ ] Фильтрация и сортировка UI
- [ ] Item Detail Screen (`app/item/[id].tsx`)
- [ ] Анимации переходов

**Sync Point 1:** После дня 2 - обсудить структуру данных items с Dev B

### 🟢 Разработчик B (5-6 дней)

**День 1-2: Item Service & Storage**

- [ ] Сервис управления вещами (`services/wardrobe/itemService.ts`)
- [ ] Настройка expo-file-system для локального хранения
- [ ] CRUD операции для items в Supabase
- [ ] Zustand store для wardrobe (`store/wardrobe/wardrobeStore.ts`)

**День 3-4: Background Removal Integration**

- [ ] Интеграция Pixian.ai API (`services/wardrobe/backgroundRemover.ts`)
- [ ] Image processor service (`services/wardrobe/imageProcessor.ts`)
- [ ] Обработка ошибок и fallback
- [ ] Кэширование обработанных изображений

**День 5-6: Query & Optimization**

- [ ] TanStack Query hooks для items
- [ ] Оптимизация загрузки для больших коллекций
- [ ] Pagination/infinite scroll logic
- [ ] Добавление встроенных базовых вещей для новых пользователей

**Sync Point 1:** После дня 2 - согласовать API контракт с Dev A

### 🔄 Sync Points для Stage 3

- **День 2:** Согласовать структуру Item types и API
- **День 4:** Интеграция UI + Backend services
- **День 6:** Комплексное тестирование, bug fixing

---

## НЕДЕЛЯ 2: Stage 4 - Manual Outfit Creator (Параллельно)

### 🔵 Разработчик A (7-8 дней)

**День 1-3: Canvas Engine**

- [ ] Canvas компонент с gesture handler (`components/outfit/Canvas.tsx`)
- [ ] Drag & drop для элементов
- [ ] Pinch to scale
- [ ] Rotation gestures
- [ ] Z-index management
- [ ] Transform controls (`components/outfit/TransformControls.tsx`)

**День 4-5: Category Carousels**

- [ ] Horizontal scroll carousels (`components/outfit/CategoryCarousel.tsx`)
- [ ] Item selection из каруселей
- [ ] Lock/unlock категорий
- [ ] Smooth animations

**День 6-7: Creator Screen**

- [ ] Экран Creator (`app/(tabs)/create.tsx`)
- [ ] Background picker (`components/outfit/BackgroundPicker.tsx`)
- [ ] Randomize функциональность
- [ ] Undo/Redo UI

**День 8: Polish & Animation**

- [ ] Анимации переходов между состояниями
- [ ] Visual feedback для действий
- [ ] Error states

### 🟢 Разработчик B (7-8 дней)

**День 1-3: Outfit Data Model & Service**

- [ ] Outfit types и модели (`types/models/outfit.ts`)
- [ ] Outfit service (`services/outfit/outfitService.ts`)
- [ ] Canvas manager service (`services/outfit/canvasManager.ts`)
- [ ] Serialization логика transforms

**День 4-5: Save/Load Logic**

- [ ] Сохранение outfit в Supabase
- [ ] Загрузка saved outfits
- [ ] Zustand store для outfit state (`store/outfit/outfitStore.ts`)
- [ ] Handle missing items

**День 6-7: Export & Share**

- [ ] Export outfit как изображение
- [ ] Canvas-to-image rendering
- [ ] Share functionality
- [ ] TanStack Query для outfits

**День 8: Optimization**

- [ ] Performance профилирование
- [ ] Memory optimization
- [ ] Caching стратегия

### 🔄 Sync Points для Stage 4

- **День 3:** Интеграция Canvas UI + Canvas Manager
- **День 5:** Тестирование save/load flow
- **День 7:** End-to-end тестирование полного flow

---

## НЕДЕЛЯ 3: Разделение путей (AI vs Tokens/UX)

### Вариант A: Stage 5 (AI) + Tokens/UX параллельно

### 🔵 Разработчик A → UX/Share/Shopping improvements (5-6 дней)

**День 1-2: Share/Export & UX**

- [ ] Export/share flow for outfits (share sheet, formats)
- [ ] Improve outfit thumbnails / previews
- [ ] Empty/loading states polishing

**День 3-4: Shopping / Web Capture**

- [ ] Shopping browser UX improvements
- [ ] Web Capture flow improvements (save/organize)
- [ ] Cart / captured items UX

**День 5-6: Tokens UI (optional) + Polish**

- [ ] Token balance UI stubs (read-only)
- [ ] Loading skeletons
- [ ] Pull to refresh where needed

### 🟢 Разработчик B → Stage 5: AI Generation (7-8 дней)

**День 1-3: Rails Backend Setup**

- [ ] Создать Rails API проект (`api-backend/`)
- [ ] JWT авторизация (валидация Supabase JWT; Devise/Doorkeeper опционально)
- [ ] API endpoints для AI-генерации
- [ ] Token balance система

**День 4-5: The New Black Integration**

- [ ] Интеграция с The New Black Virtual Try-On API
- [ ] Интеграция с Fashion Models API
- [ ] Сохранение результатов в Supabase Storage
- [ ] Response formatting

**День 6-7: Frontend Integration**

- [ ] AI Try-On UI (`app/(modals)/ai-tryon.tsx`)
- [ ] AI service на клиенте (`services/ai/aiService.ts`)
- [ ] Preview AI результатов
- [ ] Token balance management

**День 8: Polish**

- [ ] Error handling
- [ ] Loading states
- [ ] Token purchase flow

### 🔄 Sync Point для недели 3

- **День 4:** Обсудить общие компоненты (OutfitCard используется в обеих features)
- **День 7:** Cross-testing обеих features

---

## НЕДЕЛЯ 4: Stage 7 (Subscriptions) + Start Stage 8

### 🔵 Разработчик A → UI Polish (Stage 8 partial)

**День 1-3: Themes**

- [ ] Dark theme implementation
- [ ] Theme store (`store/ui/themeStore.ts`)
- [ ] Theme provider
- [ ] All screens адаптация

**День 4-5: Animations & Transitions**

- [ ] Skeleton loaders
- [ ] Page transitions
- [ ] Micro-animations
- [ ] Loading states

### 🟢 Разработчик B → Subscriptions (Stage 7)

**День 1-3: Payment Integration**

- [ ] RevenueCat setup
- [ ] Subscription service (`services/subscription/purchaseManager.ts`)
- [ ] Quota manager (`services/subscription/quotaManager.ts`)
- [ ] App Store Connect / Google Play setup

**День 4-5: Subscription UI**

- [ ] Subscription screen (`app/(modals)/subscription.tsx`)
- [ ] Paywall components
- [ ] Restore purchases
- [ ] Subscription status check

**День 6: Alternative Payments (РФ)**

- [ ] YooKassa integration (если требуется)
- [ ] Альтернативный payment flow

### Параллельно оба: Localization (Stage 8)

- [ ] i18n setup
- [ ] English translations
- [ ] Russian translations
- [ ] Language switcher

---

## НЕДЕЛЯ 5: Stage 8 - Polish & Optimization (Параллельно)

### 🔵 Разработчик A

**UX Improvements**

- [ ] Push notifications setup
- [ ] Onboarding polish
- [ ] Web Capture feature
- [ ] Export/Import данных

### 🟢 Разработчик B

**Performance & Backend**

- [ ] Offline mode handling
- [ ] TanStack Query caching стратегия
- [ ] Bundle size optimization
- [ ] Memory leak fixes
- [ ] Performance profiling

### Оба вместе

- [ ] Icons & splash screens
- [ ] App store assets
- [ ] Final UI polish

---

## НЕДЕЛЯ 6: Stage 9 - Testing & QA (Вместе)

### Оба разработчика работают совместно:

**День 1-2: Unit Tests**

- [ ] Critical services tests
- [ ] Component tests
- [ ] Utility functions tests

**День 3-4: E2E Tests**

- [ ] Detox setup
- [ ] Main user flows
- [ ] Edge cases

**День 5-6: QA & Bug Fixing**

- [ ] Device testing
- [ ] Performance testing
- [ ] Accessibility check
- [ ] Bug fixing sprint

**День 7: Security Audit**

- [ ] Code review
- [ ] Security checklist
- [ ] Dependencies audit

---

## НЕДЕЛЯ 7: Stage 10 - Deployment (Вместе)

### Совместная работа:

**День 1-2: Build & CI/CD**

- [ ] EAS setup
- [ ] Production builds
- [ ] CI/CD pipeline

**День 3-4: Store Submissions**

- [ ] App Store listing
- [ ] Google Play listing
- [ ] Marketing materials
- [ ] Screenshots & videos

**День 5: Monitoring**

- [ ] Sentry setup
- [ ] Analytics setup
- [ ] Support documentation

**День 6-7: Soft Launch & Final**

- [ ] Soft launch
- [ ] Feedback collection
- [ ] Final fixes
- [ ] Public release 🎉

---

## 🎯 Критические Sync Points

### Ежедневные Sync-ups (15 мин)

- Утром: План на день
- Вечером: Результаты, блокеры

### Weekly Planning (1 час)

- Понедельник: Планирование недели
- Пятница: Ретроспектива, демо

### Code Review Process

- Pull Requests должны быть review через 4 часа
- Обязательный review перед merge в main
- Автоматические checks (ESLint, TypeScript, tests)

---

## 📋 Общие Правила Параллельной Работы

### Branch Strategy

```
main (production-ready)
  ├─ dev (integration branch)
      ├─ feature/dev-a/wardrobe-ui
      ├─ feature/dev-b/wardrobe-backend
      ├─ feature/dev-a/canvas-engine
      └─ feature/dev-b/ai-service
```

### Merge Protocol

1. Feature branch → dev (через PR)
2. Code review обязателен
3. Tests должны проходить
4. Conflicts разрешаются совместно

### Communication Channels

- **Sync Points:** Zoom/Meet
- **Async:** Slack/Telegram
- **Code:** GitHub Comments
- **Docs:** Notion/Confluence

### Shared Resources

- **Design System:** `components/ui/` (обоим читать, изменения согласовывать)
- **Types:** `types/` (согласовывать изменения)
- **Services:** четкое разделение ответственности
- **Stores:** каждый свой store, но shared types

---

## ⚠️ Потенциальные Конфликты и Решения

### Конфликт 1: Изменения в shared types

**Решение:**

- Создать `TYPES_CHANGELOG.md`
- Уведомлять в Slack о breaking changes
- Review обязателен

### Конфликт 2: UI Component changes

**Решение:**

- Dev A владеет `components/ui/`
- Dev B создает feature-specific компоненты
- Изменения в UI согласовываются

### Конфликт 3: Database schema changes

**Решение:**

- Dev B владеет schema
- Создавать migration файлы с timestamps
- Документировать в `Bug_tracking.md`

### Конфликт 4: Merge conflicts

**Решение:**

- Frequent merges from dev
- Sync перед началом работы
- Pairing sessions для сложных конфликтов

---

## 📊 Progress Tracking

### Инструменты

- **GitHub Projects:** Kanban board
- **Daily Updates:** `STATUS.md`
- **Blockers:** Track в Slack + GitHub Issues

### Metrics

- **Velocity:** Story points per week
- **Bug Rate:** Bugs found / features completed
- **Code Review Time:** Target < 4 hours
- **Build Success Rate:** Target > 95%

---

## 🎓 Рекомендации для эффективной работы

### Для обоих разработчиков:

1. **Morning Sync:** 5 мин в начале дня
2. **Clear Commits:** Descriptive commit messages
3. **Document Decisions:** В соответствующих .md файлах
4. **Test Locally:** Перед push
5. **Ask Early:** Не застревать >30 мин на проблеме

### Best Practices:

- **Single Responsibility:** Один PR = одна feature
- **Small PRs:** < 500 lines изменений
- **Documentation:** Update docs в том же PR
- **Tests:** Добавлять тесты для критичной логики

---

## 🚀 Success Criteria

### Weekly Goals

- **Week 1:** Stage 3 complete ✅
- **Week 2:** Stage 4 complete ✅
- **Week 3:** Stage 5 + 6 complete ✅
- **Week 4:** Stage 7 + partial 8 ✅
- **Week 5:** Stage 8 complete ✅
- **Week 6:** Stage 9 complete ✅
- **Week 7:** Released to stores 🎉

### Quality Gates

- Zero critical bugs
- All tests passing
- Code coverage > 70%
- Performance benchmarks met
- Accessibility checklist complete

---

## 📞 Emergency Protocol

### Blocker Escalation

1. **Level 1:** Попытка решить самостоятельно (30 мин)
2. **Level 2:** Обсуждение с партнером (15 мин sync)
3. **Level 3:** Review документации
4. **Level 4:** External help (Stack Overflow, GitHub issues)

### Critical Issues

- Production down: Немедленный call
- Security vulnerability: Immediate fix
- Data loss risk: Stop and assess

---

**Этот roadmap обеспечивает:**

- ✅ Минимум блокирующих зависимостей
- ✅ Максимальную параллельную работу
- ✅ Четкие sync points
- ✅ Managed merge conflicts
- ✅ Continuous progress tracking
- ✅ Clear ownership и responsibilities

**Успешной разработки! 🚀**
