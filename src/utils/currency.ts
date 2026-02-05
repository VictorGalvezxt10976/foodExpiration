const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  MXN: '$',
  COP: '$',
  ARS: '$',
  CLP: '$',
  BRL: 'R$',
  UYU: '$U',
  BOB: 'Bs',
  GTQ: 'Q',
  CRC: '\u20A1',
  DOP: 'RD$',
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${amount.toFixed(2)}`;
}
