import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../src/hooks/useDatabase';
import { useTheme } from '../src/hooks/useTheme';
import { useSettings } from '../src/contexts/SettingsContext';
import { addFoodItem } from '../src/database/foodItems';

import { FoodCategory, StorageLocation } from '../src/types';
import { CATEGORIES, STORAGE_LOCATIONS, UNITS } from '../src/constants/categories';
import { getDefaultExpirationDate, getTodayString } from '../src/utils/dates';
import { getCurrencySymbol } from '../src/utils/currency';

export default function AddItemScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, rescheduleNotifications } = useSettings();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('other');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pzas');
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [expirationDate, setExpirationDate] = useState(getDefaultExpirationDate());
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('fridge');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Por favor ingresa un nombre para el producto.');
      return;
    }

    if (!expirationDate) {
      Alert.alert('Falta la fecha', 'Por favor ingresa una fecha de vencimiento.');
      return;
    }

    await addFoodItem(db, {
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      purchaseDate,
      expirationDate,
      storageLocation,
      disposition: 'active',
      price: price ? parseFloat(price) : null,
      currency: settings.currency,
      notes: notes.trim(),
    });

    await rescheduleNotifications();
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Nombre *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Leche entera"
          placeholderTextColor={colors.textSecondary}
          autoFocus
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
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>Fecha de vencimiento *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={expirationDate}
              onChangeText={setExpirationDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
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
          <Text style={[styles.saveBtnText, { color: colors.primaryText }]}>Guardar</Text>
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
});
