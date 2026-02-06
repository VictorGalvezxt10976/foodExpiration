import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '../../src/components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettings } from '../../src/contexts/SettingsContext';
import { AppSettings } from '../../src/types';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSetting } = useSettings();

  const toggleNotifyDay = async (day: number) => {
    const current = settings.notifyDaysBefore;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a);
    await updateSetting('notifyDaysBefore', updated);
  };

  const notifyDays = [7, 3, 1, 0];

  const themes: { value: AppSettings['theme']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
    { value: 'light', label: 'Claro', icon: 'sunny-outline' },
    { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
  ];

  const [apiKeyInput, setApiKeyInput] = useState(settings.openaiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const currencies = ['PEN', 'MXN', 'COP', 'ARS', 'CLP', 'BRL', 'UYU', 'BOB', 'GTQ', 'CRC', 'DOP', 'USD'];

  const handleSaveApiKey = async (key: string) => {
    setApiKeyInput(key);
    await updateSetting('openaiApiKey', key);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Notificaciones</Text>

      <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
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
                  color: settings.notifyDaysBefore.includes(day) ? colors.primaryText : colors.text,
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

      <View style={[styles.card, styles.rowCard, { backgroundColor: colors.card }, colors.shadow]}>
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

      <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
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
                color={settings.theme === t.value ? colors.primaryText : colors.textSecondary}
              />
              <Text
                style={{
                  color: settings.theme === t.value ? colors.primaryText : colors.text,
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

      <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
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
                  color: settings.currency === c ? colors.primaryText : colors.text,
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Integracion con IA</Text>

      <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
        <View style={styles.aiHeader}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>API Key de OpenAI</Text>
          {settings.openaiApiKey ? (
            <View style={[styles.aiIndicator, { backgroundColor: '#4CAF50' + '20' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: '500' }}>Configurada</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.cardSubtext, { color: colors.textSecondary, marginBottom: 10 }]}>
          Necesaria para generar recetas con IA. Obtenla en platform.openai.com
        </Text>
        <View style={styles.apiKeyRow}>
          <TextInput
            style={[styles.apiKeyInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={apiKeyInput}
            onChangeText={handleSaveApiKey}
            placeholder="sk-..."
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.apiKeyToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowApiKey(!showApiKey)}
          >
            <Ionicons name={showApiKey ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Acerca de</Text>

      <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Aplicacion</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>FreshKeep</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
        </View>
      </View>

      <View style={{ height: Platform.select({ ios: 40, android: 190 }) }} />
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
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 16,
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
    marginBottom: 10,
  },
  cardSubtext: {
    fontSize: 13,
    marginTop: -6,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  apiKeyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  apiKeyToggle: {
    borderWidth: 1,
    borderRadius: 14,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
