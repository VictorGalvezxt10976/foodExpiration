import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettings } from '../../src/contexts/SettingsContext';
import { getFoodItems, updateFoodItem } from '../../src/database/foodItems';
import { FoodItem, FoodCategory } from '../../src/types';
import { FoodItemCard } from '../../src/components/FoodItemCard';
import { EmptyState } from '../../src/components/EmptyState';
import { CATEGORIES } from '../../src/constants/categories';
import { Host, Picker } from '@expo/ui/swift-ui';
import { scanProductLabel } from '../../src/services/labelScanner';

type FilterStatus = 'all' | 'fresh' | 'expiring' | 'expired';

export default function InventoryScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, rescheduleNotifications } = useSettings();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

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

  const handleScanLabel = async () => {
    if (!settings.openaiApiKey) {
      Alert.alert(
        'API Key requerida',
        'Para escanear etiquetas necesitas configurar tu API key de OpenAI. Ve a Ajustes para agregarla.',
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la camara para escanear etiquetas.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    setScanning(true);
    try {
      const data = await scanProductLabel(settings.openaiApiKey, result.assets[0].base64);
      router.push({
        pathname: '/add-item',
        params: { scannedData: JSON.stringify(data) },
      });
    } catch (error) {
      Alert.alert('Error al escanear', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setScanning(false);
    }
  };

  const handleMarkConsumed = async (item: FoodItem) => {
    await updateFoodItem(db, item.id, { disposition: 'consumed' });
    await rescheduleNotifications();
    loadData();
  };

  const handleMarkThrownAway = async (item: FoodItem) => {
    await updateFoodItem(db, item.id, { disposition: 'thrown_away' });
    await rescheduleNotifications();
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
          <Ionicons name="add" size={22} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'ios' ? (
        <View style={styles.pickerContainer}>
          <Host matchContents>
            <Picker
              options={statusFilters.map(f => f.label)}
              selectedIndex={statusFilters.findIndex(f => f.value === selectedStatus)}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedStatus(statusFilters[index].value);
              }}
              variant="segmented"
            />
          </Host>
        </View>
      ) : (
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
                    { color: selectedStatus === f.value ? colors.primaryText : colors.text },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

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
                color={selectedCategory === c.value ? colors.primaryText : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  { color: selectedCategory === c.value ? colors.primaryText : colors.text },
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: Platform.OS === 'android' ? 140 : insets.bottom + 70 }]}
        onPress={handleScanLabel}
        disabled={scanning}
        activeOpacity={0.8}
      >
        {scanning ? (
          <ActivityIndicator size="small" color={colors.primaryText} />
        ) : (
          <Ionicons name="camera" size={26} color={colors.primaryText} />
        )}
      </TouchableOpacity>
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
    borderRadius: 14,
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    borderRadius: 20,
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
