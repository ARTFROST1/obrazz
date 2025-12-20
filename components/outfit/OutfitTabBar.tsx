/**
 * OutfitTabBar - Tab navigation for outfit creation
 * Provides 4 tabs: Basic, Dress, All, Custom
 */

import { DEFAULT_OUTFIT_TABS } from '@constants/outfitTabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OutfitTabBarProps, OutfitTabType } from '../../types/components/OutfitCreator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function OutfitTabBar({
  activeTab,
  onTabChange,
  customItemCount = 0,
  isCustomTabEditing = false,
  isEditMode = false, // ✅ NEW: Edit mode flag
  tabs = DEFAULT_OUTFIT_TABS,
}: OutfitTabBarProps) {
  const { t } = useTranslation('outfit');

  // Animated indicator
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // ✅ In edit mode, show only the custom tab
  const visibleTabs = isEditMode ? tabs.filter((tab) => tab.id === 'custom') : tabs;

  // Animate indicator when tab changes
  useEffect(() => {
    const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);
    if (activeIndex !== -1) {
      Animated.spring(indicatorAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 170,
        friction: 26,
      }).start();
    }
  }, [activeTab, visibleTabs, indicatorAnim]);

  const handleTabPress = (tabId: OutfitTabType) => {
    // ✅ Prevent tab switching in edit mode
    if (isEditMode && tabId !== 'custom') {
      console.log('🚫 [OutfitTabBar] Tab switching disabled in edit mode');
      return;
    }
    onTabChange(tabId);
  };

  const tabWidth = 100 / visibleTabs.length; // Process width (for style)
  const tabWidthInPixels = SCREEN_WIDTH / visibleTabs.length; // Pixel width (for translateX)

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {visibleTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'custom' && customItemCount > 0 && !isActive;

          // For custom tab, show Edit/Done label when active
          const isCustomTab = tab.id === 'custom';

          // Get translated label for tab
          const translatedLabel = t(`create.tabs.${tab.id}`);

          const displayLabel =
            isCustomTab && isActive
              ? isCustomTabEditing
                ? t('create.tabs.done')
                : t('create.tabs.edit')
              : translatedLabel;

          // Change icon for custom tab when in edit mode
          const displayIcon =
            isCustomTab && isActive && isCustomTabEditing ? 'checkmark-circle' : tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { width: `${tabWidth}%` }]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                {/* Icon */}
                <Ionicons
                  name={displayIcon}
                  size={22}
                  color={isActive ? '#000' : '#999'}
                  style={styles.icon}
                />

                {/* Label */}
                <Text style={[styles.label, isActive && styles.labelActive]}>{displayLabel}</Text>

                {/* Badge for custom tab (only when not active) */}
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{customItemCount}</Text>
                  </View>
                )}
              </View>

              {/* Active indicator dot */}
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Animated underline indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${tabWidth}%`,
            transform: [
              {
                translateX: indicatorAnim.interpolate({
                  inputRange: [0, visibleTabs.length - 1],
                  outputRange: [0, (visibleTabs.length - 1) * tabWidthInPixels],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  labelActive: {
    color: '#000',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -16,
    backgroundColor: '#000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
  },
});
