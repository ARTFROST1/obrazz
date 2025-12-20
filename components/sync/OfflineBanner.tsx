/**
 * OfflineBanner - Shows a banner when the app is offline
 *
 * Appears at the top of the screen to inform users they're working offline.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@services/sync/networkMonitor';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  message?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const OfflineBanner: React.FC<Props> = ({
  message = 'Вы работаете офлайн. Изменения будут синхронизированы автоматически.',
  onDismiss,
  showDismiss = false,
}) => {
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, slideAnim]);

  // Don't render if online
  if (isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color="#FFF" style={styles.icon} />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
        {showDismiss && onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8E8E93',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default OfflineBanner;
