import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';

interface KeyboardAwareScrollViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  showsVerticalScrollIndicator?: boolean;
  bounces?: boolean;
  scrollEnabled?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * A ScrollView that automatically scrolls to the focused input field,
 * positioning it in the center of the visible area above the keyboard.
 * Also dismisses keyboard when tapping outside inputs.
 */
export function KeyboardAwareScrollView({
  children,
  style,
  contentContainerStyle,
  extraScrollHeight = 75,
  enableOnAndroid = true,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  bounces = true,
  scrollEnabled = true,
  onScroll,
}: KeyboardAwareScrollViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const currentlyFocusedInput = useRef<number | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollToInput = useCallback(
    (reactNode: number) => {
      if (!scrollViewRef.current) return;

      const scrollViewHandle = findNodeHandle(scrollViewRef.current);
      if (!scrollViewHandle) return;

      // Small delay to ensure keyboard height is updated
      setTimeout(() => {
        // First measure input position relative to screen
        UIManager.measure(reactNode, (_x, _y, _width, height, _pageX, pageY) => {
          const screenHeight = Dimensions.get('window').height;
          const currentKeyboardHeight = keyboardHeight;

          // Calculate visible area above keyboard
          const visibleAreaHeight = screenHeight - currentKeyboardHeight;

          // Threshold: only scroll if input is below 50% of visible area
          // This means if input is already in upper half, don't scroll
          const scrollThreshold = visibleAreaHeight * 0.5;
          const inputBottom = pageY + height;

          // If input is already above the threshold (in upper portion of screen), don't scroll
          if (inputBottom < scrollThreshold) {
            return;
          }

          // Now measure relative to ScrollView to calculate scroll offset
          UIManager.measureLayout(
            reactNode,
            scrollViewHandle,
            () => {
              // Error callback
            },
            (_layoutX, layoutY, _layoutWidth, layoutHeight) => {
              // Position input at ~35% from top of visible area (above center)
              const targetPositionRatio = 0.35;
              const targetY = visibleAreaHeight * targetPositionRatio;

              // Calculate scroll offset
              const inputCenter = layoutY + layoutHeight / 2;
              const scrollOffset = inputCenter - targetY + extraScrollHeight;

              scrollViewRef.current?.scrollTo({
                y: Math.max(0, scrollOffset),
                animated: true,
              });
            },
          );
        });
      }, 100);
    },
    [keyboardHeight, extraScrollHeight],
  );

  // Handle text input focus
  const handleTextInputFocus = useCallback(
    (event: { target: number }) => {
      currentlyFocusedInput.current = event.target;
      scrollToInput(event.target);
    },
    [scrollToInput],
  );

  // Add listener for text input focus events
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      // Re-scroll when keyboard appears if we have a focused input
      if (currentlyFocusedInput.current) {
        scrollToInput(currentlyFocusedInput.current);
      }
    });

    return () => subscription.remove();
  }, [scrollToInput]);

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
    currentlyFocusedInput.current = null;
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : enableOnAndroid ? 'height' : undefined;

  return (
    <KeyboardAvoidingView style={[styles.container, style]} behavior={behavior}>
      <TouchableWithoutFeedback onPress={handleDismissKeyboard} accessible={false}>
        <View style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            bounces={bounces}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onTouchStart={(e) => {
              // Track focused input for auto-scroll
              const target = e.nativeEvent.target;
              if (target && (target as unknown as TextInput)?.focus) {
                // This is a TextInput
              }
            }}
          >
            <TouchableWithoutFeedback onPress={handleDismissKeyboard} accessible={false}>
              <View
                onStartShouldSetResponder={() => false}
                onStartShouldSetResponderCapture={() => false}
              >
                {React.Children.map(children, (child) => {
                  if (!React.isValidElement(child)) return child;

                  // Recursively enhance TextInput components
                  return enhanceTextInputs(child, handleTextInputFocus);
                })}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Type definitions for props that might have input-like behavior
interface InputLikeProps {
  onChangeText?: (text: string) => void;
  onFocus?: (event: { nativeEvent: { target: number } }) => void;
  children?: React.ReactNode;
}

// Helper function to recursively find and enhance TextInput components
function enhanceTextInputs(
  element: React.ReactElement,
  onFocus: (event: { target: number }) => void,
): React.ReactElement {
  // Check if this is a TextInput or has TextInput-like behavior
  const isTextInput =
    element.type === TextInput ||
    (element.props &&
      'onChangeText' in element.props &&
      typeof element.props.onChangeText === 'function');

  if (isTextInput) {
    const props = element.props as InputLikeProps;
    const originalOnFocus = props.onFocus;
    return React.cloneElement(element, {
      onFocus: (e: { nativeEvent: { target: number } }) => {
        onFocus({ target: e.nativeEvent.target });
        if (originalOnFocus) {
          originalOnFocus(e);
        }
      },
    } as Partial<typeof element.props>);
  }

  // Recursively process children
  if (element.props && 'children' in element.props) {
    const props = element.props as InputLikeProps;
    const children = React.Children.map(props.children, (child) => {
      if (React.isValidElement(child)) {
        return enhanceTextInputs(child, onFocus);
      }
      return child;
    });

    return React.cloneElement(element, {}, children);
  }

  return element;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
