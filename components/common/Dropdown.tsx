import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DropdownProps<T extends string> {
  label: string;
  value: T | T[] | null;
  options: readonly T[];
  onSelect: (value: T | T[] | null) => void;
  multiple?: boolean;
  placeholder?: string;
}

export function Dropdown<T extends string>({
  label,
  value,
  options,
  onSelect,
  multiple = false,
  placeholder = 'Select...',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: T) => {
    if (multiple) {
      const currentValues = (value as T[]) || [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter((v) => v !== option)
        : [...currentValues, option];
      onSelect(newValues.length > 0 ? newValues : null);
    } else {
      onSelect((value as T) === option ? null : option);
      setIsOpen(false);
    }
  };

  const isSelected = (option: T): boolean => {
    if (multiple) {
      return ((value as T[]) || []).includes(option);
    }
    return value === option;
  };

  const getDisplayValue = (): string => {
    if (!value) return placeholder;
    if (multiple) {
      const values = value as T[];
      if (values.length === 0) return placeholder;
      return values.map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
    }
    return (value as T).charAt(0).toUpperCase() + (value as T).slice(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setIsOpen(true)}>
        <Text style={[styles.selectorText, !value && styles.placeholderText]}>
          {getDisplayValue()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options as readonly string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, isSelected(item as T) && styles.optionSelected]}
                  onPress={() => handleSelect(item as T)}
                >
                  <Text
                    style={[styles.optionText, isSelected(item as T) && styles.optionTextSelected]}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                  {isSelected(item as T) && <Ionicons name="checkmark" size={20} color="#FFF" />}
                </TouchableOpacity>
              )}
            />
            {multiple && (
              <TouchableOpacity style={styles.doneButton} onPress={() => setIsOpen(false)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    padding: 4,
  },
  container: {
    marginBottom: 16,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 14,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    maxHeight: '70%',
    padding: 16,
    width: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  option: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: '#000',
  },
  optionText: {
    color: '#000',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#999',
  },
  selector: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectorText: {
    color: '#000',
    flex: 1,
    fontSize: 15,
  },
});
