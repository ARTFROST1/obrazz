import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { useOutfitStore } from '@store/outfit/outfitStore';
import React, { useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BackgroundPicker } from './BackgroundPicker';
import { OutfitCanvas } from './OutfitCanvas';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Android optimization: slightly smaller canvas to prevent UI crowding
const CANVAS_PADDING = Platform.OS === 'android' ? 24 : 32;
const CANVAS_WIDTH = SCREEN_WIDTH - CANVAS_PADDING;
const CANVAS_HEIGHT = (CANVAS_WIDTH / 3) * 4;

interface CompositionStepProps {
  onSave: () => void;
  onBack: () => void;
}

/**
 * CompositionStep - Step 2 of outfit creation
 * Allows user to arrange selected items on canvas with drag & drop
 */
export function CompositionStep({ onSave, onBack }: CompositionStepProps) {
  const { t } = useTranslation('outfit');
  const {
    currentItems,
    currentBackground,
    canvasSettings,
    updateItemTransform,
    removeItemFromCanvas,
    setBackground,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useOutfitStore();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

  const canSave = currentItems.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('create.step2Title')}</Text>
        <TouchableOpacity
          onPress={onSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          disabled={!canSave}
        >
          <Ionicons name="checkmark" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Canvas Area */}
      <View style={styles.canvasSection}>
        <View style={styles.canvasContainer}>
          <OutfitCanvas
            items={currentItems}
            background={currentBackground}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onItemTransformUpdate={updateItemTransform}
            onItemSelect={setSelectedItemId}
            selectedItemId={selectedItemId}
            showGrid={canvasSettings.showGrid}
            snapToGrid={canvasSettings.snapToGrid}
            gridSize={canvasSettings.gridSize}
            onCanvasTap={() => setSelectedItemId(null)}
          />
        </View>

        {/* Control Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            onPress={() => undo()}
            style={[styles.toolButton, !canUndo() && styles.toolButtonDisabled]}
            disabled={!canUndo()}
          >
            <Ionicons name="arrow-undo" size={22} color={canUndo() ? '#000' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => redo()}
            style={[styles.toolButton, !canRedo() && styles.toolButtonDisabled]}
            disabled={!canRedo()}
          >
            <Ionicons name="arrow-redo" size={22} color={canRedo() ? '#000' : '#CCC'} />
          </TouchableOpacity>

          <View style={styles.toolSeparator} />

          <TouchableOpacity onPress={() => setShowBackgroundPicker(true)} style={styles.toolButton}>
            <Ionicons name="color-palette-outline" size={22} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearCanvas}
            style={styles.toolButton}
            disabled={currentItems.length === 0}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={currentItems.length > 0 ? '#FF3B30' : '#CCC'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Background Picker Modal */}
      <BackgroundPicker
        visible={showBackgroundPicker}
        currentBackground={currentBackground}
        onSelect={setBackground}
        onClose={() => setShowBackgroundPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  canvasSection: {
    flex: 1,
    justifyContent: 'center',
    // Android optimization: reduce vertical padding to prevent crowding
    paddingVertical: Platform.OS === 'android' ? 16 : 24,
  },
  canvasContainer: {
    alignItems: 'center',
    // Android optimization: less horizontal padding
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Android optimization: reduce margin to save space
    marginTop: Platform.OS === 'android' ? 16 : 24,
    gap: 8,
  },
  toolButton: {
    // Android optimization: slightly smaller buttons
    width: Platform.OS === 'android' ? 40 : 44,
    height: Platform.OS === 'android' ? 40 : 44,
    borderRadius: Platform.OS === 'android' ? 20 : 22,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
});
