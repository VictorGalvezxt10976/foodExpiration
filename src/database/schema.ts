import * as SQLite from 'expo-sqlite';

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'pcs',
      purchaseDate TEXT NOT NULL,
      expirationDate TEXT NOT NULL,
      storageLocation TEXT NOT NULL DEFAULT 'fridge',
      status TEXT NOT NULL DEFAULT 'fresh',
      disposition TEXT NOT NULL DEFAULT 'active',
      price REAL,
      currency TEXT NOT NULL DEFAULT 'MXN',
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shopping_list (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'pcs',
      checked INTEGER NOT NULL DEFAULT 0,
      sourceItemId TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_food_expiration ON food_items(expirationDate);
    CREATE INDEX IF NOT EXISTS idx_food_status ON food_items(status);
    CREATE INDEX IF NOT EXISTS idx_food_disposition ON food_items(disposition);
    CREATE INDEX IF NOT EXISTS idx_food_category ON food_items(category);
  `);
}
