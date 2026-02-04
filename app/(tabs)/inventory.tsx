import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { getFoodItems, updateFoodItem } from '../../src/database/foodItems';
import { FoodItem, FoodCategory } from '../../src/types';
import { FoodItemCard } from '../../src/components/FoodItemCard';
import { EmptyState } from '../../src/components/EmptyState';
import { CATEGORIES } from '../../src/constants/categories';

type FilterStatus = 'all' | 'fresh' | 'expiring' | 'expired';

export default function InventoryScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const result = await getFoodItems(db, {
      category: selectedCategory ?? undefined,
      search: search || undefined,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
    });
    setItems(result);
  }, [db, selectedCategory, search, selectedStatus]);

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

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'fresh', label: 'Frescos' },
    { value: 'expiring', label: 'Por vencer' },
    { value: 'expired', label: 'Vencidos' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchRow, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add-item')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={i => i.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedStatus === f.value ? colors.primary : colors.surface,
                  borderColor: selectedStatus === f.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedStatus(f.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedStatus === f.value ? '#FFFFFF' : colors.text },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ value: null, label: 'Todos', icon: 'apps' }, ...CATEGORIES]}
          keyExtractor={i => i.value ?? 'all'}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === c.value ? colors.primary : colors.surface,
                  borderColor: selectedCategory === c.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(c.value as FoodCategory | null)}
            >
              <Ionicons
                name={c.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={selectedCategory === c.value ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  { color: selectedCategory === c.value ? '#FFFFFF' : colors.text },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <FoodItemCard
            item={item}
            onPress={handleItemPress}
            onMarkConsumed={handleMarkConsumed}
            onMarkThrownAway={handleMarkThrownAway}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="Sin resultados"
            message={search ? 'Intenta con otro termino de busqueda.' : 'Agrega productos a tu inventario para verlos aqui.'}
          />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingVertical: 4,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
});
