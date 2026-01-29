/**
 * UsageStatsCard - Displays user's usage statistics
 *
 * Shows:
 * - AI generations used
 * - Outfits created
 * - Wardrobe items count
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function UsageStatsCard() {
  const { t } = useTranslation('profile');
  const { usage } = useSubscriptionStore();

  const stats = [
    {
      icon: 'sparkles',
      label: t('stats.aiGenerations'),
      value: usage.aiGenerationsUsed,
      color: '#000000',
    },
    {
      icon: 'shirt',
      label: t('stats.outfits'),
      value: usage.outfitsCreated,
      color: '#000000',
    },
    {
      icon: 'cube',
      label: t('stats.wardrobeItems'),
      value: usage.wardrobeItemsCount,
      color: '#000000',
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('stats.title')}</Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: '#FFFFFF', borderColor: stat.color },
              ]}
            >
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
