import React from 'react';
import {
  Keyboard,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

interface DismissKeyboardViewProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * Wrapper component that dismisses the keyboard when tapping outside of inputs.
 * Best practice for mobile UX - allows users to easily close keyboard.
 */
export function DismissKeyboardView({
  children,
  style,
  disabled = false,
  ...viewProps
}: DismissKeyboardViewProps) {
  const handlePress = () => {
    if (!disabled) {
      Keyboard.dismiss();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
      <View {...viewProps} style={[styles.container, style]}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
