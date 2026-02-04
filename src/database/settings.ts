import * as SQLite from 'expo-sqlite';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

export async function getSettings(db: SQLite.SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const map = new Map((rows as { key: string; value: string }[]).map(r => [r.key, r.value]));

  return {
    notifyDaysBefore: map.has('notifyDaysBefore')
      ? JSON.parse(map.get('notifyDaysBefore')!)
      : DEFAULT_SETTINGS.notifyDaysBefore,
    dailySummary: map.has('dailySummary')
      ? map.get('dailySummary') === 'true'
      : DEFAULT_SETTINGS.dailySummary,
    currency: map.get('currency') ?? DEFAULT_SETTINGS.currency,
    theme: (map.get('theme') as AppSettings['theme']) ?? DEFAULT_SETTINGS.theme,
  };
}

export async function setSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}

export async function setSettings(
  db: SQLite.SQLiteDatabase,
  settings: Partial<AppSettings>
): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await setSetting(db, key, strValue);
  }
}
