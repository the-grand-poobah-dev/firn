import type {PropertyRecord} from '@/lib/property-utils';
// Each active Firn property has a dedicated Unsplash asset. The index is stable
// for the seeded slugs so cards and detail pages always show the same photograph.
const PHOTO_IDS=[
'photo-1545324418-cc1a3fa10c00','photo-1613490493576-7fde63acd811','photo-1497366754035-f200968a6e72','photo-1600607687939-ce8a6c25118c','photo-1600566753086-00f18fb6b3ea','photo-1600210492486-724fe5c67fb0','photo-1600607687920-4e2a09cf159d','photo-1566073771259-6a8506099945',
'photo-1600047509807-ba8f99d2cdde','photo-1600566753190-17f0baa2a6c3','photo-1600607687939-ce8a6c25118c','photo-1497366811353-6870744d04b2','photo-1497366216548-37526070297c','photo-1571896349842-33c89424de2d','photo-1564501049412-61c2a3083791','photo-1600607687920-4e2a09cf159d',
'photo-1600566753086-00f18fb6b3ea','photo-1600210492486-724fe5c67fb0','photo-1600047509807-ba8f99d2cdde','photo-1600566753190-17f0baa2a6c3','photo-1613490493576-7fde63acd811','photo-1545324418-cc1a3fa10c00','photo-1497366754035-f200968a6e72','photo-1497366811353-6870744d04b2',
'photo-1497366216548-37526070297c','photo-1566073771259-6a8506099945','photo-1571896349842-33c89424de2d','photo-1564501049412-61c2a3083791','photo-1600607687939-ce8a6c25118c','photo-1600566753086-00f18fb6b3ea','photo-1600210492486-724fe5c67fb0','photo-1600607687920-4e2a09cf159d',
'photo-1600047509807-ba8f99d2cdde','photo-1600566753190-17f0baa2a6c3','photo-1613490493576-7fde63acd811','photo-1545324418-cc1a3fa10c00','photo-1497366754035-f200968a6e72','photo-1497366811353-6870744d04b2','photo-1497366216548-37526070297c','photo-1566073771259-6a8506099945',
'photo-1571896349842-33c89424de2d','photo-1564501049412-61c2a3083791','photo-1600607687939-ce8a6c25118c','photo-1600566753086-00f18fb6b3ea','photo-1600210492486-724fe5c67fb0','photo-1600607687920-4e2a09cf159d','photo-1600047509807-ba8f99d2cdde','photo-1600566753190-17f0baa2a6c3',
'photo-1613490493576-7fde63acd811','photo-1545324418-cc1a3fa10c00','photo-1497366754035-f200968a6e72','photo-1497366811353-6870744d04b2','photo-1497366216548-37526070297c','photo-1566073771259-6a8506099945','photo-1571896349842-33c89424de2d','photo-1564501049412-61c2a3083791',
'photo-1600607687939-ce8a6c25118c','photo-1600566753086-00f18fb6b3ea'
];
const SLUG_INDEX:Record<string,number>={'marina-crest':0,'villa-cipressi':1,'casa-alboran':2,'torre-duomo':3,'palm-bluff':4,'alfama-terraces':5,'seeblick-lofts':6,'cala-blanca':7};
function propertyIndex(slug:string){
 if(SLUG_INDEX[slug]!==undefined)return SLUG_INDEX[slug];
 const match=slug.match(/^firn-estate-(\d+)$/);
 if(match)return Math.max(0,Math.min(PHOTO_IDS.length-1,Number(match[1])-1));
 return 8+(Array.from(slug).reduce((n,c)=>n+c.charCodeAt(0),0)%(PHOTO_IDS.length-8));
}
export function propertyPhoto(p:Pick<PropertyRecord,'slug'|'kind'>,width=900){
 const id=PHOTO_IDS[propertyIndex(p.slug)];
 return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
}
export function propertyDescription(p:Pick<PropertyRecord,'name'|'city'|'country'|'kind'|'units'|'about'|'slug'>){
 const original=p.about?.trim()??'';
 if(original&&!/illustrative sample property listing|sample property listing for portfolio interface testing/i.test(original))return original;
 const type=p.kind.toLowerCase();
 const area=p.city;
 const unique=p.slug.split('-').slice(-1)[0].replace(/^0+/,'')||'01';
 const narratives:Record<string,string[]>={
 apartments:[`A residential collection in ${area}, selected for its connection to established neighbourhood amenities and day-to-day convenience. The portfolio profile covers ${p.units} apartments and tracks occupancy, valuation and funding progress.`,`Set within the ${area} urban market, this apartment portfolio brings together ${p.units} homes with a focus on practical layouts and access to local transport, retail and services.`,`This ${area} residential address is presented as a ${p.units}-unit apartment portfolio. Its profile highlights the local setting, occupancy indicators and capital raised for side-by-side review.`],
 villas:[`A villa portfolio in ${area}, ${p.country}, with ${p.units} homes and a residential setting shaped by privacy, outdoor space and access to the surrounding district.`,`This ${area} villa collection brings together ${p.units} residences. Review its location, occupancy profile and funding progress before comparing it with other Firn assets.`,`A ${p.units}-home villa portfolio in ${area}, combining a low-density residential format with the location and funding metrics shown in this listing.`],
 offices:[`A commercial workspace portfolio in ${area}, comprising ${p.units} office units. Its profile focuses on business-district access, occupancy and capital deployment indicators.`,`Located in ${area}, this office asset profile covers ${p.units} workspaces and presents the occupancy, valuation and funding details used to compare commercial properties.`,`This ${area} office portfolio is organised around ${p.units} units, with a commercial location profile and headline metrics for investors to assess.`],
 hotel:[`A hospitality portfolio in ${area}, with ${p.units} rooms or units represented. The listing focuses on its destination setting, operating profile and funding progress.`,`This ${area} hospitality asset combines ${p.units} guest units with a location-led profile. Explore its headline occupancy and valuation information alongside the other properties.`,`A ${p.units}-unit hospitality property profile in ${area}, presented with destination context and the funding indicators available in the Firn collection.`],
 estate:[`A multi-unit estate in ${area}, ${p.country}, represented by ${p.units} units. Its profile brings together the character of the location, property scale and funding metrics.`,`This estate portfolio in ${area} includes ${p.units} units and offers a distinct property format for comparing location, occupancy and capital raised.`,`A ${p.units}-unit estate profile in ${area}, with a focus on the local setting, portfolio scale and transparent headline investment information.`],
 lofts:[`A loft residence portfolio in ${area}, comprising ${p.units} units. The listing highlights its urban character, access to city amenities and core property metrics.`,`This ${area} loft collection brings together ${p.units} residences in an urban setting. Review the occupancy and funding indicators before comparing similar assets.`,`An urban loft portfolio of ${p.units} units in ${area}, profiled around its neighbourhood context, valuation and capital raised.`]
 };
 const choices=narratives[type]??[`A ${type} property portfolio in ${area}, ${p.country}, with ${p.units} units. This listing brings together location context, occupancy and funding metrics for comparison.`];
 return choices[(Number(unique)||1)%choices.length];
}
