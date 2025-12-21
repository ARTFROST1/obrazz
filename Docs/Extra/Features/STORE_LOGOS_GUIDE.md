# Руководство по иконкам магазинов

## Обновлено: Российские магазины одежды

Приложение теперь использует популярные российские онлайн-магазины вместо международных.

## Список магазинов и их иконок

Добавьте файлы иконок в папку `assets/images/stores/` с указанными именами:

| ID  | Магазин      | Имя файла | URL                                                          | Примечания                  |
| --- | ------------ | --------- | ------------------------------------------------------------ | --------------------------- |
| 1   | Wildberries  | `1.png`   | https://www.wildberries.ru/wbrands                           | Фиолетовый фон с "W"        |
| 2   | Ozon         | `2.png`   | https://www.ozon.ru/category/odezhda-obuv-i-aksessuary-7500/ | Синий круг с логотипом      |
| 3   | Lamoda       | `3.png`   | https://www.lamoda.ru/c/355/clothes-zhenskaya-odezhda/       | Черный фон с белым "L"      |
| 4   | Befree       | `4.png`   | https://befree.ru/zhenskaya                                  | Красно-черное лого          |
| 5   | ТВОЕ         | `5.png`   | https://tvoe.ru/catalog/jenshchinam/odejda/                  | Красный фон с белым текстом |
| 6   | Zarina       | `6.png`   | https://zarina.ru/                                           | Черно-белое лого            |
| 7   | Gloria Jeans | `7.png`   | https://www.gloria-jeans.ru/catalog/girls                    | Синее лого "GJ"             |
| 8   | Henderson    | `8.png`   | https://henderson.ru/catalog/apparel/                        | Черное классическое лого    |
| 9   | MAAG         | `9.png`   | https://maag-fashion.com/collections/women-sale-t-shirts/    | Минималистичное лого        |
| 10  | ECRU         | `10.png`  | https://www.ecrubrand.com/collections                        | Стильное черно-белое        |
| 11  | DUB          | `11.png`  | https://www.dubapparels.com/bestsellers                      | Современное лого            |

## Рекомендации по иконкам

### Формат:

- **Размер:** 512x512 px (или 1024x1024 px для Retina)
- **Формат:** PNG с прозрачностью или белым/цветным фоном
- **Форма:** Квадратные

### Где взять:

1. **Фавиконки сайтов** (приоритет 1):
   - Откройте сайт магазина
   - В Chrome: DevTools → Application → Icons
   - Скачайте наибольшее разрешение

2. **App Icons из магазинов приложений** (приоритет 2):
   - [App Store](https://apps.apple.com)
   - [Google Play](https://play.google.com)
   - Скриншот иконки приложения

3. **Создать монограмму** (запасной вариант):
   - Квадрат с первой буквой названия
   - Используйте фирменные цвета бренда
   - Жирный шрифт, по центру

### Инструменты:

- **Canva** - для создания квадратных иконок
- **Figma** - для обработки векторных лого
- **ImageMagick** - для батчевой обработки:
  ```bash
  magick convert icon.png -resize 512x512 -background white -gravity center -extent 512x512 1.png
  ```

## Архитектура системы магазинов

### Автоматическое обновление при изменении списка

Приложение использует систему версионирования для автоматического обновления списка магазинов:

```typescript
// services/shopping/storeService.ts
const CURRENT_STORES_VERSION = '2.0'; // Увеличивайте при изменении DEFAULT_STORES
```

При изменении версии приложение автоматически:

1. Сбросит кеш старых магазинов
2. Загрузит новый список DEFAULT_STORES
3. Сохранит пользовательские магазины (если они есть)

### Компоненты, использующие магазины

1. **ShoppingStoriesCarousel** (`components/shopping/ShoppingStoriesCarousel.tsx`)
   - Карусель на главной странице
   - Отображает иконки магазинов
   - При клике открывает все магазины в браузере

2. **TabsCarousel** (`components/shopping/TabsCarousel.tsx`)
   - Карусель вкладок в браузере
   - Переключение между магазинами
   - Текстовые названия

3. **ShoppingBrowserScreen** (`app/shopping/browser.tsx`)
   - WebView с магазинами
   - Детекция изображений товаров

## Добавление новых магазинов

Для добавления новых магазинов в дефолтный список:

1. Добавьте иконку в `assets/images/stores/` с именем `{id}.png`
2. Обновите `constants/storeLogos.ts`:
   ```typescript
   export const STORE_LOGOS = {
     // ... existing
     '12': require('@/assets/images/stores/12.png'),
   } as const;
   ```
3. Добавьте магазин в `services/shopping/storeService.ts`:
   ```typescript
   export const DEFAULT_STORES: Store[] = [
     // ... existing
     {
       id: '12',
       name: 'New Store',
       url: 'https://example.com',
       logoLocal: STORE_LOGOS['12'],
       isDefault: true,
       order: 12,
     },
   ];
   ```
4. **Увеличьте версию:**
   ```typescript
   const CURRENT_STORES_VERSION = '2.1'; // Было 2.0
   ```

## Тестирование

После добавления иконок:

1. Запустите приложение: `npx expo start`
2. Откройте главную страницу - проверьте карусель магазинов
3. Нажмите на магазин - откроется браузер со всеми магазинами
4. Проверьте переключение между вкладками
5. Убедитесь, что все иконки загружаются корректно

## Фолбэки

Если иконка не загрузится, система автоматически:

1. Попробует загрузить `logoUrl` (для кастомных магазинов)
2. Покажет монограмму (первая буква названия)

```tsx
// Пример в ShoppingStoriesCarousel.tsx
{
  store.logoLocal ? (
    <Image source={store.logoLocal} />
  ) : store.logoUrl ? (
    <Image source={{ uri: store.logoUrl }} />
  ) : (
    <View>
      <Text>{store.name[0]}</Text>
    </View>
  );
}
```
