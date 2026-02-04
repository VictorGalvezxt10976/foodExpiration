import { FoodCategory, StorageLocation } from '../types';

export const CATEGORIES: { value: FoodCategory; label: string; icon: string }[] = [
  { value: 'fruits', label: 'Frutas', icon: 'nutrition' },
  { value: 'vegetables', label: 'Verduras', icon: 'leaf' },
  { value: 'dairy', label: 'Lacteos', icon: 'water' },
  { value: 'cereals', label: 'Cereales/Granos', icon: 'grid' },
  { value: 'canned', label: 'Enlatados', icon: 'cube' },
  { value: 'meat', label: 'Carnes/Proteina', icon: 'restaurant' },
  { value: 'frozen', label: 'Congelados', icon: 'snow' },
  { value: 'beverages', label: 'Bebidas', icon: 'cafe' },
  { value: 'condiments', label: 'Condimentos', icon: 'flask' },
  { value: 'snacks', label: 'Snacks', icon: 'fast-food' },
  { value: 'other', label: 'Otro', icon: 'ellipsis-horizontal' },
];

export const STORAGE_LOCATIONS: { value: StorageLocation; label: string; icon: string }[] = [
  { value: 'fridge', label: 'Refrigerador', icon: 'snow-outline' },
  { value: 'freezer', label: 'Congelador', icon: 'snow' },
  { value: 'pantry', label: 'Despensa', icon: 'file-tray-stacked' },
  { value: 'counter', label: 'Mostrador', icon: 'tablet-landscape' },
];

export const UNITS = ['pzas', 'kg', 'g', 'lb', 'oz', 'L', 'mL', 'tazas', 'paquete', 'bolsa', 'caja', 'lata', 'frasco', 'botella'];
