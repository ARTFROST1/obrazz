# Web Capture — Shopping Browser Feature

> **Дата:** 12 декабря 2025  
> **Версия:** 1.0  
> **Статус:** Планирование  
> **Приоритет:** Высокий (ключевая функция добавления вещей)

---

## 🎯 Цель Функции

Позволить пользователям **добавлять вещи в гардероб напрямую из интернет-магазинов** через встроенный браузер с автоматическим определением изображений одежды на странице.

---

## 🏗 Архитектура Функции

### User Flow:

```
Home Screen
    ↓
[Tap на иконку магазина в Shopping Stories]
    ↓
Shopping Browser Screen (WebView)
    ↓
[Пользователь сёрфит по сайту]
    ↓
[Система автоматически детектит изображения одежды]
    ↓
Bottom Sheet: "Обнаружена вещь"
    ↓
[Tap "Добавить в гардероб"]
    ↓
Add Item Screen (стандартный)
```

---

## 📱 Shopping Browser Screen

### Layout:

```
┌─────────────────────────────────────┐
│  [✕]  ZARA  H&M  Asos  [⋯]         │ <- Top Bar
├─────────────────────────────────────┤
│                                     │
│                                     │
│         [WebView Content]           │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🎯 Обнаружена вещь                 │ <- Bottom Sheet
│  [📸 Превью]                        │    (появляется при детекте)
│  [➕ Добавить в гардероб]           │
└─────────────────────────────────────┘
```

---

## 🎨 Top Bar (Browser Controls)

```
┌─────────────────────────────────────┐
│  [✕]  ZARA  H&M  Asos  Nike  [⋯]   │
└─────────────────────────────────────┘
```

### Спецификации:

**Высота:** 52px  
**Background:** #FFFFFF  
**Border-bottom:** 1px solid #E5E5E5  
**Shadow:** 0 2px 4px rgba(0,0,0,0.08)

### Элементы слева направо:

#### 1. Exit Button [✕]

- Size: 40x40px
- Icon: Close (X), 24px, #333333
- Tap → показать Alert "Выйти из браузера?"
  - "Отмена" → остаться
  - "Выйти" → закрыть Shopping Browser, вернуться на Home

#### 2. Tabs Carousel (посередине)

- Horizontal scroll
- Active tab: Bold text, underline
- Inactive tabs: Regular text, #666666
- Each tab: Padding 12px horizontal
- Tap на tab → переключение WebView на этот магазин

**Пример:**

```
ZARA | H&M | Asos | Nike | Adidas
────
(active underline под ZARA)
```

#### 3. More Menu [⋯]

- Size: 40x40px
- Icon: Three dots (vertical), 24px, #333333
- Tap → Bottom Sheet Menu:
  - 🏠 "На главную страницу"
  - ➕ "Добавить магазин"
  - 🔄 "Обновить страницу"
  - ⚙️ "Настройки браузера"

---

## 🌐 WebView Component

### Технологии:

**React Native:** `react-native-webview`

```typescript
import { WebView } from 'react-native-webview';

<WebView
  source={{ uri: currentShopUrl }}
  onLoadEnd={handlePageLoad}
  injectedJavaScript={imageDetectionScript}
  onMessage={handleImageDetection}
  allowsBackForwardNavigationGestures
  sharedCookiesEnabled
/>
```

### Функции:

1. **Навигация по сайту** — пользователь может кликать по ссылкам
2. **JavaScript Injection** — скрипт для детекта изображений
3. **Cookie Support** — сохранение сессии (корзина, логин)
4. **Back/Forward Gestures** — свайп для навигации (iOS/Android)

---

## 🎯 Auto Image Detection

### Логика определения изображений одежды:

```javascript
// injectedJavaScript (внедряется в WebView)
const imageDetectionScript = `
  (function() {
    // Ищем все изображения на странице
    const images = document.querySelectorAll('img');
    const detectedImages = [];
    
    images.forEach(img => {
      // Фильтр по размеру (min 200x200px)
      if (img.naturalWidth >= 200 && img.naturalHeight >= 200) {
        
        // Фильтр по aspect ratio (примерно 3:4 или близко)
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (aspectRatio >= 0.5 && aspectRatio <= 1.5) {
          
          // Фильтр по URL/alt (содержит keywords)
          const src = img.src.toLowerCase();
          const alt = (img.alt || '').toLowerCase();
          
          const keywords = ['product', 'clothing', 'fashion', 'dress', 
                            'shirt', 'pants', 'jacket', 'shoe'];
          
          const hasKeyword = keywords.some(kw => 
            src.includes(kw) || alt.includes(kw)
          );
          
          if (hasKeyword || aspectRatio > 0.6 && aspectRatio < 1.2) {
            detectedImages.push({
              url: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight,
              alt: img.alt
            });
          }
        }
      }
    });
    
    // Отправляем результат в React Native
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'IMAGES_DETECTED',
      images: detectedImages
    }));
  })();
`;
```

### Когда запускается детекция:

1. **onLoadEnd** — после загрузки страницы
2. **Debounced scroll** — при прокрутке (с задержкой 500мс)
3. **Manual trigger** — кнопка "Найти вещи" в menu

---

## 📦 Bottom Sheet — Detected Item

### Появляется когда:

- Система обнаружила >= 1 изображение одежды
- Пользователь кликнул на изображение на сайте

### Layout:

```
┌─────────────────────────────────────┐
│  ─────  (handle)                    │
│                                     │
│  🎯 Обнаружена вещь                 │
│                                     │
│  ┌─────────┐                        │
│  │         │  [Название категории]  │
│  │ Preview │  Вероятность: 85%      │
│  │ 120x160 │                        │
│  └─────────┘                        │
│                                     │
│  [➕ Добавить в гардероб]           │
│  [✏️ Выбрать область вручную]       │
│                                     │
└─────────────────────────────────────┘
```

### Спецификации:

**Height:** 280px (collapsed), 60% screen (expanded)  
**Border-radius:** 20px 20px 0 0  
**Background:** #FFFFFF  
**Shadow:** 0 -4px 16px rgba(0,0,0,0.12)

**Элементы:**

1. **Handle:** 40x4px, #C4C4C4, border-radius 2px, center
2. **Title:** "🎯 Обнаружена вещь", Inter 17px Semibold
3. **Preview Image:** 120x160px, border-radius 12px
4. **Category Label:** "Верх", "Низ", "Обувь" и т.д. (auto-detected)
5. **Confidence:** "Вероятность: 85%" (если AI уверен)
6. **Primary Button:** "➕ Добавить в гардероб"
7. **Secondary Button:** "✏️ Выбрать область вручную"

### Actions:

#### [Добавить в гардероб]

1. Скачать изображение по URL
2. Сохранить локально
3. Открыть Add Item Screen с:
   - `imageLocalPath` = скачанное изображение
   - `category` = auto-detected (опционально)
   - Остальные поля пустые
4. Закрыть Shopping Browser

#### [Выбрать область вручную]

1. Открыть ImageCropper modal
2. Показать full image
3. Пользователь выбирает область вручную
4. После crop → Add Item Screen
5. Закрыть Shopping Browser

---

## 🔄 Multi-Tab Support

### Концепция:

Пользователь может открыть несколько магазинов одновременно и переключаться между ними через tabs carousel.

### Управление табами:

```typescript
interface BrowserTab {
  id: string;
  shopName: string;
  shopUrl: string;
  favicon?: string;
  currentUrl: string; // текущая страница в WebView
  scrollPosition?: number;
}

const [tabs, setTabs] = useState<BrowserTab[]>([
  { id: '1', shopName: 'ZARA', shopUrl: 'https://www.zara.com', currentUrl: '...' },
  { id: '2', shopName: 'H&M', shopUrl: 'https://www.hm.com', currentUrl: '...' },
]);

const [activeTabId, setActiveTabId] = useState('1');
```

### Сохранение состояния:

При переключении таба:

1. Сохранить `currentUrl` и `scrollPosition` активного таба
2. Переключиться на новый таб
3. Восстановить `currentUrl` и `scrollPosition` нового таба

**Ограничение:** Максимум 5 табов одновременно (производительность)

---

## 🚪 Exit Flow

### При нажатии [✕]:

```
┌─────────────────────────────────────┐
│                                     │
│    Выйти из браузера?               │
│                                     │
│  Все открытые вкладки будут         │
│  закрыты.                           │
│                                     │
│  [Отмена]         [Выйти]           │
│                                     │
└─────────────────────────────────────┘
```

**Alert:**

- Title: "Выйти из браузера?"
- Message: "Все открытые вкладки будут закрыты."
- Buttons:
  - "Отмена" → dismiss alert
  - "Выйти" → навигация на Home Screen

### При системном Back Button (Android):

1. Если WebView может вернуться назад → `webView.goBack()`
2. Если уже на стартовой странице магазина → показать Exit Alert
3. Если пользователь на другом табе → переключить на первый таб

---

## 💾 Data Storage

### AsyncStorage Keys:

```typescript
// Список любимых магазинов
'@shopping_browser_stores': Store[]

interface Store {
  id: string;
  name: string;
  url: string;
  faviconUrl?: string;
  isDefault: boolean; // нельзя удалить
  order: number;
}

// История браузера (опционально)
'@shopping_browser_history': HistoryItem[]

interface HistoryItem {
  url: string;
  title: string;
  timestamp: number;
  shopName: string;
}
```

### Default Stores:

```typescript
const DEFAULT_STORES: Store[] = [
  { id: '1', name: 'ZARA', url: 'https://www.zara.com', isDefault: true, order: 1 },
  { id: '2', name: 'H&M', url: 'https://www2.hm.com', isDefault: true, order: 2 },
  { id: '3', name: 'ASOS', url: 'https://www.asos.com', isDefault: true, order: 3 },
  { id: '4', name: 'Nike', url: 'https://www.nike.com', isDefault: true, order: 4 },
  { id: '5', name: 'Adidas', url: 'https://www.adidas.com', isDefault: true, order: 5 },
  { id: '6', name: 'Reserved', url: 'https://www.reserved.com', isDefault: true, order: 6 },
];
```

---

## 📊 User Analytics

### Трекинг событий:

```typescript
// Открытие браузера
analytics.track('shopping_browser_opened', {
  shopName: 'ZARA',
  source: 'home_stories',
});

// Детект изображения
analytics.track('item_detected', {
  shopName: 'ZARA',
  confidence: 0.85,
  category: 'tops',
});

// Добавление вещи
analytics.track('item_added_from_web', {
  shopName: 'ZARA',
  method: 'auto_detect' | 'manual_crop',
});

// Выход без добавления
analytics.track('shopping_browser_closed', {
  duration: 180, // seconds
  itemsAdded: 0,
});
```

---

## 🛠 Техническая Реализация

### Файловая структура:

```
app/
├── shopping/
│   └── browser.tsx          # Shopping Browser Screen

components/
├── shopping/
│   ├── ShoppingStoriesCarousel.tsx
│   ├── BrowserTopBar.tsx
│   ├── BrowserTabs.tsx
│   ├── DetectedItemSheet.tsx
│   └── AddStoreModal.tsx

services/
├── shopping/
│   ├── imageDetectionService.ts
│   ├── storeService.ts
│   └── webCaptureService.ts

utils/
├── shopping/
│   └── imageDetection.js   # Injected script

store/
├── shoppingBrowserStore.ts
```

### Dependencies:

```json
{
  "react-native-webview": "^13.6.4",
  "@gorhom/bottom-sheet": "^4.5.1",
  "react-native-fs": "^2.20.0" // для скачивания изображений
}
```

---

## 🎨 UI/UX Детали

### Loading State:

Пока страница грузится:

```
┌─────────────────────────────────────┐
│                                     │
│          [Skeleton Screen]          │
│                                     │
│          Loading ZARA...            │
│          ──────────                 │
│                                     │
└─────────────────────────────────────┘
```

### Error State:

Если страница не загрузилась:

```
┌─────────────────────────────────────┐
│                                     │
│          ⚠️                         │
│                                     │
│    Не удалось загрузить страницу    │
│                                     │
│    [🔄 Попробовать снова]           │
│    [← Вернуться]                    │
│                                     │
└─────────────────────────────────────┘
```

### Empty State (нет детектов):

Если прошло >10 сек и ничего не найдено:

```
┌─────────────────────────────────────┐
│  ℹ️ Вещи не обнаружены              │
│                                     │
│  Кликните на изображение одежды     │
│  на сайте, чтобы добавить её        │
│  в гардероб вручную.                │
│                                     │
│  [✏️ Выбрать область]               │
└─────────────────────────────────────┘
```

---

## 🔐 Privacy & Security

### Проблемы:

1. **Cookies** — сторонние куки могут трекать юзера
2. **JavaScript Injection** — потенциальная уязвимость
3. **Cross-Site Scripting** — если сайт скомпрометирован

### Решения:

1. **Отдельный WebView контекст** — не шарить куки с системным браузером
2. **HTTPS Only** — только защищенные соединения
3. **Sandboxing** — ограничить доступ JS к устройству
4. **Clear Data** — кнопка очистки cookies/cache в настройках

### Настройки приватности:

```typescript
<WebView
  incognito={false}  // Allow cookies для корзины
  thirdPartyCookiesEnabled={false}  // Block 3rd party tracking
  cacheEnabled={true}  // Для скорости
  mixedContentMode="never"  // Only HTTPS
/>
```

---

## 🚀 План Реализации

### Phase 1: Базовый браузер (1 неделя)

- [ ] ShoppingStoriesCarousel на Home
- [ ] Shopping Browser Screen с WebView
- [ ] Top Bar с exit button
- [ ] Single tab mode (без табов)

### Phase 2: Image Detection (1 неделя)

- [ ] JavaScript injection для детекта
- [ ] DetectedItemSheet компонент
- [ ] Интеграция с Add Item flow
- [ ] Manual crop fallback

### Phase 3: Multi-Tab Support (1 неделя)

- [ ] Tabs carousel в Top Bar
- [ ] State management для табов
- [ ] Tab switching logic
- [ ] Add/Remove store функционал

### Phase 4: Polish (1 неделя)

- [ ] Loading/Error states
- [ ] Analytics tracking
- [ ] Privacy settings
- [ ] Performance оптимизация

---

## ✅ Success Metrics

### KPI:

1. **Adoption Rate:** % юзеров, открывших Shopping Browser
2. **Conversion Rate:** % сессий браузера, где добавили вещь
3. **Items Added:** Среднее кол-во вещей добавленных за сессию
4. **Session Duration:** Среднее время в браузере
5. **Auto-Detect Accuracy:** % корректных детектов

### Целевые метрики (первый месяц):

- Adoption: 40%+ пользователей
- Conversion: 25%+ сессий с добавлением
- Items per session: 1.5+
- Auto-detect accuracy: 70%+

---

## 📝 Заключение

Web Capture / Shopping Browser — **ключевая функция** для быстрого пополнения гардероба пользователями. Встроенный браузер с автоматическим определением одежды снижает friction добавления вещей с десятков тапов до 2-3.

**Преимущества:**

1. ✅ Не нужно скачивать фото отдельно
2. ✅ Не нужно переключаться между приложениями
3. ✅ Автоматический детект упрощает процесс
4. ✅ Поддержка любого интернет-магазина

**Следующий шаг:** Создание прототипа Shopping Browser с базовым WebView и тестирование на 5-10 магазинах.
