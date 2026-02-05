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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettings } from '../../src/contexts/SettingsContext';
import { getWasteStats, getInventoryStats } from '../../src/database/foodItems';
import { StatCard } from '../../src/components/StatCard';
import { CATEGORIES } from '../../src/constants/categories';
import { formatPrice } from '../../src/utils/currency';

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
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

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
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen del Inventario</Text>
      <View style={styles.statsRow}>
        <StatCard title="Total" value={invStats.total} icon="cube-outline" color={colors.accent} />
        <StatCard title="Frescos" value={invStats.fresh} icon="checkmark-circle-outline" color={colors.statusFresh} />
        <StatCard title="Por vencer" value={invStats.expiring} icon="warning-outline" color={colors.statusExpiring} />
      </View>

      {invStats.totalValue > 0 && (
        <View style={[styles.valueCard, { backgroundColor: colors.card }, colors.shadow]}>
          <View style={[styles.walletIcon, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.valueContent}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Valor del inventario actual</Text>
            <Text style={[styles.valueAmount, { color: colors.text }]}>
              {formatPrice(invStats.totalValue, settings.currency)}
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Uso de Alimentos</Text>
      <View style={styles.statsRow}>
        <StatCard title="Consumidos" value={wasteStats.totalConsumed} icon="checkmark-done-outline" color={colors.primary} />
        <StatCard title="Desperdicio" value={wasteStats.totalWasted} icon="trash-outline" color={colors.danger} />
        <StatCard title="Tasa de uso" value={`${consumedPercent}%`} icon="pie-chart-outline" color={colors.accent} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen Financiero</Text>
      <View style={styles.financeCards}>
        <View style={[styles.finCard, { backgroundColor: colors.primary + '25' }]}>
          <Ionicons name="trending-up" size={24} color={colors.primaryText} />
          <Text style={[styles.finLabel, { color: colors.primaryText }]}>Dinero Ahorrado</Text>
          <Text style={[styles.finAmount, { color: colors.primaryText }]}>
            {formatPrice(wasteStats.savedValue, settings.currency)}
          </Text>
          <Text style={[styles.finSubtext, { color: colors.primaryText + '99' }]}>de productos consumidos</Text>
        </View>
        <View style={[styles.finCard, { backgroundColor: colors.danger + '20' }]}>
          <Ionicons name="trending-down" size={24} color={colors.danger} />
          <Text style={[styles.finLabel, { color: colors.danger }]}>Dinero Perdido</Text>
          <Text style={[styles.finAmount, { color: colors.danger }]}>
            {formatPrice(wasteStats.wastedValue, settings.currency)}
          </Text>
          <Text style={[styles.finSubtext, { color: colors.danger + '99' }]}>de productos desperdiciados</Text>
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
                style={[styles.categoryRow, { backgroundColor: colors.card }, colors.shadow]}
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
                  <View style={[styles.categoryBarBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${catConsumedPct}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryNumbers}>
                  <Text style={[styles.categoryConsumed, { color: colors.primary }]}>
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
          <Ionicons name="stats-chart-outline" size={48} color={colors.textSecondary + '60'} />
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
    paddingHorizontal: 20,
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
    padding: 16,
    borderRadius: 16,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
    borderRadius: 16,
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
    padding: 14,
    borderRadius: 14,
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
