# iOS Tab Bar (NativeTabs) + System Materials

**Дата реализации:** 2025-11-06  
**Обновлено:** 2025-12-21  
**Expo SDK:** 54.x  
**Статус:** ✅ Реализовано

## Обзор

Bottom navigation на iOS реализован через Expo Router `NativeTabs` (нативный `UITabBarController`) и системные материалы (`systemChromeMaterial*`).

Важно:

- Это **системный материал/blur**, доступный и на более ранних версиях iOS.
- На **iOS 26+** визуально это соответствует Apple “Liquid Glass” стилистике.
- Для **кастомных стеклянных контролов** (поиск/кнопки) используется отдельный механизм `expo-glass-effect`.

## Что такое Liquid Glass?

Liquid Glass — визуальный материал Apple, представленный в iOS 26. Он похож на “blur/material”, но с акцентом на преломление/текучесть.

Для Tab Bar мы используем **системные материалы** через `NativeTabs`, а для кастомных view — `expo-glass-effect`.

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

#### 1. **Системный материал (blur/material)**

- ✅ Нативный системный материал из `UITabBarController`
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

> **Примечание:** `expo-blur` не обязателен для `NativeTabs` — системный материал идет из коробки через `UITabBarController`.

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

Документ оставляем как справку по текущей реализации. Развитие Liquid Glass UI (не только Tab Bar) описано отдельно в документации по Wardrobe/Glass-компонентам.

---

**Автор:** AI Assistant  
**Последнее обновление:** 2025-11-06
