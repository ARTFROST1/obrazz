import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  findNodeHandle,
  Keyboard,
  KeyboardEvent,
  Platform,
  ScrollView,
  TextInput,
  UIManager,
} from 'react-native';

interface KeyboardAwareScrollState {
  keyboardHeight: number;
  keyboardVisible: boolean;
}

interface UseKeyboardAwareScrollReturn {
  scrollViewRef: React.RefObject<ScrollView | null>;
  keyboardHeight: number;
  keyboardVisible: boolean;
  scrollToInput: (inputRef: React.RefObject<TextInput>) => void;
  dismissKeyboard: () => void;
}

/**
 * Hook for managing keyboard-aware scrolling behavior
 * Automatically scrolls to center the focused input above the keyboard
 */
export function useKeyboardAwareScroll(): UseKeyboardAwareScrollReturn {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [state, setState] = useState<KeyboardAwareScrollState>({
    keyboardHeight: 0,
    keyboardVisible: false,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      setState({
        keyboardHeight: event.endCoordinates.height,
        keyboardVisible: true,
      });
    };

    const handleKeyboardHide = () => {
      setState({
        keyboardHeight: 0,
        keyboardVisible: false,
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollToInput = useCallback(
    (inputRef: React.RefObject<TextInput>) => {
      if (!inputRef.current || !scrollViewRef.current) return;

      const inputHandle = findNodeHandle(inputRef.current);
      const scrollViewHandle = findNodeHandle(scrollViewRef.current);

      if (!inputHandle || !scrollViewHandle) return;

      // Measure the input position relative to the ScrollView
      UIManager.measureLayout(
        inputHandle,
        scrollViewHandle,
        () => {
          // Error callback - do nothing
        },
        (_x, y, _width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const keyboardHeight = state.keyboardHeight;

          // Calculate the visible area above the keyboard
          const visibleAreaHeight = screenHeight - keyboardHeight;

          // We want the input to be centered in the visible area (or slightly above center)
          // Target position: input should be at ~40% of visible area from top
          const targetPositionRatio = 0.35;
          const targetY = visibleAreaHeight * targetPositionRatio;

          // Calculate the scroll offset needed
          const inputCenter = y + height / 2;
          const scrollOffset = inputCenter - targetY;

          // Ensure we don't scroll to negative values
          const finalOffset = Math.max(0, scrollOffset);

          scrollViewRef.current?.scrollTo({
            y: finalOffset,
            animated: true,
          });
        },
      );
    },
    [state.keyboardHeight],
  );

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    scrollViewRef,
    keyboardHeight: state.keyboardHeight,
    keyboardVisible: state.keyboardVisible,
    scrollToInput,
    dismissKeyboard,
  };
}

/**
 * Simple hook for just tracking keyboard state
 */
export function useKeyboardState() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
      setKeyboardVisible(true);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, keyboardVisible };
}
