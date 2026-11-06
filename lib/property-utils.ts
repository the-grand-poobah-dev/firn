export type HistoryPoint = { d: string; v: number };
export type PropertyDocument = { title: string; size?: string; type?: string };
export type PropertyRecord = {
  id: string; slug: string; name: string; city: string; country: string; kind: string; art: string;
  units: number; target_raise: number; raised: number; target_return: number; occupancy: number;
  valuation: number; about: string | null; lat: number | null; lng: number | null;
  valuation_history: HistoryPoint[]; rent_history: HistoryPoint[]; documents: PropertyDocument[];
  sort: number | null; is_active: boolean | null;
};
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
export function artKind(value: string): 'tower' | 'villa' | 'marbella' | 'office' | 'palm' | 'lisbon' | 'zurich' | 'mallorca' {
  const kinds = ['tower','villa','marbella','office','palm','lisbon','zurich','mallorca'];
  return kinds.includes(value) ? value as ReturnType<typeof artKind> : 'tower';
}
