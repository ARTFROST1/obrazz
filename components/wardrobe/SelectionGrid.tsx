import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SelectionGridProps<T extends string> {
  items: { label: string; value: T }[];
  selectedItems: T[];
  onSelect: (value: T) => void;
  multiSelect?: boolean;
}

export function SelectionGrid<T extends string>({
  items,
  selectedItems,
  onSelect,
  multiSelect = true,
}: SelectionGridProps<T>) {
  const isSelected = (value: T) => selectedItems.includes(value);

  // Helper: split emoji and text if present (emoji at end)
  const parseLabel = (label: string) => {
    // Match emoji at end (unicode)
    const match = label.match(
      /^(.*?)([\u{1F300}-\u{1FAFF}\u2600-\u26FF\u2700-\u27BF\uFE0F\u200D\u23CF\u23E9-\u23FA\u2B50\u231A\u231B\u23F0\u23F3\u25B6\u25C0\u25FB-\u25FE\u2600-\u26FF\u2B06-\u2B07\u2934-\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299\uD83C\uD83D\uD83E][\uFE0F\u200D\u20E3]*)$/u,
    );
    if (match) {
      return { text: match[1].trim(), emoji: match[2] };
    }
    return { text: label, emoji: '' };
  };

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const selected = isSelected(item.value);
        const { text, emoji } = parseLabel(item.label);
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.item, selected && styles.itemSelected]}
            onPress={() => onSelect(item.value)}
            activeOpacity={0.7}
          >
            {emoji ? (
              <>
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                  {text}
                </Text>
              </>
            ) : (
              <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                {text}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.OS === 'android' ? 6 : 8,
    justifyContent: 'flex-start',
  },
  item: {
    width: '23%',
    aspectRatio: Platform.OS === 'android' ? 0.9 : 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: Platform.OS === 'android' ? 12 : 16,
    borderWidth: 1,
    padding: Platform.OS === 'android' ? 6 : 4,
  },
  itemSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  emoji: {
    fontSize: Platform.OS === 'android' ? 26 : 32,
    marginBottom: Platform.OS === 'android' ? 1 : 2,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 30 : 36,
  },
  label: {
    color: '#000',
    fontSize: Platform.OS === 'android' ? 10 : 13,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: Platform.OS === 'android' ? 1 : 2,
    maxWidth: '100%',
  },
  labelSelected: {
    color: '#FFF',
  },
});
