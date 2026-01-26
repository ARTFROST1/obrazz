import CategoriesCarousel from '@/components/home/CategoriesCarousel';
import StylesCarousel from '@/components/home/StylesCarousel';
import ShoppingStoriesCarousel from '@/components/shopping/ShoppingStoriesCarousel';
import { ItemCategory } from '@/types/models/item';
import { StyleTag } from '@/types/models/user';
import { useLibraryStore } from '@store/library/libraryStore';
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { setLastVisitedTab } = useLibraryStore();

  // Update StatusBar and track last visited tab when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLastVisitedTab('index');
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
      }
    }, [setLastVisitedTab]),
  );

  const handleStylePress = useCallback((style: StyleTag) => {
    // TODO: Navigate to wardrobe filtered by style
    console.log('Style pressed:', style);
  }, []);

  const handleCategoryPress = useCallback((category: ItemCategory) => {
    // TODO: Navigate to wardrobe filtered by category
    console.log('Category pressed:', category);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Главная</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Shopping Section with Store Carousel */}
        <View style={styles.shoppingSection}>
          <ShoppingStoriesCarousel />
        </View>

        {/* Styles Section - Large tiles carousel */}
        <StylesCarousel onStylePress={handleStylePress} />

        {/* Categories Section - Square tiles carousel */}
        <CategoriesCarousel onCategoryPress={handleCategoryPress} />

        {/* Placeholder for other sections */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Streak, AI Actions и другие секции будут добавлены позже
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  shoppingSection: {
    // Just a wrapper for the shopping carousel
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
    marginBottom: 40,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
