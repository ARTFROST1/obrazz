import { Ionicons } from '@expo/vector-icons';
import { CAN_USE_LIQUID_GLASS } from '@utils/platform';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import {
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

interface GlassSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onClear?: () => void;
}

/**
 * GlassSearchBar - Search bar with liquid glass effect on iOS 26+
 *
 * Features:
 * - iOS 26+: Native liquid glass effect with translucency
 * - iOS < 26 / Android: Material Design 3 style search bar
 * - Auto-adapts to light/dark mode
 * - Clear button when text is present
 *
 * Usage:
 * ```tsx
 * import { GlassSearchBar } from '@components/ui/glass';
 *
 * <GlassSearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search items..."
 * />
 * ```
 */
export const GlassSearchBar: React.FC<GlassSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  onClear,
}) => {
  const supportsLiquidGlass = CAN_USE_LIQUID_GLASS;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // CRITICAL: Delay mounting GlassView until component is stable
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (supportsLiquidGlass) {
      // Small delay to ensure proper initialization
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [supportsLiquidGlass]);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  // Dynamic colors that adapt to light/dark mode
  const iconColor =
    Platform.OS === 'ios' && supportsLiquidGlass
      ? PlatformColor('secondaryLabel')
      : isDark
        ? '#8E8E93'
        : '#666666';
  const textColor =
    Platform.OS === 'ios' && supportsLiquidGlass
      ? PlatformColor('label')
      : isDark
        ? '#FFFFFF'
        : '#000000';
  const placeholderColor =
    Platform.OS === 'ios' && supportsLiquidGlass
      ? PlatformColor('tertiaryLabel')
      : isDark
        ? '#636366'
        : '#999999';

  const content = (
    <>
      <Ionicons name="search" size={20} color={iconColor} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        // Android-specific improvements
        underlineColorAndroid="transparent"
        selectionColor={isDark ? '#007AFF' : '#007AFF'}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          android_ripple={{
            color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            borderless: true,
            radius: 16,
          }}
        >
          <Ionicons name="close-circle" size={20} color={iconColor} />
        </Pressable>
      )}
    </>
  );

  // iOS 26+: Native Liquid Glass
  // CRITICAL: isInteractive={true} is REQUIRED for TextInput to work inside GlassView
  // Wait for mounted flag before rendering GlassView
  if (supportsLiquidGlass && mounted) {
    return (
      <GlassView
        style={[styles.container, styles.glassContainer, style]}
        glassEffectStyle="regular"
        isInteractive={true}
      >
        {content}
      </GlassView>
    );
  }

  // Fallback: Material Design 3 style search bar for iOS < 26, Android, or during mount delay
  return (
    <View
      style={[
        styles.container,
        isDark ? styles.fallbackContainerDark : styles.fallbackContainerLight,
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  glassContainer: {
    // GlassView handles background automatically
    overflow: 'hidden',
  },
  fallbackContainerLight: {
    backgroundColor: '#F2F2F7',
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  fallbackContainerDark: {
    backgroundColor: '#1C1C1E',
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    // Color is set dynamically via style prop
    paddingVertical: 0,
  },
});
