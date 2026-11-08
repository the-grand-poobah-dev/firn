import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Legacy provider checkout routes are deliberately disabled. USDT TRC20 claims
// must use /api/deposits/usdt-trc20/verify; M-Pesa, card and bank are not live.
export async function POST() {
  return NextResponse.json(
    { error: 'This payment method is unavailable. Use the dedicated USDT TRC20 deposit flow when deposits are enabled.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
