import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../src/components/StyledText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Host, DateTimePicker } from '@expo/ui/swift-ui';
import { useDatabase } from '../src/hooks/useDatabase';
import { useTheme } from '../src/hooks/useTheme';
import { useSettings } from '../src/contexts/SettingsContext';
import { addFoodItem } from '../src/database/foodItems';

import { FoodCategory, StorageLocation } from '../src/types';
import { CATEGORIES, STORAGE_LOCATIONS, UNITS } from '../src/constants/categories';
import { getDefaultExpirationDate, getTodayString, dateToDateString } from '../src/utils/dates';
import { getCurrencySymbol } from '../src/utils/currency';
import { scanProductLabel, ScannedProductData } from '../src/services/labelScanner';

export default function AddItemScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, rescheduleNotifications } = useSettings();
  const { scannedData } = useLocalSearchParams<{ scannedData?: string }>();

  const getInitialValues = () => {
    if (scannedData) {
      try {
        const data: ScannedProductData = JSON.parse(scannedData);
        return {
          name: data.name ?? '',
          category: data.category ?? 'other' as FoodCategory,
          quantity: data.quantity != null ? String(data.quantity) : '1',
          unit: data.unit ?? 'pzas',
          expirationDate: data.expirationDate ?? getDefaultExpirationDate(),
          storageLocation: data.storageLocation ?? 'fridge' as StorageLocation,
          price: data.price != null ? String(data.price) : '',
        };
      } catch {
        // ignore parse errors
      }
    }
    return {
      name: '',
      category: 'other' as FoodCategory,
      quantity: '1',
      unit: 'pzas',
      expirationDate: getDefaultExpirationDate(),
      storageLocation: 'fridge' as StorageLocation,
      price: '',
    };
  };

  const initial = getInitialValues();

  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState<FoodCategory>(initial.category);
  const [quantity, setQuantity] = useState(initial.quantity);
  const [unit, setUnit] = useState(initial.unit);
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [expirationDate, setExpirationDate] = useState(initial.expirationDate);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(initial.storageLocation);
  const [price, setPrice] = useState(initial.price);
  const [notes, setNotes] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [scanning, setScanning] = useState(false);

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

      if (data.name) setName(data.name);
      if (data.category) setCategory(data.category);
      if (data.quantity != null) setQuantity(String(data.quantity));
      if (data.unit) setUnit(data.unit);
      if (data.expirationDate) setExpirationDate(data.expirationDate);
      if (data.storageLocation) setStorageLocation(data.storageLocation);
      if (data.price != null) setPrice(String(data.price));
    } catch (error) {
      Alert.alert('Error al escanear', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setScanning(false);
    }
  };

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
      <View key={scannedData ?? 'new'} style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Nombre *</Text>

        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleScanLabel}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
          )}
          <Text style={[styles.scanBtnText, { color: colors.primary }]}>
            {scanning ? 'Analizando etiqueta...' : 'Escanear etiqueta'}
          </Text>
        </TouchableOpacity>

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
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  scanBtnText: {
    fontSize: 14,
    fontWeight: '600',
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
