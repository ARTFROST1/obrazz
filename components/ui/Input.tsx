import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && <Ionicons name={leftIcon} size={20} color="#666666" style={styles.leftIcon} />}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor="#666666"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // Android-specific optimizations
          disableFullscreenUI={true}
          importantForAutofill="yes"
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconButton}>
            <Ionicons name={rightIcon} size={20} color="#666666" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 4,
    marginTop: 6,
  },
  input: {
    color: '#000000',
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: '#FF3B30',
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  label: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIconButton: {
    marginLeft: 8,
    padding: 8,
  },
});
