// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  'house.fill': 'home',
  'heart.fill': 'favorite',
  'clipboard.checkmark': 'check-circle',
  'person.circle.fill': 'person',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'bell.fill': 'notifications',
  'gearshape.fill': 'settings',
  'trash.fill': 'delete',
  'pencil': 'edit',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  'xmark.circle.fill': 'cancel',
  'checkmark.circle.fill': 'check-circle',
  'photo.fill': 'photo',
  'camera.fill': 'camera',
  'lock.fill': 'lock',
  'lock.open.fill': 'lock-open',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle.fill': 'info',
  'questionmark.circle.fill': 'help',
  'star.fill': 'star',
  'star.lefthalf.fill': 'star-half',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'graduationcap.fill': 'school',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;


export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
