/**
 * SyncStatusIndicator - Shows sync status in UI
 *
 * Displays:
 * - 🟢 Synced
 * - 🟡 Pending (X changes)
 * - 🔴 Error
 * - ⚪ Offline
 */

import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@services/sync/networkMonitor';
import { syncService } from '@services/sync/syncService';
import { SyncStatus } from '@services/sync/types';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface Props {
  style?: ViewStyle;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

type StatusType = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

interface StatusConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  backgroundColor: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  synced: {
    icon: 'checkmark-circle',
    color: '#34C759',
    label: 'Синхронизировано',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  pending: {
    icon: 'time',
    color: '#FF9500',
    label: 'Ожидание синхронизации',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  syncing: {
    icon: 'sync',
    color: '#007AFF',
    label: 'Синхронизация...',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  error: {
    icon: 'alert-circle',
    color: '#FF3B30',
    label: 'Ошибка синхронизации',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  offline: {
    icon: 'cloud-offline',
    color: '#8E8E93',
    label: 'Офлайн',
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
};

const SIZE_CONFIG = {
  small: { icon: 16, font: 11, padding: 4 },
  medium: { icon: 20, font: 13, padding: 6 },
  large: { icon: 24, font: 15, padding: 8 },
};

export const SyncStatusIndicator: React.FC<Props> = ({
  style,
  showLabel = false,
  size = 'medium',
  onPress,
}) => {
  const { isOnline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const spinValue = useState(new Animated.Value(0))[0];

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Animate spin for syncing state
  useEffect(() => {
    if (syncStatus?.state === 'syncing') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [syncStatus?.state, spinValue]);

  // Determine status type
  const getStatusType = (): StatusType => {
    if (!isOnline) return 'offline';
    if (!syncStatus) return 'synced';

    switch (syncStatus.state) {
      case 'syncing':
        return 'syncing';
      case 'error':
        return 'error';
      default:
        return syncStatus.pendingCount > 0 ? 'pending' : 'synced';
    }
  };

  const statusType = getStatusType();
  const config = STATUS_CONFIG[statusType];
  const sizeConfig = SIZE_CONFIG[size];

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (statusType === 'pending' || statusType === 'error') {
      // Try to sync when pressed
      syncService.syncNow();
    }
  };

  const Container = onPress || statusType !== 'synced' ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: sizeConfig.padding * 2,
          paddingVertical: sizeConfig.padding,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={statusType === 'syncing' ? { transform: [{ rotate: spin }] } : undefined}
      >
        <Ionicons name={config.icon} size={sizeConfig.icon} color={config.color} />
      </Animated.View>

      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: config.color,
              fontSize: sizeConfig.font,
              marginLeft: sizeConfig.padding,
            },
          ]}
        >
          {statusType === 'pending' && syncStatus?.pendingCount
            ? `${syncStatus.pendingCount} изменений`
            : config.label}
        </Text>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
  },
  label: {
    fontWeight: '500',
  },
});

export default SyncStatusIndicator;
