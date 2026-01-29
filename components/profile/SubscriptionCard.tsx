/**
 * SubscriptionCard - Displays current subscription status
 *
 * Shows:
 * - Current plan (Free/Pro/Max)
 * - Status and expiration
 * - Upgrade button
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { PLAN_TOKENS, useSubscriptionStore } from '@store/subscription/subscriptionStore';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubscriptionCardProps {
  onUpgrade: () => void;
  onManage: () => void;
}

export function SubscriptionCard({ onUpgrade, onManage }: SubscriptionCardProps) {
  const { t, i18n } = useTranslation('profile');
  const { subscription, getPlanDisplayName } = useSubscriptionStore();

  const isPaid = subscription.plan !== 'free';
  const planTokens = PLAN_TOKENS[subscription.plan];

  // Format expiration date
  const formatDate = (date?: Date | string) => {
    const parsed = date instanceof Date ? date : date ? new Date(date) : undefined;
    if (!parsed || Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Plan colors
  const planColors: Record<string, { bg: string; text: string; icon: string }> = {
    free: { bg: '#FFFFFF', text: '#000000', icon: '#666666' },
    pro: { bg: '#FFFFFF', text: '#000000', icon: '#000000' },
    max: { bg: '#000000', text: '#FFFFFF', icon: '#FFFFFF' },
  };

  const colors = planColors[subscription.plan];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.planBadge, { backgroundColor: colors.bg }]}>
          <Ionicons
            name={subscription.plan === 'free' ? 'person' : 'diamond'}
            size={16}
            color={colors.icon}
          />
          <Text style={[styles.planName, { color: colors.text }]}>{getPlanDisplayName()}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: subscription.status === 'active' ? '#F0F0F0' : '#FAFAFA' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: subscription.status === 'active' ? '#000000' : '#666666' },
            ]}
          >
            {t(`subscription.status.${subscription.status}`)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="flash-outline" size={18} color="#000000" />
          <Text style={styles.infoText}>
            {t('subscription.monthlyTokens', { count: planTokens })}
          </Text>
        </View>

        {isPaid && subscription.expiresAt && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#000000" />
            <Text style={styles.infoText}>
              {subscription.autoRenewal
                ? t('subscription.renewsOn', { date: formatDate(subscription.expiresAt) })
                : t('subscription.expiresOn', { date: formatDate(subscription.expiresAt) })}
            </Text>
          </View>
        )}

        {isPaid && (
          <View style={styles.infoRow}>
            <Ionicons
              name={
                subscription.provider === 'ios'
                  ? 'logo-apple'
                  : subscription.provider === 'android'
                    ? 'logo-google-playstore'
                    : 'globe-outline'
              }
              size={18}
              color="#000000"
            />
            <Text style={styles.infoText}>
              {t(`subscription.provider.${subscription.provider}`)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!isPaid ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Ionicons name="arrow-up-circle" size={20} color="#FFF" />
            <Text style={styles.upgradeButtonText}>{t('subscription.upgrade')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <Text style={styles.manageButtonText}>{t('subscription.manage')}</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    letterSpacing: -0.1,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 10,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  manageButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -0.1,
  },
});
