# iOS Liquid Glass Tab Bar Implementation

**Дата реализации:** 2025-11-06  
**Expo SDK:** 54.0.0  
**Статус:** ✅ Реализовано

## Обзор

Внедрен официальный iOS liquid glass эффект для bottom navigation используя нативный `UITabBarController` от Apple через Expo Router's `NativeTabs` API.

## Что такое Liquid Glass?

Liquid Glass - это фирменный эффект Apple с iOS 15+, который создает полупрозрачный размытый фон с эффектом матового стекла. Контент плавно проходит под таб-баром, создавая ощущение глубины и иерархии.

## Технические детали

### Platform-Specific подход

Используется **разная реализация для iOS и Android**:

- **iOS**: `NativeTabs` с нативным `UITabBarController`
- **Android**: Традиционный `Tabs` с Material Design

### iOS Implementation

```typescript
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

<NativeTabs
  minimizeBehavior="onScrollDown"
  iconColor={PlatformColor('systemGray')}
  tintColor={PlatformColor('label')}
>
  <NativeTabs.Trigger name="index">
    <Label>Feed</Label>
    <Icon sf="house.fill" />
  </NativeTabs.Trigger>

  {/* More tabs... */}
</NativeTabs>
```

### Ключевые возможности

#### 1. **Автоматический Liquid Glass эффект**

- ✅ Нативное размытие из `UITabBarController`
- ✅ Полупрозрачный фон
- ✅ Адаптация под dark/light режим
- ✅ Smooth transitions

#### 2. **SF Symbols Integration**

Используются официальные SF Symbols от Apple:

| Tab      | SF Symbol              | Описание            |
| -------- | ---------------------- | ------------------- |
| Feed     | `house.fill`           | Дом (главная)       |
| Wardrobe | `tshirt.fill`          | Футболка (гардероб) |
| Outfits  | `square.grid.2x2.fill` | Сетка (образы)      |
| Profile  | `person.fill`          | Профиль             |

**Преимущества SF Symbols:**

- 🎨 Автоматическая адаптация под iOS system weight
- 📱 Поддержка Dynamic Type
- 🌓 Нативная поддержка dark mode
- 📦 Не требуют импорта библиотек иконок (1200+ иконок из коробки)

#### 3. **Minimize Behavior**

```typescript
minimizeBehavior = 'onScrollDown';
```

Таб-бар автоматически минимизируется при скролле вниз, максимизируя контент.

#### 4. **Platform Colors**

```typescript
iconColor={PlatformColor('systemGray')}
tintColor={PlatformColor('label')}
```

Используются системные цвета iOS для идеальной интеграции.

### Android Implementation

Традиционный подход с Material Design:

```typescript
<Tabs
  screenOptions={{
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    tabBarStyle: {
      backgroundColor: isDark ? '#000' : '#fff',
      borderTopColor: isDark ? '#333' : '#e0e0e0',
    }
  }}
>
  <Tabs.Screen
    name="index"
    options={{
      title: 'Feed',
      tabBarIcon: ({ color }) => <FontAwesome name="home" color={color} />
    }}
  />
</Tabs>
```

## Установленные пакеты

```json
{
  "expo-blur": "~15.0.7"
}
```

> **Примечание:** `expo-blur` установлен для будущих компонентов. Для `NativeTabs` он не требуется - эффект liquid glass идет из коробки от `UITabBarController`.

## Преимущества нового подхода

### ✅ Производительность

- Нативный рендеринг вместо JavaScript
- Плавные анимации 60 FPS
- Меньше нагрузки на батарею

### ✅ UX/UI

- Официальный iOS дизайн
- Идеальная интеграция с системой
- Accessibility из коробки
- VoiceOver поддержка

### ✅ Поддержка

- Автоматические обновления с iOS
- Нет кастомных хаков
- Стабильность долгосрочная

## Миграция с JavaScript Tabs

### До:

```typescript
<Tabs>
  <Tabs.Screen name="index" />
</Tabs>
```

### После (iOS):

```typescript
<NativeTabs>
  <NativeTabs.Trigger name="index">
    <Label>Home</Label>
    <Icon sf="house.fill" />
  </NativeTabs.Trigger>
</NativeTabs>
```

## Известные ограничения

1. **API является "unstable"**
   - Импорт из `expo-router/unstable-native-tabs`
   - Может измениться в будущих версиях SDK

2. **Только iOS получает liquid glass**
   - Android использует обычные tabs
   - Это нормально - у платформ разные дизайн-системы

3. **Не работает кастомный tabBar**
   - Нельзя переопределить весь компонент
   - Можно настраивать только через props

4. **Ограничения с icon libraries**
   - На iOS лучше использовать SF Symbols
   - FontAwesome/Ionicons работают, но не оптимально

## Отступы контента

Контент автоматически учитывает таб-бар. Обновлены компоненты:

- `components/wardrobe/ItemGrid.tsx` - paddingBottom 100px (iOS)
- `components/outfit/OutfitGrid.tsx` - paddingBottom 100px (iOS)
- `app/(tabs)/profile.tsx` - contentContainerStyle с paddingBottom

## Тестирование

### iOS (Симулятор/Устройство)

- [x] Liquid glass эффект виден
- [x] Контент плавно проходит под таб-баром
- [x] Минимизация при скролле работает
- [x] Dark mode корректно переключается
- [x] SF Symbols отображаются правильно

### Android

- [x] Стандартные tabs работают
- [x] Иконки FontAwesome отображаются
- [x] Material Design стиль соблюден

## Ресурсы

- [Expo NativeTabs Docs](https://docs.expo.dev/router/advanced/native-tabs/)
- [SF Symbols Browser](https://developer.apple.com/sf-symbols/)
- [iOS Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Liquid Glass Article](https://www.amillionmonkeys.co.uk/blog/expo-liquid-glass-tab-bar-ios)

## Следующие шаги

### Возможные улучшения:

1. **Badges на табах**

   ```typescript
   <Badge value={3} />
   ```

2. **Search tab для iOS 26**

   ```typescript
   <NativeTabs.Trigger name="search" role="search">
     <Label>Search</Label>
   </NativeTabs.Trigger>
   ```

3. **Кастомные цвета**
   Экспериментировать с `PlatformColor` для брендинга

4. **Accessibility**
   Добавить ARIA labels и hints

---

**Автор:** AI Assistant  
**Последнее обновление:** 2025-11-06
