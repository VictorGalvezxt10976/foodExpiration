import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { getDailyNutrition, deleteMeal } from '../../src/database/meals';
import { getExpiringItems, getExpiredItems } from '../../src/database/foodItems';
import { DailyNutrition, Meal, MealType, FoodItem } from '../../src/types';
import { DateSelector } from '../../src/components/DateSelector';
import { MealTypeFilter } from '../../src/components/MealTypeFilter';
import { MealCard } from '../../src/components/MealCard';
import { NutritionSummary } from '../../src/components/NutritionSummary';
import { EmptyState } from '../../src/components/EmptyState';
import { getTodayString } from '../../src/utils/dates';
import { getExpirationLabel } from '../../src/utils/dates';

export default function HomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  const [nutrition, setNutrition] = useState<DailyNutrition>({
    date: getTodayString(),
    totalCalories: 0,
    totalProtein: 0,
    totalFats: 0,
    totalCarbs: 0,
    meals: [],
  });
  const [expiringItems, setExpiringItems] = useState<FoodItem[]>([]);
  const [expiredCount, setExpiredCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [daily, expiring, expired] = await Promise.all([
      getDailyNutrition(db, selectedDate),
      getExpiringItems(db, 3),
      getExpiredItems(db),
    ]);
    setNutrition(daily);
    setExpiringItems(expiring.slice(0, 3));
    setExpiredCount(expired.length);
  }, [db, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleDeleteMeal = async (meal: Meal) => {
    Alert.alert(
      'Eliminar comida',
      `Quieres eliminar "${meal.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteMeal(db, meal.id);
            loadData();
          },
        },
      ]
    );
  };

  const filteredMeals = mealFilter === 'all'
    ? nutrition.meals
    : nutrition.meals.filter(m => m.mealType === mealFilter);

  const alertItems = [...expiringItems];
  const totalAlerts = expiredCount + expiringItems.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>FreshKeep</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.card }, colors.shadow]}
            onPress={() => router.push('/ai-recipes')}
          >
            <Ionicons name="sparkles" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }, colors.shadow]}
            onPress={() => router.push({ pathname: '/add-meal', params: { date: selectedDate } })}
          >
            <Ionicons name="add" size={24} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

      <View style={{ height: 12 }} />

      <NutritionSummary nutrition={nutrition} />

      <View style={{ height: 12 }} />

      <MealTypeFilter selected={mealFilter} onSelect={setMealFilter} />

      <View style={{ height: 8 }} />

      {filteredMeals.length > 0 ? (
        filteredMeals.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            onDelete={handleDeleteMeal}
          />
        ))
      ) : (
        <EmptyState
          icon="restaurant-outline"
          title="Sin comidas"
          message="Toca el boton + para registrar tu primera comida del dia."
        />
      )}

      {totalAlerts > 0 && (
        <View style={styles.alertSection}>
          <View style={[styles.alertBanner, { backgroundColor: colors.statusExpired + '15' }]}>
            <View style={[styles.alertIconBg, { backgroundColor: colors.statusExpired + '25' }]}>
              <Ionicons name="alert-circle" size={18} color={colors.statusExpired} />
            </View>
            <Text style={[styles.alertText, { color: colors.text }]}>
              {expiredCount > 0 && `${expiredCount} vencido${expiredCount !== 1 ? 's' : ''}`}
              {expiredCount > 0 && expiringItems.length > 0 && ' · '}
              {expiringItems.length > 0 && `${expiringItems.length} por vencer`}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/inventory')}>
              <Text style={[styles.alertLink, { color: colors.primary }]}>Ver</Text>
            </TouchableOpacity>
          </View>

          {alertItems.map(item => (
            <View key={item.id} style={[styles.alertItem, { backgroundColor: colors.card }, colors.shadow]}>
              <View style={[styles.alertDot, {
                backgroundColor: item.status === 'expired' ? colors.statusExpired : colors.statusExpiring,
              }]} />
              <Text style={[styles.alertItemName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.alertItemLabel, { color: colors.textSecondary }]}>
                {getExpirationLabel(item.expirationDate)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 6,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  alertIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  alertLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertItemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  alertItemLabel: {
    fontSize: 12,
  },
});
