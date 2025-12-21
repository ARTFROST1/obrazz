# Liquid Glass in Obrazz — Current Implementation (iOS 26+)

> **Date:** 2025-12-21  
> **Scope:** UI only (no social/community features)  
> **Target:** iOS 26+ with graceful fallback on iOS < 26 and Android

Этот документ заменяет устаревшие куски “плана” и фиксирует текущую архитектуру Liquid Glass в проекте. Старые черновики с локальными проверками версии iOS, force-remount подходами и альтернативной архитектурой больше не отражают текущий код.

---

## ✅ Что уже реализовано

### 1) Platform detection (единый источник истины)

- `utils/platform.ts`
  - `IS_IOS_26_OR_NEWER`
  - `CAN_USE_LIQUID_GLASS` = iOS 26+ && `isLiquidGlassAvailable()`

Важный принцип: **не дублируем** вычисления iOS-версии и availability по разным компонентам.

### 2) Wardrobe (header + FAB) на iOS 26+

- `app/(tabs)/wardrobe.tsx`
  - Glass UI включается **отложенно** (focus + root layout + after-interactions + 2x RAF), чтобы избежать бага первого холодного открытия.
  - После первого включения работает в режиме **run-once** (не выключается на blur), чтобы не было re-init при возвратах.
  - Классический header **не мигает** на iOS 26+ при поддержке Liquid Glass.

Компоненты:

- `components/ui/glass/GlassSearchBar.tsx`
- `components/ui/glass/GlassDropdownMenu.tsx`
- `components/ui/FAB.tsx`

### 3) Back / Favorite buttons (iOS 26+)

- `components/ui/glass/GlassBackButton.tsx`
- `components/ui/glass/GlassIconButton.tsx`
- Используются в:
  - `app/item/[id].tsx`
  - `app/outfit/[id].tsx`
  - `app/shopping/cart.tsx`
  - `components/outfit/ItemSelectionStepNew.tsx`
  - `components/outfit/CompositionStep.tsx`

### 4) Tab bar (iOS)

Tab bar на iOS использует `NativeTabs` и системные материалы (`systemChromeMaterial*`). На iOS 26 это визуально соответствует “Liquid Glass”-стилистике.

---

## 📦 Технологии

### `expo-glass-effect`

Используется для iOS 26+ стеклянного материала (glass) в кастомных контролах.

Документация:

- https://docs.expo.dev/versions/latest/sdk/glass-effect/

---

## 🧠 Правила/конвенции

1. **Проверка поддержки только через `utils/platform.ts`**  
   Не импортируем `isLiquidGlassAvailable()` напрямую в компонентах без необходимости.

2. **Избегаем раннего монтирования `GlassView` на cold start**  
   Если видите “контент без стекла” на первом открытии — сначала проверьте timing (focus/layout/interactions) до того, как пробовать force-remount.

3. **Run-once для проблемных экранов**  
   Если причина в раннем lifecycle, лучше один раз корректно включить glass UI и не дергать его при навигации.

4. **Fallback всегда должен быть функциональным**  
   На iOS < 26 и Android UI остается solid/обычным, но без потери функциональности.

---

## 🔎 Где смотреть

- Platform constants: `utils/platform.ts`
- Wardrobe enable algorithm: `app/(tabs)/wardrobe.tsx`
- Glass components: `components/ui/glass/*`

---

## 🧩 Рецепт для компонентов (iOS 26+)

Базовый паттерн в проекте:

1. **Один источник истины**: `utils/platform.ts` (`CAN_USE_LIQUID_GLASS`)
2. **Условный рендер**: glass-ветка только при `CAN_USE_LIQUID_GLASS`
3. **Fallback**: обычный UI для iOS < 26 / Android

Пример:

```tsx
import { CAN_USE_LIQUID_GLASS } from '@/utils/platform';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import { Pressable, TouchableOpacity } from 'react-native';

export function MyGlassButton({ onPress }: { onPress: () => void }) {
  if (!CAN_USE_LIQUID_GLASS) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {/* fallback */}
      </TouchableOpacity>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <GlassView glassEffectStyle="regular" isInteractive>
        {/* content */}
      </GlassView>
    </Pressable>
  );
}
```

### Wardrobe — особый кейс

Если вы видите баг “контент без стекла” на **первом холодном открытии**, повторите стратегию Wardrobe:

- включайте стеклянную ветку **отложенно** (focus + root layout + after-interactions + 2x RAF)
- после первого включения — **run-once** (не выключать на blur)

См. `app/(tabs)/wardrobe.tsx`.

---

Документ intentionally оставлен коротким и актуальным. Устаревшие черновики/планы удалены, чтобы не конфликтовать с текущей реализацией.

- [x] Улучшить стили: borderRadius 24, overflow hidden

**Улучшения v2 (2025-12-21):**

- [x] **Search bar:** увеличен borderRadius до 24px, height до 48px
- [x] **Dropdown:** custom dropdown реализован сейчас; нативный UIMenu возможен позже (см. флаг в `GlassDropdownMenu.tsx`)
- [x] **Trigger button:** размер увеличен до 48x48, borderRadius 24
- [x] **Паддинги:** улучшены для лучшего визуального восприятия

### Phase 3: Headers

- [ ] Создать `GlassHeader` компонент
- [ ] Обновить заголовки всех tab screens
- [ ] Добавить scroll edge effect

### Phase 4: Modals

- [ ] Создать `GlassModalHeader`
- [ ] Обновить модальные окна

### Phase 5: Toolbars

- [ ] Создать `GlassToolbar`
- [ ] Обновить toolbar в outfit creation

### Phase 6: Search & Chips

- [ ] Обновить другие search bars (если появятся) на `GlassSearchBar`
- [ ] Опционально: Glass filter chips

### Phase 7: Testing & QA

- [ ] Тестирование на iOS 26+
- [ ] Тестирование на iOS < 26
- [ ] Тестирование на Android
- [ ] Accessibility testing (Reduce Transparency)
- [ ] Performance profiling
- [ ] Dark/Light mode verification

---

**Автор:** GitHub Copilot  
**Дата создания:** 2025-12-21  
**Последнее обновление:** 2025-12-21  
**Реализовано:** FAB (Floating Action Button) ✅

---

## 📚 Дополнительные ресурсы

### Официальная документация

- **Expo GlassEffect:** https://docs.expo.dev/versions/latest/sdk/glass-effect/
- **Expo Router Native Tabs:** https://docs.expo.dev/router/advanced/native-tabs/
- **React Native Platform:** https://reactnative.dev/docs/platform
- **PlatformColor:** https://reactnative.dev/docs/platformcolor

### GitHub Repositories

- **expo-glass-effect:** https://github.com/expo/expo/tree/main/packages/expo-glass-effect
- **expo-router:** https://github.com/expo/expo/tree/main/packages/expo-router

### Видео

- **Liquid Glass Tabs with Expo Router:** https://www.youtube.com/watch?v=QqNZXdGFl44  
  **Реализовано:** FAB (Floating Action Button) ✅

---

## 📚 Дополнительные ресурсы

### Официальная документация

- **Expo GlassEffect:** https://docs.expo.dev/versions/latest/sdk/glass-effect/
- **Expo Router Native Tabs:** https://docs.expo.dev/router/advanced/native-tabs/
- **React Native Platform:** https://reactnative.dev/docs/platform
- **PlatformColor:** https://reactnative.dev/docs/platformcolor

### GitHub Repositories

- **expo-glass-effect:** https://github.com/expo/expo/tree/main/packages/expo-glass-effect
- **expo-router:** https://github.com/expo/expo/tree/main/packages/expo-router

### Видео

- **Liquid Glass Tabs with Expo Router:** https://www.youtube.com/watch?v=QqNZXdGFl44
