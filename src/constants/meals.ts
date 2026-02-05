import { MealType } from '../types';

export const MEAL_TYPES: { value: MealType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Todos', icon: 'grid-outline' },
  { value: 'breakfast', label: 'Desayuno', icon: 'sunny-outline' },
  { value: 'lunch', label: 'Almuerzo', icon: 'restaurant-outline' },
  { value: 'dinner', label: 'Cena', icon: 'moon-outline' },
  { value: 'snack', label: 'Snack', icon: 'cafe-outline' },
];

export const FOOD_EMOJIS = [
  '🍽️', '🥗', '🍳', '🥞', '🧇', '🥐', '🍞', '🥖',
  '🥪', '🌮', '🌯', '🥙', '🍕', '🍔', '🍟', '🌭',
  '🍗', '🥩', '🍖', '🥚', '🧀', '🥓', '🥘', '🍲',
  '🍜', '🍝', '🍛', '🍣', '🍱', '🥟', '🍤', '🦐',
  '🐟', '🥦', '🥬', '🥒', '🍅', '🥕', '🌽', '🥔',
  '🍠', '🥑', '🍌', '🍎', '🍊', '🍇', '🍓', '🫐',
  '🥛', '☕', '🍵', '🧃', '🥤', '🍺', '🍷', '🧁',
  '🍰', '🍪', '🍫', '🍩', '🥜', '🥣', '🧈', '🍯',
];

export function getMealTypeLabel(mealType: MealType): string {
  const found = MEAL_TYPES.find(m => m.value === mealType);
  return found?.label ?? mealType;
}
