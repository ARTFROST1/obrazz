# Gesture Best Practices - ImageCropper

**Date:** November 10, 2025  
**Component:** `components/common/ImageCropper.tsx`

## Проблема

Жесты "зависали" и работали некорректно из-за неправильной композиции.

## Решение

### ✅ Правильная композиция: Gesture.Race

**НЕПРАВИЛЬНО:**

```typescript
// ❌ Simultaneous - жесты конфликтуют
const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
```

**ПРАВИЛЬНО:**

```typescript
// ✅ Race - жесты не конфликтуют, работает тот кто первый
const composedGesture = Gesture.Race(panGesture, pinchGesture);
```

### ✅ Pan: только 1 палец

**НЕПРАВИЛЬНО:**

```typescript
// ❌ Может работать с 2+ пальцами
const panGesture = Gesture.Pan()
  .onUpdate((e) => { ... });
```

**ПРАВИЛЬНО:**

```typescript
// ✅ Строго 1 палец
const panGesture = Gesture.Pan()
  .maxPointers(1)  // ВАЖНО!
  .onUpdate((e) => { ... });
```

### ✅ Pinch: с focal point

**НЕПРАВИЛЬНО:**

```typescript
// ❌ Zoom от центра экрана
const pinchGesture = Gesture.Pinch().onUpdate((e) => {
  scale.value = savedScale.value * e.scale;
});
```

**ПРАВИЛЬНО:**

```typescript
// ✅ Zoom к точке касания пальцев
const pinchGesture = Gesture.Pinch()
  .onStart((e) => {
    focalX.value = e.focalX; // Сохраняем точку
    focalY.value = e.focalY;
  })
  .onUpdate((e) => {
    const newScale = savedScale.value * e.scale;
    const constrainedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    // Zoom к точке касания
    const deltaScale = constrainedScale / scale.value;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = (SCREEN_HEIGHT - 160) / 2 + 80;

    translateX.value =
      (translateX.value - (e.focalX - centerX)) * deltaScale + (e.focalX - centerX);
    translateY.value =
      (translateY.value - (e.focalY - centerY)) * deltaScale + (e.focalY - centerY);

    scale.value = constrainedScale;
  });
```

### ✅ Правильное сохранение состояния

**НЕПРАВИЛЬНО:**

```typescript
// ❌ Не сохраняем базовые значения
const pinchGesture = Gesture.Pinch().onUpdate((e) => {
  scale.value = e.scale; // Неправильно!
});
```

**ПРАВИЛЬНО:**

```typescript
// ✅ Сохраняем базовые значения
const pinchGesture = Gesture.Pinch()
  .onUpdate((e) => {
    scale.value = savedScale.value * e.scale; // От сохраненного
  })
  .onEnd(() => {
    savedScale.value = scale.value; // Сохраняем новое
  });
```

## Полный код

```typescript
// Shared values
const scale = useSharedValue(1);
const savedScale = useSharedValue(1);
const translateX = useSharedValue(0);
const translateY = useSharedValue(0);
const savedTranslateX = useSharedValue(0);
const savedTranslateY = useSharedValue(0);
const focalX = useSharedValue(0);
const focalY = useSharedValue(0);

// Pinch gesture (2 fingers)
const pinchGesture = Gesture.Pinch()
  .onStart((e) => {
    focalX.value = e.focalX;
    focalY.value = e.focalY;
  })
  .onUpdate((e) => {
    const newScale = savedScale.value * e.scale;
    const constrainedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    const deltaScale = constrainedScale / scale.value;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = (SCREEN_HEIGHT - 160) / 2 + 80;

    translateX.value =
      (translateX.value - (e.focalX - centerX)) * deltaScale + (e.focalX - centerX);
    translateY.value =
      (translateY.value - (e.focalY - centerY)) * deltaScale + (e.focalY - centerY);

    scale.value = constrainedScale;
  })
  .onEnd(() => {
    savedScale.value = scale.value;
    savedTranslateX.value = translateX.value;
    savedTranslateY.value = translateY.value;

    if (scale.value < 1) {
      scale.value = withSpring(1);
      savedScale.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  });

// Pan gesture (1 finger)
const panGesture = Gesture.Pan()
  .maxPointers(1)
  .onUpdate((e) => {
    translateX.value = savedTranslateX.value + e.translationX;
    translateY.value = savedTranslateY.value + e.translationY;
  })
  .onEnd(() => {
    savedTranslateX.value = translateX.value;
    savedTranslateY.value = translateY.value;
  });

// Combine with Race
const composedGesture = Gesture.Race(panGesture, pinchGesture);
```

## Почему Gesture.Race?

| Композиция     | Поведение                      | Проблемы                  |
| -------------- | ------------------------------ | ------------------------- |
| `Simultaneous` | Оба жеста работают вместе      | ❌ Конфликты, зависания   |
| `Exclusive`    | Первый блокирует второй        | ❌ Нельзя переключиться   |
| **`Race`**     | Первый побеждает, потом другой | ✅ Плавно, без конфликтов |

## Почему maxPointers(1)?

```typescript
// ✅ С maxPointers(1)
1 палец: Pan работает
2 пальца: Pinch работает
3+ пальца: Ничего не работает

// ❌ Без maxPointers(1)
1 палец: Pan работает
2 пальца: Pan И Pinch конфликтуют! 🔴
```

## Focal Point Math

Zoom должен происходить к точке, где находятся пальцы:

```
Before zoom:
   [Screen Center]
      (focalPoint)
         [Image]

After zoom:
   [Screen Center]
      (same focalPoint position on screen!)
         [Zoomed Image]
```

**Formula:**

```typescript
// deltaScale = how much we're scaling
const deltaScale = newScale / oldScale;

// Adjust translation to keep focal point in same screen position
translateX.value = (translateX.value - offsetX) * deltaScale + offsetX;
```

## Результат

✅ **1 палец** = плавный drag  
✅ **2 пальца** = zoom к точке касания  
✅ **Нет зависаний**  
✅ **Нет конфликтов**  
✅ **Как в Instagram/Photos**

## References

- [react-native-gesture-handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Gesture.Race](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/composed-gestures/#race)
- [Gesture.Pinch](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pinch-gesture/)
- [Gesture.Pan](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture/)
