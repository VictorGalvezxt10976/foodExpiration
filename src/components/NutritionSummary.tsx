import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { DailyNutrition } from '../types';

interface Props {
  nutrition: DailyNutrition;
}

const STAT_COLORS = {
  calories: '#F47551',
  protein: '#CCB1F6',
  fats: '#F8D558',
  carbs: '#CDE26D',
};

export function NutritionSummary({ nutrition }: Props) {
  const { colors } = useTheme();

  const stats = [
    { label: 'Calorias', value: `${Math.round(nutrition.totalCalories)}`, unit: 'kcal', color: STAT_COLORS.calories },
    { label: 'Proteina', value: `${Math.round(nutrition.totalProtein)}`, unit: 'g', color: STAT_COLORS.protein },
    { label: 'Grasas', value: `${Math.round(nutrition.totalFats)}`, unit: 'g', color: STAT_COLORS.fats },
    { label: 'Carbos', value: `${Math.round(nutrition.totalCarbs)}`, unit: 'g', color: STAT_COLORS.carbs },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
      <View style={styles.row}>
        {stats.map(stat => (
          <View key={stat.label} style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: stat.color }]} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}> {stat.unit}</Text>
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
