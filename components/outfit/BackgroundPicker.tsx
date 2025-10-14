import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OutfitBackground } from '../../types/models/outfit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BackgroundPickerProps {
  visible: boolean;
  currentBackground: OutfitBackground;
  onSelect: (background: OutfitBackground) => void;
  onClose: () => void;
}

const SOLID_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Light Gray', value: '#F5F5F5' },
  { name: 'Dark Gray', value: '#333333' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Cream', value: '#FFFDD0' },
  { name: 'Light Blue', value: '#E3F2FD' },
  { name: 'Light Pink', value: '#FCE4EC' },
  { name: 'Light Green', value: '#E8F5E9' },
  { name: 'Light Yellow', value: '#FFFDE7' },
  { name: 'Light Purple', value: '#F3E5F5' },
  { name: 'Light Orange', value: '#FFF3E0' },
];

const GRADIENTS = [
  {
    name: 'Sunset',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colors: ['#667eea', '#764ba2'] as const,
  },
  {
    name: 'Ocean',
    value: 'linear-gradient(135deg, #667eea 0%, #f09819 100%)',
    colors: ['#2193b0', '#6dd5ed'] as const,
  },
  {
    name: 'Rose',
    value: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
    colors: ['#ee9ca7', '#ffdde1'] as const,
  },
  {
    name: 'Forest',
    value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    colors: ['#134e5e', '#71b280'] as const,
  },
  {
    name: 'Peach',
    value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    colors: ['#ffecd2', '#fcb69f'] as const,
  },
  {
    name: 'Purple Haze',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    colors: ['#a8edea', '#fed6e3'] as const,
  },
] as const;

export function BackgroundPicker({
  visible,
  currentBackground,
  onSelect,
  onClose,
}: BackgroundPickerProps) {
  const handleSelectColor = (color: string) => {
    onSelect({
      type: 'color',
      value: color,
      opacity: 1,
    });
    onClose();
  };

  const handleSelectGradient = (gradient: (typeof GRADIENTS)[number]) => {
    onSelect({
      type: 'gradient',
      value: JSON.stringify(gradient.colors), // Store colors array as JSON string
      opacity: 1,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Background</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Solid Colors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solid Colors</Text>
              <View style={styles.grid}>
                {SOLID_COLORS.map((color) => {
                  const isSelected =
                    currentBackground.type === 'color' && currentBackground.value === color.value;

                  return (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorCard,
                        { backgroundColor: color.value },
                        isSelected && styles.selectedCard,
                      ]}
                      onPress={() => handleSelectColor(color.value)}
                    >
                      {color.value === '#FFFFFF' && <View style={styles.whiteBorder} />}
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark" size={24} color="#007AFF" />
                        </View>
                      )}
                      <Text
                        style={[styles.colorName, color.value === '#000000' && { color: '#FFF' }]}
                      >
                        {color.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Gradients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gradients</Text>
              <View style={styles.grid}>
                {GRADIENTS.map((gradient) => {
                  const isSelected =
                    currentBackground.type === 'gradient' &&
                    currentBackground.value === JSON.stringify(gradient.colors);

                  return (
                    <TouchableOpacity
                      key={gradient.name}
                      style={[styles.gradientCard, isSelected && styles.selectedCard]}
                      onPress={() => handleSelectGradient(gradient)}
                    >
                      <LinearGradient
                        colors={gradient.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientPreview}
                      />
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark" size={24} color="#007AFF" />
                        </View>
                      )}
                      <Text style={styles.colorName}>{gradient.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Coming Soon Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patterns & Images</Text>
              <View style={styles.comingSoon}>
                <Ionicons name="lock-closed-outline" size={32} color="#999" />
                <Text style={styles.comingSoonText}>Available with Premium subscription</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  checkmark: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    bottom: 8,
    padding: 4,
    position: 'absolute',
    right: 8,
  },
  closeButton: {
    padding: 8,
  },
  colorCard: {
    alignItems: 'center',
    borderRadius: 12,
    height: 100,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    width: (SCREEN_WIDTH - 80) / 3,
  },
  colorName: {
    bottom: 8,
    color: '#333',
    fontSize: 11,
    fontWeight: '500',
    position: 'absolute',
    textAlign: 'center',
  },
  comingSoon: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  comingSoonText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },
  gradientCard: {
    alignItems: 'center',
    borderRadius: 12,
    height: 100,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    width: (SCREEN_WIDTH - 80) / 3,
  },
  gradientPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    marginTop: 'auto',
    maxHeight: '85%',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  title: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  whiteBorder: {
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
