import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ColorPickerProps {
  selectedColors: string[];
  onColorSelect: (color: string) => void;
  multiSelect?: boolean;
}

const COLORS = [
  { hex: '#000000', name: 'Black' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#808080', name: 'Gray' },
  { hex: '#8B4513', name: 'Brown' },
  { hex: '#F5F5DC', name: 'Beige' },
  { hex: '#FF6B6B', name: 'Red' },
  { hex: '#FFB347', name: 'Orange' },
  { hex: '#FDFD96', name: 'Yellow' },
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
  const scaleAnim = React.useRef(new Animated.Value(selected ? 1.1 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.1 : 1,
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
              size={20}
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
  const isSelected = (color: string) => selectedColors.includes(color);

  return (
    <View style={styles.container}>
      {COLORS.map((color) => (
        <ColorButton
          key={color.hex}
          color={color}
          selected={isSelected(color.hex)}
          onPress={() => onColorSelect(color.hex)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  colorButton: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 8 : 12,
  },
  colorCircle: {
    alignItems: 'center',
    borderColor: '#E5E5E5',
    borderRadius: Platform.OS === 'android' ? 24 : 28,
    borderWidth: 1,
    height: Platform.OS === 'android' ? 48 : 56,
    justifyContent: 'center',
    width: Platform.OS === 'android' ? 48 : 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    gap: Platform.OS === 'android' ? 6 : 8,
    justifyContent: 'flex-start',
  },
});
