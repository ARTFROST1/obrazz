/**
 * LibrarySegmentControl - Native iOS UISegmentedControl / Material Tabs for Android
 *
 * iOS: Uses the native @react-native-segmented-control/segmented-control
 * which wraps Apple's UISegmentedControl for authentic iOS look and feel.
 *
 * Android: Uses custom Material Design 3 inspired tabs with animated indicator.
 *
 * On iOS 26+, the native segmented control automatically gets the
 * Liquid Glass styling from the system.
 */

import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { LibraryTab } from '@store/library/libraryStore';
import React from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface LibrarySegmentControlProps {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  style?: ViewStyle;
  liquidGlassEnabled?: boolean;
}

const SEGMENT_VALUES = ['Гардероб', 'Образы'];

/**
 * Native iOS Segmented Control / Material Android Tabs for Library screen tab switching
 */
export const LibrarySegmentControl: React.FC<LibrarySegmentControlProps> = ({
  activeTab,
  onTabChange,
  style,
}) => {
  const isDark = activeTab === 'outfits';
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
          appearance={isDark ? 'dark' : 'light'}
        />
      </View>
    );
  }

  // Android: Material Design 3 inspired tabs
  return (
    <View style={[styles.container, style]}>
      <MaterialTabs
        selectedIndex={selectedIndex}
        onTabChange={(index) => onTabChange(index === 0 ? 'wardrobe' : 'outfits')}
        tabs={SEGMENT_VALUES}
        isDark={isDark}
      />
    </View>
  );
};

// Material Design 3 Tabs Component for Android
interface MaterialTabsProps {
  selectedIndex: number;
  onTabChange: (index: number) => void;
  tabs: string[];
  isDark: boolean;
}

const MaterialTabs: React.FC<MaterialTabsProps> = ({
  selectedIndex,
  onTabChange,
  tabs,
  isDark,
}) => {
  const indicatorPosition = useSharedValue(selectedIndex);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useEffect(() => {
    indicatorPosition.value = withTiming(selectedIndex, {
      duration: 200,
    });
  }, [selectedIndex, indicatorPosition]);

  const segmentWidth = containerWidth > 0 ? Math.max(0, (containerWidth - 8) / 2) : 0;

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: indicatorPosition.value * segmentWidth }],
    }),
    [segmentWidth],
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View
      style={[
        styles.materialContainer,
        isDark ? styles.materialContainerDark : styles.materialContainerLight,
      ]}
      onLayout={handleLayout}
    >
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.materialIndicator,
          isDark ? styles.materialIndicatorDark : styles.materialIndicatorLight,
          { width: segmentWidth },
          indicatorStyle,
        ]}
      />

      {/* Tab buttons */}
      {tabs.map((tab, index) => (
        <Pressable
          key={tab}
          onPress={() => onTabChange(index)}
          style={styles.materialTab}
          android_ripple={{
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            borderless: false,
          }}
        >
          <Text
            style={[
              styles.materialTabText,
              selectedIndex === index
                ? isDark
                  ? styles.materialTabTextActiveDark
                  : styles.materialTabTextActiveLight
                : isDark
                  ? styles.materialTabTextInactiveDark
                  : styles.materialTabTextInactiveLight,
            ]}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
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
  // Material Design 3 styles for Android
  materialContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    height: 40,
    overflow: 'hidden',
  },
  materialContainerLight: {
    backgroundColor: '#E9E9EB',
  },
  materialContainerDark: {
    backgroundColor: '#2C2C2E',
  },
  materialIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 32,
    borderRadius: 16,
  },
  materialIndicatorLight: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  materialIndicatorDark: {
    backgroundColor: '#48484A',
    elevation: 2,
  },
  materialTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    zIndex: 1,
  },
  materialTabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  materialTabTextActiveLight: {
    color: '#000000',
    fontWeight: '600',
  },
  materialTabTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  materialTabTextInactiveLight: {
    color: '#666666',
  },
  materialTabTextInactiveDark: {
    color: '#8E8E93',
  },
});
