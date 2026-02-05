import * as SQLite from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Meal, MealItem, MealType, DailyNutrition } from '../types';

export async function addMeal(
  db: SQLite.SQLiteDatabase,
  meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Meal> {
  const now = new Date().toISOString();
  const id = randomUUID();

  await db.runAsync(
    `INSERT INTO meals (id, name, mealType, date, calories, protein, fats, carbs, servingSize, emoji, notes, source, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    meal.name,
    meal.mealType,
    meal.date,
    meal.calories,
    meal.protein,
    meal.fats,
    meal.carbs,
    meal.servingSize,
    meal.emoji,
    meal.notes,
    meal.source,
    now,
    now
  );

  return {
    id,
    ...meal,
    createdAt: now,
    updatedAt: now,
  };
}

export async function addMealItems(
  db: SQLite.SQLiteDatabase,
  mealId: string,
  items: Omit<MealItem, 'id' | 'mealId'>[]
): Promise<MealItem[]> {
  const result: MealItem[] = [];

  for (const item of items) {
    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO meal_items (id, mealId, foodItemId, name, quantity, unit, calories, protein, fats, carbs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      mealId,
      item.foodItemId,
      item.name,
      item.quantity,
      item.unit,
      item.calories,
      item.protein,
      item.fats,
      item.carbs
    );
    result.push({ id, mealId, ...item });
  }

  return result;
}

export async function getMealsByDate(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<Meal[]> {
  const rows = await db.getAllAsync(
    'SELECT * FROM meals WHERE date = ? ORDER BY createdAt ASC',
    date
  );
  return rows as Meal[];
}

export async function getMealsByDateAndType(
  db: SQLite.SQLiteDatabase,
  date: string,
  mealType: MealType
): Promise<Meal[]> {
  const rows = await db.getAllAsync(
    'SELECT * FROM meals WHERE date = ? AND mealType = ? ORDER BY createdAt ASC',
    date,
    mealType
  );
  return rows as Meal[];
}

export async function getMealById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Meal | null> {
  const row = await db.getFirstAsync('SELECT * FROM meals WHERE id = ?', id);
  return row ? (row as Meal) : null;
}

export async function getMealItems(
  db: SQLite.SQLiteDatabase,
  mealId: string
): Promise<MealItem[]> {
  const rows = await db.getAllAsync(
    'SELECT * FROM meal_items WHERE mealId = ?',
    mealId
  );
  return rows as MealItem[];
}

export async function updateMeal(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<Omit<Meal, 'id' | 'createdAt'>>
): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: SQLite.SQLiteBindValue[] = [];

  const allowedFields = [
    'name', 'mealType', 'date', 'calories', 'protein', 'fats', 'carbs',
    'servingSize', 'emoji', 'notes', 'source',
  ] as const;

  for (const field of allowedFields) {
    if (field in updates) {
      fields.push(`${field} = ?`);
      values.push(updates[field as keyof typeof updates] as SQLite.SQLiteBindValue);
    }
  }

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE meals SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}

export async function deleteMeal(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM meal_items WHERE mealId = ?', id);
  await db.runAsync('DELETE FROM meals WHERE id = ?', id);
}

export async function getDailyNutrition(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<DailyNutrition> {
  const meals = await getMealsByDate(db, date);

  let totalCalories = 0;
  let totalProtein = 0;
  let totalFats = 0;
  let totalCarbs = 0;

  for (const meal of meals) {
    totalCalories += meal.calories;
    totalProtein += meal.protein;
    totalFats += meal.fats;
    totalCarbs += meal.carbs;
  }

  return {
    date,
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalFats: Math.round(totalFats * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    meals,
  };
}
