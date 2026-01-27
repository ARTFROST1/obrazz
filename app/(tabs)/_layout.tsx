import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '@hooks/useTranslation';
import { IS_IOS_26_OR_NEWER } from '@utils/platform';
import { Tabs, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, PlatformColor, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Determine if we're on profile tab to change add button icon
  const isProfileTab = pathname.includes('/profile');

  // Android: Floating bottom nav with Apple-inspired design (3 tabs + floating plus)
  if (Platform.OS === 'android') {
    const currentColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
    return (
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[currentColorScheme].tint,
            headerShown: false,
            tabBarStyle: {
              // Floating nav styling - 4 tabs total
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
            name="library"
            options={{
              title: t('tabs.library'),
              tabBarIcon: ({ color }) => <TabBarIconIonic name="library" color={color} />,
              headerShown: false,
            }}
          />
          {/* Hidden screens - old routes for backward compatibility */}
          <Tabs.Screen
            name="wardrobe"
            options={{
              href: null, // Hide from tab bar
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="outfits"
            options={{
              href: null, // Hide from tab bar
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
          <Tabs.Screen
            name="add"
            options={{
              title: '',
              tabBarIcon: ({ color }) => (
                <TabBarIcon name={isProfileTab ? 'gear' : 'plus'} color={color} />
              ),
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
