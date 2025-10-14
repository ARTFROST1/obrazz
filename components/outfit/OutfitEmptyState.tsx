import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@components/ui';

export interface OutfitEmptyStateProps {
  onCreatePress?: () => void;
  title?: string;
  message?: string;
  ctaText?: string;
}

/**
 * OutfitEmptyState Component
 *
 * Displays when user has no outfits in their collection.
 * Guides user to create their first outfit.
 *
 * @example
 * ```tsx
 * <OutfitEmptyState
 *   onCreatePress={() => router.push('/outfit/create')}
 * />
 * ```
 */
export const OutfitEmptyState: React.FC<OutfitEmptyStateProps> = ({
  onCreatePress,
  title = 'No Outfits Yet',
  message = 'Create your first outfit by combining items from your wardrobe',
  ctaText = 'Create Outfit',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8' }]}>
        <Ionicons name="shirt-outline" size={64} color={isDark ? '#8E8E93' : '#666666'} />
      </View>

      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>

      <Text style={[styles.message, { color: isDark ? '#8E8E93' : '#666666' }]}>{message}</Text>

      {onCreatePress && (
        <Button title={ctaText} onPress={onCreatePress} variant="primary" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  button: {
    minWidth: 200,
  },
});

export default OutfitEmptyState;
