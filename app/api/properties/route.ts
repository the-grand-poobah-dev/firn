import { NextResponse } from 'next/server';
import { getProperties } from '@/lib/properties';
export const revalidate = 60;
export async function GET() {
  try {
    const properties = await getProperties();
    return NextResponse.json({ properties }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } });
  } catch {
    return NextResponse.json({ error: 'Sign in to view properties.' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
