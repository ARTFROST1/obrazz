/**
 * LibrarySegmentControl - Native iOS UISegmentedControl
 *
 * Uses the native @react-native-segmented-control/segmented-control
 * which wraps Apple's UISegmentedControl for authentic iOS look and feel.
 *
 * On iOS 26+, the native segmented control automatically gets the
 * Liquid Glass styling from the system.
 */

import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { LibraryTab } from '@store/library/libraryStore';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface LibrarySegmentControlProps {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  style?: ViewStyle;
  liquidGlassEnabled?: boolean;
}

const SEGMENT_VALUES = ['Гардероб', 'Образы'];

/**
 * Native iOS Segmented Control for Library screen tab switching
 */
export const LibrarySegmentControl: React.FC<LibrarySegmentControlProps> = ({
  activeTab,
  onTabChange,
  style,
}) => {
  const selectedIndex = activeTab === 'wardrobe' ? 0 : 1;

  const handleChange = (event: { nativeEvent: { selectedSegmentIndex: number } }) => {
    const newTab = event.nativeEvent.selectedSegmentIndex === 0 ? 'wardrobe' : 'outfits';
    onTabChange(newTab);
  };

  // iOS: Native UISegmentedControl
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        <SegmentedControl
          values={SEGMENT_VALUES}
          selectedIndex={selectedIndex}
          onChange={handleChange}
          style={styles.segmentedControl}
          // iOS 13+ appearance - on iOS 26+ this gets Liquid Glass automatically
          appearance="light" // Will adapt based on system theme
        />
      </View>
    );
  }

  // Android: Use the same component - it has JS fallback that mimics iOS 13 style
  return (
    <View style={[styles.container, style]}>
      <SegmentedControl
        values={SEGMENT_VALUES}
        selectedIndex={selectedIndex}
        onChange={handleChange}
        style={styles.segmentedControl}
        backgroundColor="#E9E9EB"
        tintColor="#FFFFFF"
        fontStyle={{ fontSize: 15, fontWeight: '500', color: '#000' }}
        activeFontStyle={{ fontSize: 15, fontWeight: '600', color: '#000' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  segmentedControl: {
    height: 32,
  },
});
