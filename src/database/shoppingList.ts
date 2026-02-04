import * as SQLite from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { ShoppingListItem, FoodCategory } from '../types';

export async function addShoppingItem(
  db: SQLite.SQLiteDatabase,
  item: { name: string; category: FoodCategory; quantity: number; unit: string; sourceItemId?: string }
): Promise<ShoppingListItem> {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO shopping_list (id, name, category, quantity, unit, checked, sourceItemId, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    id,
    item.name,
    item.category,
    item.quantity,
    item.unit,
    item.sourceItemId ?? null,
    now
  );

  return {
    id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    checked: false,
    sourceItemId: item.sourceItemId ?? null,
    createdAt: now,
  };
}

export async function getShoppingList(db: SQLite.SQLiteDatabase): Promise<ShoppingListItem[]> {
  const rows = await db.getAllAsync(
    'SELECT * FROM shopping_list ORDER BY checked ASC, createdAt DESC'
  );
  return (rows as (Omit<ShoppingListItem, 'checked'> & { checked: number })[]).map(row => ({
    ...row,
    checked: Boolean(row.checked),
  }));
}

export async function toggleShoppingItem(
  db: SQLite.SQLiteDatabase,
  id: string,
  checked: boolean
): Promise<void> {
  await db.runAsync(
    'UPDATE shopping_list SET checked = ? WHERE id = ?',
    checked ? 1 : 0,
    id
  );
}

export async function deleteShoppingItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM shopping_list WHERE id = ?', id);
}

export async function clearCheckedItems(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM shopping_list WHERE checked = 1');
}

export async function getShoppingListCount(db: SQLite.SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM shopping_list WHERE checked = 0'
  );
  return result?.count ?? 0;
}
