import { createClient } from '@supabase/supabase-js';
import { growth } from '../lib/finance';

type PlanCode = 'six' | 'twelve';
type PositionSeed = { plan: PlanCode; principal: number; startedOn: string };

const EMAIL = 'demo@firn.example';
const NAME = 'Julius Thandi';
const POSITIONS: PositionSeed[] = [
  { plan: 'twelve', principal: 10_000, startedOn: '2026-06-12' },
  { plan: 'six', principal: 5_000, startedOn: '2026-09-03' },
  { plan: 'twelve', principal: 2_500, startedOn: '2026-10-01' },
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function addMonths(isoDate: string, months: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

function cents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function main() {
  const url = required('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const demoPassword = required('DEMO_PASSWORD');
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let demoUser = listed.users.find(user => user.email?.toLowerCase() === EMAIL);
  if (demoUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(demoUser.id, {
      password: demoPassword,
      user_metadata: { full_name: NAME, country: 'Kenya' },
    });
    if (error) throw error;
    demoUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: NAME, country: 'Kenya' },
    });
    if (error) throw error;
    demoUser = data.user;
  }
  if (!demoUser) throw new Error('Supabase did not return the demo user.');

  const userId = demoUser.id;

  // Clear only this demo account. Deleting positions cascades to its allocations and accruals.
  for (const table of ['wallet_ledger', 'notifications', 'positions'] as const) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: NAME,
    country: 'Kenya',
    kyc_status: 'verified',
    risk_level: 3,
  });
  if (profileError) throw profileError;

  const { data: plans, error: planError } = await supabase
    .from('plans')
    .select('code, lock_months, target_apy')
    .in('code', ['six', 'twelve']);
  if (planError) throw planError;
  const planByCode = new Map((plans ?? []).map(plan => [plan.code, plan]));

  const { data: properties, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('is_active', true)
    .order('sort', { ascending: true })
    .limit(10);
  if (propertyError) throw propertyError;
  if (!properties || properties.length !== 10) {
    throw new Error(`Expected at least 10 active properties; found ${properties?.length ?? 0}.`);
  }

  // The three deposits total 18,740.50: 17,500.00 is locked in positions,
  // leaving the requested 1,240.50 available wallet balance.
  const deposits = [
    { amount: 5_000, created_at: '2026-06-10T10:00:00.000Z' },
    { amount: 6_000, created_at: '2026-08-29T10:00:00.000Z' },
    { amount: 7_740.5, created_at: '2026-09-28T10:00:00.000Z' },
  ];
  const { error: depositError } = await supabase.from('wallet_ledger').insert(
    deposits.map(row => ({
      user_id: userId, kind: 'deposit', amount: row.amount,
      method: 'demo_seed', created_at: row.created_at,
    })),
  );
  if (depositError) throw depositError;

  const positionIds: string[] = [];
  for (const seed of POSITIONS) {
    const plan = planByCode.get(seed.plan);
    if (!plan) throw new Error(`Plan ${seed.plan} is missing from public.plans.`);
    const maturity = addMonths(seed.startedOn, plan.lock_months);
    const { data: position, error } = await supabase
      .from('positions')
      .insert({
        user_id: userId,
        plan: seed.plan,
        principal: seed.principal,
        apy: Number(plan.target_apy),
        started_on: seed.startedOn,
        matures_on: maturity,
        status: 'active',
        auto_roll: 'ask',
        settled: false,
      })
      .select('id')
      .single();
    if (error) throw error;
    positionIds.push(position.id);

    const totalCents = Math.round(seed.principal * 100);
    const baseCents = Math.floor(totalCents / 10);
    const remainder = totalCents % 10;
    const allocations = properties.map((property, index) => ({
      position_id: position.id,
      property_id: property.id,
      amount: ((baseCents + (index === 0 ? remainder : 0)) / 100).toFixed(2),
    }));
    const { error: allocationError } = await supabase.from('allocations').insert(allocations);
    if (allocationError) throw allocationError;

    const { error: backfillError } = await supabase.rpc('backfill_accruals', {
      p_position: position.id,
    });
    if (backfillError) throw backfillError;
    // A second backfill must be a no-op because (position_id, accrual_date) is unique.
    const { data: secondBackfill, error: secondBackfillError } = await supabase.rpc('backfill_accruals', {
      p_position: position.id,
    });
    if (secondBackfillError) throw secondBackfillError;
    if (secondBackfill !== 0) {
      throw new Error(`Backfill was not idempotent for position ${position.id}.`);
    }
  }

  const locks = POSITIONS.map((position, index) => ({
    user_id: userId,
    kind: 'lock',
    amount: -position.principal,
    method: 'position',
    created_at: [
      '2026-06-12T10:05:00.000Z',
      '2026-09-03T10:05:00.000Z',
      '2026-10-01T10:05:00.000Z',
    ][index],
  }));
  const { error: lockError } = await supabase.from('wallet_ledger').insert(locks);
  if (lockError) throw lockError;

  const notifications = [
    { title: 'Daily interest added', body: 'Your Firn savings earned interest today.', created_at: '2026-11-06T00:05:00.000Z' },
    { title: 'Marina Crest occupancy report', body: 'The latest occupancy report for Marina Crest Tower is ready.', created_at: '2026-11-04T09:00:00.000Z' },
    { title: 'Maturity reminder', body: 'Your Firn Six position is approaching its maturity date.', created_at: '2026-11-03T09:00:00.000Z' },
    { title: 'October statement ready', body: 'Your October savings statement is ready to review.', created_at: '2026-11-01T08:00:00.000Z' },
    { title: 'New device sign-in', body: 'A new device signed in to your Firn account.', created_at: '2026-10-28T16:30:00.000Z' },
    { title: 'Villa Cipressi refurbished', body: 'Villa Cipressi has completed its refurbishment update.', created_at: '2026-10-24T11:00:00.000Z' },
  ];
  const { error: notificationError } = await supabase.from('notifications').insert(
    notifications.map(row => ({ ...row, user_id: userId, read: false })),
  );
  if (notificationError) throw notificationError;

  // First run posts today's accrual. The second run must not change today's rows or totals.
  const { error: firstRunError } = await supabase.rpc('accrue_daily');
  if (firstRunError) throw firstRunError;
  const { data: beforeRows, error: beforeError } = await supabase
    .from('accruals')
    .select('position_id, accrual_date, amount')
    .in('position_id', positionIds);
  if (beforeError) throw beforeError;
  const beforeSignature = JSON.stringify((beforeRows ?? [])
    .map(row => [row.position_id, row.accrual_date, Number(row.amount)])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1]))));

  const { error: secondRunError } = await supabase.rpc('accrue_daily');
  if (secondRunError) throw secondRunError;
  const { data: afterRows, error: afterError } = await supabase
    .from('accruals')
    .select('position_id, accrual_date, amount')
    .in('position_id', positionIds);
  if (afterError) throw afterError;
  const afterSignature = JSON.stringify((afterRows ?? [])
    .map(row => [row.position_id, row.accrual_date, Number(row.amount)])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1]))));
  if (beforeSignature !== afterSignature) {
    throw new Error('Idempotency check failed: the second accrue_daily() call changed accrual rows.');
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: allAccruals, error: allAccrualsError } = await supabase
    .from('accruals')
    .select('position_id, accrual_date, amount')
    .in('position_id', positionIds);
  if (allAccrualsError) throw allAccrualsError;

  const { data: positionRows, error: positionRowsError } = await supabase
    .from('positions')
    .select('id, plan, principal, apy, started_on, matures_on')
    .in('id', positionIds)
    .order('started_on', { ascending: true });
  if (positionRowsError) throw positionRowsError;

  const positionChecks = (positionRows ?? []).map(position => {
    const rows = (allAccruals ?? []).filter(row => row.position_id === position.id && row.accrual_date <= today);
    const actual = cents(Number(position.principal) + rows.reduce((sum, row) => sum + Number(row.amount), 0));
    const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${position.started_on}T00:00:00Z`)) / 86_400_000);
    const expected = cents(growth(Number(position.principal), Number(position.apy), days));
    if (actual !== expected) {
      throw new Error(`Value mismatch for ${position.id}: accruals=${actual}, growth()=${expected}.`);
    }
    return {
      position_id: position.id,
      plan: position.plan,
      principal: Number(position.principal),
      days,
      actual_value: actual,
      growth_value: expected,
      matches_to_cent: actual === expected,
    };
  });

  const accrualCount = allAccruals?.length ?? 0;
  const earnedToday = cents((allAccruals ?? [])
    .filter(row => row.accrual_date === today)
    .reduce((sum, row) => sum + Number(row.amount), 0));

  const { data: ledger, error: ledgerError } = await supabase
    .from('wallet_ledger')
    .select('amount')
    .eq('user_id', userId);
  if (ledgerError) throw ledgerError;
  const available = cents((ledger ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
  if (available !== 1_240.5) {
    throw new Error(`Demo wallet balance mismatch: expected 1,240.50, got ${available.toFixed(2)}.`);
  }

  console.log(JSON.stringify({
    demo_user: EMAIL,
    positions: positionIds,
    wallet_available: available,
    idempotency: 'PASS — second accrue_daily() call made no changes',
    accrual_count: accrualCount,
    position_checks: positionChecks,
    total_earned_today: earnedToday,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
