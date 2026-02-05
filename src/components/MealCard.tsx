import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Meal } from '../types';

interface Props {
  meal: Meal;
  onPress?: (meal: Meal) => void;
  onDelete?: (meal: Meal) => void;
}

const MACRO_COLORS = {
  protein: '#CCB1F6',
  fats: '#F8D558',
  carbs: '#CDE26D',
};

export function MealCard({ meal, onPress, onDelete }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={[styles.emojiCircle, { backgroundColor: colors.surface }]}>
          <Text style={styles.emoji}>{meal.emoji}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {meal.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {meal.calories} kcal{meal.servingSize ? ` · ${meal.servingSize}` : ''}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => onDelete(meal)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.macrosRow}>
        <View style={styles.macroItem}>
          <View style={[styles.macroDot, { backgroundColor: MACRO_COLORS.protein }]} />
          <Text style={[styles.macroValue, { color: colors.text }]}>{meal.protein}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Proteina</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.macroDot, { backgroundColor: MACRO_COLORS.fats }]} />
          <Text style={[styles.macroValue, { color: colors.text }]}>{meal.fats}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Grasas</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.macroDot, { backgroundColor: MACRO_COLORS.carbs }]} />
          <Text style={[styles.macroValue, { color: colors.text }]}>{meal.carbs}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  menuBtn: {
    padding: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  macroItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 11,
  },
});
