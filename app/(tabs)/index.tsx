import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function FeedScreen() {
  // Update StatusBar when screen is focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
      }
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Community</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Discover outfits from the community</Text>
        {/* TODO: Add community feed in Stage 6 */}
      </View>
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
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
