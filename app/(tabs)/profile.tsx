/**
 * Profile Screen - Personal Dashboard (Личный кабинет)
 *
 * Shows:
 * - User info header
 * - Token balance with progress
 * - Subscription status
 * - Usage statistics
 * - Quick actions (Buy tokens via IAP, Upgrade, Web dashboard link)
 *
 * Payment Flow:
 * - Russian users → Web payment (YooKassa)
 * - Other users → Native IAP (App Store / Google Play)
 */

import {
  PurchaseModal,
  SubscriptionCard,
  TokenBalanceCard,
  UsageStatsCard,
} from '@components/profile';
import { Loader } from '@components/ui';
import { getTabBarPadding } from '@constants/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { subscriptionService } from '@services/subscription/subscriptionService';
import { useAuthStore } from '@store/auth/authStore';
import { useLibraryStore } from '@store/library/libraryStore';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { setLastVisitedTab } = useLibraryStore();
  const { subscription, isLoading, paymentRegion } = useSubscriptionStore();
  const { t } = useTranslation('profile');
  const [refreshing, setRefreshing] = useState(false);

  // IAP purchase modal state
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'subscription' | 'tokens'>('tokens');

  // Update StatusBar and track last visited tab when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLastVisitedTab('profile');
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
      }
    }, [setLastVisitedTab]),
  );

  // Fetch subscription status on mount
  useEffect(() => {
    subscriptionService.fetchSubscriptionStatus();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await subscriptionService.fetchSubscriptionStatus();
    setRefreshing(false);
  }, []);

  // Handle buy tokens
  const handleBuyTokens = useCallback(() => {
    if (paymentRegion === 'ru') {
      // Open web dashboard for Russian users
      Linking.openURL(subscriptionService.getTokensPurchaseUrl());
    } else {
      // Open IAP modal for iOS/Android
      setPurchaseType('tokens');
      setPurchaseModalVisible(true);
    }
  }, [paymentRegion]);

  // Handle upgrade subscription
  const handleUpgrade = useCallback(() => {
    if (paymentRegion === 'ru') {
      // Open web dashboard for Russian users
      Linking.openURL(subscriptionService.getSubscriptionUpgradeUrl());
    } else {
      // Open IAP subscription modal for iOS/Android
      setPurchaseType('subscription');
      setPurchaseModalVisible(true);
    }
  }, [paymentRegion]);

  // Handle manage subscription
  const handleManageSubscription = useCallback(() => {
    if (subscription.provider === 'ios') {
      // Open iOS subscription settings
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (subscription.provider === 'android') {
      // Open Google Play subscription settings
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    } else {
      // Open web dashboard
      Linking.openURL(subscriptionService.getDashboardUrl());
    }
  }, [subscription.provider]);

  if (isLoading && !refreshing) {
    return <Loader fullScreen />;
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('header.title')}</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.navigate('/(tabs)/add')}
            >
              <Ionicons name="settings-outline" size={22} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={44} color="#FFFFFF" />
            </View>
            {subscription.plan !== 'free' && (
              <View style={styles.planBadge}>
                <Ionicons name="diamond" size={12} color="#FFF" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>
            {user?.user_metadata?.full_name || t('userInfo.defaultName')}
          </Text>
          <Text style={styles.userEmail}>{user?.email || t('userInfo.noEmail')}</Text>
        </View>

        {/* Token Balance Card */}
        <TokenBalanceCard onBuyTokens={handleBuyTokens} />

        {/* Subscription Card */}
        <SubscriptionCard onUpgrade={handleUpgrade} onManage={handleManageSubscription} />

        {/* Usage Stats Card */}
        <UsageStatsCard />

        {/* Russian market notice */}
        {paymentRegion === 'ru' && (
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={22} color="#000000" />
            <Text style={styles.noticeText}>{t('payment.ruNotice')}</Text>
          </View>
        )}

        {/* Web Dashboard Link */}
        <TouchableOpacity
          style={styles.dashboardLink}
          onPress={() => Linking.openURL(subscriptionService.getDashboardUrl())}
        >
          <View style={styles.dashboardLinkContent}>
            <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
            <Text style={styles.dashboardLinkText}>{t('dashboard.openWeb')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Purchase Modal (IAP) */}
      <PurchaseModal
        visible={purchaseModalVisible}
        type={purchaseType}
        onClose={() => setPurchaseModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTop: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerContent: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : getTabBarPadding() + 20,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F0F0F0',
  },
  planBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: '#999',
    letterSpacing: -0.1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    borderRadius: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  dashboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  dashboardLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardLinkText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
});
