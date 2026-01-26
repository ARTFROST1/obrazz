import { NativeModulesProxy, requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { ViewProps } from 'react-native';

export type ObrazzContextMenuAction = {
  id: string;
  title: string;
  systemIcon?: string;
  destructive?: boolean;
  disabled?: boolean;
};

export type ObrazzContextMenuOnActionEvent = {
  id: string;
};

export type ObrazzContextMenuProps = {
  actions: ObrazzContextMenuAction[];
  menuTitle?: string;
  enabled?: boolean;
  onAction?: (event: { nativeEvent: ObrazzContextMenuOnActionEvent }) => void;
  onMenuWillShow?: (event: { nativeEvent: Record<string, never> }) => void;
  onMenuDidHide?: (event: { nativeEvent: Record<string, never> }) => void;
} & ViewProps;

const hasNativeModule = Boolean((NativeModulesProxy as any)?.ObrazzContextMenu);

const NativeView: React.ComponentType<ObrazzContextMenuProps> | null = hasNativeModule
  ? requireNativeViewManager('ObrazzContextMenu')
  : null;

export function ObrazzContextMenuView(props: ObrazzContextMenuProps) {
  if (!NativeView) {
    // Running in an environment without the native module (e.g. Expo Go).
    // We render children normally to avoid the "Unimplemented component" placeholder.
    return <>{props.children}</>;
  }

  return <NativeView {...props} />;
}
