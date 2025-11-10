/**
 * CustomTabManager - Manage custom tab categories
 * Phase 3: Drag & drop, add/remove categories (Basic version)
 *
 * TODO: Full implementation with react-native-draggable-flatlist
 * For now: Basic add/remove functionality
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemCategory } from '../../types/models/item';
import { CATEGORIES, getCategoryLabel, getCategoryIcon } from '@constants/categories';
import { canAddCategory, canRemoveCategory } from '@constants/outfitTabs';

interface CustomTabManagerProps {
  categories: ItemCategory[];
  onCategoriesChange: (categories: ItemCategory[]) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

/**
 * CustomTabManager - Basic version
 * Shows add/remove UI for custom tab
 *
 * Future: Implement drag & drop with react-native-draggable-flatlist
 */
export function CustomTabManager({
  categories,
  onCategoriesChange,
  isEditMode,
  onToggleEditMode,
}: CustomTabManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  // Get available categories (not yet in custom tab)
  const availableCategories = CATEGORIES.filter((cat) => !categories.includes(cat));

  const handleAddCategory = (category: ItemCategory) => {
    if (canAddCategory(categories, category)) {
      onCategoriesChange([...categories, category]);
      setShowAddModal(false);
    }
  };

  const handleRemoveCategory = (category: ItemCategory) => {
    if (canRemoveCategory(categories)) {
      onCategoriesChange(categories.filter((c) => c !== category));
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Edit Mode Toggle */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Custom Layout</Text>
          <Text style={styles.headerSubtitle}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, isEditMode && styles.editButtonActive]}
          onPress={onToggleEditMode}
          activeOpacity={0.7}
        >
          <Ionicons name={isEditMode ? 'checkmark' : 'create'} size={20} color="#FFF" />
          <Text style={styles.editButtonText}>{isEditMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      {isEditMode ? (
        <View style={styles.editContainer}>
          <Text style={styles.instructionText}>Tap ✕ to remove • Tap + to add categories</Text>

          {/* Current Categories */}
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={styles.categoryLabel}>{getCategoryLabel(category)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCategory(category)}
                  disabled={!canRemoveCategory(categories)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={canRemoveCategory(categories) ? '#FF3B30' : '#CCC'}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Button */}
          {availableCategories.length > 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={24} color="#000" />
              <Text style={styles.addButtonText}>Add Category</Text>
            </TouchableOpacity>
          )}

          {/* Future: Drag & Drop Info */}
          <View style={styles.futureFeature}>
            <Ionicons name="information-circle-outline" size={16} color="#999" />
            <Text style={styles.futureFeatureText}>Drag & drop reordering coming soon!</Text>
          </View>
        </View>
      ) : (
        <View style={styles.viewModeContainer}>
          <Text style={styles.viewModeText}>
            Tap "Edit" button to manage your custom categories
          </Text>
          <View style={styles.previewList}>
            {categories.map((category) => (
              <View key={category} style={styles.previewItem}>
                <Text style={styles.previewIcon}>{getCategoryIcon(category)}</Text>
                <Text style={styles.previewLabel}>{getCategoryLabel(category)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Add Category Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.modalItem}
                  onPress={() => handleAddCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={styles.modalItemText}>{getCategoryLabel(category)}</Text>
                  <Ionicons name="add" size={20} color="#000" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  editButtonActive: {
    backgroundColor: '#34C759',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editContainer: {
    gap: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  futureFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  futureFeatureText: {
    fontSize: 12,
    color: '#999',
  },
  viewModeContainer: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    gap: 16,
  },
  viewModeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  previewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  previewIcon: {
    fontSize: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});
