import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import type { CartItem } from '@/types/models/store';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Hook for batch processing items from cart or gallery
 * Sequentially navigates to add-item screen for each item
 */
export function useBatchItemProcessing() {
  const router = useRouter();
  const { startBatchProcessing, updateBatchProgress, isBatchProcessing } =
    useShoppingBrowserStore();

  const processBatch = useCallback(
    async (items: CartItem[]) => {
      if (items.length === 0) return;

      // Start batch processing
      startBatchProcessing(items.length);

      // For MVP: процессим items последовательно через add-item screen
      // TODO: Полная реализация требует coordination между экранами
      // Сейчас просто открываем первый item
      const firstItem = items[0];

      if (firstItem) {
        router.push({
          pathname: '/add-item',
          params: {
            imageUrl: firstItem.image.url,
            source: 'web',
            batchMode: 'true',
            batchTotal: items.length.toString(),
            batchCurrent: '1',
          },
        });

        // Update progress
        updateBatchProgress(1);
      }

      // Note: После сохранения на add-item screen,
      // нужно будет вернуться сюда и продолжить со следующим item
      // Это требует более сложной логики с navigation listeners
    },
    [router, startBatchProcessing, updateBatchProgress],
  );

  const processBatchFromCart = useCallback(async () => {
    const { cartItems } = useShoppingBrowserStore.getState();
    await processBatch(cartItems);
  }, [processBatch]);

  return {
    processBatch,
    processBatchFromCart,
    isBatchProcessing,
  };
}
