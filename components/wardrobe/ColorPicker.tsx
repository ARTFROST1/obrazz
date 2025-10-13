import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorPickerProps {
  selectedColors: string[];
  onColorSelect: (color: string) => void;
  multiSelect?: boolean;
}

const COLORS = [
  { hex: '#000000', name: 'Black' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#808080', name: 'Gray' },
  { hex: '#C0C0C0', name: 'Silver' },
  { hex: '#FF0000', name: 'Red' },
  { hex: '#FFA500', name: 'Orange' },
  { hex: '#FFFF00', name: 'Yellow' },
  { hex: '#00FF00', name: 'Green' },
  { hex: '#0000FF', name: 'Blue' },
  { hex: '#800080', name: 'Purple' },
  { hex: '#FFC0CB', name: 'Pink' },
  { hex: '#A52A2A', name: 'Brown' },
  { hex: '#F5F5DC', name: 'Beige' },
  { hex: '#FFD700', name: 'Gold' },
  { hex: '#00CED1', name: 'Turquoise' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColors,
  onColorSelect,
  multiSelect = true,
}) => {
  const isSelected = (color: string) => selectedColors.includes(color);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {COLORS.map((color) => {
        const selected = isSelected(color.hex);
        return (
          <TouchableOpacity
            key={color.hex}
            style={[styles.colorButton, selected && styles.colorButtonSelected]}
            onPress={() => onColorSelect(color.hex)}
            activeOpacity={0.7}
          >
            <View style={[styles.colorCircle, { backgroundColor: color.hex }]}>
              {selected && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={color.hex === '#FFFFFF' ? '#000' : '#FFF'}
                />
              )}
            </View>
            <Text style={styles.colorName}>{color.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  colorButton: {
    alignItems: 'center',
    marginRight: 16,
  },
  colorButtonSelected: {
    transform: [{ scale: 1.1 }],
  },
  colorCircle: {
    alignItems: 'center',
    borderColor: '#E5E5E5',
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    marginBottom: 4,
    width: 40,
  },
  colorName: {
    color: '#666',
    fontSize: 11,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
