import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Text } from './StyledText';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { MealType } from '../types';
import { MEAL_TYPES } from '../constants/meals';

interface Props {
  selected: MealType | 'all';
  onSelect: (type: MealType | 'all') => void;
}

export function MealTypeFilter({ selected, onSelect }: Props) {
  const { colors, isDark } = useTheme();

  const androidChipStyle = {
    backgroundColor: isDark ? 'rgba(50, 50, 50, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    elevation: 2,
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {MEAL_TYPES.map(type => {
        const isActive = selected === type.value;

        const content = (
          <>
            <Ionicons
              name={type.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={isActive ? colors.primaryText : colors.textSecondary}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primaryText : colors.text },
              ]}
            >
              {type.label}
            </Text>
          </>
        );

        if (isActive) {
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.chip,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => onSelect(type.value)}
              activeOpacity={0.7}
            >
              {content}
            </TouchableOpacity>
          );
        }

        if (Platform.OS === 'android') {
          return (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, androidChipStyle]}
              onPress={() => onSelect(type.value)}
              activeOpacity={0.7}
            >
              {content}
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={type.value}
            onPress={() => onSelect(type.value)}
            activeOpacity={0.7}
          >
            <GlassView style={styles.chip}>
              {content}
            </GlassView>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
