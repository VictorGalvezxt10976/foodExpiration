import React from 'react';
import { View, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../hooks/useTheme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  intensity?: 'standard' | 'subtle';
  onPress?: () => void;
  activeOpacity?: number;
}

export function GlassCard({
  children,
  style,
  borderRadius = 16,
  intensity = 'standard',
  onPress,
  activeOpacity = 0.7,
}: Props) {
  const { colors, isDark } = useTheme();

  const glassStyle: ViewStyle = {
    backgroundColor: intensity === 'standard' ? colors.glass.card : colors.glass.surface,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius,
    overflow: 'hidden',
    ...colors.glassShadow,
  };

  // Android fallback: simulated glass effect
  const androidGlassStyle: ViewStyle = {
    backgroundColor: isDark
      ? intensity === 'standard' ? 'rgba(50, 50, 50, 0.92)' : 'rgba(45, 45, 45, 0.88)'
      : intensity === 'standard' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    borderRadius,
    overflow: 'hidden',
    elevation: intensity === 'standard' ? 4 : 2,
  };

  if (Platform.OS === 'android') {
    if (onPress) {
      return (
        <TouchableOpacity
          style={[androidGlassStyle, style]}
          onPress={onPress}
          activeOpacity={activeOpacity}
        >
          {children}
        </TouchableOpacity>
      );
    }
    return (
      <View style={[androidGlassStyle, style]}>
        {children}
      </View>
    );
  }

  // iOS: use native GlassView
  if (onPress) {
    return (
      <TouchableOpacity
        style={[{ borderRadius, overflow: 'hidden' }, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        <GlassView
          style={[glassStyle, { borderRadius }]}
          tintColor={intensity === 'standard' ? colors.glass.card : colors.glass.surface}
        >
          {children}
        </GlassView>
      </TouchableOpacity>
    );
  }

  return (
    <GlassView
      style={[glassStyle, style, { borderRadius }]}
      tintColor={intensity === 'standard' ? colors.glass.card : colors.glass.surface}
    >
      {children}
    </GlassView>
  );
}
