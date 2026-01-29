# In-App Purchases (IAP) — Obrazz

## Обзор

Obrazz использует гибридную систему платежей:

- **Глобальные пользователи**: Apple App Store / Google Play (IAP)
- **Российские пользователи**: Web-платежи через YooKassa

## Продукты

### Подписки

| Product ID               | Платформа | Описание    | Токены/месяц |
| ------------------------ | --------- | ----------- | ------------ |
| `com.obrazz.pro_monthly` | iOS       | Pro Monthly | 50           |
| `com.obrazz.pro_yearly`  | iOS       | Pro Yearly  | 50           |
| `com.obrazz.max_monthly` | iOS       | Max Monthly | 150          |
| `com.obrazz.max_yearly`  | iOS       | Max Yearly  | 150          |
| `pro_monthly`            | Android   | Pro Monthly | 50           |
| `pro_yearly`             | Android   | Pro Yearly  | 50           |
| `max_monthly`            | Android   | Max Monthly | 150          |
| `max_yearly`             | Android   | Max Yearly  | 150          |

### Пакеты токенов (Consumable)

| Product ID              | Платформа | Токены |
| ----------------------- | --------- | ------ |
| `com.obrazz.tokens_10`  | iOS       | 10     |
| `com.obrazz.tokens_30`  | iOS       | 30     |
| `com.obrazz.tokens_100` | iOS       | 100    |
| `com.obrazz.tokens_300` | iOS       | 300    |
| `tokens_10`             | Android   | 10     |
| `tokens_30`             | Android   | 30     |
| `tokens_100`            | Android   | 100    |
| `tokens_300`            | Android   | 300    |

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                       Mobile App                                 │
│                                                                  │
│   ┌─────────────────┐     ┌─────────────────────────────────┐  │
│   │ PurchaseModal   │────▶│ iapService                      │  │
│   │ (UI)            │     │ - initialize()                  │  │
│   └─────────────────┘     │ - getSubscriptions()            │  │
│           │               │ - getTokenPacks()               │  │
│           │               │ - purchaseSubscription()        │  │
│           ▼               │ - purchaseTokenPack()           │  │
│   ┌─────────────────┐     │ - restorePurchases()            │  │
│   │ regionService   │     │ - validateAndFinishPurchase()   │  │
│   │ - detectRegion()│     └─────────────────────────────────┘  │
│   └─────────────────┘                    │                      │
│           │                              │ Receipt              │
│           ▼                              ▼                      │
│   ┌─────────────────┐     ┌─────────────────────────────────┐  │
│   │ subscriptionSt. │     │ subscriptionService             │  │
│   │ - paymentRegion │     │ - validateIOSReceipt()          │  │
│   └─────────────────┘     │ - validateAndroidPurchase()     │  │
│                           └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Rails Backend                              │
│                                                                  │
│   POST /api/v1/iap/ios/validate                                 │
│   POST /api/v1/iap/android/validate                             │
│                                                                  │
│   - Проверка receipt с Apple/Google                             │
│   - Создание/обновление подписки                                │
│   - Начисление токенов                                          │
│   - Логирование транзакций                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Потоки покупок

### 1. Покупка подписки (IAP)

```
User → PurchaseModal → "Pro Monthly" → iapService.purchaseSubscription()
                                           │
                                           ▼
                                    App Store / Google Play
                                           │
                                           ▼
                              purchaseUpdatedListener()
                                           │
                                           ▼
                              validateAndFinishPurchase()
                                           │
                                           ▼
                              Rails: /api/v1/iap/ios/validate
                                           │
                                           ▼
                              finishTransaction() + refresh status
```

### 2. Покупка токенов (IAP)

```
User → PurchaseModal → "30 токенов" → iapService.purchaseTokenPack()
                                           │
                                           ▼
                                    App Store / Google Play
                                           │
                                           ▼
                              purchaseUpdatedListener()
                                           │
                                           ▼
                              validateAndFinishPurchase()
                                           │
                                           ▼
                              Rails: /api/v1/iap/ios/validate
                                           │
                                           ▼
                              finishTransaction() + addTokensLocal()
```

### 3. Web-платёж (RU)

```
User (RU) → Profile → "Pay on Website" → Linking.openURL()
                                              │
                                              ▼
                                         Rails Dashboard
                                              │
                                              ▼
                                         YooKassa Checkout
                                              │
                                              ▼
                                         Webhook → Rails
                                              │
                                              ▼
                                         Update subscription
```

## Определение региона

**Приоритет:**

1. Настройка языка в приложении (`ru` → RU region)
2. Локаль устройства (`ru-RU`, `ru_RU`)
3. Код страны (RU, BY, KZ)
4. Часовой пояс (Europe/Moscow, Asia/Yekaterinburg, etc.)

```typescript
// regionService.ts
const regionInfo = await regionService.detectAndSetRegion();
// { region: 'ru', locale: 'ru-RU', detectionMethod: 'setting' }
```

## Файловая структура

```
services/
├── iap/
│   └── iapService.ts          # IAP логика
├── region/
│   └── regionService.ts       # Определение региона
└── subscription/
    └── subscriptionService.ts # API к Rails backend

components/
└── profile/
    └── PurchaseModal.tsx      # UI выбора покупки

store/
└── subscription/
    └── subscriptionStore.ts   # paymentRegion, subscription state
```

## Инициализация

В `app/_layout.tsx`:

```typescript
useEffect(() => {
  // Detect region
  regionService.detectAndSetRegion();

  // Initialize IAP (only on native)
  if (Platform.OS !== 'web') {
    iapService.initialize();
  }

  return () => {
    if (Platform.OS !== 'web') {
      iapService.cleanup();
    }
  };
}, []);
```

## Установка зависимостей

```bash
# react-native-iap (для production)
npx expo install react-native-iap

# Или для dev builds
npx expo prebuild
cd ios && pod install
```

## Rails API Endpoints

### POST /api/v1/iap/ios/validate

```json
// Request
{
  "receipt_data": "base64_receipt_string",
  "product_id": "com.obrazz.pro_monthly"
}

// Response
{
  "success": true,
  "subscription": {
    "plan": "pro",
    "status": "active",
    "expires_at": "2025-02-28T00:00:00Z"
  },
  "tokens_added": null
}
```

### POST /api/v1/iap/android/validate

```json
// Request
{
  "purchase_token": "android_purchase_token",
  "product_id": "tokens_30"
}

// Response
{
  "success": true,
  "tokens_added": 30
}
```

## Тестирование

### iOS Sandbox

1. Создайте Sandbox Tester в App Store Connect
2. Выйдите из App Store на устройстве
3. При покупке введите sandbox credentials

### Android Test Track

1. Добавьте тестовых пользователей в Google Play Console
2. Используйте Internal Testing track
3. Тестовые покупки не списывают реальные деньги

## Обработка ошибок

```typescript
try {
  await iapService.purchaseSubscription(productId);
} catch (error) {
  if (error.code === 'E_USER_CANCELLED') {
    // User cancelled - no action needed
  } else if (error.code === 'E_ITEM_UNAVAILABLE') {
    // Product not available in this region
    Alert.alert('Недоступно', 'Продукт недоступен в вашем регионе');
  } else {
    // Generic error
    Alert.alert('Ошибка', error.message);
  }
}
```

## Checklist для релиза

- [ ] Создать продукты в App Store Connect
- [ ] Создать продукты в Google Play Console
- [ ] Настроить Shared Secret (iOS)
- [ ] Настроить Service Account (Android)
- [ ] Реализовать Rails endpoints
- [ ] Настроить Server-to-Server Notifications (iOS)
- [ ] Настроить Real-time developer notifications (Android)
- [ ] Тестирование в sandbox/test environment
- [ ] Review подачи в сторы
