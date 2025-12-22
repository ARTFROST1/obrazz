# Obrazz - Анализ Сетевой Архитектуры и Зависимостей

**Дата:** 20 декабря 2025  
**Версия:** 1.0  
**Статус:** Текущая архитектура (до offline-first)

---

## 1. Обзор Текущей Архитектуры

### 1.1 Общая схема

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           КЛИЕНТ (React Native + Expo)                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐   ┌─────────────────┐   ┌──────────────────────────┐   │
│  │   Screens   │ → │   Zustand       │ → │  Services Layer          │   │
│  │  (UI/UX)    │   │   Stores        │   │  (itemService, etc.)     │   │
│  └─────────────┘   └─────────────────┘   └──────────────────────────┘   │
│                           │                          │                   │
│                           ▼                          ▼                   │
│                   ┌─────────────────┐   ┌──────────────────────────┐   │
│                   │  AsyncStorage   │   │   Supabase Client        │   │
│                   │  (Persistence)  │   │   (lib/supabase/client)  │   │
│                   └─────────────────┘   └──────────────────────────┘   │
│                                                      │                   │
└──────────────────────────────────────────────────────│───────────────────┘
                                                       │
                                        ─────────── СЕТЬ ───────────
                                                       │
                                                       ▼
                               ┌──────────────────────────────────────┐
                               │            SUPABASE CLOUD            │
                               │  ┌────────────┐  ┌────────────────┐  │
                               │  │   Auth     │  │   PostgreSQL   │  │
                               │  │  (JWT)     │  │   (items,      │  │
                               │  │            │  │    outfits)    │  │
                               │  └────────────┘  └────────────────┘  │
                               │  ┌────────────┐  ┌────────────────┐  │
                               │  │  Storage   │  │   RLS Policies │  │
                               │  │  (images)  │  │   (security)   │  │
                               │  └────────────┘  └────────────────┘  │
                               └──────────────────────────────────────┘
```

### 1.2 Текущая зависимость от сети

**КРИТИЧЕСКАЯ ПРОБЛЕМА:** Приложение имеет **Online-First** архитектуру:

| Функция          | Зависимость от сети | Текущее поведение при отсутствии сети |
| ---------------- | ------------------- | ------------------------------------- |
| Авторизация      | 🔴 Полная           | Невозможно войти/выйти                |
| Загрузка вещей   | 🔴 Полная           | Пустой гардероб                       |
| Добавление вещи  | 🔴 Полная           | Ошибка, данные теряются               |
| Просмотр образов | 🔴 Полная           | Пустой список                         |
| Создание образа  | 🟡 Частичная        | Работает локально, но не сохраняется  |
| Настройки        | 🟢 Локально         | Работает полностью офлайн             |

---

## 2. Детальный Анализ Компонентов

### 2.1 Supabase Client (`lib/supabase/client.ts`)

```typescript
// Текущая конфигурация
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage, // AsyncStorage адаптер
    autoRefreshToken: true, // Автообновление токена
    persistSession: true, // Сессия сохраняется локально
    detectSessionInUrl: false, // Для мобильных
  },
});
```

**Особенности:**

- Supabase URL и Anon Key зашиты через environment variables
- Сессия персистится в AsyncStorage (работает офлайн для чтения)
- Клиент НЕ поддерживает очереди запросов для offline

### 2.2 Wardrobe Store (`store/wardrobe/wardrobeStore.ts`)

```typescript
export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],              // ← Хранится в AsyncStorage
      filter: defaultFilter,  // ← Хранится в AsyncStorage
      sortOptions: ...,       // ← Хранится в AsyncStorage
      // ...
    }),
    {
      name: 'wardrobe-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        items: state.items,
        filter: state.filter,
        sortOptions: state.sortOptions,
      }),
      skipHydration: true,    // ← SSR совместимость
    },
  ),
);
```

**Текущее поведение:**

- ✅ Данные персистятся в AsyncStorage
- ❌ При загрузке экрана ВСЕГДА делается запрос к Supabase
- ❌ Если нет сети → items=[] (даже если есть кешированные данные!)

### 2.3 Item Service (`services/wardrobe/itemService.ts`)

```typescript
async getUserItems(userId: string): Promise<WardrobeItem[]> {
  // ПРЯМОЙ запрос к Supabase - нет fallback на кеш
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data || []).map(this.mapSupabaseItemToWardrobeItem);
}
```

**Проблема:** Нет механизма cache-first или offline fallback.

### 2.4 Wardrobe Screen (`app/(tabs)/wardrobe.tsx`)

```typescript
const loadItems = useCallback(async () => {
  if (!user?.id) return;

  setLoading(true);
  // ⚠️ ВСЕГДА делает сетевой запрос
  const userItems = await itemService.getUserItems(user.id);
  setItems(userItems); // ← Перезаписывает кешированные данные
  setLoading(false);
}, [user?.id]);

useFocusEffect(
  useCallback(() => {
    // Загружает если items.length === 0
    // НО items=[] после перезапуска (hydration issue)
    if (items.length === 0 || !user?.id) {
      loadItems();
    }
  }, [loadItems, items.length, user?.id]),
);
```

**Проблема:** При фокусе всегда пытается загрузить с сервера.

---

## 3. Expo/Dev Server и VPN

### 3.1 Почему VPN ломает соединение

```
┌─────────────────┐         ┌───────────────────┐
│  Dev Machine    │ ← LAN → │  Physical Device  │
│  (Metro Server) │         │  (Expo Go)        │
│  192.168.1.10   │         │  192.168.1.20     │
└─────────────────┘         └───────────────────┘
         │                           │
         │        ╔═════════════════╧══════════════════╗
         │        ║  VPN ВКЛЮЧАЕТСЯ                    ║
         │        ║  - Меняется IP устройства          ║
         │        ║  - Трафик идет через VPN туннель   ║
         │        ║  - Локальная сеть недоступна       ║
         │        ╚════════════════════════════════════╝
         │                           │
         │                           ▼
         │                   192.168.1.20 → 10.8.0.X (VPN)
         │                           │
         │←──── ✗ Соединение разорвано ────✗
```

**Причина:**

1. Metro dev server привязан к локальному IP (192.168.x.x)
2. VPN создает новый сетевой интерфейс с другим IP
3. Устройство больше не может достучаться до Metro
4. Supabase тоже может быть недоступен через некоторые VPN

### 3.2 Что происходит при сборке APK

```
┌────────────────────────────────────────────────────────────────┐
│                        APK BUNDLE                              │
├────────────────────────────────────────────────────────────────┤
│  ✅ Весь JS код внутри APK (НЕ нужен Metro)                   │
│  ✅ Assets (изображения, шрифты) внутри APK                   │
│  ✅ Environment variables захардкожены при билде              │
│  ✅ Supabase URL/Key внутри бандла                            │
├────────────────────────────────────────────────────────────────┤
│  ⚠️ Но всё равно нужен интернет для:                          │
│     - Supabase Auth (авторизация)                             │
│     - Supabase DB (загрузка данных)                           │
│     - Supabase Storage (изображения с сервера)                │
└────────────────────────────────────────────────────────────────┘
```

**Ответ на вопрос:** После сборки в APK приложение НЕ зависит от dev сервера, но ЗАВИСИТ от Supabase для всех операций с данными.

---

## 4. Локальное vs Удаленное Хранение (Текущее)

### 4.1 Что хранится локально

| Данные                | Хранилище                    | Когда используется                               |
| --------------------- | ---------------------------- | ------------------------------------------------ |
| Auth Session          | AsyncStorage                 | При старте для проверки залогиненности           |
| Wardrobe Items (кеш)  | Zustand + AsyncStorage       | Персистится, но перезаписывается при loadItems() |
| Outfit Store State    | Zustand + AsyncStorage       | При создании образов                             |
| Settings (язык, тема) | Zustand + AsyncStorage       | Всегда локально                                  |
| Custom Tab Config     | AsyncStorage                 | При создании образов                             |
| Shopping Cart         | AsyncStorage                 | Полностью офлайн                                 |
| Изображения вещей     | FileSystem.documentDirectory | Локальные копии                                  |

### 4.2 Что требует сети

| Операция          | Сервис                         | Можно сделать offline?  |
| ----------------- | ------------------------------ | ----------------------- |
| Вход/Выход        | authService                    | ❌ Нет                  |
| Загрузка вещей    | itemService.getUserItems()     | ❌ Нет (должно быть ДА) |
| Добавление вещи   | itemService.createItem()       | ❌ Нет (нужна очередь)  |
| Удаление вещи     | itemService.deleteItem()       | ❌ Нет (нужна очередь)  |
| Загрузка образов  | outfitService.getUserOutfits() | ❌ Нет (должно быть ДА) |
| Сохранение образа | outfitService.createOutfit()   | ❌ Нет (нужна очередь)  |

---

## 5. Схема Базы Данных (Supabase)

### 5.1 Таблица `items`

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),    -- NULL для дефолтных
  name TEXT NOT NULL,
  category TEXT NOT NULL,                   -- headwear, tops, etc.
  color TEXT,
  colors JSONB DEFAULT '[]',
  primary_color JSONB,
  style TEXT[] DEFAULT '{}',
  season TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  image_url TEXT NOT NULL,                  -- Локальный путь!
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Важно:** `image_url` хранит ЛОКАЛЬНЫЙ путь к файлу (`file://...`), а не URL на сервере!

### 5.2 Таблица `outfits`

```sql
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  items JSONB DEFAULT '[]',              -- Массив OutfitItem
  background JSONB DEFAULT '{"type":"color","value":"#FFFFFF"}',
  canvas_settings JSONB,
  visibility TEXT DEFAULT 'private',
  styles TEXT[] DEFAULT '{}',
  seasons TEXT[] DEFAULT '{}',
  occasions TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  wear_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Проблемы Текущей Архитектуры

### 6.1 Критические

1. **❌ Нет offline-first подхода**
   - При отсутствии сети гардероб пустой
   - Пользователь теряет доступ к своим вещам

2. **❌ Sync strategy отсутствует**
   - Нет очереди для отложенных операций
   - Нет конфликт-резолюции

3. **❌ Нет индикатора состояния сети**
   - Пользователь не знает, онлайн он или нет

### 6.2 Средние

4. **⚠️ Rehydration не работает оптимально**
   - `skipHydration: true` → требует ручной `rehydrate()`
   - После rehydrate сразу идет запрос к серверу

5. **⚠️ Изображения хранятся локально, но метаданные - на сервере**
   - Рассинхрон если удалить файл локально

### 6.3 Незначительные

6. **ℹ️ Нет background sync**
   - Синхронизация только при активном использовании

---

## 7. Выводы и Рекомендации

### 7.1 Нужен ли отдельный Backend?

**НЕТ, прямо сейчас отдельный backend не нужен.**

Supabase покрывает:

- ✅ Аутентификация (Supabase Auth)
- ✅ База данных (PostgreSQL)
- ✅ Row Level Security (RLS)
- ✅ Real-time subscriptions (если понадобятся)
- ✅ Storage для изображений

Что планируется:

- 🔮 Rails Backend (API, админка, биллинг) - Stage 6
- 🔮 The New Black AI API (Virtual Try-On, Fashion Models, Variations) - Stage 5
- 🔮 Push notifications сервис
- 🔮 Payment processing (YooMoney/IAP) - Stage 7

### 7.2 Будет ли работать APK без dev сервера?

**ДА**, APK полностью автономен от Metro/dev server.

НО:

- Нужен интернет для Supabase и AI функций
- Offline-First архитектура реализована (Stage 4.12)

### 7.3 Рекомендуемое решение

Внедрена **Offline-First Architecture** со стратегией:

```
LOCAL FIRST → BACKGROUND SYNC → CONFLICT RESOLUTION
```

Подробный план реализации в `OFFLINE_FIRST_IMPLEMENTATION_PLAN.md`.

---

## 8. Глоссарий

| Термин                     | Описание                                         |
| -------------------------- | ------------------------------------------------ |
| **Online-First**           | Всегда сначала запрос к серверу                  |
| **Offline-First**          | Сначала локальные данные, потом синхронизация    |
| **Cache-First**            | Показать кеш, потом обновить с сервера           |
| **Stale-While-Revalidate** | Показать старые данные, обновить в фоне          |
| **Optimistic Update**      | Обновить UI сразу, откатить если сервер отклонил |
| **Sync Queue**             | Очередь операций для отложенной синхронизации    |

---

_Документ создан для понимания текущего состояния перед внедрением offline-first архитектуры._
