import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

/**
 * Carousel with store names for switching between browser tabs
 * Simple text-based tabs without favicons
 */
export default function TabsCarousel() {
  const { tabs, activeTabId, switchTab } = useShoppingBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      switchTab: state.switchTab,
    })),
  );

  if (!tabs || tabs.length === 0) {
    return null;
  }

  const handleTabPress = (tabId: string) => {
    if (tabId && tabId !== activeTabId) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[TabsCarousel] Switching to tab:', tabId);
      }
      switchTab(tabId);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.shopName}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000000',
  },
  tabText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
});
