import type { DetectedImage } from '@/types/models/store';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface GalleryImageItemProps {
  image: DetectedImage;
  isSelected: boolean;
  onSelect: (image: DetectedImage) => void;
  width: number;
  height: number;
}

export default function GalleryImageItem({
  image,
  isSelected,
  onSelect,
  width,
  height,
}: GalleryImageItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Animation on press
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });

    onSelect(image);
  };

  return (
    <Animated.View style={[styles.container, { width, height }, animatedStyle]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.touchable}>
        <Image source={{ uri: image.url }} style={styles.image} resizeMode="cover" />

        {/* Selection Overlay */}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  touchable: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
