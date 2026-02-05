export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'dairy'
  | 'cereals'
  | 'canned'
  | 'meat'
  | 'frozen'
  | 'beverages'
  | 'condiments'
  | 'snacks'
  | 'other';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'counter';

export type FoodStatus = 'fresh' | 'expiring' | 'expired';

export type ItemDisposition = 'active' | 'consumed' | 'thrown_away';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  purchaseDate: string; // ISO date string
  expirationDate: string; // ISO date string
  storageLocation: StorageLocation;
  status: FoodStatus;
  disposition: ItemDisposition;
  price: number | null;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  checked: boolean;
  sourceItemId: string | null; // linked to expired/low food item
  createdAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealSource = 'manual' | 'ai';

export interface Meal {
  id: string;
  name: string;
  mealType: MealType;
  date: string; // ISO date string YYYY-MM-DD
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  servingSize: string;
  emoji: string;
  notes: string;
  source: MealSource;
  createdAt: string;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  mealId: string;
  foodItemId: string | null;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
  meals: Meal[];
}

export interface RecipeSuggestion {
  name: string;
  emoji: string;
  description: string;
  servingSize: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  ingredients: string[];
  instructions: string[];
}

export interface AppSettings {
  notifyDaysBefore: number[];
  dailySummary: boolean;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  openaiApiKey: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifyDaysBefore: [3, 1, 0],
  dailySummary: true,
  currency: 'PEN',
  theme: 'system',
  openaiApiKey: '',
};
