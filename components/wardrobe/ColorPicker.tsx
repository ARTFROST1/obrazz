import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
  Text,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ColorPickerProps {
  selectedColors: string[];
  onColorSelect: (color: string) => void;
  multiSelect?: boolean;
}

// Primary colors (first 8) - always visible
const PRIMARY_COLORS = [
  { hex: '#000000', name: 'Black' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#808080', name: 'Gray' },
  { hex: '#8B4513', name: 'Brown' },
  { hex: '#F5F5DC', name: 'Beige' },
  { hex: '#FF6B6B', name: 'Red' },
  { hex: '#FFB347', name: 'Orange' },
  { hex: '#FDFD96', name: 'Yellow' },
];

// Additional colors (hidden by default)
const ADDITIONAL_COLORS = [
  { hex: '#77DD77', name: 'Green' },
  { hex: '#006400', name: 'Dark Green' },
  { hex: '#AFEEEE', name: 'Turquoise' },
  { hex: '#AEC6CF', name: 'Light Blue' },
  { hex: '#0000FF', name: 'Blue' },
  { hex: '#B39EB5', name: 'Purple' },
  { hex: '#FFB7B2', name: 'Pink' },
  { hex: '#800020', name: 'Burgundy' },
];

const ColorButton: React.FC<{
  color: { hex: string; name: string };
  selected: boolean;
  onPress: () => void;
}> = ({ color, selected, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(selected ? 1.05 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.05 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity style={styles.colorButton} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.colorCircle, { backgroundColor: color.hex }]}>
          {selected && (
            <Ionicons
              name="checkmark"
              size={18}
              color={
                ['#FFFFFF', '#FDFD96', '#F5F5DC', '#AFEEEE', '#AEC6CF'].includes(color.hex)
                  ? '#000'
                  : '#FFF'
              }
            />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColors,
  onColorSelect,
  multiSelect = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSelected = (color: string) => selectedColors.includes(color);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {PRIMARY_COLORS.map((color) => (
          <ColorButton
            key={color.hex}
            color={color}
            selected={isSelected(color.hex)}
            onPress={() => onColorSelect(color.hex)}
          />
        ))}
        {isExpanded &&
          ADDITIONAL_COLORS.map((color) => (
            <ColorButton
              key={color.hex}
              color={color}
              selected={isSelected(color.hex)}
              onPress={() => onColorSelect(color.hex)}
            />
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -32,
  },
  expandButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  colorButton: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 10 : 12,
  },
  colorCircle: {
    alignItems: 'center',
    borderColor: '#E5E5E5',
    borderRadius: 24,
    borderWidth: 1,
    height: Platform.OS === 'android' ? 44 : 48,
    justifyContent: 'center',
    width: Platform.OS === 'android' ? 44 : 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
