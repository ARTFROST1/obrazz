# Architecture Reference — Obrazz

## Code Patterns

### React Native

#### Service Layer Pattern

Services инкапсулируют всю логику работы с данными:

```typescript
// services/wardrobe/itemService.ts
class ItemService {
  async getItems(userId: string): Promise<WardrobeItem[]> {
    const { data, error } = await supabase.from('items').select('*').eq('user_id', userId);

    if (error) throw new ServiceError(error.message);
    return data.map(this.mapDatabaseToItem);
  }

  private mapDatabaseToItem(data: any): WardrobeItem {
    return {
      id: data.id,
      userId: data.user_id, // snake_case → camelCase
      imageUrl: data.image_url,
      category: data.category,
      createdAt: new Date(data.created_at),
    };
  }
}

export const itemService = new ItemService();
```

#### Zustand Store with Persistence

```typescript
// store/wardrobe/wardrobeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@store/storage';

interface WardrobeState {
  items: WardrobeItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: WardrobeItem) => void;
  removeItem: (id: string) => void;

  // Selectors
  getFilteredItems: (category?: string) => WardrobeItem[];
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const items = await itemServiceOffline.getItems();
          set({ items, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      addItem: (item) => {
        set((state) => ({ items: [...state.items, item] }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      getFilteredItems: (category) => {
        const { items } = get();
        if (!category) return items;
        return items.filter((i) => i.category === category);
      },
    }),
    {
      name: 'wardrobe-store',
      storage: zustandStorage,
      partialize: (state) => ({ items: state.items }), // Only persist items
    },
  ),
);

// Usage with selectors for performance
const items = useWardrobeStore((state) => state.items);
const fetchItems = useWardrobeStore((state) => state.fetchItems);
```

#### Outfit Store (Complex State with Undo/Redo)

```typescript
// store/outfit/outfitStore.ts — 808 lines
interface OutfitState {
  // Selection state
  selectedItemsByCategory: Record<string, string[]>;

  // Canvas state
  currentItems: CanvasItem[];
  canvasSettings: CanvasSettings;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  selectItemForCategory: (category: string, itemId: string) => void;
  updateItemTransform: (itemId: string, transform: Transform) => void;
  undo: () => void;
  redo: () => void;
  saveOutfit: () => Promise<Outfit>;
  loadOutfitForEdit: (outfit: Outfit) => void;
}
```

#### Expo Router Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  // iOS 26+: NativeTabs with Liquid Glass
  // Android: Custom floating tab bar

  if (Platform.OS === 'ios') {
    return (
      <Tabs
        screenOptions={{
          tabBarStyle: { position: 'absolute' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="library" options={{ title: 'Library' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    );
  }

  // Android implementation...
}
```

### Rails Backend

#### Base API Controller

```ruby
# app/controllers/api/base_controller.rb
module Api
  class BaseController < ActionController::API
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from Auth::SupabaseJwtService::InvalidTokenError, with: :handle_unauthorized

    before_action :authenticate_user!
    before_action :track_activity

    attr_reader :current_user

    def authenticate_user!
      token = extract_bearer_token
      return render_unauthorized("Missing token") if token.blank?

      jwt_service = Auth::SupabaseJwtService.new(token)
      payload = jwt_service.decode
      @current_user = Auth::UserSyncService.sync_from_token(payload)

      render_unauthorized("User not active") unless @current_user&.active?
    end

    def render_success(data = nil, status: :ok, meta: {})
      response = { success: true }
      response[:data] = data if data
      response[:meta] = meta if meta.present?
      render json: response, status: status
    end

    def render_error(message, status: :bad_request, code: nil, details: nil)
      render json: {
        success: false,
        error: {
          message: message,
          code: code || status.to_s,
          details: details
        }.compact
      }, status: status
    end

    private

    def extract_bearer_token
      header = request.headers["Authorization"]
      header&.match(/Bearer (.+)/)&.captures&.first
    end
  end
end
```

#### Service Object Pattern

```ruby
# app/services/ai/generation_service.rb
module Ai
  class GenerationService
    class InsufficientTokensError < StandardError; end
    class GenerationError < StandardError; end

    def initialize(user)
      @user = user
      @client = TheNewBlackClient.new
      @token_service = Tokens::BalanceService.new(user)
    end

    def create_virtual_try_on(garment_url:, model_url:, **options)
      create_generation(
        generation_type: "virtual_try_on",
        input_params: { garment_url:, model_url:, **options },
        input_image_urls: [garment_url, model_url]
      ) do |generation|
        @client.create_virtual_try_on(garment_url:, model_url:, **options)
      end
    end

    private

    def create_generation(generation_type:, input_params:, input_image_urls:)
      tokens_cost = AiGeneration::TOKEN_COSTS[generation_type] || 1

      unless @user.can_generate?(tokens_cost)
        raise InsufficientTokensError, "Insufficient tokens"
      end

      ActiveRecord::Base.transaction do
        generation = @user.ai_generations.create!(
          generation_type:,
          status: "pending",
          tokens_cost:,
          input_params:,
          input_image_urls:
        )

        @token_service.debit_for_generation!(amount: tokens_cost, ai_generation: generation)

        api_response = yield(generation)
        generation.update!(external_id: api_response[:task_id], status: "processing")

        AiGenerationStatusJob.perform_later(generation.id)
        generation
      end
    end
  end
end
```

#### Model with Validations and Scopes

```ruby
# app/models/subscription.rb
class Subscription < ApplicationRecord
  belongs_to :user
  has_many :payments, dependent: :nullify

  PLANS = %w[free pro_monthly pro_yearly].freeze
  STATUSES = %w[active cancelled expired past_due].freeze

  PLAN_TOKENS = {
    "free" => 0,
    "pro_monthly" => 100,
    "pro_yearly" => 100
  }.freeze

  validates :plan, presence: true, inclusion: { in: PLANS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :user_id, uniqueness: true

  scope :active, -> { where(status: "active") }
  scope :pro, -> { where(plan: %w[pro_monthly pro_yearly]) }
  scope :expiring_soon, ->(days = 3) { where("current_period_end < ?", days.days.from_now) }

  def active? = status == "active"
  def pro? = plan.in?(%w[pro_monthly pro_yearly])
  def free? = plan == "free"
  def monthly_tokens = PLAN_TOKENS[plan] || 0
end
```

## Component Patterns

### UI Component with Props

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], styles[size]]}
    >
      {loading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </Pressable>
  );
};
```

### Gesture Handler Component

```typescript
// components/outfit/DraggableItem.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

export const DraggableItem = ({ item, onTransformEnd }) => {
  const translateX = useSharedValue(item.transform.x);
  const translateY = useSharedValue(item.transform.y);
  const scale = useSharedValue(item.transform.scale);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = item.transform.x + e.translationX;
      translateY.value = item.transform.y + e.translationY;
    })
    .onEnd(() => {
      onTransformEnd({
        x: translateX.value,
        y: translateY.value,
        scale: scale.value,
      });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, item.transform.scale * e.scale));
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.Image source={{ uri: item.imageUrl }} style={animatedStyle} />
    </GestureDetector>
  );
};
```

## Offline-First Architecture

```typescript
// services/sync/syncQueue.ts
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'item' | 'outfit';
  payload: any;
  createdAt: number;
  retries: number;
}

class SyncQueue {
  private queue: SyncOperation[] = [];

  async enqueue(operation: SyncOperation) {
    this.queue.push(operation);
    await this.persist();
  }

  async processQueue() {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) return;

    for (const op of this.queue) {
      try {
        await this.executeOperation(op);
        this.queue = this.queue.filter((o) => o.id !== op.id);
      } catch (error) {
        op.retries++;
        if (op.retries >= MAX_RETRIES) {
          // Move to dead letter queue
        }
      }
    }
    await this.persist();
  }
}
```

## Error Handling

### React Native

```typescript
// utils/errors/ServiceError.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Usage
try {
  await itemService.createItem(data);
} catch (error) {
  if (error instanceof ServiceError) {
    showToast(error.message);
  } else {
    console.error('[ItemService] Unexpected error:', error);
    showToast('Something went wrong');
  }
}
```

### Rails

```ruby
# Automatic error handling via BaseController
rescue_from ActiveRecord::RecordNotFound do |e|
  render_not_found(e.message)
end

rescue_from ActiveRecord::RecordInvalid do |e|
  render_validation_error(e.record.errors.full_messages)
end
```
