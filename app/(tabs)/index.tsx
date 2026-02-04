import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { getInventoryStats, getExpiringItems, getExpiredItems, updateFoodItem } from '../../src/database/foodItems';
import { FoodItem } from '../../src/types';
import { StatCard } from '../../src/components/StatCard';
import { FoodItemCard } from '../../src/components/FoodItemCard';
import { EmptyState } from '../../src/components/EmptyState';

export default function HomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();

  const [stats, setStats] = useState({ total: 0, fresh: 0, expiring: 0, expired: 0, totalValue: 0, wastedValue: 0 });
  const [expiringItems, setExpiringItems] = useState<FoodItem[]>([]);
  const [expiredItems, setExpiredItems] = useState<FoodItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [s, expiring, expired] = await Promise.all([
      getInventoryStats(db),
      getExpiringItems(db, 3),
      getExpiredItems(db),
    ]);
    setStats(s);
    setExpiringItems(expiring);
    setExpiredItems(expired);
  }, [db]);

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

  const handleMarkConsumed = async (item: FoodItem) => {
    await updateFoodItem(db, item.id, { disposition: 'consumed' });
    loadData();
  };

  const handleMarkThrownAway = async (item: FoodItem) => {
    await updateFoodItem(db, item.id, { disposition: 'thrown_away' });
    loadData();
  };

  const handleItemPress = (item: FoodItem) => {
    router.push({ pathname: '/edit-item', params: { id: item.id } });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>FreshKeep</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add-item')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="Total" value={stats.total} icon="cube" color={colors.primary} />
        <StatCard title="Frescos" value={stats.fresh} icon="checkmark-circle" color={colors.statusFresh} />
        <StatCard title="Por vencer" value={stats.expiring} icon="warning" color={colors.statusExpiring} />
      </View>

      {stats.expired > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: colors.statusExpired + '15' }]}>
          <Ionicons name="alert-circle" size={20} color={colors.statusExpired} />
          <Text style={[styles.alertText, { color: colors.statusExpired }]}>
            {stats.expired} producto{stats.expired !== 1 ? 's' : ''} vencido{stats.expired !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {expiredItems.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.statusExpired }]}>Vencidos</Text>
          {expiredItems.slice(0, 5).map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              onPress={handleItemPress}
              onMarkConsumed={handleMarkConsumed}
              onMarkThrownAway={handleMarkThrownAway}
            />
          ))}
          {expiredItems.length > 5 && (
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                Ver los {expiredItems.length} productos vencidos
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {expiringItems.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.statusExpiring }]}>Por Vencer</Text>
          {expiringItems.slice(0, 5).map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              onPress={handleItemPress}
              onMarkConsumed={handleMarkConsumed}
              onMarkThrownAway={handleMarkThrownAway}
            />
          ))}
          {expiringItems.length > 5 && (
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                Ver los {expiringItems.length} productos por vencer
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {stats.total === 0 && (
        <EmptyState
          icon="nutrition"
          title="Sin productos"
          message="Toca el boton + para agregar tu primer producto y comenzar a rastrear fechas de vencimiento."
        />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  seeAll: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
});
