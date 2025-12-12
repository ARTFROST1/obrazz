# WebView Crop Overlay - Setup Instructions

## Что реализовано

### 1. WebViewCropOverlay Component

**Файл:** `components/shopping/WebViewCropOverlay.tsx`

**Функционал:**

- Делает screenshot WebView контейнера при открытии
- Показывает screenshot с ResizableCropOverlay поверх
- Позволяет пользователю перетаскивать углы рамки для выбора области
- Обрезает выбранную область и возвращает URI

**Технологии:**

- `react-native-view-shot` - для screenshot WebView
- `ResizableCropOverlay` - для интерактивного crop интерфейса
- `expo-image-manipulator` - для обрезки изображения

### 2. Integration в Shopping Browser

**Файл:** `app/shopping/browser.tsx`

**Изменения:**

- WebView обернут в `<View ref={webViewContainerRef}>` для screenshot
- Добавлен state `showCropOverlay` для контроля видимости
- DetectionFAB получает callback `onManualCrop={() => setShowCropOverlay(true)}`
- При завершении crop → переход на `/add-item` с `imageUrl` и `source: 'web_capture_manual'`

### 3. DetectionFAB Updates

**Файл:** `components/shopping/DetectionFAB.tsx`

**Поведение:**

- Кнопка всегда видна (убрали `if (!isVisible) return null`)
- **count > 0:** Синяя кнопка "🔍 Найдено X вещей" → открывает gallery
- **count === 0:** Зеленая кнопка "✂️ Вырезать вручную" → вызывает `onManualCrop()`

## Установка зависимости

### Шаг 1: Установить react-native-view-shot

```bash
npm install react-native-view-shot@4.0.3
```

Или через package.json (уже добавлено):

```json
"react-native-view-shot": "4.0.3"
```

Затем:

```bash
npm install
```

### Шаг 2: Для iOS - установить pods

```bash
cd ios && pod install && cd ..
```

### Шаг 3: Rebuild приложения

```bash
# Очистить кэш Metro
npx expo start --clear

# Или для нативных билдов
npx expo run:ios
# или
npx expo run:android
```

## Как работает

1. **Пользователь видит зеленую кнопку "Вырезать вручную"** (когда нет обнаруженных изображений)

2. **Нажатие кнопки:**
   - Вызывается `setShowCropOverlay(true)` в browser.tsx
   - Открывается WebViewCropOverlay modal

3. **Screenshot capture:**

   ```typescript
   const uri = await captureRef(webViewContainerRef, {
     format: 'jpg',
     quality: 0.9,
     result: 'tmpfile',
   });
   ```

4. **Crop интерфейс:**
   - Screenshot отображается на фоне
   - ResizableCropOverlay поверх с перетаскиваемой рамкой
   - Инструкция: "Перетащите углы рамки, чтобы выбрать область"

5. **Обрезка:**

   ```typescript
   const result = await ImageManipulator.manipulateAsync(
     screenshot,
     [{ crop: { originX, originY, width, height } }],
     { compress: 0.9, format: 'JPEG' },
   );
   ```

6. **Навигация:**
   ```typescript
   router.push({
     pathname: '/add-item',
     params: {
       imageUrl: result.uri,
       source: 'web_capture_manual',
     },
   });
   ```

## Альтернатива (если react-native-view-shot не работает)

Если возникают проблемы с `react-native-view-shot`, можно:

1. **Использовать встроенный screenshot системы:**
   - Попросить пользователя сделать скриншот
   - Открыть камеру/галерею
   - Crop существующего изображения

2. **Использовать Expo MediaLibrary:**

   ```bash
   npx expo install expo-media-library
   ```

   Затем попросить пользователя выбрать последний скриншот из галереи

## Известные ограничения

1. **WebView screenshot может не захватывать:**
   - Видео контент
   - Canvas элементы с tainted pixels
   - Cross-origin изображения без CORS

2. **Performance:**
   - Screenshot большой WebView страницы может занять 1-2 секунды
   - Crop операция быстрая (< 500ms)

3. **Permissions:**
   - Для сохранения в галерею нужны permissions (не требуется для tmpfile)

## Тестирование

1. Откройте shopping browser
2. Перейдите на любую страницу магазина
3. Нажмите зеленую кнопку "✂️ Вырезать вручную"
4. Дождитесь загрузки screenshot
5. Перетащите углы рамки crop overlay
6. Нажмите "Обрезать"
7. Проверьте, что открылся add-item screen с обрезанным изображением

## Логи для отладки

```
[DetectionFAB] Triggering manual crop
[Browser] Opening crop overlay
[WebViewCropOverlay] Capturing screenshot...
[WebViewCropOverlay] Screenshot captured: file://...
[WebViewCropOverlay] Crop config: { originX, originY, width, height }
[WebViewCropOverlay] Crop complete: file://...
[Browser] Crop complete, navigating to add-item: file://...
```

## Файлы изменены

- ✅ `components/shopping/WebViewCropOverlay.tsx` - новый компонент
- ✅ `components/shopping/DetectionFAB.tsx` - добавлен onManualCrop prop
- ✅ `app/shopping/browser.tsx` - интеграция crop overlay
- ✅ `package.json` - добавлена зависимость react-native-view-shot

## Next Steps

1. Установить `npm install react-native-view-shot`
2. Rebuild приложения
3. Протестировать функционал
4. При необходимости настроить crop размеры/ограничения в WebViewCropOverlay.tsx

---

**Автор:** GitHub Copilot  
**Дата:** 13 декабря 2025
