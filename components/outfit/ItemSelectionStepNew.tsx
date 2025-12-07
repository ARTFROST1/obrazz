import { CATEGORIES, getCategoryIcon, getCategoryLabel } from '@constants/categories';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { loadCustomTabConfig, saveCustomTabConfig } from '@utils/storage/customTabStorage';
import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { OutfitTabType } from '../../types/components/OutfitCreator';
import { ItemCategory, WardrobeItem } from '../../types/models/item';
import { CategorySelectorWithSmooth } from './CategorySelectorWithSmooth';
import { OutfitTabBar } from './OutfitTabBar';

// Type for draggable list item with index
interface DraggableCategoryItem {
  category: ItemCategory;
  index: number;
}

interface ItemSelectionStepNewProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * ItemSelectionStepNew - Step 1 of outfit creation with tab system
 * 4 tabs: Basic, Dress, All, Custom
 */
export function ItemSelectionStepNew({ onNext, onBack }: ItemSelectionStepNewProps) {
  const { t } = useTranslation('outfit');
  const { items: wardrobeItems } = useWardrobeStore();
  const {
    currentOutfit, // ✅ To detect edit mode
    selectedItemsForCreation,
    selectItemForCategory,
    getSelectedItemsCount,
    confirmItemSelection,
    activeTab,
    setActiveTab,
    customTabCategories,
    updateCustomTab,
    getActiveTabCategories,
    isCustomTabEditing,
    toggleCustomTabEditing,
  } = useOutfitStore();

  // ✅ Detect edit mode
  const isEditMode = !!currentOutfit;

  // Load custom tab configuration on mount (ONLY if NOT editing)
  useEffect(() => {
    // ✅ Skip AsyncStorage load in edit mode
    if (isEditMode) {
      console.log('🚫 [ItemSelectionStepNew] Skipping AsyncStorage load - edit mode');
      return;
    }

    const loadCustomTab = async () => {
      console.log('📂 [ItemSelectionStepNew] Loading custom tab config from AsyncStorage');
      const config = await loadCustomTabConfig();
      if (config.categories.length > 0) {
        console.log('✅ [ItemSelectionStepNew] Loaded custom config:', config.categories);
        updateCustomTab(config.categories, config.order);
      }
    };
    loadCustomTab();
  }, [isEditMode, updateCustomTab]);

  // Save custom tab when it changes (ONLY in create mode, not edit mode)
  useEffect(() => {
    // ✅ FIX: Only save to AsyncStorage in create mode
    // In edit mode, we don't want to overwrite user's custom tab preferences
    if (activeTab === 'custom' && !isEditMode) {
      const order = customTabCategories.map((_, i) => i);
      console.log(
        '💾 [ItemSelectionStepNew] Saving custom tab to AsyncStorage (create mode):',
        customTabCategories,
      );
      saveCustomTabConfig(customTabCategories, order).catch((error) => {
        console.error('[ItemSelectionStepNew] Failed to save custom tab:', error);
      });
    } else if (activeTab === 'custom' && isEditMode) {
      console.log(
        '🚫 [ItemSelectionStepNew] Skipping AsyncStorage save (edit mode):',
        customTabCategories,
      );
    }
  }, [customTabCategories, activeTab, isEditMode]); // ✅ Added isEditMode dependency

  // Get categories for current tab
  const currentTabCategories = getActiveTabCategories();

  const selectedCount = getSelectedItemsCount();
  const canProceed = selectedCount > 0;

  // Prepare data for draggable list
  const draggableCategories: DraggableCategoryItem[] = customTabCategories.map(
    (category, index) => ({
      category,
      index,
    }),
  );

  const handleAddCategory = useCallback(
    (category: ItemCategory) => {
      // Allow duplicates - just add to the end
      const newCategories = [...customTabCategories, category];
      const order = newCategories.map((_, i) => i);
      updateCustomTab(newCategories, order);
    },
    [customTabCategories, updateCustomTab],
  );

  // Handle drag & drop reorder
  const handleReorderCategories = useCallback(
    ({ data }: { data: DraggableCategoryItem[] }) => {
      const newCategories = data.map((item) => item.category);
      const order = newCategories.map((_, i) => i);
      updateCustomTab(newCategories, order);
    },
    [updateCustomTab],
  );

  const handleRemoveCategory = useCallback(
    (index: number) => {
      // Remove by index to handle duplicates
      const newCategories = customTabCategories.filter((_, i) => i !== index);
      const order = newCategories.map((_, i) => i);
      updateCustomTab(newCategories, order);
    },
    [customTabCategories, updateCustomTab],
  );

  const handleItemSelect = useCallback(
    (slotIndex: number, item: WardrobeItem | null) => {
      selectItemForCategory(slotIndex, item);
    },
    [selectItemForCategory],
  );

  const handleTabChange = useCallback(
    (tab: OutfitTabType) => {
      // If clicking on custom tab when already on it - toggle edit mode
      if (tab === 'custom' && activeTab === 'custom') {
        toggleCustomTabEditing();
      } else {
        // Switch to new tab
        setActiveTab(tab);
        // Exit edit mode when switching away from custom tab
        if (tab !== 'custom' && isCustomTabEditing) {
          toggleCustomTabEditing();
        }
      }
    },
    [activeTab, setActiveTab, isCustomTabEditing, toggleCustomTabEditing],
  );

  const handleRandomize = useCallback(() => {
    // Randomize only categories in current tab
    currentTabCategories.forEach((category, slotIndex) => {
      const categoryItems = wardrobeItems.filter((item) => item.category === category);
      if (categoryItems.length === 0) {
        selectItemForCategory(slotIndex, null);
        return;
      }

      const randomIndex = Math.floor(Math.random() * categoryItems.length);
      selectItemForCategory(slotIndex, categoryItems[randomIndex]);
    });
  }, [currentTabCategories, wardrobeItems, selectItemForCategory]);

  const handleNext = useCallback(() => {
    confirmItemSelection();
    onNext();
  }, [confirmItemSelection, onNext]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('create.step1Title')}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.selectedCount}>{selectedCount}</Text>
        </View>
      </View>

      {/* Tab Bar - NEW! */}
      <OutfitTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        customItemCount={customTabCategories.length}
        isCustomTabEditing={isCustomTabEditing}
      />

      {/* Category Carousels OR Edit Content */}
      {/* Edit mode - show category management */}
      {activeTab === 'custom' && (
        <ScrollView
          style={[
            styles.editContainer,
            !isCustomTabEditing && styles.hiddenView, // Hide instead of unmount when not editing
          ]}
          contentContainerStyle={styles.editContentContainer}
          pointerEvents={isCustomTabEditing ? 'auto' : 'none'}
        >
          {/* Header */}
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>{t('create.customTab.manageTitle')}</Text>
            <Text style={styles.editSubtitle}>
              {customTabCategories.length}{' '}
              {customTabCategories.length === 1
                ? t('create.customTab.carouselCount_one')
                : t('create.customTab.carouselCount_other')}{' '}
              • {t('create.customTab.dragToReorder')}
            </Text>
          </View>

          {/* Current Categories - Draggable */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('create.customTab.currentCategories')}</Text>
            <Text style={styles.sectionHint}>{t('create.customTab.dragHint')}</Text>
            {customTabCategories.length > 0 ? (
              <DraggableFlatList
                data={draggableCategories}
                onDragEnd={handleReorderCategories}
                keyExtractor={(item) => `draggable-${item.index}-${item.category}`}
                renderItem={({
                  item,
                  drag,
                  isActive,
                  getIndex,
                }: RenderItemParams<DraggableCategoryItem>) => {
                  const currentIndex = getIndex() ?? 0;
                  return (
                    <ScaleDecorator>
                      <TouchableOpacity
                        onLongPress={drag}
                        disabled={isActive}
                        style={[
                          styles.categoryRow,
                          styles.draggableCategoryRow,
                          isActive && styles.categoryRowActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        {/* Drag Handle */}
                        <View style={styles.dragHandle}>
                          <Ionicons name="menu" size={20} color="#999" />
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryEmoji}>{getCategoryIcon(item.category)}</Text>
                          <Text style={styles.categoryName}>{getCategoryLabel(item.category)}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveCategory(currentIndex)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle" size={24} color="#FF3B30" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </ScaleDecorator>
                  );
                }}
                containerStyle={styles.draggableList}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>{t('create.customTab.emptyText')}</Text>
            )}
          </View>

          {/* All Available Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('create.customTab.addCategories')}</Text>
            <Text style={styles.sectionHint}>{t('create.customTab.addHint')}</Text>
            <View style={styles.categoryList}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={`add-${category}`}
                  style={styles.categoryRow}
                  onPress={() => handleAddCategory(category)}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryEmoji}>{getCategoryIcon(category)}</Text>
                    <Text style={styles.categoryName}>{getCategoryLabel(category)}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#34C759" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Carousels - Always mounted to prevent image reload */}
      <View
        style={[
          styles.carouselsWrapper,
          activeTab === 'custom' && isCustomTabEditing && styles.hiddenView,
        ]}
        pointerEvents={activeTab === 'custom' && isCustomTabEditing ? 'none' : 'auto'}
      >
        <CategorySelectorWithSmooth
          categories={currentTabCategories}
          wardrobeItems={wardrobeItems}
          selectedItems={selectedItemsForCreation}
          tabType={activeTab}
          onItemSelect={handleItemSelect}
          outfitId={currentOutfit?.id} // ✅ FIX: Pass outfit ID for cache isolation
        />
      </View>

      {/* Footer with action buttons - Hide in custom tab edit mode */}
      {!(activeTab === 'custom' && isCustomTabEditing) && (
        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.randomButton}
              onPress={handleRandomize}
              activeOpacity={0.7}
            >
              <Ionicons name="shuffle" size={20} color="#666" />
              <Text style={styles.randomButtonText}>{t('create.randomize')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.7}
            >
              <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
                {t('create.nextButton')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={canProceed ? '#FFF' : '#CCC'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingBottom: 12,
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
  editContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  editContentContainer: {
    paddingBottom: 20,
  },
  editHeader: {
    padding: 20,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  editSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  categoryList: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  draggableCategoryRow: {
    marginBottom: 8,
  },
  categoryRowActive: {
    backgroundColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dragHandle: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  draggableList: {
    marginTop: 4,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  // Hidden view for keeping components mounted but invisible
  hiddenView: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  carouselsWrapper: {
    flex: 1,
  },
});

// Export removed types for backwards compatibility (if needed)
export type { OutfitTabType };
