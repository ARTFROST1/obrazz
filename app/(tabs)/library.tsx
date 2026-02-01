/**
 * Library Screen - Unified Wardrobe + Outfits Screen
 *
 * This screen combines the Wardrobe and Outfits sections into a single
 * unified Library screen with native Liquid Glass segment control for switching.
 *
 * Features:
 * - Native iOS segment control with Liquid Glass effect
 * - Smooth theme transition (light for Wardrobe, dark for Outfits)
 * - Preserves existing header functionality (search + menu)
 * - Tab state persistence via Zustand store
 */

import { LibrarySegmentControl } from '@components/library/LibrarySegmentControl';
import { OutfitsTab } from '@components/library/OutfitsTab';
import { WardrobeTab } from '@components/library/WardrobeTab';
import { useLibraryStore } from '@store/library/libraryStore';
import { CAN_USE_LIQUID_GLASS, IS_IOS_26_OR_NEWER } from '@utils/platform';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  InteractionManager,
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Theme colors
const WARDROBE_BG = '#F2F2F7'; // Light theme background
const OUTFITS_BG = '#000000'; // Dark theme background
const WARDROBE_BG_GLASS = 'transparent';
const OUTFITS_BG_GLASS = 'transparent';

// Segment control height for header offset calculation
const SEGMENT_CONTROL_HEIGHT = 44;
const SEGMENT_CONTROL_MARGIN = 12;
const SEGMENT_CONTROL_EXTRA_SPACING = 12;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab, setLastVisitedTab } = useLibraryStore();

  // Platform detection
  const isIOS26 = IS_IOS_26_OR_NEWER;
  const canUseLiquidGlass = CAN_USE_LIQUID_GLASS;
  const [rootLayoutReady, setRootLayoutReady] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [useLiquidGlassUI, setUseLiquidGlassUI] = useState(false);
  const supportsLiquidGlass = canUseLiquidGlass && useLiquidGlassUI;

  // Animation value for theme transition (0 = wardrobe/light, 1 = outfits/dark)
  const themeProgress = useSharedValue(activeTab === 'wardrobe' ? 0 : 1);

  // Track screen focus for Liquid Glass initialization and last visited tab
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      setLastVisitedTab('library');

      // Set status bar based on active tab
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle(activeTab === 'wardrobe' ? 'dark-content' : 'light-content', true);
      }

      return () => {
        setIsScreenFocused(false);
      };
    }, [activeTab, setLastVisitedTab]),
  );

  // Enable Liquid Glass after screen is ready
  useEffect(() => {
    if (!canUseLiquidGlass) {
      setUseLiquidGlassUI(false);
      return;
    }

    if (useLiquidGlassUI) return;
    if (!isScreenFocused || !rootLayoutReady) return;

    let cancelled = false;
    let raf1: number | null = null;
    let raf2: number | null = null;

    const interactionTask = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return;
          LayoutAnimation.configureNext({
            duration: 250,
            create: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.opacity,
            },
            update: { type: LayoutAnimation.Types.easeInEaseOut },
          });
          setUseLiquidGlassUI(true);
        });
      });
    });

    return () => {
      cancelled = true;
      interactionTask.cancel();
      if (raf1 != null) cancelAnimationFrame(raf1);
      if (raf2 != null) cancelAnimationFrame(raf2);
    };
  }, [canUseLiquidGlass, isIOS26, isScreenFocused, rootLayoutReady, useLiquidGlassUI]);

  // Animate theme transition when tab changes
  useEffect(() => {
    themeProgress.value = withTiming(activeTab === 'wardrobe' ? 0 : 1, { duration: 300 });

    // Update status bar
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle(activeTab === 'wardrobe' ? 'dark-content' : 'light-content', true);
    }
  }, [activeTab, themeProgress]);

  // Animated background style for theme transition
  const animatedContainerStyle = useAnimatedStyle(() => {
    const bgLight = supportsLiquidGlass ? WARDROBE_BG_GLASS : WARDROBE_BG;
    const bgDark = supportsLiquidGlass ? OUTFITS_BG_GLASS : OUTFITS_BG;

    return {
      backgroundColor: interpolateColor(themeProgress.value, [0, 1], [bgLight, bgDark]),
    };
  }, [supportsLiquidGlass]);

  const handleTabChange = useCallback(
    (tab: 'wardrobe' | 'outfits') => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

  // Calculate header offset for tabs (includes segment control)
  const segmentControlOffset =
    SEGMENT_CONTROL_HEIGHT + SEGMENT_CONTROL_MARGIN + SEGMENT_CONTROL_EXTRA_SPACING;

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      onLayout={() => setRootLayoutReady(true)}
    >
      {/* Segment Control - positioned below header */}
      <View
        style={[
          styles.segmentControlContainer,
          {
            top: insets.top + 60 + SEGMENT_CONTROL_EXTRA_SPACING,
          },
        ]}
      >
        <LibrarySegmentControl
          activeTab={activeTab}
          onTabChange={handleTabChange}
          liquidGlassEnabled={supportsLiquidGlass}
        />
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* Wardrobe Tab */}
        <View
          style={[
            styles.tabContainer,
            activeTab === 'wardrobe' ? styles.tabActive : styles.tabHidden,
          ]}
          pointerEvents={activeTab === 'wardrobe' ? 'auto' : 'none'}
        >
          <WardrobeTab
            isActive={activeTab === 'wardrobe' && isScreenFocused}
            liquidGlassEnabled={supportsLiquidGlass}
            headerOffset={segmentControlOffset}
          />
        </View>

        {/* Outfits Tab */}
        <View
          style={[
            styles.tabContainer,
            activeTab === 'outfits' ? styles.tabActive : styles.tabHidden,
          ]}
          pointerEvents={activeTab === 'outfits' ? 'auto' : 'none'}
        >
          <OutfitsTab
            isActive={activeTab === 'outfits' && isScreenFocused}
            liquidGlassEnabled={supportsLiquidGlass}
            headerOffset={segmentControlOffset}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentControlContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  tabContent: {
    flex: 1,
  },
  tabContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  tabActive: {
    opacity: 1,
  },
  tabHidden: {
    opacity: 0,
  },
});
