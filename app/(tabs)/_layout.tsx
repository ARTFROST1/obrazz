import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '@hooks/useTranslation';
import { IS_IOS_26_OR_NEWER } from '@utils/platform';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, PlatformColor, useColorScheme } from 'react-native';

import Colors from '../../constants/Colors';

// Shared platform detection (computed once per JS bundle load)
const supportsLiquidGlass = IS_IOS_26_OR_NEWER;

// Tab bar icon component for Android
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Tab bar icon component for Android (Ionicons)
function TabBarIconIonic(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { t } = useTranslation('navigation');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Android: Floating bottom nav with Apple-inspired design
  if (Platform.OS === 'android') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarStyle: {
            // Floating nav styling
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,

            // Rounded corners and background
            backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,

            // Remove default border
            borderTopWidth: 0,

            // Shadow for floating effect
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 12,

            // Subtle border
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 2,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            title: t('tabs.wardrobe'),
            tabBarIcon: ({ color }) => <TabBarIconIonic name="shirt" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: t('tabs.outfits'),
            tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>
    );
  }

  // iOS: Native liquid glass tabs with SF Symbols and blur effect
  // For iOS 26+: Full liquid glass with minimizeBehavior
  // For iOS 13-25: Blur effect works, but we ensure explicit styling for visibility
  return (
    <NativeTabs
      // Liquid glass blur effect - works on all iOS versions (13+)
      // Using systemChromeMaterial for best translucent glass effect
      blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
      // Shadow for depth - ensures tab bar is visible
      shadowColor={PlatformColor('separator')}
      // Minimize behavior on scroll (iOS 26+ only, gracefully ignored on older versions)
      minimizeBehavior={supportsLiquidGlass ? 'onScrollDown' : undefined}
      // Color scheme - using platform colors for proper contrast
      iconColor={PlatformColor('systemGray')}
      tintColor={PlatformColor('label')}
      // Badge styling
      badgeBackgroundColor={Colors[colorScheme ?? 'light'].tint}
      // Label styling for consistency
      labelStyle={{
        fontSize: 10,
        fontWeight: '500',
      }}
      // Keep blur consistent when scrolling
      // Setting to true for older iOS ensures the background stays visible
      disableTransparentOnScrollEdge={!supportsLiquidGlass}
    >
      <NativeTabs.Trigger name="index">
        <Label>{t('tabs.home')}</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wardrobe">
        <Label>{t('tabs.wardrobe')}</Label>
        <Icon sf="tshirt.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="outfits">
        <Label>{t('tabs.outfits')}</Label>
        <Icon sf="square.grid.2x2.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>{t('tabs.profile')}</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
