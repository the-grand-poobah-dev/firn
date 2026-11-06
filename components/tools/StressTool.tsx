'use client';

import { PLANS, vacancyScenario } from '@/lib/finance';
import { pct } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { LineChart } from '@/components/charts/LineChart';

const vacancyPoints = Array.from({ length: 7 }, (_, index) => 5 + index * 5);

export function StressTool() {
  const returns = vacancyPoints.map(vacancy => vacancyScenario({
    apy: PLANS.twelve.apy,
    vacancy: vacancy / 100,
    rentChange: 0,
    valuationChange: 0,
  }));
  const chartSeries = [
    { name: 'Illustrative return', values: returns, color: 'var(--accent)' },
    { name: '10% plan range floor', values: vacancyPoints.map(() => 0.10), color: 'var(--warm)', dashed: true },
  ];
  const rows = [6, 20, 35].map(vacancy => ({
    vacancy,
    apy: vacancyScenario({
      apy: PLANS.twelve.apy,
      vacancy: vacancy / 100,
      rentChange: 0,
      valuationChange: 0,
    }),
  }));
  const tone = (vacancy: number) => vacancy === 6
    ? 'text-positive'
    : vacancy === 20
      ? 'text-amber-600'
      : 'text-rose-600';

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted">Firn Twelve</p>
            <h2 className="font-semibold">Return sensitivity</h2>
          </div>
          <span className="text-xs text-muted">12 months</span>
        </div>
        <div className="mt-4">
          <LineChart
            series={chartSeries}
            labels={vacancyPoints.map(value => value + '%')}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Vacancy ranges from 5% to 35% in 5-point steps. Rent and valuation changes are held at 0%.
          The dashed line marks the plan&apos;s 10% lower target range, not a guaranteed minimum.
        </p>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Selected vacancy points</h3>
        <div className="divide-y divide-line">
          {rows.map(row => (
            <div key={row.vacancy} className="flex items-center justify-between py-3">
              <div>
                <strong>{row.vacancy}% vacancy</strong>
                <p className="text-xs text-muted">Illustrative annual return</p>
              </div>
              <strong className={tone(row.vacancy)}>{pct(row.apy, 2)}</strong>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Row colours distinguish the lower, middle and higher vacancy stress cases. All figures are illustrative;
          actual outcomes can differ and capital can be lost.
        </p>
      </Card>
    </div>
  );
}
