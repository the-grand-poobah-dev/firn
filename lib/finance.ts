export type PlanCode = 'six' | 'twelve';

export const PLANS = {
  six: { name: 'Firn Six', months: 6, apy: 0.105, low: 0.09, high: 0.12 },
  twelve: { name: 'Firn Twelve', months: 12, apy: 0.13, low: 0.10, high: 0.15 },
} as const;

export const MIN_AMOUNT = 500;
export const EARLY_EXIT_FEE = 0.015;
export const EARLY_EXIT_MIN_DAYS = 90;

export function dailyRate(apy: number): number { return Math.pow(1 + apy, 1 / 365) - 1; }
export function growth(principal: number, apy: number, days: number): number { return principal * Math.pow(1 + apy, days / 365); }
export function periodReturn(apy: number, years: number): number { return Math.pow(1 + apy, years) - 1; }
export function roiTable(apy: number) { return { daily: dailyRate(apy), monthly: periodReturn(apy, 1 / 12), sixMonth: periodReturn(apy, 0.5), yearly: apy }; }
export function maturityValue(principal: number, plan: PlanCode): number { const p = PLANS[plan]; return principal * Math.pow(1 + p.apy, p.months / 12); }

export interface Scenario { label: 'Optimistic' | 'Expected' | 'Conservative' | 'Weak case'; apy: number; value: number; gain: number }
export function scenarios(principal: number, plan: PlanCode): Scenario[] {
  const p = PLANS[plan];
  return ([['Optimistic', p.high], ['Expected', p.apy], ['Conservative', p.low], ['Weak case', 0]] as const).map(([label, apy]) => {
    const value = principal * Math.pow(1 + apy, p.months / 12);
    return { label, apy, value, gain: value - principal };
  });
}

export interface ProjectionPoint { month: number; value: number; gain: number }
export function projectionSeries(principal: number, apy: number, months: number): ProjectionPoint[] {
  if (!Number.isInteger(months) || months < 0) throw new RangeError('months must be a non-negative integer');
  return Array.from({ length: months + 1 }, (_, month) => {
    const value = principal * Math.pow(1 + apy, month / 12);
    return { month, value, gain: value - principal };
  });
}

export function splitEqually(amountCents: number, n: number): number[] {
  if (!Number.isInteger(amountCents) || amountCents < 0) throw new RangeError('amountCents must be a non-negative integer');
  if (!Number.isInteger(n) || n <= 0) throw new RangeError('n must be a positive integer');
  const base = Math.floor(amountCents / n);
  const remainder = amountCents % n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function blendedApy(positions: { principal: number; apy: number }[]): number {
  const total = positions.reduce((sum, p) => sum + p.principal, 0);
  if (total === 0) return 0;
  return positions.reduce((sum, p) => sum + p.principal * p.apy, 0) / total;
}

export interface EarlyExitInput { principal: number; accrued: number; daysIn: number }
export interface EarlyExitResult { allowed: boolean; fee: number; forfeited: number; receive: number; reason?: string }
export function earlyExit({ principal, accrued, daysIn }: EarlyExitInput): EarlyExitResult {
  const allowed = daysIn >= EARLY_EXIT_MIN_DAYS;
  return { allowed, fee: principal * EARLY_EXIT_FEE, forfeited: accrued, receive: principal - principal * EARLY_EXIT_FEE, ...(!allowed ? { reason: `Early exit is available after ${EARLY_EXIT_MIN_DAYS} days.` } : {}) };
}

export interface HistoryRow { date: string; amount: number }
export function accrualFromHistory(rows: HistoryRow[], period: 'day' | 'month'): Record<string, number> {
  return rows.reduce<Record<string, number>>((totals, row) => {
    const date = new Date(row.date);
    if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid history date: ${row.date}`);
    const key = period === 'day'
      ? date.toISOString().slice(0, 10)
      : date.toISOString().slice(0, 7);
    totals[key] = (totals[key] ?? 0) + row.amount;
    return totals;
  }, {});
}

/** Illustrative sensitivity model only; it is not an investment forecast or guarantee. */
export function vacancyScenario({ apy, vacancy, rentChange, valuationChange }: { apy: number; vacancy: number; rentChange: number; valuationChange: number }): number {
  const rentPart = 0.6 * apy * ((1 - vacancy) / (1 - 0.06)) * (1 + rentChange);
  const appreciationPart = 0.4 * apy + valuationChange;
  return Math.max(-0.5, rentPart + appreciationPart);
}

/** Allocates a position across properties in proportion to each property's target return. */
export function propertyShare(positionPrincipal: number, propertyWeights: { targetReturn: number }[]): number[] {
  const total = propertyWeights.reduce((sum, property) => sum + property.targetReturn, 0);
  if (propertyWeights.length === 0) return [];
  if (total === 0) return propertyWeights.map(() => positionPrincipal / propertyWeights.length);
  return propertyWeights.map(property => positionPrincipal * property.targetReturn / total);
}
