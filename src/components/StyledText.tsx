import React from 'react';
import { Text as RNText, TextProps, TextStyle, StyleSheet } from 'react-native';

const FONT_WEIGHTS: Record<string, string> = {
  '400': 'PlaypenSans_400Regular',
  'normal': 'PlaypenSans_400Regular',
  '500': 'PlaypenSans_500Medium',
  '600': 'PlaypenSans_600SemiBold',
  '700': 'PlaypenSans_700Bold',
  'bold': 'PlaypenSans_700Bold',
};

export function Text({ style, ...props }: TextProps) {
  const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const weight = flatStyle?.fontWeight?.toString() || '400';
  const fontFamily = FONT_WEIGHTS[weight] || 'PlaypenSans_400Regular';

  return (
    <RNText
      {...props}
      style={[{ fontFamily }, style]}
    />
  );
}
