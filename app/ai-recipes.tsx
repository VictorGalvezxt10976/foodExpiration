import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../src/hooks/useDatabase';
import { useTheme } from '../src/hooks/useTheme';
import { useSettings } from '../src/contexts/SettingsContext';
import { getFoodItems } from '../src/database/foodItems';
import { generateRecipeSuggestions } from '../src/services/openai';
import { RecipeSuggestion } from '../src/types';

export default function AIRecipesScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors } = useTheme();
  const { settings } = useSettings();

  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set());

  const hasApiKey = !!settings.openaiApiKey;

  const toggleIngredients = (index: number) => {
    setExpandedIngredients(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleInstructions = (index: number) => {
    setExpandedInstructions(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await getFoodItems(db, { disposition: 'active' });
      if (items.length === 0) {
        setError('No tienes productos en tu inventario. Agrega productos primero.');
        setLoading(false);
        return;
      }

      const result = await generateRecipeSuggestions(settings.openaiApiKey, items, 3);
      setRecipes(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ocurrio un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = (recipe: RecipeSuggestion) => {
    const notesText = [
      recipe.description,
      '',
      'Ingredientes:',
      ...recipe.ingredients.map(i => `- ${i}`),
      '',
      'Instrucciones:',
      ...recipe.instructions.map((inst, i) => `${i + 1}. ${inst}`),
    ].join('\n');

    router.push({
      pathname: '/add-meal',
      params: {
        recipeName: recipe.name,
        recipeEmoji: recipe.emoji,
        recipeCalories: String(recipe.calories),
        recipeProtein: String(recipe.protein),
        recipeFats: String(recipe.fats),
        recipeCarbs: String(recipe.carbs),
        recipeServingSize: recipe.servingSize,
        recipeNotes: notesText,
      },
    });
  };

  if (!hasApiKey) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="key-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>API Key requerida</Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          Para generar recetas con IA necesitas configurar tu API key de OpenAI en Ajustes.
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-outline" size={18} color={colors.primaryText} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>Ir a Ajustes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>
          Genera recetas basadas en tu inventario actual. La IA priorizara ingredientes que estan por vencer.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Ionicons name="sparkles" size={18} color={colors.primaryText} />
          )}
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
            {loading ? 'Generando...' : 'Generar Recetas'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.statusExpired + '15' }]}>
          <Ionicons name="alert-circle" size={18} color={colors.statusExpired} />
          <Text style={[styles.errorText, { color: colors.statusExpired }]}>{error}</Text>
        </View>
      )}

      {recipes.map((recipe, index) => (
        <View key={index} style={[styles.recipeCard, { backgroundColor: colors.card }, colors.shadow]}>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
            <View style={styles.recipeHeaderText}>
              <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.name}</Text>
              <Text style={[styles.recipeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {recipe.description}
              </Text>
            </View>
          </View>

          <View style={styles.recipeMacros}>
            <View style={[styles.recipeMacroItem, { backgroundColor: '#F47551' + '15' }]}>
              <Text style={styles.recipeMacroValue}>{recipe.calories}</Text>
              <Text style={[styles.recipeMacroLabel, { color: colors.textSecondary }]}>kcal</Text>
            </View>
            <View style={[styles.recipeMacroItem, { backgroundColor: '#CCB1F6' + '15' }]}>
              <Text style={styles.recipeMacroValue}>{recipe.protein}g</Text>
              <Text style={[styles.recipeMacroLabel, { color: colors.textSecondary }]}>Prot</Text>
            </View>
            <View style={[styles.recipeMacroItem, { backgroundColor: '#F8D558' + '15' }]}>
              <Text style={styles.recipeMacroValue}>{recipe.fats}g</Text>
              <Text style={[styles.recipeMacroLabel, { color: colors.textSecondary }]}>Grasas</Text>
            </View>
            <View style={[styles.recipeMacroItem, { backgroundColor: '#CDE26D' + '15' }]}>
              <Text style={styles.recipeMacroValue}>{recipe.carbs}g</Text>
              <Text style={[styles.recipeMacroLabel, { color: colors.textSecondary }]}>Carbos</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleIngredients(index)}
          >
            <Text style={[styles.collapsibleTitle, { color: colors.text }]}>
              Ingredientes ({recipe.ingredients.length})
            </Text>
            <Ionicons
              name={expandedIngredients.has(index) ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {expandedIngredients.has(index) && (
            <View style={styles.collapsibleContent}>
              {recipe.ingredients.map((ing, i) => (
                <Text key={i} style={[styles.listItem, { color: colors.text }]}>
                  {'\u2022'} {ing}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleInstructions(index)}
          >
            <Text style={[styles.collapsibleTitle, { color: colors.text }]}>
              Instrucciones ({recipe.instructions.length} pasos)
            </Text>
            <Ionicons
              name={expandedInstructions.has(index) ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {expandedInstructions.has(index) && (
            <View style={styles.collapsibleContent}>
              {recipe.instructions.map((inst, i) => (
                <Text key={i} style={[styles.listItem, { color: colors.text }]}>
                  {i + 1}. {inst}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveRecipeBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleSaveRecipe(recipe)}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
            <Text style={[styles.saveRecipeBtnText, { color: colors.primaryText }]}>
              Guardar como comida
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  headerSection: {
    padding: 16,
    gap: 12,
  },
  headerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  recipeCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  recipeEmoji: {
    fontSize: 32,
  },
  recipeHeaderText: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  recipeDesc: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  recipeMacros: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  recipeMacroItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  recipeMacroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  recipeMacroLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  collapsibleContent: {
    paddingBottom: 8,
    gap: 4,
  },
  listItem: {
    fontSize: 13,
    lineHeight: 20,
  },
  saveRecipeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
  },
  saveRecipeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
