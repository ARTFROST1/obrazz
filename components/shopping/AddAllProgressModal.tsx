import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddAllProgressModal() {
  const { isBatchProcessing, batchProgress, finishBatchProcessing } = useShoppingBrowserStore();

  const { current, total } = batchProgress;
  const progress = total > 0 ? (current / total) * 100 : 0;

  const handleCancel = () => {
    finishBatchProcessing();
  };

  if (!isBatchProcessing) {
    return null;
  }

  return (
    <Modal visible={isBatchProcessing} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Добавление вещей</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          {/* Counter */}
          <Text style={styles.counter}>
            Вещь {current} из {total}
          </Text>

          {/* Loading Indicator */}
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Отменить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  counter: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 24,
  },
  loader: {
    marginBottom: 24,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FF3B30',
  },
});
