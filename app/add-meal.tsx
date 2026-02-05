import React, { useState } from 'react';
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
import { useDatabase } from '../src/hooks/useDatabase';
import { useTheme } from '../src/hooks/useTheme';
import { addMeal } from '../src/database/meals';
import { MealType } from '../src/types';
import { MEAL_TYPES, FOOD_EMOJIS } from '../src/constants/meals';
import { getTodayString } from '../src/utils/dates';

export default function AddMealScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    date?: string;
    recipeName?: string;
    recipeEmoji?: string;
    recipeMealType?: string;
    recipeCalories?: string;
    recipeProtein?: string;
    recipeFats?: string;
    recipeCarbs?: string;
    recipeServingSize?: string;
    recipeNotes?: string;
  }>();

  const [name, setName] = useState(params.recipeName ?? '');
  const [emoji, setEmoji] = useState(params.recipeEmoji ?? '🍽️');
  const [mealType, setMealType] = useState<MealType>((params.recipeMealType as MealType) ?? 'lunch');
  const [date, setDate] = useState(params.date ?? getTodayString());
  const [servingSize, setServingSize] = useState(params.recipeServingSize ?? '1 porcion');
  const [calories, setCalories] = useState(params.recipeCalories ?? '');
  const [protein, setProtein] = useState(params.recipeProtein ?? '');
  const [fats, setFats] = useState(params.recipeFats ?? '');
  const [carbs, setCarbs] = useState(params.recipeCarbs ?? '');
  const [notes, setNotes] = useState(params.recipeNotes ?? '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const mealTypeOptions = MEAL_TYPES.filter(m => m.value !== 'all');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Por favor ingresa un nombre para la comida.');
      return;
    }

    await addMeal(db, {
      name: name.trim(),
      mealType,
      date,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      fats: parseFloat(fats) || 0,
      carbs: parseFloat(carbs) || 0,
      servingSize: servingSize.trim(),
      emoji,
      notes: notes.trim(),
      source: params.recipeName ? 'ai' : 'manual',
    });

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
          placeholder="Ej: Ensalada cesar"
          placeholderTextColor={colors.textSecondary}
          autoFocus={!params.recipeName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Emoji</Text>
        <TouchableOpacity
          style={[styles.emojiBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <Text style={styles.emojiBtnText}>{emoji}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {showEmojiPicker && (
          <View style={[styles.emojiGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {FOOD_EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[
                  styles.emojiItem,
                  emoji === e && { backgroundColor: colors.primary + '30' },
                ]}
                onPress={() => { setEmoji(e); setShowEmojiPicker(false); }}
              >
                <Text style={styles.emojiItemText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Tipo de comida</Text>
        <View style={styles.chipGroup}>
          {mealTypeOptions.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.chip,
                {
                  backgroundColor: mealType === t.value ? colors.primary : colors.surface,
                  borderColor: mealType === t.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setMealType(t.value as MealType)}
            >
              <Ionicons
                name={t.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={mealType === t.value ? colors.primaryText : colors.textSecondary}
              />
              <Text style={{ color: mealType === t.value ? colors.primaryText : colors.text, fontSize: 13 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Fecha</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Porcion</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={servingSize}
          onChangeText={setServingSize}
          placeholder="Ej: 1 porcion"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Nutricion</Text>
        <View style={styles.macroGrid}>
          <View style={styles.macroField}>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Calorias</Text>
            <TextInput
              style={[styles.macroInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={calories}
              onChangeText={setCalories}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Proteina (g)</Text>
            <TextInput
              style={[styles.macroInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Grasas (g)</Text>
            <TextInput
              style={[styles.macroInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={fats}
              onChangeText={setFats}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbos (g)</Text>
            <TextInput
              style={[styles.macroInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
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
  emojiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emojiBtnText: {
    fontSize: 24,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    marginTop: 4,
    gap: 2,
  },
  emojiItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emojiItemText: {
    fontSize: 20,
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
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroField: {
    width: '47%',
  },
  macroLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  macroInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
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
