/**
 * FloatingTabBar - Material Design 3 floating bottom navigation for Android
 *
 * Design inspired by iOS NativeTabs with split layout:
 * - Left: Main tabs (Home, Library, Profile) in a rounded pill
 * - Right: Action button (Add/Settings) as separate circular button
 *
 * Features:
 * - Glass-like translucent background matching iOS aesthetic
 * - Animated icons with scale and color transitions
 * - Ripple effects on Android
 * - Dark/light mode support
 * - Hides on add screen
 */

import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  type?: 'ionicons' | 'material';
}

// Animated tab icon with scale effect
function TabIcon({ name, focused, color, type = 'ionicons' }: TabIconProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 150 });
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const IconComponent = type === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent name={name as any} size={24} color={color} />
    </Animated.View>
  );
}

// Animated action button (Add/Settings)
interface ActionButtonProps {
  icon: string;
  onPress: () => void;
  activeColor: string;
  isDark: boolean;
}

function ActionButton({ icon, onPress, activeColor, isDark }: ActionButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.actionButton,
        isDark ? styles.actionButtonDark : styles.actionButtonLight,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{
        color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        borderless: true,
        radius: 28,
      }}
    >
      <Ionicons name={icon as any} size={26} color={activeColor} />
    </AnimatedPressable>
  );
}

// Tab button component
interface TabButtonProps {
  label: string;
  icon: string;
  iconFocused: string;
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  iconType?: 'ionicons' | 'material';
  isDark: boolean;
}

function TabButton({
  label,
  icon,
  iconFocused,
  focused,
  onPress,
  activeColor,
  inactiveColor,
  iconType = 'ionicons',
  isDark,
}: TabButtonProps) {
  return (
    <AnimatedPressable
      style={styles.tabButton}
      onPress={onPress}
      android_ripple={{
        color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        borderless: false,
        radius: 24,
      }}
    >
      <TabIcon
        name={focused ? iconFocused : icon}
        focused={focused}
        color={focused ? activeColor : inactiveColor}
        type={iconType}
      />
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: focused ? activeColor : inactiveColor },
          focused && styles.tabLabelFocused,
        ]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

// Main tabs configuration
const MAIN_TABS = [
  {
    key: 'index',
    label: 'Главная',
    icon: 'home-outline',
    iconFocused: 'home',
    iconType: 'ionicons' as const,
  },
  {
    key: 'library',
    label: 'Библиотека',
    icon: 'view-grid-outline',
    iconFocused: 'view-grid',
    iconType: 'material' as const,
  },
  {
    key: 'profile',
    label: 'Профиль',
    icon: 'person-outline',
    iconFocused: 'person',
    iconType: 'ionicons' as const,
  },
];

// Hidden tabs (not rendered in custom tab bar)
const HIDDEN_TABS = ['wardrobe', 'outfits'] as const;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // ⚠️ CRITICAL: All hooks MUST be called before any conditional returns
  // to comply with Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Sliding selection indicator state (MUST be before any returns)
  const [pillWidth, setPillWidth] = React.useState(0);
  const indicatorX = useSharedValue(0);

  const currentColorScheme = isDark ? 'dark' : 'light';
  const activeColor = Colors[currentColorScheme].tint;
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)';

  // Get current route name
  const currentRoute = state.routes[state.index]?.name;

  // Map hidden routes to the tab that should be visually active.
  // (Some screens live in the same tabs group but are not part of the visible bottom bar.)
  const activeRouteForMainTabs: string = (HIDDEN_TABS as readonly string[]).includes(currentRoute)
    ? 'library'
    : currentRoute;

  // Determine action button icon based on current tab
  const isProfileTab = activeRouteForMainTabs === 'profile';
  const actionIcon = isProfileTab ? 'settings-outline' : 'add';

  const handleActionPress = () => {
    const addRoute = state.routes.find((r) => r.name === 'add');
    if (addRoute) {
      navigation.navigate('add');
    }
  };

  const onPillLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== pillWidth) setPillWidth(width);
  };

  const mainTabIndex = Math.max(
    0,
    MAIN_TABS.findIndex((t) => t.key === activeRouteForMainTabs),
  );

  const innerPadding = 4 * 2; // left + right padding in mainTabsContainer
  const tabWidth = pillWidth > innerPadding ? (pillWidth - innerPadding) / MAIN_TABS.length : 0;

  useEffect(() => {
    if (tabWidth <= 0) return;
    indicatorX.value = withTiming(mainTabIndex * tabWidth, {
      duration: 200,
    });
  }, [indicatorX, mainTabIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  // ⚠️ NOW safe to return null after all hooks are called
  if (currentRoute === 'add') {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* Main tabs pill */}
      <View
        onLayout={onPillLayout}
        style={[styles.mainTabsContainer, isDark ? styles.containerDark : styles.containerLight]}
      >
        {/* Active tab indicator */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              isDark ? styles.activeIndicatorDark : styles.activeIndicatorLight,
              { width: tabWidth },
              indicatorStyle,
            ]}
          />
        )}
        {MAIN_TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.key);
          if (routeIndex === -1) return null;

          const route = state.routes[routeIndex];
          const { options } = descriptors[route.key];
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={tab.key}
              label={options.title || tab.label}
              icon={tab.icon}
              iconFocused={tab.iconFocused}
              focused={isFocused}
              onPress={onPress}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              iconType={tab.iconType}
              isDark={isDark}
            />
          );
        })}
      </View>

      {/* Action button (Add/Settings) */}
      <ActionButton
        icon={actionIcon}
        onPress={handleActionPress}
        activeColor={activeColor}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 4,
    gap: 4,

    // Shadow
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 56,
    borderRadius: 28,
  },
  activeIndicatorLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  activeIndicatorDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  containerDark: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.1,
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',

    // Shadow
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  actionButtonLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  actionButtonDark: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
