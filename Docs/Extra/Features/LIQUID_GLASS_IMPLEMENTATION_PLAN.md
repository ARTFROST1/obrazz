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

### 3) Outfits (header + FAB) на iOS 26+ + always-dark screen

- `app/(tabs)/outfits.tsx`
  - Использует тот же deferred enable + run-once паттерн, что и Wardrobe.
  - Header: `components/outfit/OutfitHeader.tsx` (Glass на iOS 26+, fallback на остальных).
  - FAB: `components/ui/FAB.tsx` (Glass на iOS 26+ при `liquidGlassEnabled`).
  - **Важно:** экран Outfits намеренно всегда тёмный на всех платформах.
    - Для fallback UI используется `forceDark` в `SearchBar`/`DropdownMenu`.

### 4) Back / Favorite buttons (iOS 26+)

- `components/ui/glass/GlassBackButton.tsx`
- `components/ui/glass/GlassIconButton.tsx`
- Используются в:
  - `app/item/[id].tsx`
  - `app/outfit/[id].tsx`
  - `app/shopping/cart.tsx`
  - `components/outfit/ItemSelectionStepNew.tsx`
  - `components/outfit/CompositionStep.tsx`

### 5) Tab bar (iOS)

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
- Outfits enable algorithm: `app/(tabs)/outfits.tsx`
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

### Wardrobe / Outfits — особый кейс

Если вы видите баг “контент без стекла” на **первом холодном открытии**, повторите стратегию Wardrobe:

- включайте стеклянную ветку **отложенно** (focus + root layout + after-interactions + 2x RAF)
- после первого включения — **run-once** (не выключать на blur)

См. `app/(tabs)/wardrobe.tsx` и `app/(tabs)/outfits.tsx`.

---

## 🧪 Мини-чеклист (ручная проверка)

- iOS 26+ cold start → сразу открыть Wardrobe/Outfits: glass фон должен примениться сразу.
- Переключение табов туда-сюда: glass UI не должен «переинициализироваться»/мигать.
- Dropdown: открывается/закрывается, действия срабатывают.
- Android / iOS < 26: fallback UI функционален и не ломает UX.

---

## 📚 Ресурсы

- Expo GlassEffect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- Expo Router Native Tabs: https://docs.expo.dev/router/advanced/native-tabs/
- React Native PlatformColor: https://reactnative.dev/docs/platformcolor

---

**Автор:** GitHub Copilot  
**Последнее обновление:** 2025-12-21
