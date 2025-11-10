import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { SizeVector } from 'react-native-zoom-toolkit';

type CropOverlayProps = {
  cropSize: SizeVector<number>;
};

/**
 * Overlay with a transparent crop area (3:4 aspect ratio)
 * Uses View components to create a dark overlay with a rectangular hole for the crop frame
 * Centered using flexbox to match CropZoom's layout
 */
export const CropOverlay: React.FC<CropOverlayProps> = ({ cropSize }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top dark bar */}
      <View style={styles.darkBar} />

      {/* Middle section with left bar, crop frame, right bar */}
      <View style={styles.middleSection}>
        <View style={styles.darkBar} />

        {/* Crop frame - transparent area with white border */}
        <View
          style={[
            styles.cropFrame,
            {
              width: cropSize.width,
              height: cropSize.height,
            },
          ]}
        >
          {/* Corner indicators */}
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <View style={styles.darkBar} />
      </View>

      {/* Bottom dark bar */}
      <View style={styles.darkBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkBar: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  cropFrame: {
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFF',
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFF',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFF',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFF',
  },
});
