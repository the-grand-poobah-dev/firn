import { formatCurrency, type Currency } from '@/lib/fx';
export function usd(n: number, decimals = 0, currency: Currency = 'USD'): string {
  return formatCurrency(n, currency, decimals);
}
export function pct(n: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
export function compact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
function asDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date');
  return date;
}
export function shortDate(value: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(asDate(value));
}
export function longDate(value: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(asDate(value));
}
/** Calendar-day difference, calculated at UTC midnight (b - a). */
export function daysBetween(a: Date | string, b: Date | string): number {
  const utcDay = (value: Date | string) => {
    const d = asDate(value);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  return Math.round((utcDay(b) - utcDay(a)) / 86_400_000);
}

export { formatCurrency } from '@/lib/fx';
