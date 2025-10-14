import { StyleProp, ViewStyle } from 'react-native';

export interface FABProps {
  icon: string;
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
  hideOnScroll?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export interface FABState {
  isVisible: boolean;
  scale: number;
}
