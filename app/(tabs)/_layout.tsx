import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useColorScheme, Platform, PlatformColor } from 'react-native';

import Colors from '../../constants/Colors';

// Tab bar icon component for Android
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Android: Use traditional Tabs with custom styling
  if (Platform.OS === 'android') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 5,
            paddingTop: 8,
            backgroundColor: isDark ? '#000' : '#fff',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#333' : '#e0e0e0',
            elevation: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            title: 'Wardrobe',
            tabBarIcon: ({ color }) => <TabBarIcon name="th" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: 'Outfits',
            tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>
    );
  }

  // iOS: Native liquid glass tabs with SF Symbols
  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      iconColor={PlatformColor('systemGray')}
      tintColor={PlatformColor('label')}
    >
      <NativeTabs.Trigger name="index">
        <Label>Feed</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wardrobe">
        <Label>Wardrobe</Label>
        <Icon sf="tshirt.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="outfits">
        <Label>Outfits</Label>
        <Icon sf="square.grid.2x2.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
