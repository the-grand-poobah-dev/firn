import 'server-only';

import { blendedApy, propertyShare } from '@/lib/finance';
import { createClient } from '@/lib/supabase/server';
import type { Database, Tables } from '@/lib/database.types';

type LivePosition = Database['public']['Views']['positions_live']['Row'];
type DailyRow = Database['public']['Views']['portfolio_daily']['Row'];
type PropertyRow = Tables<'properties'>;

export type PortfolioPosition = {
  id: string;
  plan: 'six' | 'twelve';
  principal: number;
  value: number;
  earned: number;
  apy: number;
  daysLeft: number;
  daysIn: number;
  startedOn: string;
  maturesOn: string;
};

export type PropertyShare = {
  propertyId: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  targetReturn: number;
  amount: number;
  lat: number | null;
  lng: number | null;
  art: string;
  profitWeight: number;
};

export type PortfolioResult = {
  positions: PortfolioPosition[];
  totals: { principal: number; value: number; earned: number; todayProfit: number; blendedApy: number };
  last30Days: { date: string; profit: number; balance: number }[];
  cumulativeValueSeries: { date: string; value: number }[];
  propertyShares: PropertyShare[];
};

function number(value: number | null | undefined): number {
  return Number(value ?? 0);
}

export async function getPortfolio(): Promise<PortfolioResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to view your portfolio.');

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 29);
  const sinceDate = since.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [positionResult, dailyResult] = await Promise.all([
    supabase.from('positions_live')
      .select('id, plan, principal, value, earned, apy, days_left, days_in, started_on, matures_on')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_on', { ascending: false }),
    supabase.from('portfolio_daily')
      .select('accrual_date, profit, balance')
      .eq('user_id', user.id)
      .gte('accrual_date', sinceDate)
      .order('accrual_date', { ascending: true }),
  ]);
  if (positionResult.error) throw positionResult.error;
  if (dailyResult.error) throw dailyResult.error;

  const positions: PortfolioPosition[] = ((positionResult.data ?? []) as Pick<LivePosition,
    'id' | 'plan' | 'principal' | 'value' | 'earned' | 'apy' | 'days_left' | 'days_in' | 'started_on' | 'matures_on'>[])
    .filter((row): row is typeof row & { id: string; plan: 'six' | 'twelve'; started_on: string; matures_on: string } =>
      Boolean(row.id && row.plan && row.started_on && row.matures_on))
    .map(row => ({
      id: row.id!,
      plan: row.plan!,
      principal: number(row.principal),
      value: number(row.value),
      earned: number(row.earned),
      apy: number(row.apy),
      daysLeft: number(row.days_left),
      daysIn: number(row.days_in),
      startedOn: row.started_on!,
      maturesOn: row.matures_on!,
    }));

  const dailyRows = (dailyResult.data ?? []) as DailyRow[];
  const byDate = new Map<string, { profit: number; balance: number }>();
  for (const row of dailyRows) {
    if (!row.accrual_date) continue;
    const current = byDate.get(row.accrual_date) ?? { profit: 0, balance: 0 };
    current.profit += number(row.profit);
    current.balance += number(row.balance);
    byDate.set(row.accrual_date, current);
  }
  const last30Days = Array.from(byDate, ([date, values]) => ({ date, ...values }));
  const principal = positions.reduce((sum, position) => sum + position.principal, 0);
  const value = positions.reduce((sum, position) => sum + position.value, 0);
  const earned = positions.reduce((sum, position) => sum + position.earned, 0);
  const todayProfit = last30Days.find(row => row.date === today)?.profit ?? 0;
  const cumulativeValueSeries = last30Days.map(row => ({ date: row.date, value: row.balance }));

  let propertyShares: PropertyShare[] = [];
  const positionIds = positions.map(position => position.id);
  if (positionIds.length) {
    const { data: allocations, error: allocationError } = await supabase
      .from('allocations')
      .select('property_id, amount, properties(id, name, slug, city, country, target_return, lat, lng, art)')
      .in('position_id', positionIds);
    if (allocationError) throw allocationError;

    const grouped = new Map<string, { property: NonNullable<(typeof allocations)[number]['properties']>; amount: number }>();
    for (const allocation of allocations ?? []) {
      const property = allocation.properties;
      if (!property) continue;
      const current = grouped.get(allocation.property_id) ?? { property, amount: 0 };
      current.amount += number(allocation.amount);
      grouped.set(allocation.property_id, current);
    }
    const rows = Array.from(grouped.values());
    const weights = propertyShare(1, rows.map(row => ({ targetReturn: number(row.property.target_return) })));
    propertyShares = rows.map((row, index) => ({
      propertyId: row.property.id,
      name: row.property.name,
      slug: row.property.slug,
      city: row.property.city,
      country: row.property.country,
      targetReturn: number(row.property.target_return),
      amount: row.amount,
      lat: row.property.lat === null ? null : number(row.property.lat),
      lng: row.property.lng === null ? null : number(row.property.lng),
      art: row.property.art,
      profitWeight: weights[index],
    })) as PropertyShare[];
  }

  return {
    positions,
    totals: {
      principal,
      value,
      earned,
      todayProfit,
      blendedApy: blendedApy(positions.map(position => ({ principal: position.principal, apy: position.apy }))),
    },
    last30Days,
    cumulativeValueSeries,
    propertyShares,
  };
}

export async function getProperties(): Promise<PropertyRow[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to view properties.');
  const { data, error } = await supabase.from('properties')
    .select('*')
    .order('sort', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getWalletBalance(): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to view your wallet.');
  const { data, error } = await supabase.rpc('wallet_balance');
  if (error) throw error;
  return number(data);
}
