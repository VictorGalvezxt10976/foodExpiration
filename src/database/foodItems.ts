import * as SQLite from 'expo-sqlite';
import { SQLiteBindValue } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { FoodItem, FoodCategory, StorageLocation, ItemDisposition } from '../types';

export async function addFoodItem(
  db: SQLite.SQLiteDatabase,
  item: Omit<FoodItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<FoodItem> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const status = computeStatus(item.expirationDate);

  await db.runAsync(
    `INSERT INTO food_items (id, name, category, quantity, unit, purchaseDate, expirationDate, storageLocation, status, disposition, price, currency, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    item.name,
    item.category,
    item.quantity,
    item.unit,
    item.purchaseDate,
    item.expirationDate,
    item.storageLocation,
    status,
    item.disposition,
    item.price,
    item.currency,
    item.notes,
    now,
    now
  );

  return {
    id,
    ...item,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateFoodItem(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<Omit<FoodItem, 'id' | 'createdAt'>>
): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: SQLiteBindValue[] = [];

  const allowedFields = [
    'name', 'category', 'quantity', 'unit', 'purchaseDate',
    'expirationDate', 'storageLocation', 'status', 'disposition',
    'price', 'currency', 'notes',
  ] as const;

  for (const field of allowedFields) {
    if (field in updates) {
      fields.push(`${field} = ?`);
      values.push(updates[field as keyof typeof updates] as SQLiteBindValue);
    }
  }

  if (updates.expirationDate && !updates.status) {
    fields.push('status = ?');
    values.push(computeStatus(updates.expirationDate));
  }

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE food_items SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}

export async function deleteFoodItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM food_items WHERE id = ?', id);
}

export async function getFoodItems(
  db: SQLite.SQLiteDatabase,
  filters?: {
    category?: FoodCategory;
    storageLocation?: StorageLocation;
    disposition?: ItemDisposition;
    search?: string;
    status?: string;
  }
): Promise<FoodItem[]> {
  let query = 'SELECT * FROM food_items WHERE 1=1';
  const params: SQLiteBindValue[] = [];

  if (filters?.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters?.storageLocation) {
    query += ' AND storageLocation = ?';
    params.push(filters.storageLocation);
  }
  if (filters?.disposition) {
    query += ' AND disposition = ?';
    params.push(filters.disposition);
  } else {
    query += ' AND disposition = ?';
    params.push('active');
  }
  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.search) {
    query += ' AND name LIKE ?';
    params.push(`%${filters.search}%`);
  }

  query += ' ORDER BY expirationDate ASC';

  const rows = await db.getAllAsync(query, ...params);
  return (rows as FoodItem[]).map(refreshStatus);
}

export async function getFoodItemById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<FoodItem | null> {
  const row = await db.getFirstAsync('SELECT * FROM food_items WHERE id = ?', id);
  return row ? refreshStatus(row as FoodItem) : null;
}

export async function getExpiringItems(
  db: SQLite.SQLiteDatabase,
  daysAhead: number
): Promise<FoodItem[]> {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + daysAhead);

  const rows = await db.getAllAsync(
    `SELECT * FROM food_items
     WHERE disposition = 'active'
       AND expirationDate <= ?
       AND expirationDate >= ?
     ORDER BY expirationDate ASC`,
    future.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );

  return (rows as FoodItem[]).map(refreshStatus);
}

export async function getExpiredItems(
  db: SQLite.SQLiteDatabase
): Promise<FoodItem[]> {
  const today = new Date().toISOString().split('T')[0];

  const rows = await db.getAllAsync(
    `SELECT * FROM food_items
     WHERE disposition = 'active'
       AND expirationDate < ?
     ORDER BY expirationDate ASC`,
    today
  );

  return (rows as FoodItem[]).map(refreshStatus);
}

export async function refreshAllStatuses(db: SQLite.SQLiteDatabase): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDays = threeDaysLater.toISOString().split('T')[0];

  await db.execAsync(`
    UPDATE food_items SET status = 'expired' WHERE disposition = 'active' AND expirationDate < '${today}';
    UPDATE food_items SET status = 'expiring' WHERE disposition = 'active' AND expirationDate >= '${today}' AND expirationDate <= '${threeDays}';
    UPDATE food_items SET status = 'fresh' WHERE disposition = 'active' AND expirationDate > '${threeDays}';
  `);
}

export async function getInventoryStats(db: SQLite.SQLiteDatabase): Promise<{
  total: number;
  fresh: number;
  expiring: number;
  expired: number;
  totalValue: number;
  wastedValue: number;
}> {
  await refreshAllStatuses(db);

  const total = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM food_items WHERE disposition = 'active'"
  );
  const fresh = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM food_items WHERE disposition = 'active' AND status = 'fresh'"
  );
  const expiring = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM food_items WHERE disposition = 'active' AND status = 'expiring'"
  );
  const expired = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM food_items WHERE disposition = 'active' AND status = 'expired'"
  );
  const totalValue = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(price) as total FROM food_items WHERE disposition = 'active' AND price IS NOT NULL"
  );
  const wastedValue = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(price) as total FROM food_items WHERE disposition = 'thrown_away' AND price IS NOT NULL"
  );

  return {
    total: total?.count ?? 0,
    fresh: fresh?.count ?? 0,
    expiring: expiring?.count ?? 0,
    expired: expired?.count ?? 0,
    totalValue: totalValue?.total ?? 0,
    wastedValue: wastedValue?.total ?? 0,
  };
}

export async function getWasteStats(db: SQLite.SQLiteDatabase): Promise<{
  totalWasted: number;
  totalConsumed: number;
  wastedValue: number;
  savedValue: number;
  byCategory: { category: string; wasted: number; consumed: number }[];
}> {
  const wasted = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM food_items WHERE disposition = 'thrown_away'"
  );
  const consumed = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM food_items WHERE disposition = 'consumed'"
  );
  const wastedValue = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(price) as total FROM food_items WHERE disposition = 'thrown_away' AND price IS NOT NULL"
  );
  const savedValue = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(price) as total FROM food_items WHERE disposition = 'consumed' AND price IS NOT NULL"
  );

  const byCategory = await db.getAllAsync(
    `SELECT category,
       SUM(CASE WHEN disposition = 'thrown_away' THEN 1 ELSE 0 END) as wasted,
       SUM(CASE WHEN disposition = 'consumed' THEN 1 ELSE 0 END) as consumed
     FROM food_items
     WHERE disposition IN ('thrown_away', 'consumed')
     GROUP BY category`
  );

  return {
    totalWasted: wasted?.count ?? 0,
    totalConsumed: consumed?.count ?? 0,
    wastedValue: wastedValue?.total ?? 0,
    savedValue: savedValue?.total ?? 0,
    byCategory: byCategory as { category: string; wasted: number; consumed: number }[],
  };
}

function computeStatus(expirationDate: string): 'fresh' | 'expiring' | 'expired' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring';
  return 'fresh';
}

function refreshStatus(item: FoodItem): FoodItem {
  if (item.disposition !== 'active') return item;
  return { ...item, status: computeStatus(item.expirationDate) };
}
