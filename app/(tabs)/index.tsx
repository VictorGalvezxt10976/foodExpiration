import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Text } from '../../src/components/StyledText';
import { GlassView, GlassContainer } from 'expo-glass-effect';
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
import { EmptyState } from '../../src/components/EmptyState';
import { getTodayString } from '../../src/utils/dates';
import { getExpirationLabel } from '../../src/utils/dates';
import { Host, Button, VStack, HStack } from '@expo/ui/swift-ui';

export default function HomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  // Android glass fallback styles
  const androidGlassCard = {
    backgroundColor: isDark ? 'rgba(50, 50, 50, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    elevation: 3,
  };

  const androidGlassBtn = {
    backgroundColor: isDark ? 'rgba(50, 50, 50, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    elevation: 2,
  };

  const NutritionCards = () => {
    const cards = [
      { color: '#F47551', value: Math.round(nutrition.totalCalories), unit: 'kcal', label: 'Calorias' },
      { color: '#CCB1F6', value: Math.round(nutrition.totalProtein), unit: 'g', label: 'Proteina' },
      { color: '#F8D558', value: Math.round(nutrition.totalFats), unit: 'g', label: 'Grasas' },
      { color: '#CDE26D', value: Math.round(nutrition.totalCarbs), unit: 'g', label: 'Carbos' },
    ];

    const CardContent = ({ card }: { card: typeof cards[0] }) => (
      <>
        <View style={[styles.nutritionDot, { backgroundColor: card.color }]} />
        <Text style={[styles.nutritionValue, { color: colors.text }]}>
          {card.value}
          <Text style={[styles.nutritionUnit, { color: colors.textSecondary }]}> {card.unit}</Text>
        </Text>
        <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>{card.label}</Text>
      </>
    );

    if (Platform.OS === 'android') {
      return (
        <View style={styles.nutritionContainer}>
          {cards.map(card => (
            <View key={card.label} style={[styles.nutritionCard, androidGlassCard]}>
              <CardContent card={card} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <GlassContainer spacing={8} style={styles.nutritionContainer}>
        {cards.map(card => (
          <GlassView key={card.label} style={styles.nutritionCard}>
            <CardContent card={card} />
          </GlassView>
        ))}
      </GlassContainer>
    );
  };

  const HeaderButton = () => {
    if (Platform.OS === 'android') {
      return (
        <View style={[styles.headerBtn, androidGlassBtn]}>
          <Ionicons name="sparkles" size={20} color={colors.accent} />
        </View>
      );
    }
    return (
      <GlassView style={styles.headerBtn}>
        <Ionicons name="sparkles" size={20} color={colors.accent} />
      </GlassView>
    );
  };

  const AlertBanner = () => {
    const content = (
      <>
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
      </>
    );

    if (Platform.OS === 'android') {
      return <View style={[styles.alertBanner, androidGlassCard]}>{content}</View>;
    }
    return <GlassView style={styles.alertBanner}>{content}</GlassView>;
  };

  const AlertItem = ({ item }: { item: FoodItem }) => {
    const content = (
      <>
        <View style={[styles.alertDot, {
          backgroundColor: item.status === 'expired' ? colors.statusExpired : colors.statusExpiring,
        }]} />
        <Text style={[styles.alertItemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.alertItemLabel, { color: colors.textSecondary }]}>
          {getExpirationLabel(item.expirationDate)}
        </Text>
      </>
    );

    if (Platform.OS === 'android') {
      return <View style={[styles.alertItem, androidGlassCard]}>{content}</View>;
    }
    return <GlassView style={styles.alertItem}>{content}</GlassView>;
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../../assets/background.png')}
        resizeMode="cover"
      />
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>FreshKeep</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/ai-recipes')}
            >
              <HeaderButton />
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

        <NutritionCards />

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
            <AlertBanner />
            {alertItems.map(item => (
              <AlertItem key={item.id} item={item} />
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.55,
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
  nutritionContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 2,
  },
  nutritionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  nutritionUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  nutritionLabel: {
    fontSize: 11,
    marginTop: 2,
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
