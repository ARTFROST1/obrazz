import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onClear?: () => void;
  /**
   * Visual variant of the search bar
   * - 'rounded': Pill-shaped search bar (default)
   * - 'square': Rounded rectangle search bar
   */
  variant?: 'rounded' | 'square';
  /**
   * Force dark theme styling regardless of system color scheme.
   * Used on screens that are always dark (e.g., Outfits).
   */
  forceDark?: boolean;
}

/**
 * SearchBar - Cross-platform search bar component
 *
 * Features:
 * - Matches iOS 26+ GlassSearchBar visual style
 * - Adapts to light/dark mode
 * - Clear button when text is present
 * - Keyboard-aware (can dismiss on search)
 * - Works on Android and iOS < 26
 *
 * Usage:
 * ```tsx
 * import { SearchBar } from '@components/ui';
 *
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search items..."
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  onClear,
  variant = 'rounded',
  forceDark,
  ...textInputProps
}) => {
  const colorScheme = useColorScheme();
  const isDark = forceDark ?? colorScheme === 'dark';
  const inputRef = useRef<TextInput>(null);

  // Theme colors
  const backgroundColor = isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(248, 248, 248, 0.95)';
  const borderColor = isDark ? 'rgba(84, 84, 88, 0.65)' : 'rgba(229, 229, 229, 1)';
  const iconColor = isDark ? '#8E8E93' : '#666666';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const placeholderColor = isDark ? '#636366' : '#8E8E93';

  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const containerStyle: ViewStyle = {
    backgroundColor,
    borderColor,
    borderRadius: variant === 'rounded' ? 24 : 12,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Ionicons name="search" size={20} color={iconColor} style={styles.icon} />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never" // We use custom clear button
        {...textInputProps}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={18} color={iconColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    // Shadow for depth (matches iOS style)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 0,
    ...Platform.select({
      android: {
        paddingVertical: 8,
      },
    }),
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});
