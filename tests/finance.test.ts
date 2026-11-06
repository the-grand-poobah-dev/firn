import { describe, expect, it } from 'vitest';
import {
  PLANS, accrualFromHistory, blendedApy, dailyRate, earlyExit, growth,
  maturityValue, projectionSeries, propertyShare, scenarios, splitEqually, vacancyScenario,
} from '../lib/finance';

describe('finance calculations', () => {
  it('calculates effective daily rate', () => expect(dailyRate(0.13)).toBeCloseTo(0.00033490, 6));
  it('calculates annual growth', () => expect(growth(10000, 0.13, 365)).toBeCloseTo(11300, 8));
  it('calculates plan maturity values', () => {
    expect(maturityValue(10000, 'twelve')).toBeCloseTo(11300, 8);
    expect(maturityValue(5000, 'six')).toBeCloseTo(5000 * Math.pow(1.105, 0.5), 8);
  });
  it('matches 365 daily compounding steps to annual growth', () => {
    const step = 1 + dailyRate(0.13);
    expect(10000 * Math.pow(step, 365)).toBeCloseTo(growth(10000, 0.13, 365), 8);
  });
  it('splits cents exactly and assigns remainder to the first entries', () => {
    expect(splitEqually(500000, 10).reduce((a, b) => a + b, 0)).toBe(500000);
    const uneven = splitEqually(50001, 10);
    expect(uneven.reduce((a, b) => a + b, 0)).toBe(50001);
    expect(uneven[0]).toBe(Math.max(...uneven));
  });
  it('calculates principal-weighted blended APY', () => expect(blendedApy([{ principal: 10000, apy: 0.13 }, { principal: 5000, apy: 0.105 }])).toBeCloseTo(0.1216666667, 4));
  it('enforces early exit minimum and fee', () => {
    expect(earlyExit({ principal: 1000, accrued: 50, daysIn: 89 }).allowed).toBe(false);
    expect(earlyExit({ principal: 1000, accrued: 50, daysIn: 90 }).receive).toBeCloseTo(985, 8);
  });
  it('returns plan APY at base vacancy assumptions', () => {
    expect(vacancyScenario({ apy: PLANS.six.apy, vacancy: 0.06, rentChange: 0, valuationChange: 0 })).toBeCloseTo(PLANS.six.apy, 10);
  });
  it('orders scenarios from optimistic to weak', () => {
    const values = scenarios(10000, 'twelve').map(s => s.value);
    expect(values[0]).toBeGreaterThanOrEqual(values[1]);
    expect(values[1]).toBeGreaterThanOrEqual(values[2]);
    expect(values[2]).toBeGreaterThanOrEqual(values[3]);
  });
  it('returns monthly projection points including month zero', () => {
    const points = projectionSeries(1000, 0.12, 6);
    expect(points).toHaveLength(7);
    expect(points[0]).toMatchObject({ month: 0, value: 1000, gain: 0 });
  });
  it('aggregates history by UTC day or month', () => {
    const rows = [{ date: '2026-11-05T12:00:00Z', amount: 1 }, { date: '2026-11-05T18:00:00Z', amount: 2 }];
    expect(accrualFromHistory(rows, 'day')).toEqual({ '2026-11-05': 3 });
    expect(accrualFromHistory(rows, 'month')).toEqual({ '2026-11': 3 });
  });
  it('allocates property amounts by target return weights', () => {
    expect(propertyShare(1000, [{ targetReturn: 0.1 }, { targetReturn: 0.2 }])).toEqual([1000 / 3, 2000 / 3]);
  });
});
