import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DetectionFABProps {
  onScan: () => void;
  onManualCrop: () => void;
}

export default function DetectionFAB({ onScan, onManualCrop }: DetectionFABProps) {
  const { isScanning, hasScanned, detectedImages, showGallerySheet } = useShoppingBrowserStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Determine button state
  let buttonText = '🔍 Сканировать';
  let buttonStyle = styles.buttonScan;
  let onPress = onScan;
  let showLoader = false;

  if (isScanning) {
    buttonText = 'Сканирование...';
    buttonStyle = styles.buttonScanning;
    onPress = () => {}; // Disabled during scanning
    showLoader = true;
  } else if (hasScanned && detectedImages.length === 0) {
    buttonText = '✂️ Вырезать вручную';
    buttonStyle = styles.buttonManual;
    onPress = onManualCrop;
  }

  // Hide button ONLY when gallery sheet is open
  if (showGallerySheet && detectedImages.length > 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isScanning}
      >
        {showLoader && <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />}
        <Text style={styles.text}>{buttonText}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  button: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonScan: {
    backgroundColor: '#000000', // Black for scan button
  },
  buttonScanning: {
    backgroundColor: '#333333', // Dark gray during scanning
  },
  buttonManual: {
    backgroundColor: '#34C759', // Green for manual crop
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loader: {
    marginRight: 8,
  },
});
