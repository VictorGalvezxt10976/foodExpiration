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

export interface AppSettings {
  notifyDaysBefore: number[];
  dailySummary: boolean;
  currency: string;
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifyDaysBefore: [3, 1, 0],
  dailySummary: true,
  currency: 'MXN',
  theme: 'system',
};
