import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WardrobeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Wardrobe</Text>
      <Text style={styles.subtitle}>Your clothing collection</Text>
      {/* TODO: Add wardrobe grid in Stage 3 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
