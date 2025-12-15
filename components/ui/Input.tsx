import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    marginBottom: 16,
  },
  error: {
    color: '#FF3B30',
    fontSize: 13,
    marginLeft: 4,
    marginTop: 4,
  },
  input: {
    color: '#000000',
    flex: 1,
    fontSize: 17,
    padding: 0,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  inputContainerFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  label: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIconButton: {
    marginLeft: 8,
    padding: 8,
  },
});
