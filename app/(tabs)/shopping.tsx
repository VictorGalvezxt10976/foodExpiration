import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import {
  getShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCheckedItems,
} from '../../src/database/shoppingList';
import { getExpiredItems } from '../../src/database/foodItems';
import { ShoppingListItem, FoodItem } from '../../src/types';
import { EmptyState } from '../../src/components/EmptyState';

export default function ShoppingScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadData = useCallback(async () => {
    const [list, expired] = await Promise.all([
      getShoppingList(db),
      getExpiredItems(db),
    ]);
    setItems(list);
    // Filter out items already in the shopping list
    const listNames = new Set(list.map(i => i.name.toLowerCase()));
    setSuggestions(expired.filter(i => !listNames.has(i.name.toLowerCase())));
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

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await addShoppingItem(db, {
      name: newItemName.trim(),
      category: 'other',
      quantity: 1,
      unit: 'pcs',
    });
    setNewItemName('');
    loadData();
  };

  const handleAddSuggestion = async (item: FoodItem) => {
    await addShoppingItem(db, {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      sourceItemId: item.id,
    });
    loadData();
  };

  const handleToggle = async (item: ShoppingListItem) => {
    await toggleShoppingItem(db, item.id, !item.checked);
    loadData();
  };

  const handleDelete = async (item: ShoppingListItem) => {
    await deleteShoppingItem(db, item.id);
    loadData();
  };

  const handleClearChecked = () => {
    const checkedCount = items.filter(i => i.checked).length;
    if (checkedCount === 0) return;
    Alert.alert(
      'Limpiar marcados',
      `Eliminar ${checkedCount} producto${checkedCount !== 1 ? 's' : ''} marcado${checkedCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: async () => {
            await clearCheckedItems(db);
            loadData();
          },
        },
      ]
    );
  };

  const handleMoveToInventory = (item: ShoppingListItem) => {
    router.push({
      pathname: '/add-item',
    });
  };

  const checkedCount = items.filter(i => i.checked).length;
  const uncheckedCount = items.filter(i => !i.checked).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.addRow, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.addInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Agregar producto a la lista..."
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddItem}
        >
          <Ionicons name="add" size={22} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <TouchableOpacity
          style={[styles.suggestionsHeader, { backgroundColor: colors.accent + '15' }]}
          onPress={() => setShowSuggestions(!showSuggestions)}
        >
          <View style={styles.suggestionsRow}>
            <Ionicons name="bulb" size={18} color={colors.accent} />
            <Text style={[styles.suggestionsTitle, { color: colors.accent }]}>
              {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''} de productos vencidos
            </Text>
          </View>
          <Ionicons
            name={showSuggestions ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.accent}
          />
        </TouchableOpacity>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map(item => (
            <View
              key={item.id}
              style={[styles.suggestionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.suggestionName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity
                style={[styles.suggestionAddBtn, { backgroundColor: colors.primary + '20' }]}
                onPress={() => handleAddSuggestion(item)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.suggestionAddText, { color: colors.primary }]}>Agregar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {checkedCount > 0 && (
        <TouchableOpacity
          style={[styles.clearRow, { backgroundColor: colors.surface }]}
          onPress={handleClearChecked}
        >
          <Text style={[styles.clearText, { color: colors.danger }]}>
            Limpiar {checkedCount} marcado{checkedCount !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleToggle(item)}
            onLongPress={() => {
              Alert.alert('Eliminar producto', `Quitar "${item.name}" de la lista?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(item) },
              ]);
            }}
          >
            <Ionicons
              name={item.checked ? 'checkbox' : 'square-outline'}
              size={22}
              color={item.checked ? colors.primary : colors.textSecondary}
            />
            <View style={styles.listItemContent}>
              <Text
                style={[
                  styles.listItemName,
                  { color: item.checked ? colors.textSecondary : colors.text },
                  item.checked && styles.strikethrough,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                {item.quantity} {item.unit} · {item.category}
              </Text>
            </View>
            {item.checked && (
              <TouchableOpacity
                onPress={() => handleMoveToInventory(item)}
                style={[styles.moveBtn, { backgroundColor: colors.primary + '20' }]}
              >
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cart"
            title="Lista de compras vacia"
            message="Agrega productos manualmente o revisa las sugerencias de productos vencidos."
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
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 15,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestionName: {
    flex: 1,
    fontSize: 14,
  },
  suggestionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionAddText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 3,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  listItemDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  moveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
});
