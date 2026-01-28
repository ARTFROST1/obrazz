# 📦 Curated Collections (Подборки) — Полный план реализации

> **Дата создания:** 22 декабря 2025  
> **Статус:** Планирование  
> **Приоритет:** High  
> **Автор:** AI Assistant  
> **Estimated Timeline:** 2-3 недели

---

## 📋 Оглавление

1. [Обзор функционала](#1-обзор-функционала)
2. [Архитектура системы](#2-архитектура-системы)
3. [Модель данных](#3-модель-данных)
4. [Backend (Supabase)](#4-backend-supabase)
5. [Админ-панель](#5-админ-панель)
6. [Frontend (React Native)](#6-frontend-react-native)
7. [Пошаговый план реализации](#7-пошаговый-план-реализации)
8. [API Reference](#8-api-reference)
9. [UI/UX спецификации](#9-uiux-спецификации)

---

## 1. Обзор функционала

### 1.1 Что такое подборки?

**Подборки (Curated Collections)** — это курируемые администратором списки товаров из различных интернет-магазинов, сгруппированные по тематикам (стили, события, сезоны, бренды и т.д.).

### 1.2 Ключевые особенности

| Функция                       | Описание                                                      |
| ----------------------------- | ------------------------------------------------------------- |
| **Карусель подборок**         | Плитки на главной странице вместо карусели стилей             |
| **Masonry-список**            | Страница подборки с товарами в 2-колоночной сетке             |
| **Детальная страница товара** | Просмотр товара + добавление в гардероб + переход на источник |
| **Админ-панель**              | Rails Dashboard/Admin для управления контентом                |
| **Глобальность**              | Все подборки видны всем пользователям приложения              |

### 1.3 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ГЛАВНАЯ СТРАНИЦА                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  Y2K    │  │Old Money│  │  Sport  │  │ Casual  │  ← Карусель │
│  │  Guy    │  │  Style  │  │  Look   │  │ Friday  │    подборок │
│  └────┬────┘  └─────────┘  └─────────┘  └─────────┘             │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │ Tap
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    СТРАНИЦА ПОДБОРКИ                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ← Gift Ideas                            🔗 ↕️               ││
│  │ ┌─────────────┐  ┌─────────────────────────────────────────┐││
│  │ │  Y2K Guy    │  │      BANNER IMAGE                       │││
│  └─┴─────────────┴──┴─────────────────────────────────────────┴┘│
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │                       │
│  │ │             │ │  │ │             │ │   ← Masonry Grid      │
│  │ │   Jacket    │ │  │ │   Jeans     │ │     2 columns         │
│  │ │   $21.49    │ │  │ │   $39.99    │ │                       │
│  │ └─────────────┘ │  │ └─────────────┘ │                       │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │                       │
│  │ │             │ │  │ │             │ │                       │
│  │ │  Pokemon    │ │  │ │   Jersey    │ │                       │
│  │ │   $59.99    │ │  │ │   $23.99    │ │                       │
│  │ └─────────────┘ │  │ └─────────────┘ │                       │
│  └─────────────────┘  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
        │ Tap на товар
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                ДЕТАЛЬНАЯ СТРАНИЦА ТОВАРА                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │              [ИЗОБРАЖЕНИЕ ТОВАРА]                           ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  IYTR Men's Colorblock Windbreaker                              │
│  💰 $21.49                                                      │
│  🏪 Amazon                                                      │
│  📦 Category: Outerwear                                         │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ ➕ Add to Wardrobe  │  │  🔗 Open in Store   │               │
│  └─────────────────────┘  └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Архитектура системы

### 2.1 Общая архитектура (целевой вариант под единый Ruby on Rails backend)

Ключевая идея: **Supabase остаётся data/storage слоем**, а **Rails становится единым backend-слоем**:

- Mobile App ходит в Rails API (единая аутентификация, кэш, аналитика, future-персонализация)
- Rails читает/пишет подборки в Supabase (Postgres + Storage) через service-role
- Админка подборок — часть Rails (Dashboard/Admin)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RAILS BACKEND                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ API v1 для Mobile                                                ││
│  │  - GET /api/v1/collections                                       ││
│  │  - GET /api/v1/collections/:id/items                             ││
│  │  - GET /api/v1/collection_items/:id                              ││
│  │  - POST /api/v1/collections/events (опционально)                 ││
│  │                                                                 ││
│  │ Dashboard/Admin (только для админов)                             ││
│  │  - CRUD подборок + товаров                                       ││
│  │  - Upload изображений + генерация thumbnail                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└───────────────┬─────────────────────────────────────────────────────┘
                │ service-role (server-side)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SUPABASE                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   collections   │  │ collection_items│  │   Storage:          │  │
│  │   (Postgres)    │  │   (Postgres)    │  │   collections/*     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│  RLS: клиенту только SELECT опубликованного (без write-политик)       │
└───────────────┬─────────────────────────────────────────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MOBILE APP (React Native)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │CollectionsCarou-│  │ CollectionScreen│  │CollectionItemDetail │  │
│  │sel (Home)       │  │ (Masonry List)  │  │   (Item View)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│  Services: collectionsApi.ts (calls Rails API)                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Админка (обновлено под Ruby on Rails)

Чтобы планы по подборкам и по backend были едиными, **админка подборок должна жить в Rails**:

- единая авторизация админов (отдельный `AdminUser` в Rails)
- единые политики доступа (server-side, без выдачи прав на write клиентам)
- проще подключить аналитику, кэш, фоновую обработку изображений (Solid Queue; Sidekiq опционально)
- веб-админка (Rails Views + Hotwire) — единственный интерфейс для управления контентом

---

## 3. Модель данных

### 3.1 TypeScript Types

```typescript
// types/models/collection.ts

export interface Collection {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  bannerUrl?: string;
  gradient: [string, string];
  sortOrder: number;
  isActive: boolean;
  itemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  sourceUrl: string;
  sourceName: string;
  price?: number;
  currency?: string;
  category?: string;
  colors?: unknown[];
  sortOrder: number;
  isActive: boolean;
  metadata?: CollectionItemMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionItemMetadata {
  brand?: string;
  size?: string[];
  material?: string;
  originalPrice?: number;
  discount?: number;
  inStock?: boolean;
  aiTags?: string[];
}

export interface CollectionTile {
  id: string;
  title: string;
  gradient: [string, string];
  bannerUrl?: string;
  itemsCount: number;
}
```

### 3.2 Database Schema (Supabase PostgreSQL)

```sql
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  banner_url TEXT,
  gradient JSONB DEFAULT '["#667eea", "#764ba2"]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  items_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  category TEXT,
  colors JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_active ON public.collections(is_active, sort_order);
CREATE INDEX idx_collection_items_active ON public.collection_items(collection_id, is_active, sort_order);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Клиент читает только опубликованное. Пишет только Rails через service-role.
CREATE POLICY "Published collections are viewable"
  ON public.collections FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Published collection items are viewable"
  ON public.collection_items FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_active = true
    AND EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_items.collection_id
        AND collections.is_active = true
    )
  );

CREATE OR REPLACE FUNCTION recalc_collection_items_count(p_collection_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE collections
  SET items_count = (
    SELECT COUNT(*)::int
    FROM collection_items
    WHERE collection_id = p_collection_id AND is_active = true
  ),
  updated_at = NOW()
  WHERE id = p_collection_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION on_collection_items_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalc_collection_items_count(NEW.collection_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalc_collection_items_count(OLD.collection_id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.collection_id IS DISTINCT FROM OLD.collection_id THEN
      PERFORM recalc_collection_items_count(OLD.collection_id);
      PERFORM recalc_collection_items_count(NEW.collection_id);
    ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      PERFORM recalc_collection_items_count(NEW.collection_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collection_items_changed
AFTER INSERT OR UPDATE OR DELETE ON collection_items
FOR EACH ROW EXECUTE FUNCTION on_collection_items_changed();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collections_updated
BEFORE UPDATE ON collections
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_collection_items_updated
BEFORE UPDATE ON collection_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 Supabase Storage Structure

```
storage/
└── collections/                    # Bucket for collection assets
    ├── banners/                    # Collection banner images
    │   ├── y2k-guy-banner.jpg
    │   ├── old-money-banner.jpg
    │   └── ...
  └── items/                      # Collection item images
    ├── {collection_id}/
    │   ├── full/
    │   │   ├── item-001.jpg
    │   │   └── ...
    │   └── thumb/
    │       ├── item-001.jpg
    │       └── ...
    └── ...
```

**Storage Policies:**

```sql
-- Read access for authenticated users (подборки доступны всем пользователям приложения)
CREATE POLICY "Public read access for collection images"
ON storage.objects FOR SELECT
USING (bucket_id = 'collections' AND auth.role() = 'authenticated');

-- Server write access (Rails uses service-role)
CREATE POLICY "Service role write access for collection images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'collections' AND auth.role() = 'service_role'
);

CREATE POLICY "Service role update access for collection images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'collections' AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'collections' AND auth.role() = 'service_role'
);

CREATE POLICY "Service role delete access for collection images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'collections' AND auth.role() = 'service_role'
);
```

---

## 4. Backend (Rails + Supabase)

Цель: **единый backend слой в Rails** для API, аналитики, кэша и админки.

### 4.1 Rails API (для мобильного приложения)

Mobile App делает запросы в Rails с Supabase JWT:

- `Authorization: Bearer <supabase_access_token>`
- Rails валидирует JWT (как описано в backend-плане) и может логировать события.

### 4.2 Rails Service Layer (доступ к Supabase)

Rails не отдаёт service-role наружу. Все операции записи (создание/редактирование подборок, загрузка изображений) идут только server-side.

Рекомендуемый слой сервисов:

- `Supabase::CollectionsService` — CRUD для `collections`, `collection_items` через Supabase REST (`/rest/v1/*`)
- `Supabase::StorageService` — upload в Storage bucket `collections`
- `Collections::Query` — сборка ответов для API (пагинация, сортировка)

### 4.3 Database Functions (опционально)

```sql
-- Function to get collections with items count
CREATE OR REPLACE FUNCTION get_active_collections()
RETURNS TABLE (
  id UUID,
  title TEXT,
  title_en TEXT,
  banner_url TEXT,
  gradient JSONB,
  items_count INTEGER,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.title_en,
    c.banner_url,
    c.gradient,
    c.items_count,
    c.sort_order
  FROM collections c
  WHERE c.is_active = true
  ORDER BY c.sort_order ASC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collection items with pagination
CREATE OR REPLACE FUNCTION get_collection_items(
  p_collection_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  source_url TEXT,
  source_name TEXT,
  price DECIMAL,
  currency TEXT,
  category TEXT,
  colors JSONB,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.title,
    ci.description,
    ci.image_url,
    ci.thumbnail_url,
    ci.image_width,
    ci.image_height,
    ci.source_url,
    ci.source_name,
    ci.price,
    ci.currency,
    ci.category,
    ci.colors,
    ci.metadata
  FROM collection_items ci
  JOIN collections c ON c.id = ci.collection_id
  WHERE ci.collection_id = p_collection_id
    AND ci.is_active = true
    AND c.is_active = true
  ORDER BY ci.sort_order ASC, ci.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Примечание: эти RPC полезны как “ускорители” запросов, но **мобильное приложение не должно быть привязано к ним напрямую** — оно обращается к Rails API.

---

## 5. Админ-панель (Rails)

### 5.1 Почему админка в Rails — самый чистый вариант

- один backend контур (как в backend-плане)
- не нужно держать отдельные деплои/секреты для внешних сервисов
- проще обеспечить безопасность (service-role только на сервере)
- проще добавить фоновые задачи (thumbnail/оптимизация картинок, переобход ссылок, проверки наличия товара)

### 5.2 Минимальный функционал админки (MVP)

- CRUD `collections` (title, title_en, description, gradient, sort_order, is_active, banner)
- CRUD `collection_items` (title, image, source_url, source_name, price, currency, category, is_active, sort_order)
- Upload изображений в Supabase Storage + генерация `thumbnail_url` + запись `image_width/height`

### 5.3 Роли и доступ

- отдельная модель `AdminUser` (custom + `has_secure_password`) для входа в `/admin` (сейчас защищено HTTP Basic)
- таблица админов **не должна** быть в Supabase Auth, чтобы не смешивать домены “пользователь приложения” и “админ контента”

Примечание: Devise можно подключить позже (опционально), если появятся требования к полноценным admin-сессиям/2FA/управлению ролями.

---

## 6. Frontend (React Native)

### 6.1 Новые файлы

```
components/
├── collections/
│   ├── CollectionsCarousel.tsx      # Карусель на главной
│   ├── CollectionTile.tsx           # Плитка подборки
│   ├── CollectionMasonry.tsx        # Masonry-сетка товаров
│   └── CollectionItemCard.tsx       # Карточка товара в сетке

app/
├── collection/
│   ├── [id].tsx                     # Страница подборки (masonry list)
│   └── item/
│       └── [itemId].tsx             # Детальная страница товара

services/
├── collections/
│   ├── collectionsApi.ts            # Calls Rails API (read-only для клиента)
│   └── index.ts

store/
├── collections/
│   └── collectionsStore.ts          # Zustand store (опционально)

types/
├── models/
│   └── collection.ts                # Типы для подборок
```

### 6.2 Компоненты

#### CollectionsCarousel.tsx

```typescript
// components/collections/CollectionsCarousel.tsx

import { Collection } from '@/types/models/collection';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collectionsApi } from '@/services/collections';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = SCREEN_WIDTH - 64;
const TILE_HEIGHT = 160;
const TILE_GAP = 16;

export default function CollectionsCarousel() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await collectionsApi.getActiveCollections();
      setCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Infinite loop data
  const infiniteData = collections.length > 0
    ? [...collections, ...collections, ...collections]
    : [];
  const dataLength = collections.length;

  useEffect(() => {
    if (dataLength > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: dataLength,
        animated: false,
      });
    }
  }, [dataLength]);

  const handleCollectionPress = (collection: Collection) => {
    router.push(`/collection/${collection.id}`);
  };

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (TILE_WIDTH + TILE_GAP));

    if (index <= 0 || index >= dataLength * 2) {
      flatListRef.current?.scrollToIndex({
        index: dataLength,
        animated: false,
      });
    }
  };

  const renderTile = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => handleCollectionPress(item)}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={[...item.gradient, item.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {item.bannerUrl && (
          <Image
            source={{ uri: item.bannerUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.overlay}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.itemsCount}>{item.itemsCount} items</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading || collections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={infiniteData}
        renderItem={renderTile}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={TILE_WIDTH + TILE_GAP}
        decelerationRate="fast"
        snapToAlignment="center"
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: TILE_WIDTH + TILE_GAP,
          offset: (TILE_WIDTH + TILE_GAP) * index,
          index,
        })}
        ItemSeparatorComponent={() => <View style={{ width: TILE_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 32,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  overlay: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  itemsCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});
```

#### Collection Screen (Masonry)

```typescript
// app/collection/[id].tsx

import { CollectionItem } from '@/types/models/collection';
import { collectionsApi } from '@/services/collections';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const PADDING = 16;
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP) / 2;

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollection();
  }, [id]);

  const loadCollection = async () => {
    if (!id) return;
    try {
      const [collectionData, itemsData] = await Promise.all([
        collectionsApi.getCollectionById(id),
        collectionsApi.getCollectionItems(id),
      ]);
      setCollection(collectionData);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: CollectionItem) => {
    router.push(`/collection/item/${item.id}`);
  };

  // Masonry layout calculation
  const getMasonryColumns = useCallback(() => {
    const leftColumn: CollectionItem[] = [];
    const rightColumn: CollectionItem[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    items.forEach((item) => {
      // Estimate item height (image + text)
      const aspectRatio =
        item.imageWidth && item.imageHeight
          ? item.imageHeight / item.imageWidth
          : 1.2; // fallback ratio
      const imageHeight = COLUMN_WIDTH * aspectRatio;
      const textHeight = 60;
      const itemHeight = imageHeight + textHeight;

      if (leftHeight <= rightHeight) {
        leftColumn.push(item);
        leftHeight += itemHeight + 12;
      } else {
        rightColumn.push(item);
        rightHeight += itemHeight + 12;
      }
    });

    return [leftColumn, rightColumn];
  }, [items]);

  const [leftColumn, rightColumn] = getMasonryColumns();

  const renderItem = (item: CollectionItem) => {
    const aspectRatio =
      item.imageWidth && item.imageHeight
        ? item.imageHeight / item.imageWidth
        : 1.2;
    const imageHeight = COLUMN_WIDTH * aspectRatio;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.thumbnailUrl || item.imageUrl }}
          style={[styles.itemImage, { height: imageHeight }]}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>
              {item.currency === 'USD' ? '$' : '₽'}{item.price?.toFixed(2)}
            </Text>
            <Text style={styles.storeName}>{item.sourceName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{collection?.title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Banner */}
      {collection?.bannerUrl && (
        <Image
          source={{ uri: collection.bannerUrl }}
          style={styles.banner}
          resizeMode="cover"
        />
      )}

      {/* Masonry Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.masonryContainer}>
          <View style={styles.column}>
            {leftColumn.map(renderItem)}
          </View>
          <View style={styles.column}>
            {rightColumn.map(renderItem)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  banner: {
    width: SCREEN_WIDTH,
    height: 180,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: PADDING,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 0.8,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  storeName: {
    fontSize: 12,
    color: '#666',
  },
});
```

### 6.3 Service Layer

```typescript
// services/collections/collectionsApi.ts

import { supabase } from '@/lib/supabase/client';
import { Collection, CollectionItem } from '@/types/models/collection';

class CollectionsApi {
  /**
   * Get all active collections for carousel
   */
  async getActiveCollections(): Promise<Collection[]> {
    const { data, error } = await supabase.rpc('get_active_collections');

    if (error) {
      console.error('[CollectionsApi] Error fetching collections:', error);
      throw error;
    }

    return (data || []).map(this.mapToCollection);
  }

  /**
   * Get collection by ID
   */
  async getCollectionById(id: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[CollectionsApi] Error fetching collection:', error);
      return null;
    }

    return this.mapToCollection(data);
  }

  /**
   * Get items for a collection with pagination
   */
  async getCollectionItems(
    collectionId: string,
    limit = 50,
    offset = 0,
  ): Promise<CollectionItem[]> {
    const { data, error } = await supabase.rpc('get_collection_items', {
      p_collection_id: collectionId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('[CollectionsApi] Error fetching items:', error);
      throw error;
    }

    return (data || []).map(this.mapToCollectionItem);
  }

  /**
   * Get single collection item by ID
   */
  async getCollectionItemById(itemId: string): Promise<CollectionItem | null> {
    const { data, error } = await supabase
      .from('collection_items')
      .select(
        `
        *,
        collections!inner(is_active)
      `,
      )
      .eq('id', itemId)
      .eq('is_active', true)
      .single();

    if (error || !data?.collections?.is_active) {
      console.error('[CollectionsApi] Error fetching item:', error);
      return null;
    }

    return this.mapToCollectionItem(data);
  }

  /**
   * Add collection item to user's wardrobe
   */
  async addItemToWardrobe(item: CollectionItem, userId: string): Promise<string> {
    // CRITICAL (Obrazz offline-first): wardrobe item creation expects a LOCAL imageUri.
    // Current itemService.saveImageLocally() копирует файл через expo-file-system,
    // поэтому http(s) URL напрямую передавать нельзя.
    const { downloadImageFromUrl } = await import('@/services/shopping/webCaptureService');
    const { itemServiceOffline } = await import('@/services/wardrobe/itemServiceOffline');

    const localUri = await downloadImageFromUrl(item.imageUrl);

    const wardrobeItem = await itemServiceOffline.createItem({
      userId,
      title: item.title,
      category: (item.category as any) || 'other',
      colors: item.colors?.length ? item.colors.map((c) => ({ hex: c.hex })) : [{ hex: '#CCCCCC' }],
      primaryColor: item.colors?.[0] ? { hex: item.colors[0].hex } : { hex: '#CCCCCC' },
      styles: [],
      seasons: [],
      imageUri: localUri,
      price: item.price,
      metadata: {
        source: 'web',
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
      },
    });

    return wardrobeItem.id;
  }

  // Mappers
  private mapToCollection(data: any): Collection {
    return {
      id: data.id,
      title: data.title,
      titleEn: data.title_en,
      description: data.description,
      bannerUrl: data.banner_url,
      gradient: data.gradient || ['#667eea', '#764ba2'],
      sortOrder: data.sort_order || 0,
      isActive: data.is_active,
      itemsCount: data.items_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToCollectionItem(data: any): CollectionItem {
    return {
      id: data.id,
      collectionId: data.collection_id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      thumbnailUrl: data.thumbnail_url,
      imageWidth: data.image_width,
      imageHeight: data.image_height,
      sourceUrl: data.source_url,
      sourceName: data.source_name,
      price: data.price,
      currency: data.currency || 'USD',
      category: data.category,
      colors: data.colors || [],
      sortOrder: data.sort_order || 0,
      isActive: data.is_active,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export const collectionsApi = new CollectionsApi();
```

---

## 7. Пошаговый план реализации

### Phase 1: Backend Foundation (3-4 дня)

| #   | Задача                                                                                     | Оценка | Приоритет |
| --- | ------------------------------------------------------------------------------------------ | ------ | --------- |
| 1.1 | Создать SQL миграции для таблиц `collections`, `collection_items`                          | 2ч     | P0        |
| 1.2 | Применить миграции в Supabase                                                              | 30м    | P0        |
| 1.3 | Настроить RLS (клиенту только SELECT опубликованного; без write-политик для authenticated) | 1ч     | P0        |
| 1.4 | Создать Storage bucket `collections` + policies (read=authenticated, write=service_role)   | 30м    | P0        |
| 1.5 | Поднять Rails API эндпоинты чтения подборок (контракты, сортировка, пагинация)             | 4ч     | P0        |
| 1.6 | Добавить triggers для `items_count` и `updated_at`                                         | 30м    | P0        |
| 1.7 | Создать тестовые данные (2-3 подборки, 10+ товаров)                                        | 1ч     | P1        |

### Phase 2: Mobile App - Core Features (4-5 дней)

| #    | Задача                                                                | Оценка | Приоритет |
| ---- | --------------------------------------------------------------------- | ------ | --------- |
| 2.1  | Создать types/models/collection.ts                                    | 30м    | P0        |
| 2.2  | Создать services/collections/collectionsApi.ts (calls Rails API)      | 2ч     | P0        |
| 2.3  | Создать components/collections/CollectionsCarousel.tsx                | 3ч     | P0        |
| 2.4  | Заменить StylesCarousel на CollectionsCarousel в app/(tabs)/index.tsx | 30м    | P0        |
| 2.5  | Создать app/collection/[id].tsx (страница подборки с masonry)         | 4ч     | P0        |
| 2.6  | Создать app/collection/item/[itemId].tsx (детальная страница товара)  | 3ч     | P0        |
| 2.7  | Реализовать "Add to Wardrobe" функционал                              | 2ч     | P0        |
| 2.8  | Реализовать "Open in Store" (Linking.openURL)                         | 30м    | P0        |
| 2.9  | Добавить loading states и error handling                              | 1ч     | P1        |
| 2.10 | Тестирование на устройствах                                           | 2ч     | P1        |

### Phase 3: Rails Admin (3-5 дней)

| #   | Задача                                                                    | Оценка | Приоритет |
| --- | ------------------------------------------------------------------------- | ------ | --------- |
| 3.1 | Добавить `AdminUser` (custom + `has_secure_password`) + доступ к `/admin` | 2ч     | P0        |
| 3.2 | (Опционально) подключить Administrate/ActiveAdmin (выбрать один)          | 2ч     | P1        |
| 3.3 | CRUD для `collections`                                                    | 3ч     | P0        |
| 3.4 | CRUD для `collection_items`                                               | 4ч     | P0        |
| 3.5 | Upload изображений в Supabase Storage (full + thumb)                      | 4ч     | P0        |
| 3.6 | Авто-`image_width/height` + генерация thumb (job/inline)                  | 3ч     | P1        |
| 3.7 | Деплой Rails (Render/Railway) + секреты Supabase service-role             | 2ч     | P0        |

### Phase 4: Polish & Launch (2-3 дня)

| #   | Задача                                                    | Оценка | Приоритет |
| --- | --------------------------------------------------------- | ------ | --------- |
| 4.1 | Оптимизация производительности карусели                   | 2ч     | P1        |
| 4.2 | Кэширование данных в Zustand store                        | 2ч     | P2        |
| 4.3 | Добавить pull-to-refresh на странице подборки             | 1ч     | P2        |
| 4.4 | Локализация (RU/EN) для UI                                | 2ч     | P2        |
| 4.5 | Документация для администраторов (как работать в админке) | 1ч     | P1        |
| 4.6 | Наполнение контентом (минимум 5 подборок по 15+ товаров)  | 4ч     | P1        |
| 4.7 | Финальное тестирование                                    | 2ч     | P0        |

### Phase 5: Опциональные улучшения (+2-5 дней)

| #   | Задача                                                 | Оценка |
| --- | ------------------------------------------------------ | ------ |
| 5.1 | Кэширование Rails API (Redis)                          | 3ч     |
| 5.2 | Аналитика событий (view/open/add) + отчёты в админке   | 4ч     |
| 5.3 | Bulk import (CSV) в админке                            | 4ч     |
| 5.4 | Проверка ссылок/наличия товара (Sidekiq scheduled job) | 4ч     |

---

## 8. API Reference (Rails)

### 8.1 Public API для мобильного приложения

```
GET  /api/v1/collections
GET  /api/v1/collections/:id
GET  /api/v1/collections/:id/items?limit=20&cursor=...
GET  /api/v1/collection_items/:id

# (опционально, если делаем аналитику уже в MVP)
POST /api/v1/collections/events
```

### 8.2 Принцип контрактов

- API отдаёт **camelCase** поля (как принято в приложении)
- Rails внутри маппит snake_case Supabase → camelCase
- В API не отдаём “черновики”: только `isActive=true`

---

## 9. UI/UX спецификации

### 9.1 Карусель подборок (Главная)

- **Размер плитки:** `SCREEN_WIDTH - 64px` × `160px`
- **Border radius:** `20px`
- **Spacing:** `16px` между плитками
- **Padding:** `32px` по краям
- **Snap:** К центру, decelerationRate="fast"
- **Infinite scroll:** Да (3x data duplication)
- **Gradient overlay:** Снизу, для читаемости текста
- **Typography:**
  - Title: 24px, bold, white, shadow
  - Items count: 14px, white 80% opacity

### 9.2 Masonry Grid (Страница подборки)

- **Columns:** 2
- **Gap:** `12px`
- **Padding:** `16px`
- **Card background:** `#FFFFFF`
- **Card border-radius:** `12px`
- **Image aspect ratio:** ~0.8 (вертикальные)
- **Typography:**
  - Title: 14px, medium, 2 lines max
  - Price: 16px, bold
  - Store: 12px, gray

### 9.3 Item Detail Screen

- **Layout:** Похож на существующий `app/item/[id].tsx`
- **Image:** Fullscreen с overlay buttons
- **Actions:**
  - "Add to Wardrobe" — primary button, blue
  - "Open in Store" — secondary button, outline
- **Info cards:**
  - Price + Store
  - Category (если есть)
  - Brand (если есть)

---

## 10. Примечания к реализации

### 10.1 Оптимизация изображений

- Для Masonry используй `thumbnail_url` (если есть), а `image_url` — на detail
- На админке при загрузке изображений сохраняй: full + thumb + `image_width`/`image_height`
- Опционально позже: `expo-image` для кэширования (не блокер для MVP)

### 10.2 Offline Support

- Подборки — **online-first** (без очередей на запись)
- Для лучшего UX можно кэшировать последний успешный ответ (read-only) и показывать его offline + баннер “нет сети”

### 10.3 Analytics (будущее)

Добавить события:

- `collection_viewed` — просмотр подборки
- `collection_item_viewed` — просмотр товара
- `collection_item_added` — добавление в гардероб
- `collection_item_opened` — переход на сайт магазина

### 10.4 Безопасность

- Никогда не кладём `SUPABASE_SERVICE_ROLE_KEY` в мобильное приложение
- Все write-операции (создание/редактирование подборок, загрузка изображений) — только server-side (Rails)
- RLS в Supabase делаем максимально простым:
  - клиенту нужен только `SELECT` опубликованного
  - write-политики для `authenticated` не нужны (чтобы исключить privilege escalation)
  - сервер пишет через service-role (обходит RLS)

---

## 11. Зависимости от существующего кода

### Используемые компоненты:

- `GlassBackButton`, `GlassIconButton` — из `@components/ui/glass`
- `MasonryGallery` (частично) — из `@components/shopping` (можно адаптировать)
- `itemService.createItem()` — для добавления в гардероб

### Паттерны:

- Service layer: `collectionsApi` следует паттерну `itemService`, но обращается к Rails API
- Type mapping: snake_case (DB) → camelCase (App)
- Navigation: Expo Router с dynamic routes

---

**Готово к реализации!** 🚀

Начинать рекомендую с Phase 1 (Rails API + Supabase schema) + Phase 2 (Mobile Core), затем Phase 3 (Rails Admin) для управления контентом.
