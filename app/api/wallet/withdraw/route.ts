import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// No real payout provider is connected. Never record a demo withdrawal as if
// money had actually been sent to a customer.
export async function POST() {
  return NextResponse.json(
    { error: 'Withdrawals are not available yet. No money has been moved.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
