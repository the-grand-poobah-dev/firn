import type {PropertyRecord} from '@/lib/property-utils';
const PHOTOS={
 apartments:['photo-1545324418-cc1a3fa10c00','photo-1600607687939-ce8a6c25118c','photo-1600566753086-00f18fb6b3ea','photo-1600210492486-724fe5c67fb0'],
 villas:['photo-1613490493576-7fde63acd811','photo-1600607687920-4e2a09cf159d','photo-1600566753190-17f0baa2a6c3','photo-1600047509807-ba8f99d2cdde'],
 offices:['photo-1497366754035-f200968a6e72','photo-1497366811353-6870744d04b2','photo-1497366216548-37526070297c','photo-1497366754035-f200968a6e72'],
 hotel:['photo-1566073771259-6a8506099945','photo-1571896349842-33c89424de2d','photo-1564501049412-61c2a3083791'],
 estate:['photo-1600607687939-ce8a6c25118c','photo-1600210492486-724fe5c67fb0','photo-1600566753190-17f0baa2a6c3'],
 lofts:['photo-1600607687920-4e2a09cf159d','photo-1600566753086-00f18fb6b3ea','photo-1600047509807-ba8f99d2cdde'],
};
function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0}
export function propertyPhoto(p:Pick<PropertyRecord,'slug'|'kind'>,width=900){
 const kind=p.kind.toLowerCase() as keyof typeof PHOTOS;const choices=PHOTOS[kind]??PHOTOS.apartments;const id=choices[hash(p.slug)%choices.length];
 return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
}
export function propertyDescription(p:Pick<PropertyRecord,'name'|'city'|'country'|'kind'|'units'|'about'>){
 const original=p.about?.trim()??'';
 if(original&&!/illustrative sample property listing|sample property listing for portfolio interface testing/i.test(original))return original;
 const type=p.kind.toLowerCase();
 const descriptions:Record<string,string>={
 apartments:`A representative residential profile in ${p.city}, ${p.country}, with ${p.units} apartments in the sample portfolio. The overview brings together the location, unit count and funding information for a clearer first look.`,
 villas:`A representative villa collection in ${p.city}, ${p.country}. This sample profile highlights a ${p.units}-unit residential portfolio and gives members a starting point for reviewing location and funding metrics.`,
 offices:`A representative commercial workspace profile in ${p.city}, ${p.country}, comprising ${p.units} office units in this sample portfolio. Review the funding progress and property metrics before comparing it with other opportunities.`,
 hotel:`A representative hospitality asset profile in ${p.city}, ${p.country}, with ${p.units} rooms or units represented in the sample portfolio. The listing is designed to make its location and funding indicators easy to compare.`,
 estate:`A representative multi-unit estate profile in ${p.city}, ${p.country}. Its ${p.units} units are presented with portfolio-level valuation and funding indicators for exploration.`,
 lofts:`A representative loft residence profile in ${p.city}, ${p.country}, with ${p.units} units in the sample portfolio. Explore its location and headline metrics alongside the other Firn listings.`
 };
 return descriptions[type]??`A representative ${type} property profile in ${p.city}, ${p.country}, with ${p.units} units in the sample portfolio. Explore the location and headline funding metrics alongside other Firn listings.`;
}
