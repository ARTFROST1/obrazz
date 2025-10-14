import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * ProgressIndicator - Shows progress of item selection
 * Displays "X/Y items selected" with visual progress bar
 */
export function ProgressIndicator({ current, total, label }: ProgressIndicatorProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const displayLabel = label || `${current}/${total} items selected`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{displayLabel}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
});
