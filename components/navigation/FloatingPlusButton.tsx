/**
 * FloatingPlusButton - Context-Sensitive Plus Button
 *
 * A floating action button that appears in the bottom navigation area.
 * Behavior changes based on the current screen:
 *
 * - Home: Opens AI menu (Virtual Try-On, Fashion Models, Variations)
 * - Library (Wardrobe tab): Add new clothing item
 * - Library (Outfits tab): Create new outfit
 * - Profile: Hidden (button animates out)
 *
 * Uses Liquid Glass styling on iOS 26+ for consistency with native tab bar.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@store/library/libraryStore';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { router, usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Animation spring config
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

// Button size
const BUTTON_SIZE = 56;
const ICON_SIZE = 28;

// AI Menu options (for Home screen)
interface AIMenuOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface FloatingPlusButtonProps {
  style?: ViewStyle;
}

export const FloatingPlusButton: React.FC<FloatingPlusButtonProps> = ({ style }) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activeTab } = useLibraryStore();

  const canUseLiquidGlass = CAN_USE_LIQUID_GLASS;
  const [showAIMenu, setShowAIMenu] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);
  const menuProgress = useSharedValue(0);

  // Determine current screen context
  const screenContext = useMemo(() => {
    if (pathname === '/profile' || pathname === '/(tabs)/profile') {
      return 'profile';
    }
    if (
      pathname === '/' ||
      pathname === '/index' ||
      pathname === '/(tabs)' ||
      pathname === '/(tabs)/index'
    ) {
      return 'home';
    }
    if (pathname === '/library' || pathname === '/(tabs)/library') {
      return activeTab;
    }
    // Fallback for old wardrobe/outfits routes
    if (pathname === '/wardrobe' || pathname === '/(tabs)/wardrobe') {
      return 'wardrobe';
    }
    if (pathname === '/outfits' || pathname === '/(tabs)/outfits') {
      return 'outfits';
    }
    return 'home';
  }, [pathname, activeTab]);

  // Hide button on profile screen
  const isVisible = screenContext !== 'profile';

  // Animate visibility
  useEffect(() => {
    buttonOpacity.value = withTiming(isVisible ? 1 : 0, { duration: 200 });
    buttonScale.value = withSpring(isVisible ? 1 : 0.5, SPRING_CONFIG);
  }, [isVisible, buttonOpacity, buttonScale]);

  // AI Menu options (for Home screen)
  const aiMenuOptions: AIMenuOption[] = useMemo(
    () => [
      {
        id: 'virtual-try-on',
        icon: 'body-outline',
        label: 'Virtual Try-On',
        onPress: () => {
          setShowAIMenu(false);
          Alert.alert('Coming Soon', 'Virtual Try-On feature will be available soon!');
        },
      },
      {
        id: 'fashion-models',
        icon: 'people-outline',
        label: 'Fashion Models',
        onPress: () => {
          setShowAIMenu(false);
          Alert.alert('Coming Soon', 'Fashion Models feature will be available soon!');
        },
      },
      {
        id: 'variations',
        icon: 'color-palette-outline',
        label: 'Variations',
        onPress: () => {
          setShowAIMenu(false);
          Alert.alert('Coming Soon', 'Clothing Variations feature will be available soon!');
        },
      },
    ],
    [],
  );

  // Handle button press
  const handlePress = useCallback(() => {
    switch (screenContext) {
      case 'home':
        // Toggle AI menu
        setShowAIMenu((prev) => !prev);
        menuProgress.value = withSpring(showAIMenu ? 0 : 1, SPRING_CONFIG);
        break;
      case 'wardrobe':
        // Add new item
        router.push('/add-item');
        break;
      case 'outfits':
        // Create new outfit
        router.push('/outfit/create');
        break;
      default:
        break;
    }
  }, [screenContext, showAIMenu, menuProgress]);

  // Close menu when tapping outside
  const handleOverlayPress = useCallback(() => {
    setShowAIMenu(false);
    menuProgress.value = withSpring(0, SPRING_CONFIG);
  }, [menuProgress]);

  // Animated button style
  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  // Animated menu overlay style
  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0, 1], [0, 1]),
    pointerEvents: menuProgress.value > 0.5 ? ('auto' as const) : ('none' as const),
  }));

  // Animated menu item styles (pre-create for each item)
  const menuItem0Style = useAnimatedStyle(() => {
    const translateY = interpolate(menuProgress.value, [0, 1], [20, 0]);
    const opacity = interpolate(menuProgress.value, [0, 0.5, 1], [0, 0, 1]);
    const scale = interpolate(menuProgress.value, [0, 1], [0.8, 1]);
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const menuItem1Style = useAnimatedStyle(() => {
    const translateY = interpolate(menuProgress.value, [0, 1], [20, 0]);
    const opacity = interpolate(menuProgress.value, [0, 0.5, 1], [0, 0, 1]);
    const scale = interpolate(menuProgress.value, [0, 1], [0.8, 1]);
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const menuItem2Style = useAnimatedStyle(() => {
    const translateY = interpolate(menuProgress.value, [0, 1], [20, 0]);
    const opacity = interpolate(menuProgress.value, [0, 0.5, 1], [0, 0, 1]);
    const scale = interpolate(menuProgress.value, [0, 1], [0.8, 1]);
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const menuItemStyles = [menuItem0Style, menuItem1Style, menuItem2Style];

  // Get icon based on context
  const getIcon = () => {
    if (screenContext === 'home' && showAIMenu) {
      return 'close';
    }
    return 'add';
  };

  const buttonContent = (
    <Animated.View style={[styles.buttonContainer, animatedButtonStyle, style]}>
      {/* Button */}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        {canUseLiquidGlass ? (
          <GlassView style={styles.glassButton}>
            <Ionicons name={getIcon()} size={ICON_SIZE} color="#007AFF" />
          </GlassView>
        ) : (
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurButton}>
            <Ionicons name={getIcon()} size={ICON_SIZE} color="#007AFF" />
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  );

  // Render with conditional visibility
  if (!isVisible) {
    return null;
  }

  // For home screen, render with AI menu
  if (screenContext === 'home') {
    return (
      <>
        {/* AI Menu Overlay */}
        <Animated.View style={[styles.menuOverlay, animatedOverlayStyle]}>
          <Pressable style={styles.menuOverlayPressable} onPress={handleOverlayPress}>
            <View
              style={[
                styles.menuContainer,
                {
                  bottom: insets.bottom + 80, // Above the tab bar
                  right: 16,
                },
              ]}
            >
              {aiMenuOptions.map((option, index) => (
                <Animated.View key={option.id} style={menuItemStyles[index]}>
                  <Pressable
                    onPress={option.onPress}
                    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  >
                    {canUseLiquidGlass ? (
                      <GlassView style={styles.menuItemGlass}>
                        <Ionicons name={option.icon} size={24} color="#007AFF" />
                        <Text style={styles.menuItemLabel}>{option.label}</Text>
                      </GlassView>
                    ) : (
                      <BlurView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.menuItemBlur}
                      >
                        <Ionicons name={option.icon} size={24} color="#007AFF" />
                        <Text style={[styles.menuItemLabel, isDark && styles.menuItemLabelDark]}>
                          {option.label}
                        </Text>
                      </BlurView>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Pressable>
        </Animated.View>

        {/* Button */}
        {buttonContent}
      </>
    );
  }

  return buttonContent;
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  glassButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUTTON_SIZE / 2,
  },
  blurButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  menuOverlayPressable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    gap: 12,
  },
  menuItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItemPressed: {
    opacity: 0.8,
  },
  menuItemGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 16,
  },
  menuItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuItemLabelDark: {
    color: '#FFF',
  },
});
