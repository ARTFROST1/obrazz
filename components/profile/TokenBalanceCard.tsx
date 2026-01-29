/**
 * TokenBalanceCard - Displays user's token balance
 *
 * Shows:
 * - Available tokens
 * - Breakdown (subscription + purchased)
 * - Progress bar
 * - Buy more button
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TokenBalanceCardProps {
  onBuyTokens: () => void;
}

export function TokenBalanceCard({ onBuyTokens }: TokenBalanceCardProps) {
  const { t } = useTranslation('profile');
  const { tokenBalance, usage } = useSubscriptionStore();

  const percentUsed = (() => {
    if (usage.aiGenerationsLimit === 'unlimited') return 0;
    const limit = Number(usage.aiGenerationsLimit);
    if (!Number.isFinite(limit) || limit <= 0) return 0;
    return Math.round((usage.aiGenerationsUsed / limit) * 100);
  })();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t('tokens.title')}</Text>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceNumber}>{tokenBalance.available}</Text>
        <Text style={styles.balanceLabel}>{t('tokens.available')}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${Math.min(100, percentUsed)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {t('tokens.used', {
            used: usage.aiGenerationsUsed,
            total: usage.aiGenerationsLimit === 'unlimited' ? '∞' : usage.aiGenerationsLimit,
          })}
        </Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, { backgroundColor: '#000000' }]} />
          <Text style={styles.breakdownText}>
            {t('tokens.subscription')}: {tokenBalance.subscription}
          </Text>
        </View>
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, { backgroundColor: '#666666' }]} />
          <Text style={styles.breakdownText}>
            {t('tokens.purchased')}: {tokenBalance.purchased}
          </Text>
        </View>
      </View>

      {/* Buy button */}
      <TouchableOpacity style={styles.buyButton} onPress={onBuyTokens}>
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.buyButtonText}>{t('tokens.buyMore')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -2,
    lineHeight: 64,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    letterSpacing: -0.1,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  breakdownText: {
    fontSize: 13,
    color: '#666',
    letterSpacing: -0.1,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
});
