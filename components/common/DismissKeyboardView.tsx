import React from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
} from 'react-native';

interface DismissKeyboardViewProps {
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
}: DismissKeyboardViewProps) {
  const handlePress = () => {
    if (!disabled) {
      Keyboard.dismiss();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
      <View style={[styles.container, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
