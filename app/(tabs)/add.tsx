/**
 * Add Screen - Context-Sensitive Content Screen
 *
 * This screen renders different content based on which tab the user was on:
 * - Home: Shows AI Features menu
 * - Library (Wardrobe): Shows AddItemContent
 * - Library (Outfits): Shows CreateOutfitContent
 * - Profile: Shows Settings (placeholder)
 *
 * Key features:
 * - Renders content IMMEDIATELY - no white screen flash
 * - Uses Native Tabs (no custom overlays)
 * - Back button returns to correct tab
 */

import { AddItemContent } from '@components/add/AddItemContent';
import { CreateOutfitContent } from '@components/add/CreateOutfitContent';
import { SettingsContent } from '@components/settings/SettingsContent';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@store/library/libraryStore';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function AddScreen() {
  const { activeTab, lastVisitedTab } = useLibraryStore();

  // Determine return route based on context
  const returnRoute = React.useMemo(() => {
    if (lastVisitedTab === 'library') {
      return '/(tabs)/library';
    } else if (lastVisitedTab === 'profile') {
      return '/(tabs)/profile';
    }
    return '/(tabs)/';
  }, [lastVisitedTab]);

  // Render content based on last visited tab
  const renderContent = () => {
    if (lastVisitedTab === 'library') {
      if (activeTab === 'wardrobe') {
        // Wardrobe tab - show Add Item screen
        return <AddItemContent returnRoute={returnRoute} />;
      } else {
        // Outfits tab - show Create Outfit screen
        return <CreateOutfitContent returnRoute={returnRoute} />;
      }
    }

    if (lastVisitedTab === 'profile') {
      // Profile - show Settings screen
      return <SettingsContent returnRoute={returnRoute} />;
    }

    // Home - show AI Features menu
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>AI Функции</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
        <View style={styles.menuContent}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Coming Soon', 'Virtual Try-On feature will be available soon!');
            }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="body-outline" size={28} color="#007AFF" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Virtual Try-On</Text>
              <Text style={styles.menuItemDescription}>Примерьте вещи на своё фото</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Coming Soon', 'Fashion Models feature will be available soon!');
            }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={28} color="#007AFF" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Fashion Models</Text>
              <Text style={styles.menuItemDescription}>Покажите вещи на AI-модели</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Coming Soon', 'Clothing Variations feature will be available soon!');
            }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="color-palette-outline" size={28} color="#007AFF" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Variations</Text>
              <Text style={styles.menuItemDescription}>Создайте вариации дизайна вещей</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  safeArea: {
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#666',
  },
});

export default AddScreen;
