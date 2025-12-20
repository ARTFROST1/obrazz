# Obrazz - План Внедрения Offline-First Архитектуры

**Дата:** 20 декабря 2025  
**Версия:** 2.0  
**Статус:** ✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО  
**Этап проекта:** Stage 4.12 - Offline First (COMPLETED)

---

## ⚠️ ВАЖНО: ПЛАН ВЫПОЛНЕН

Данный документ содержит исходный план внедрения offline-first архитектуры.
**ВСЕ ОСНОВНЫЕ ЦЕЛИ ДОСТИГНУТЫ** по состоянию на 20 декабря 2025.

**Что реализовано:**

✅ Мгновенная загрузка данных из кеша
✅ Работа без интернета (все CRUD операции)
✅ Фоновая синхронизация с сервером
✅ Очередь операций для offline режима
✅ Optimistic UI для всех операций
✅ Cache-first стратегия для detail screens

**Реализованные сервисы:**

- ✅ `services/wardrobe/itemServiceOffline.ts` - полный offline-first для вещей
- ✅ `services/outfit/outfitServiceOffline.ts` - полный offline-first для образов
- ✅ Обновлены все экраны для использования offline сервисов
- ✅ Исправлены все TypeScript ошибки

**Что НЕ реализовано из плана:**

- ❌ UI индикаторы синхронизации (SyncStatusIndicator) - не критично, может быть добавлено позже
- ❌ Offline Banner - не критично, работает и без него

---

## 1. Цели и Задачи

### 1.1 Основные цели ✅

1. ✅ **Мгновенная загрузка** - Гардероб отображается сразу из кеша
2. ✅ **Работа без интернета** - Просмотр вещей и образов офлайн
3. ✅ **Фоновая синхронизация** - Данные обновляются когда есть сеть
4. ✅ **Очередь операций** - Изменения применяются при восстановлении связи
5. ⚠️ **Индикация статуса** - Пользователь видит состояние синхронизации (UI компоненты не добавлены, но функционал работает)

### 1.2 Ограничения

- ❌ Offline авторизация (невозможно без backend)
- ❌ AI функции офлайн (требуют внешних API)
- ❌ Добавление новых изображений с сервера офлайн
- ⚠️ Конфликты при одновременном редактировании (edge case)

---

## 2. Архитектура Решения

### 2.1 Новая схема данных

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           КЛИЕНТ (React Native)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌───────────────────┐    ┌────────────────────┐    │
│  │   Screens    │ →  │   Zustand Stores  │ ←  │  Sync Engine       │    │
│  │  (wardrobe,  │    │  (offline-first)  │    │  (new)             │    │
│  │   outfits)   │    └───────────────────┘    └────────────────────┘    │
│  └──────────────┘              │                        │               │
│                                │                        │               │
│                                ▼                        ▼               │
│                   ┌───────────────────┐    ┌────────────────────┐       │
│                   │   AsyncStorage    │    │  Network Monitor   │       │
│                   │   (Primary DB)    │    │  (NetInfo)         │       │
│                   └───────────────────┘    └────────────────────┘       │
│                                                      │                   │
│                   ┌───────────────────┐              │                   │
│                   │   Sync Queue      │◄─────────────┘                   │
│                   │   (Pending Ops)   │                                  │
│                   └───────────────────┘                                  │
│                            │                                             │
└────────────────────────────│─────────────────────────────────────────────┘
                             │
                   ────── СЕТЬ (когда доступна) ──────
                             │
                             ▼
                  ┌──────────────────────┐
                  │     SUPABASE         │
                  │  (Source of Truth)   │
                  └──────────────────────┘
```

### 2.2 Принципы работы

| Режим                   | Поведение                                                      |
| ----------------------- | -------------------------------------------------------------- |
| **Онлайн**              | Показать локальные → синхронизировать с сервером → обновить UI |
| **Офлайн**              | Показать локальные → добавить операции в очередь               |
| **Восстановление сети** | Обработать очередь → разрешить конфликты → обновить локальные  |

---

## 3. Пошаговый План Реализации

### Фаза 1: Инфраструктура (2-3 часа)

#### Шаг 1.1: Установка зависимостей

```bash
npx expo install @react-native-community/netinfo
```

#### Шаг 1.2: Создание Network Monitor (`services/sync/networkMonitor.ts`)

```typescript
// Функционал:
// - Отслеживание состояния сети
// - События online/offline
// - Хук useNetworkStatus()
```

#### Шаг 1.3: Создание Sync Queue (`services/sync/syncQueue.ts`)

```typescript
// Функционал:
// - Добавление операций в очередь
// - Персистентность очереди в AsyncStorage
// - Обработка очереди при online
// - Retry логика с exponential backoff
```

#### Шаг 1.4: Создание Sync Service (`services/sync/syncService.ts`)

```typescript
// Функционал:
// - Координация синхронизации
// - Разрешение конфликтов (last-write-wins)
// - Логирование синхронизации
```

---

### Фаза 2: Wardrobe Offline (3-4 часа)

#### Шаг 2.1: Модификация `wardrobeStore.ts`

**Изменения:**

1. Добавить `syncStatus: 'synced' | 'pending' | 'error'`
2. Добавить `lastSyncedAt: Date | null`
3. Убрать `skipHydration: true`
4. Добавить action `syncWithServer()`

```typescript
interface WardrobeState {
  // ... existing
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt: Date | null;
  pendingChanges: PendingChange[];

  // New actions
  syncWithServer: () => Promise<void>;
  addPendingChange: (change: PendingChange) => void;
  clearPendingChanges: () => void;
}
```

#### Шаг 2.2: Создание `itemServiceOffline.ts`

```typescript
class ItemServiceOffline {
  // Offline-first методы
  async getUserItems(userId: string): Promise<WardrobeItem[]> {
    // 1. Вернуть из store (мгновенно)
    // 2. Если online - fetch и merge
    // 3. Если offline - вернуть только локальные
  }

  async createItem(input: CreateItemInput): Promise<WardrobeItem> {
    // 1. Создать локально с tempId
    // 2. Добавить в очередь синхронизации
    // 3. Если online - синхронизировать сразу
  }

  async deleteItem(itemId: string): Promise<void> {
    // 1. Удалить локально (soft delete)
    // 2. Добавить в очередь синхронизации
  }
}
```

#### Шаг 2.3: Модификация `wardrobe.tsx`

```typescript
// БЫЛО:
const loadItems = async () => {
  const userItems = await itemService.getUserItems(user.id);
  setItems(userItems);
};

// СТАЛО:
const loadItems = async () => {
  // 1. Показать кешированные (уже в store через hydration)
  // 2. Запустить фоновую синхронизацию
  if (isOnline) {
    syncWithServer();
  }
};
```

---

### Фаза 3: Outfits Offline (2-3 часа)

#### Шаг 3.1: Модификация `outfitStore.ts`

Аналогично wardrobeStore - добавить sync state и pending changes.

#### Шаг 3.2: Создание `outfitServiceOffline.ts`

Аналогично itemServiceOffline.

#### Шаг 3.3: Модификация экранов outfits

- `outfits.tsx` - показ локальных образов
- `outfit/[id].tsx` - работа с офлайн данными
- `outfit/create.tsx` - сохранение локально + очередь

---

### Фаза 4: UI Индикация (1-2 часа)

#### Шаг 4.1: Компонент `SyncStatusIndicator.tsx`

```tsx
// Показывает:
// - 🟢 Синхронизировано
// - 🟡 Ожидание синхронизации (X изменений)
// - 🔴 Ошибка синхронизации
// - ⚪ Офлайн режим
```

#### Шаг 4.2: Интеграция в Header/Footer

```tsx
// В _layout.tsx или tabs/_layout.tsx
<SyncStatusIndicator />
```

#### Шаг 4.3: Offline Banner

```tsx
// Показывается когда offline
<OfflineBanner message="Вы работаете офлайн. Изменения будут синхронизированы..." />
```

---

### Фаза 5: Тестирование и Полировка (2-3 часа)

#### Шаг 5.1: Тестовые сценарии

| #   | Сценарий                  | Ожидаемый результат                  |
| --- | ------------------------- | ------------------------------------ |
| 1   | Запуск офлайн             | Показать кешированные вещи           |
| 2   | Добавление вещи офлайн    | Сохранить локально, показать pending |
| 3   | Переход online            | Синхронизировать, показать synced    |
| 4   | Удаление офлайн → online  | Удалить на сервере                   |
| 5   | Конфликт (редактирование) | Last-write-wins                      |
| 6   | VPN включение             | Продолжить работу офлайн             |

#### Шаг 5.2: Edge cases

- Очередь переполнена (limit 100 операций)
- Timeout при синхронизации
- Частичная синхронизация (некоторые failed)
- Logout в офлайн режиме

---

## 4. Структура Новых Файлов

```
services/
├── sync/
│   ├── index.ts                  # Экспорты
│   ├── networkMonitor.ts         # Отслеживание сети
│   ├── syncQueue.ts              # Очередь операций
│   ├── syncService.ts            # Координатор синхронизации
│   ├── conflictResolver.ts       # Разрешение конфликтов
│   └── types.ts                  # Типы для синхронизации
├── wardrobe/
│   ├── itemService.ts            # Оставить как есть (legacy)
│   └── itemServiceOffline.ts     # NEW: Offline-first сервис
└── outfit/
    ├── outfitService.ts          # Оставить как есть (legacy)
    └── outfitServiceOffline.ts   # NEW: Offline-first сервис

components/
├── sync/
│   ├── SyncStatusIndicator.tsx   # Индикатор статуса
│   └── OfflineBanner.tsx         # Баннер офлайн режима

hooks/
├── useNetworkStatus.ts           # Хук для состояния сети
└── useSyncStatus.ts              # Хук для статуса синхронизации
```

---

## 5. Типы и Интерфейсы

### 5.1 Sync Types (`services/sync/types.ts`)

```typescript
// Состояние сети
export interface NetworkStatus {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  isInternetReachable: boolean | null;
}

// Операция в очереди
export interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'item' | 'outfit';
  payload: unknown;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

// Статус синхронизации
export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  lastSyncedAt: Date | null;
  pendingCount: number;
  error?: string;
}

// Конфликт
export interface SyncConflict {
  entityType: 'item' | 'outfit';
  entityId: string;
  localVersion: unknown;
  serverVersion: unknown;
  resolution: 'local' | 'server' | 'merge';
}
```

---

## 6. Примеры Кода

### 6.1 Network Monitor

```typescript
// services/sync/networkMonitor.ts
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkStore {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;

  setNetworkState: (state: NetInfoState) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isConnected: true,
  isInternetReachable: null,
  type: 'unknown',

  setNetworkState: (state) =>
    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    }),
}));

// Инициализация слушателя
export const initNetworkMonitor = () => {
  return NetInfo.addEventListener((state) => {
    useNetworkStore.getState().setNetworkState(state);

    // Trigger sync when back online
    if (state.isConnected && state.isInternetReachable) {
      syncService.processQueue();
    }
  });
};
```

### 6.2 Sync Queue

```typescript
// services/sync/syncQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PendingOperation } from './types';

const QUEUE_KEY = '@sync_queue';

export class SyncQueue {
  private queue: PendingOperation[] = [];

  async load(): Promise<void> {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    this.queue = stored ? JSON.parse(stored) : [];
  }

  async add(
    operation: Omit<PendingOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>,
  ): Promise<void> {
    const op: PendingOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(op);
    await this.persist();
  }

  async process(): Promise<void> {
    const pending = this.queue.filter((op) => op.status === 'pending');

    for (const op of pending) {
      try {
        op.status = 'processing';
        await this.executeOperation(op);
        this.queue = this.queue.filter((o) => o.id !== op.id);
      } catch (error) {
        op.status = 'failed';
        op.retryCount++;
        op.error = error instanceof Error ? error.message : 'Unknown error';

        if (op.retryCount >= 3) {
          // Move to dead letter queue or notify user
        }
      }
    }

    await this.persist();
  }

  private async executeOperation(op: PendingOperation): Promise<void> {
    // Delegate to appropriate service based on entity type
    switch (op.entity) {
      case 'item':
        await itemSyncHandler.execute(op);
        break;
      case 'outfit':
        await outfitSyncHandler.execute(op);
        break;
    }
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
  }
}
```

### 6.3 Offline Item Service

```typescript
// services/wardrobe/itemServiceOffline.ts
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { useNetworkStore } from '@services/sync/networkMonitor';
import { syncQueue } from '@services/sync/syncQueue';
import { itemService } from './itemService';

class ItemServiceOffline {
  async getUserItems(userId: string): Promise<WardrobeItem[]> {
    const store = useWardrobeStore.getState();
    const network = useNetworkStore.getState();

    // Always return cached first
    const cachedItems = store.items;

    // If online, sync in background
    if (network.isConnected && network.isInternetReachable) {
      this.syncInBackground(userId, cachedItems);
    }

    return cachedItems;
  }

  private async syncInBackground(userId: string, localItems: WardrobeItem[]): Promise<void> {
    try {
      const serverItems = await itemService.getUserItems(userId);
      const merged = this.mergeItems(localItems, serverItems);
      useWardrobeStore.getState().setItems(merged);
      useWardrobeStore.getState().setSyncStatus('synced');
    } catch (error) {
      console.log('[ItemServiceOffline] Background sync failed:', error);
    }
  }

  async createItem(input: CreateItemInput): Promise<WardrobeItem> {
    const network = useNetworkStore.getState();

    // Create local item with temp ID
    const tempId = `temp_${Date.now()}`;
    const localItem: WardrobeItem = {
      ...this.inputToItem(input),
      id: tempId,
      syncStatus: 'pending',
    };

    // Add to store immediately
    useWardrobeStore.getState().addItem(localItem);

    if (network.isConnected) {
      // Try to sync immediately
      try {
        const serverItem = await itemService.createItem(input);
        useWardrobeStore.getState().updateItem(tempId, {
          ...serverItem,
          syncStatus: 'synced',
        });
        return serverItem;
      } catch (error) {
        // Add to queue for later
        await syncQueue.add({
          type: 'CREATE',
          entity: 'item',
          payload: input,
        });
      }
    } else {
      // Add to queue
      await syncQueue.add({
        type: 'CREATE',
        entity: 'item',
        payload: input,
      });
    }

    return localItem;
  }
}

export const itemServiceOffline = new ItemServiceOffline();
```

---

## 7. Миграция Существующего Кода

### 7.1 Файлы для изменения

| Файл                              | Изменения                                 |
| --------------------------------- | ----------------------------------------- |
| `store/wardrobe/wardrobeStore.ts` | Добавить sync state, убрать skipHydration |
| `store/outfit/outfitStore.ts`     | Добавить sync state                       |
| `app/(tabs)/wardrobe.tsx`         | Использовать itemServiceOffline           |
| `app/(tabs)/outfits.tsx`          | Использовать outfitServiceOffline         |
| `app/_layout.tsx`                 | Инициализировать networkMonitor           |
| `app/add-item.tsx`                | Использовать itemServiceOffline           |
| `app/outfit/create.tsx`           | Использовать outfitServiceOffline         |

### 7.2 Обратная совместимость

- Старые сервисы (`itemService`, `outfitService`) остаются
- Новые offline сервисы используют старые как fallback
- Постепенная миграция экран за экраном

---

## 8. Метрики Успеха

| Метрика                       | До       | После   |
| ----------------------------- | -------- | ------- |
| Время загрузки гардероба      | ~2-3 сек | < 100ms |
| Работа офлайн                 | ❌       | ✅      |
| Потеря данных при обрыве сети | Возможна | Нет     |
| Индикация состояния           | Нет      | Есть    |

---

## 9. Риски и Митигация

| Риск                 | Вероятность | Митигация                           |
| -------------------- | ----------- | ----------------------------------- |
| Конфликты данных     | Средняя     | Last-write-wins + timestamp         |
| Переполнение очереди | Низкая      | Лимит 100 операций, уведомление     |
| Corrupted cache      | Низкая      | Валидация при load, clear на ошибку |
| Memory issues        | Низкая      | Pagination для больших списков      |

---

## 10. Timeline

| Фаза                     | Срок     | Зависимости |
| ------------------------ | -------- | ----------- |
| Фаза 1: Инфраструктура   | День 1   | -           |
| Фаза 2: Wardrobe Offline | День 1-2 | Фаза 1      |
| Фаза 3: Outfits Offline  | День 2   | Фаза 1      |
| Фаза 4: UI Индикация     | День 2-3 | Фазы 2, 3   |
| Фаза 5: Тестирование     | День 3   | Все фазы    |

**Общий срок:** 3 дня разработки

---

_План готов к реализации. Начинаем с Фазы 1._
