import { NextResponse } from 'next/server';
import { getProperty } from '@/lib/properties';
export const revalidate = 60;
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const result = await getProperty(params.slug);
    if (!result) return NextResponse.json({ error: 'Property not found.' }, { status: 404, headers: { 'Cache-Control': 'private, max-age=60' } });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } });
  } catch {
    return NextResponse.json({ error: 'Sign in to view this property.' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
