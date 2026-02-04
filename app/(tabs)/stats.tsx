import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { getWasteStats, getInventoryStats } from '../../src/database/foodItems';
import { StatCard } from '../../src/components/StatCard';
import { CATEGORIES } from '../../src/constants/categories';

interface WasteStats {
  totalWasted: number;
  totalConsumed: number;
  wastedValue: number;
  savedValue: number;
  byCategory: { category: string; wasted: number; consumed: number }[];
}

interface InvStats {
  total: number;
  fresh: number;
  expiring: number;
  expired: number;
  totalValue: number;
  wastedValue: number;
}

export default function StatsScreen() {
  const db = useDatabase();
  const { colors } = useTheme();

  const [wasteStats, setWasteStats] = useState<WasteStats>({
    totalWasted: 0,
    totalConsumed: 0,
    wastedValue: 0,
    savedValue: 0,
    byCategory: [],
  });
  const [invStats, setInvStats] = useState<InvStats>({
    total: 0,
    fresh: 0,
    expiring: 0,
    expired: 0,
    totalValue: 0,
    wastedValue: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [waste, inv] = await Promise.all([
      getWasteStats(db),
      getInventoryStats(db),
    ]);
    setWasteStats(waste);
    setInvStats(inv);
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

  const totalHandled = wasteStats.totalConsumed + wasteStats.totalWasted;
  const consumedPercent = totalHandled > 0 ? Math.round((wasteStats.totalConsumed / totalHandled) * 100) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen del Inventario</Text>
      <View style={styles.statsRow}>
        <StatCard title="Total" value={invStats.total} icon="cube" color={colors.primary} />
        <StatCard title="Frescos" value={invStats.fresh} icon="checkmark-circle" color={colors.statusFresh} />
        <StatCard title="Por vencer" value={invStats.expiring} icon="warning" color={colors.statusExpiring} />
      </View>

      {invStats.totalValue > 0 && (
        <View style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="wallet" size={22} color={colors.primary} />
          <View style={styles.valueContent}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Valor del inventario actual</Text>
            <Text style={[styles.valueAmount, { color: colors.text }]}>${invStats.totalValue.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Uso de Alimentos</Text>
      <View style={styles.statsRow}>
        <StatCard title="Consumidos" value={wasteStats.totalConsumed} icon="checkmark-done" color={colors.success} />
        <StatCard title="Desperdicio" value={wasteStats.totalWasted} icon="trash" color={colors.danger} />
        <StatCard title="Tasa de uso" value={`${consumedPercent}%`} icon="pie-chart" color={colors.primary} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen Financiero</Text>
      <View style={styles.financeCards}>
        <View style={[styles.finCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Ionicons name="trending-up" size={24} color={colors.success} />
          <Text style={[styles.finLabel, { color: colors.success }]}>Dinero Ahorrado</Text>
          <Text style={[styles.finAmount, { color: colors.success }]}>
            ${wasteStats.savedValue.toFixed(2)}
          </Text>
          <Text style={[styles.finSubtext, { color: colors.textSecondary }]}>de productos consumidos</Text>
        </View>
        <View style={[styles.finCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '30' }]}>
          <Ionicons name="trending-down" size={24} color={colors.danger} />
          <Text style={[styles.finLabel, { color: colors.danger }]}>Dinero Perdido</Text>
          <Text style={[styles.finAmount, { color: colors.danger }]}>
            ${wasteStats.wastedValue.toFixed(2)}
          </Text>
          <Text style={[styles.finSubtext, { color: colors.textSecondary }]}>de productos desperdiciados</Text>
        </View>
      </View>

      {wasteStats.byCategory.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Por Categoria</Text>
          {wasteStats.byCategory.map(cat => {
            const catInfo = CATEGORIES.find(c => c.value === cat.category);
            const catTotal = cat.consumed + cat.wasted;
            const catConsumedPct = catTotal > 0 ? Math.round((cat.consumed / catTotal) * 100) : 0;

            return (
              <View
                key={cat.category}
                style={[styles.categoryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons
                  name={(catInfo?.icon ?? 'ellipsis-horizontal') as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={colors.textSecondary}
                />
                <View style={styles.categoryContent}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {catInfo?.label ?? cat.category}
                  </Text>
                  <View style={styles.categoryBarBg}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          backgroundColor: colors.success,
                          width: `${catConsumedPct}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryNumbers}>
                  <Text style={[styles.categoryConsumed, { color: colors.success }]}>
                    {cat.consumed}
                  </Text>
                  <Text style={[styles.categorySep, { color: colors.textSecondary }]}>/</Text>
                  <Text style={[styles.categoryWasted, { color: colors.danger }]}>
                    {cat.wasted}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {totalHandled === 0 && invStats.total === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart" size={48} color={colors.textSecondary + '60'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin datos</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Comienza a agregar y rastrear productos para ver estadisticas aqui.
          </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  valueContent: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
  },
  valueAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  financeCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  finCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  finAmount: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  finSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 3,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryBarBg: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  categoryBarFill: {
    height: 4,
    borderRadius: 2,
  },
  categoryNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryConsumed: {
    fontSize: 14,
    fontWeight: '600',
  },
  categorySep: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  categoryWasted: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});
