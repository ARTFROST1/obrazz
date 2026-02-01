import { FloatingTabBar } from '@components/navigation/FloatingTabBar';
import { useTranslation } from '@hooks/useTranslation';
import { IS_IOS_26_OR_NEWER } from '@utils/platform';
import { Tabs, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, PlatformColor, StyleSheet, useColorScheme, View } from 'react-native';

import Colors from '../../constants/Colors';

// Shared platform detection (computed once per JS bundle load)
const supportsLiquidGlass = IS_IOS_26_OR_NEWER;

export default function TabLayout() {
  const { t } = useTranslation('navigation');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();

  // Determine if we're on profile tab to change add button icon
  const isProfileTab = pathname.includes('/profile');

  // Hide tab bar on add screen
  const shouldHideTabBar = pathname.includes('/add');

  // Android: Custom floating tab bar with split layout (3 main tabs + action button)
  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('tabs.home'),
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="library"
            options={{
              title: t('tabs.library'),
              headerShown: false,
            }}
          />
          {/* Hidden screens - old routes for backward compatibility */}
          <Tabs.Screen
            name="wardrobe"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="outfits"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('tabs.profile'),
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="add"
            options={{
              title: '',
              headerShown: false,
            }}
          />
        </Tabs>
      </View>
    );
  }

  // iOS: Native liquid glass tabs with SF Symbols and blur effect (3 tabs + floating plus)
  return (
    <View style={styles.container}>
      <NativeTabs
        // Hide tab bar on add screen (SDK 55 feature)
        hidden={shouldHideTabBar}
        // Liquid glass blur effect - works on all iOS versions (13+)
        blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
        // Shadow for depth
        shadowColor={PlatformColor('separator')}
        // Minimize behavior on scroll (iOS 26+ only)
        minimizeBehavior={supportsLiquidGlass ? 'onScrollDown' : undefined}
        // Color scheme
        iconColor={PlatformColor('systemGray')}
        tintColor={PlatformColor('label')}
        // Badge styling
        badgeBackgroundColor={Colors[colorScheme === 'dark' ? 'dark' : 'light'].tint}
        // Label styling
        labelStyle={{
          fontSize: 10,
          fontWeight: '500',
        }}
        disableTransparentOnScrollEdge={!supportsLiquidGlass}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="library">
          <NativeTabs.Trigger.Label>{t('tabs.library')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="rectangle.stack.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="add" role="search">
          <NativeTabs.Trigger.Label hidden />
          <NativeTabs.Trigger.Icon sf={isProfileTab ? 'gearshape.fill' : 'plus'} />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
