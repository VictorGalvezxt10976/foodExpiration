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
      currency TEXT NOT NULL DEFAULT 'PEN',
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

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      mealType TEXT NOT NULL DEFAULT 'lunch',
      date TEXT NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      fats REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      servingSize TEXT NOT NULL DEFAULT '',
      emoji TEXT NOT NULL DEFAULT '🍽️',
      notes TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
    CREATE INDEX IF NOT EXISTS idx_meals_type ON meals(mealType);

    CREATE TABLE IF NOT EXISTS meal_items (
      id TEXT PRIMARY KEY NOT NULL,
      mealId TEXT NOT NULL,
      foodItemId TEXT,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'g',
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      fats REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (mealId) REFERENCES meals(id) ON DELETE CASCADE,
      FOREIGN KEY (foodItemId) REFERENCES food_items(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(mealId);
  `);
}
