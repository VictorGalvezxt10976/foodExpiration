import { format, differenceInDays, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "d 'de' MMM, yyyy", { locale: es });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "d 'de' MMM", { locale: es });
}

export function daysUntilExpiration(expirationDate: string): number {
  const today = startOfDay(new Date());
  const expDate = startOfDay(new Date(expirationDate));
  return differenceInDays(expDate, today);
}

export function getExpirationLabel(expirationDate: string): string {
  const days = daysUntilExpiration(expirationDate);
  const date = new Date(expirationDate);

  if (days < 0) {
    const abs = Math.abs(days);
    return `Vencido hace ${abs} dia${abs !== 1 ? 's' : ''}`;
  }
  if (isToday(date)) return 'Vence hoy';
  if (isTomorrow(date)) return 'Vence manana';
  if (days <= 7) return `Vence en ${days} dias`;
  return `Vence el ${formatShortDate(expirationDate)}`;
}

export function getDefaultExpirationDate(): string {
  return addDays(new Date(), 7).toISOString().split('T')[0];
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
