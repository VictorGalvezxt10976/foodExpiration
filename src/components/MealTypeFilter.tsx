import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { MealType } from '../types';
import { MEAL_TYPES } from '../constants/meals';

interface Props {
  selected: MealType | 'all';
  onSelect: (type: MealType | 'all') => void;
}

export function MealTypeFilter({ selected, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {MEAL_TYPES.map(type => {
        const isActive = selected === type.value;
        return (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.primary : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
              },
              !isActive && colors.shadow,
            ]}
            onPress={() => onSelect(type.value)}
            activeOpacity={0.7}
          >
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
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
