import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Host, DateTimePicker } from '@expo/ui/swift-ui';
import { useDatabase } from '../src/hooks/useDatabase';
import { useTheme } from '../src/hooks/useTheme';
import { useSettings } from '../src/contexts/SettingsContext';
import { getFoodItemById, updateFoodItem, deleteFoodItem } from '../src/database/foodItems';
import { FoodCategory, StorageLocation } from '../src/types';
import { CATEGORIES, STORAGE_LOCATIONS, UNITS } from '../src/constants/categories';
import { getCurrencySymbol } from '../src/utils/currency';
import { dateToDateString } from '../src/utils/dates';

export default function EditItemScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { settings, rescheduleNotifications } = useSettings();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('other');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pzas');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('fridge');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const item = await getFoodItemById(db, id);
      if (!item) {
        Alert.alert('Error', 'Producto no encontrado.');
        router.back();
        return;
      }
      setName(item.name);
      setCategory(item.category);
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setPurchaseDate(item.purchaseDate);
      setExpirationDate(item.expirationDate);
      setStorageLocation(item.storageLocation);
      setPrice(item.price != null ? String(item.price) : '');
      setNotes(item.notes);
      setLoading(false);
    })();
  }, [id, db]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Por favor ingresa un nombre para el producto.');
      return;
    }
    if (!id) return;

    await updateFoodItem(db, id, {
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      purchaseDate,
      expirationDate,
      storageLocation,
      price: price ? parseFloat(price) : null,
      notes: notes.trim(),
    });

    await rescheduleNotifications();
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Eliminar producto', `Seguro que quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteFoodItem(db, id);
            await rescheduleNotifications();
            router.back();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View key={loading ? 'loading' : id} style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Nombre *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Leche entera"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
        <View style={styles.chipGroup}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.chip,
                {
                  backgroundColor: category === c.value ? colors.primary : colors.surface,
                  borderColor: category === c.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCategory(c.value)}
            >
              <Ionicons
                name={c.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={category === c.value ? colors.primaryText : colors.textSecondary}
              />
              <Text style={{ color: category === c.value ? colors.primaryText : colors.text, fontSize: 13 }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>Cantidad</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>Unidad</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowUnitPicker(!showUnitPicker)}
            >
              <Text style={{ color: colors.text }}>{unit}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {showUnitPicker && (
          <View style={[styles.chipGroup, { marginTop: -4 }]}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.chip,
                  {
                    backgroundColor: unit === u ? colors.primary : colors.surface,
                    borderColor: unit === u ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setUnit(u); setShowUnitPicker(false); }}
              >
                <Text style={{ color: unit === u ? colors.primaryText : colors.text, fontSize: 13 }}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Ubicacion</Text>
        <View style={styles.chipGroup}>
          {STORAGE_LOCATIONS.map(s => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.chip,
                {
                  backgroundColor: storageLocation === s.value ? colors.primary : colors.surface,
                  borderColor: storageLocation === s.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setStorageLocation(s.value)}
            >
              <Ionicons
                name={s.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={storageLocation === s.value ? colors.primaryText : colors.textSecondary}
              />
              <Text style={{ color: storageLocation === s.value ? colors.primaryText : colors.text, fontSize: 13 }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>Fecha de compra</Text>
            <Host matchContents>
              <DateTimePicker
                variant="compact"
                displayedComponents="date"
                initialDate={purchaseDate}
                onDateSelected={(date) => setPurchaseDate(dateToDateString(date))}
              />
            </Host>
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>Fecha de vencimiento *</Text>
            <Host matchContents>
              <DateTimePicker
                variant="compact"
                displayedComponents="date"
                initialDate={expirationDate}
                onDateSelected={(date) => setExpirationDate(dateToDateString(date))}
              />
            </Host>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Precio (opcional)</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>
            {getCurrencySymbol(settings.currency)}
          </Text>
          <TextInput
            style={[styles.input, styles.priceInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Notas</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas opcionales..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={20} color={colors.primaryText} />
          <Text style={[styles.saveBtnText, { color: colors.primaryText }]}>Guardar Cambios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: colors.danger }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Eliminar Producto</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
  },
  priceInput: {
    flex: 1,
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
