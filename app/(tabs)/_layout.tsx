import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 70 : 60,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom - 15, 5) : 5,
          paddingTop: 8,
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 10 : 0,
          left: Platform.OS === 'ios' ? 10 : 0,
          right: Platform.OS === 'ios' ? 10 : 0,
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          borderTopWidth: Platform.OS === 'ios' ? 0 : 1,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
          borderRadius: Platform.OS === 'ios' ? 20 : 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
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
