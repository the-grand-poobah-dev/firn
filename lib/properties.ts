import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type HistoryPoint = { d: string; v: number };
export type PropertyDocument = { title: string; size?: string; type?: string };
export type PropertyRecord = {
  id: string; slug: string; name: string; city: string; country: string; kind: string; art: string;
  units: number; target_raise: number; raised: number; target_return: number; occupancy: number;
  valuation: number; about: string | null; lat: number | null; lng: number | null;
  valuation_history: HistoryPoint[]; rent_history: HistoryPoint[]; documents: PropertyDocument[];
  sort: number | null; is_active: boolean | null;
};
export type PropertyUpdate = { id: string; title: string; body: string | null; posted_on: string | null };

function points(value: unknown): HistoryPoint[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return { d: String(row.d ?? ''), v: Number(row.v ?? 0) };
  });
}
function docs(value: unknown): PropertyDocument[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return { title: String(row.title ?? 'Property document'), size: row.size ? String(row.size) : undefined, type: row.type ? String(row.type) : undefined };
  });
}
function normalize(row: Record<string, unknown>): PropertyRecord {
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name), city: String(row.city),
    country: String(row.country), kind: String(row.kind), art: String(row.art), units: Number(row.units ?? 0),
    target_raise: Number(row.target_raise ?? 0), raised: Number(row.raised ?? 0),
    target_return: Number(row.target_return ?? 0), occupancy: Number(row.occupancy ?? 0),
    valuation: Number(row.valuation ?? 0), about: row.about ? String(row.about) : null,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    valuation_history: points(row.valuation_history), rent_history: points(row.rent_history),
    documents: docs(row.documents), sort: row.sort === null || row.sort === undefined ? null : Number(row.sort),
    is_active: row.is_active === null || row.is_active === undefined ? null : Boolean(row.is_active),
  };
}
async function signedInClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sign in to explore Firn properties.');
  return supabase;
}
export async function getProperties(): Promise<PropertyRecord[]> {
  const supabase = await signedInClient();
  const { data, error } = await supabase.from('properties').select('*').eq('is_active', true).order('sort', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalize);
}
export async function getProperty(slug: string): Promise<{ property: PropertyRecord; updates: PropertyUpdate[]; investorCount: number } | null> {
  const supabase = await signedInClient();
  const { data, error } = await supabase.from('properties').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const property = normalize(data as unknown as Record<string, unknown>);
  const [{ data: updates, error: updateError }, { data: investorCount, error: countError }] = await Promise.all([
    supabase.from('property_updates').select('id,title,body,posted_on').eq('property_id', property.id).order('posted_on', { ascending: false }),
    supabase.rpc('property_investor_count', { p_property: property.id }),
  ]);
  if (updateError) throw updateError;
  if (countError) throw countError;
  return { property, updates: (updates ?? []) as PropertyUpdate[], investorCount: Number(investorCount ?? 0) };
}
export function propertyRisk(property: Pick<PropertyRecord, 'occupancy' | 'target_return'>): 'Lower' | 'Medium' | 'Higher' {
  if (property.occupancy < .85 || property.target_return > .145) return 'Higher';
  if (property.occupancy >= .95 && property.target_return < .125) return 'Lower';
  return 'Medium';
}
export function artSeed(slug: string): number {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i++) hash = Math.imul(hash ^ slug.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export function artKind(value: string, seed = 0): 'tower' | 'villa' | 'marbella' | 'office' | 'palm' | 'lisbon' | 'zurich' | 'mallorca' {
  const kinds = ['tower','villa','marbella','office','palm','lisbon','zurich','mallorca'];
  if (kinds.includes(value)) return value as ReturnType<typeof artKind>;
  const fallbacks: Record<string, string[]> = {
    hotel: ['marbella','mallorca','villa','palm'],
    loft: ['zurich','office','lisbon'],
    residential: ['tower','palm','office','marbella'],
  };
  const choices = fallbacks[value] ?? ['tower'];
  return choices[Math.abs(Math.floor(seed)) % choices.length] as ReturnType<typeof artKind>;
}
