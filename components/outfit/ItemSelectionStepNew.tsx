import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import {
  CategorySelectorWithSmooth,
  CategoryDisplayMode,
  CATEGORY_GROUPS,
} from './CategorySelectorWithSmooth';
import { WardrobeItem, ItemCategory } from '../../types/models/item';
import { CATEGORIES } from '@constants/categories';

interface ItemSelectionStepNewProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * ItemSelectionStepNew - Step 1 of outfit creation with smooth carousels
 * Full-width design with flag buttons for category toggles
 */
export function ItemSelectionStepNew({ onNext, onBack }: ItemSelectionStepNewProps) {
  const { items: wardrobeItems } = useWardrobeStore();
  const {
    selectedItemsForCreation,
    selectItemForCategory,
    getSelectedItemsCount,
    confirmItemSelection,
  } = useOutfitStore();

  // Track active categories (replacing locked with active)
  const [activeCategories, setActiveCategories] = useState<Set<ItemCategory>>(
    new Set(CATEGORIES), // All categories active by default
  );
  const [displayMode, setDisplayMode] = useState<CategoryDisplayMode>('all');

  const selectedCount = getSelectedItemsCount();
  const canProceed = selectedCount > 0;

  const handleItemSelect = useCallback(
    (category: ItemCategory, item: WardrobeItem | null) => {
      selectItemForCategory(category, item);
    },
    [selectItemForCategory],
  );

  const handleCategoryToggle = useCallback(
    (category: ItemCategory) => {
      setActiveCategories((prev) => {
        const newSet = new Set(prev);
        const isDeactivating = newSet.has(category);

        if (isDeactivating) {
          // Deactivate category
          newSet.delete(category);
        } else {
          // Activate category
          newSet.add(category);
        }
        return newSet;
      });

      // Clear selection when deactivating (outside setState)
      if (activeCategories.has(category)) {
        selectItemForCategory(category, null);
      }
    },
    [selectItemForCategory, activeCategories],
  );

  const handleRandomize = useCallback(() => {
    CATEGORIES.forEach((category) => {
      // Only randomize active categories
      if (!activeCategories.has(category)) return;

      const categoryItems = wardrobeItems.filter((item) => item.category === category);
      if (categoryItems.length === 0) {
        selectItemForCategory(category, null);
        return;
      }

      // Pick random item
      const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
      selectItemForCategory(category, randomItem);
    });
  }, [wardrobeItems, activeCategories, selectItemForCategory]);

  const handleNext = () => {
    confirmItemSelection();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Build Your Outfit</Text>
        <View style={styles.headerRight}>
          <Text style={styles.selectedCount}>{selectedCount}</Text>
        </View>
      </View>

      {/* Category Carousels - NO PROGRESS BAR */}
      <CategorySelectorWithSmooth
        categories={CATEGORIES}
        wardrobeItems={wardrobeItems}
        selectedItems={selectedItemsForCreation}
        activeCategories={activeCategories}
        displayMode={displayMode}
        onItemSelect={handleItemSelect}
        onCategoryToggle={handleCategoryToggle}
      />

      {/* Footer with display mode switcher and action buttons */}
      <View style={styles.footer}>
        {/* Display Mode Switcher */}
        <View style={styles.displayModeSwitcher}>
          {/* All Categories Button */}
          <TouchableOpacity
            style={[
              styles.displayModeButton,
              displayMode === 'all' && styles.displayModeButtonActive,
            ]}
            onPress={() => setDisplayMode('all')}
            activeOpacity={0.7}
          >
            <Ionicons name="apps" size={20} color={displayMode === 'all' ? '#FFF' : '#666'} />
            <Text
              style={[
                styles.displayModeText,
                displayMode === 'all' && styles.displayModeTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Main Categories Button */}
          <TouchableOpacity
            style={[
              styles.displayModeButton,
              displayMode === 'main' && styles.displayModeButtonActive,
            ]}
            onPress={() => setDisplayMode('main')}
            activeOpacity={0.7}
          >
            <Ionicons name="shirt" size={20} color={displayMode === 'main' ? '#FFF' : '#666'} />
            <Text
              style={[
                styles.displayModeText,
                displayMode === 'main' && styles.displayModeTextActive,
              ]}
            >
              Main
            </Text>
          </TouchableOpacity>

          {/* Extra Categories Button */}
          <TouchableOpacity
            style={[
              styles.displayModeButton,
              displayMode === 'extra' && styles.displayModeButtonActive,
            ]}
            onPress={() => setDisplayMode('extra')}
            activeOpacity={0.7}
          >
            <Ionicons name="diamond" size={20} color={displayMode === 'extra' ? '#FFF' : '#666'} />
            <Text
              style={[
                styles.displayModeText,
                displayMode === 'extra' && styles.displayModeTextActive,
              ]}
            >
              Extra
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.randomButton}
            onPress={handleRandomize}
            activeOpacity={0.7}
          >
            <Ionicons name="shuffle" size={20} color="#666" />
            <Text style={styles.randomButtonText}>Randomize</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.7}
          >
            <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20} color={canProceed ? '#FFF' : '#CCC'} />
          </TouchableOpacity>
        </View>
      </View>
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
  headerRight: {
    minWidth: 40,
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  displayModeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  displayModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  displayModeButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  displayModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  displayModeTextActive: {
    color: '#FFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  randomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F8F8F8',
    borderRadius: 26,
    gap: 8,
  },
  randomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#000',
    borderRadius: 26,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  nextButtonTextDisabled: {
    color: '#CCC',
  },
});
