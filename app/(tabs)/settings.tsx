import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useTheme } from '../../src/hooks/useTheme';
import { getSettings, setSettings } from '../../src/database/settings';
import { AppSettings } from '../../src/types';

export default function SettingsScreen() {
  const db = useDatabase();
  const { colors } = useTheme();

  const [settings, setLocalSettings] = useState<AppSettings>({
    notifyDaysBefore: [3, 1, 0],
    dailySummary: true,
    currency: 'MXN',
    theme: 'system',
  });

  const loadSettings = useCallback(async () => {
    const s = await getSettings(db);
    setLocalSettings(s);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const updateSetting = async (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    const updated = { ...settings, [key]: value };
    setLocalSettings(updated);
    await setSettings(db, { [key]: value });
  };

  const toggleNotifyDay = async (day: number) => {
    const current = settings.notifyDaysBefore;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a);
    await updateSetting('notifyDaysBefore', updated);
  };

  const notifyDays = [7, 3, 1, 0];

  const themes: { value: AppSettings['theme']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'system', label: 'Sistema', icon: 'phone-portrait' },
    { value: 'light', label: 'Claro', icon: 'sunny' },
    { value: 'dark', label: 'Oscuro', icon: 'moon' },
  ];

  const currencies = ['MXN', 'COP', 'ARS', 'CLP', 'PEN', 'BRL', 'UYU', 'BOB', 'GTQ', 'CRC', 'DOP', 'USD'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notificaciones</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.text }]}>Notificar antes del vencimiento</Text>
        <View style={styles.chipGroup}>
          {notifyDays.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.chip,
                {
                  backgroundColor: settings.notifyDaysBefore.includes(day) ? colors.primary : colors.surface,
                  borderColor: settings.notifyDaysBefore.includes(day) ? colors.primary : colors.border,
                },
              ]}
              onPress={() => toggleNotifyDay(day)}
            >
              <Text
                style={{
                  color: settings.notifyDaysBefore.includes(day) ? '#FFFFFF' : colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                {day === 0 ? 'El dia' : `${day} dia${day !== 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowCardContent}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>Resumen diario</Text>
          <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>
            Recibe un resumen diario de productos por vencer
          </Text>
        </View>
        <Switch
          value={settings.dailySummary}
          onValueChange={v => updateSetting('dailySummary', v)}
          trackColor={{ true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.text }]}>Tema</Text>
        <View style={styles.chipGroup}>
          {themes.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.chip,
                {
                  backgroundColor: settings.theme === t.value ? colors.primary : colors.surface,
                  borderColor: settings.theme === t.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateSetting('theme', t.value)}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={settings.theme === t.value ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={{
                  color: settings.theme === t.value ? '#FFFFFF' : colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Moneda</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chipGroup}>
          {currencies.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.chip,
                {
                  backgroundColor: settings.currency === c ? colors.primary : colors.surface,
                  borderColor: settings.currency === c ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateSetting('currency', c)}
            >
              <Text
                style={{
                  color: settings.currency === c ? '#FFFFFF' : colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Acerca de</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Aplicacion</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>FreshKeep</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>

          <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 13,
    marginTop: -4,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
