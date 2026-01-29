# Routes Reference — Obrazz

## Rails Backend Routes

### API v1 (Mobile App)

Base URL: `https://api.obrazz.app/api/v1`

All API endpoints require Bearer token authentication (except webhooks).

#### Health Check

```
GET /health                 # Public health check
```

#### Users

```
GET    /users/me            # Get current user profile
PUT    /users/me            # Update current user profile
PATCH  /users/me            # Update current user profile (partial)
```

#### Tokens

```
GET    /tokens              # List token balances
GET    /tokens/balance      # Get total available balance
GET    /tokens/history      # Get token transaction history
```

Response example (`/tokens/balance`):

```json
{
  "success": true,
  "data": {
    "total": 53,
    "subscription_tokens": 45,
    "purchased_tokens": 5,
    "bonus_tokens": 3,
    "balances": [
      { "type": "subscription_tokens", "balance": 45, "expires_at": "2026-02-15T00:00:00Z" },
      { "type": "purchased_tokens", "balance": 5, "expires_at": null },
      { "type": "bonus_tokens", "balance": 3, "expires_at": "2026-02-28T00:00:00Z" }
    ]
  }
}
```

#### Subscriptions

```
GET    /subscription        # Get current subscription
POST   /subscription        # Create/start subscription
PUT    /subscription        # Update subscription
DELETE /subscription        # Cancel subscription
POST   /subscription/upgrade  # Upgrade plan
POST   /subscription/cancel   # Cancel with reason
```

#### AI Generations

```
GET    /ai_generations           # List user's generations
POST   /ai_generations           # Create new generation
GET    /ai_generations/:id       # Get generation details
POST   /ai_generations/:id/cancel  # Cancel pending generation
GET    /ai_generations/:id/status  # Poll status
```

Request example (`POST /ai_generations`):

```json
{
  "generation_type": "virtual_try_on",
  "garment_url": "https://storage.supabase.co/...",
  "model_url": "https://storage.supabase.co/...",
  "options": {
    "category": "upper_body"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "generation_type": "virtual_try_on",
    "status": "processing",
    "tokens_cost": 1,
    "created_at": "2026-01-29T12:00:00Z"
  }
}
```

#### AI Shortcuts

```
POST   /ai/virtual-try-on    # Quick virtual try-on
POST   /ai/fashion-model     # Quick fashion model
POST   /ai/variation         # Quick variation
```

#### Payments

```
GET    /payments             # List user payments
POST   /payments             # Create payment (YooKassa redirect)
GET    /payments/:id         # Get payment details
GET    /payments/token_packs # List available token packs
```

Request example (`POST /payments`):

```json
{
  "payment_type": "token_pack",
  "token_pack_id": "medium_200",
  "return_url": "obrazz://payment/callback"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "confirmation_url": "https://yoomoney.ru/checkout/...",
    "amount": 999,
    "currency": "RUB"
  }
}
```

#### Webhooks (Public, signature verified)

```
POST   /webhooks/yookassa       # YooKassa payment callbacks
POST   /webhooks/apple          # App Store callbacks
POST   /webhooks/google         # Google Play callbacks
POST   /webhooks/the_new_black  # AI generation callbacks
```

---

### Dashboard (User Cabinet)

Base URL: `https://dashboard.obrazz.app` or `/dashboard`

#### Authentication

```
GET    /login                   # Login page
POST   /login                   # Submit login (Supabase OAuth)
DELETE /logout                  # Logout
GET    /auth/callback           # OAuth callback
```

#### Dashboard Home

```
GET    /dashboard               # Dashboard home (stats, recent activity)
```

#### Subscription Management

```
GET    /dashboard/subscription        # View subscription
GET    /dashboard/subscription/plans  # View available plans
POST   /dashboard/subscription/upgrade    # Upgrade plan
POST   /dashboard/subscription/cancel     # Cancel subscription
POST   /dashboard/subscription/reactivate # Reactivate
```

#### Tokens

```
GET    /dashboard/tokens              # View token balance
GET    /dashboard/tokens/history      # Transaction history
POST   /dashboard/tokens/purchase     # Purchase tokens (YooKassa)
```

#### AI Generations Gallery

```
GET    /dashboard/generations         # List generations
GET    /dashboard/generations/:id     # View generation details
GET    /dashboard/generations/:id/download  # Download images
```

#### Settings

```
GET    /dashboard/settings            # View settings
PATCH  /dashboard/settings            # Update settings
DELETE /dashboard/settings/account    # Delete account
GET    /dashboard/settings/notifications      # Notification settings
PATCH  /dashboard/settings/notifications      # Update notifications
```

---

### Admin Panel

Base URL: `/admin` (HTTP Basic Auth)

```
GET    /admin                   # Admin dashboard (stats)

# Users
GET    /admin/users             # List users
GET    /admin/users/:id         # View user details

# Subscriptions
GET    /admin/subscriptions     # List subscriptions
GET    /admin/subscriptions/:id # View subscription
GET    /admin/subscriptions/:id/edit   # Edit form
PATCH  /admin/subscriptions/:id # Update subscription

# Payments
GET    /admin/payments          # List payments
GET    /admin/payments/:id      # View payment details

# AI Generations
GET    /admin/ai_generations    # List generations
GET    /admin/ai_generations/:id # View generation details

# Token Transactions
GET    /admin/token_transactions     # List transactions
GET    /admin/token_transactions/:id # View transaction
```

---

## React Native Routes (Expo Router)

### File-based routing in `app/` directory

#### Auth Group `(auth)/`

```
/welcome              # Welcome screen (app/(auth)/welcome.tsx)
/sign-in              # Sign in (app/(auth)/sign-in.tsx)
/sign-up              # Sign up (app/(auth)/sign-up.tsx)
/forgot-password      # Password recovery (app/(auth)/forgot-password.tsx)
```

#### Tabs Group `(tabs)/`

```
/                     # Home tab (app/(tabs)/index.tsx)
/library              # Wardrobe + Outfits (app/(tabs)/library.tsx)
/profile              # Profile (app/(tabs)/profile.tsx)
/add                  # Context-sensitive add (app/(tabs)/add.tsx)
```

#### Item Routes

```
/item/[id]            # Item detail (app/item/[id].tsx)
/add-item             # Add new item (app/add-item.tsx)
```

#### Outfit Routes

```
/outfit/[id]          # Outfit detail (app/outfit/[id].tsx)
/outfit/create        # Create outfit (app/outfit/create.tsx)
```

#### Shopping Routes

```
/shopping/browser     # Shopping WebView (app/shopping/browser.tsx)
```

---

## Navigation Examples

### React Native (Expo Router)

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to screen
router.push('/item/abc123');

// Replace current screen
router.replace('/(tabs)/library');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/outfit/create',
  params: { editId: 'xyz456' },
});
```

### API Calls (from React Native)

```typescript
// services/api/railsClient.ts
const RAILS_API_URL = process.env.EXPO_PUBLIC_RAILS_API_URL;

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(`${RAILS_API_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'API Error');
  }

  return data.data;
}

// Usage
const balance = await apiCall<TokenBalance>('/tokens/balance');
const generation = await apiCall<AiGeneration>('/ai_generations', {
  method: 'POST',
  body: JSON.stringify({
    generation_type: 'virtual_try_on',
    garment_url: '...',
    model_url: '...',
  }),
});
```
