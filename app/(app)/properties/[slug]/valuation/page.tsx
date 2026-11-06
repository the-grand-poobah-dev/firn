import { notFound } from 'next/navigation';
import { TopBar } from '@/components/app/TopBar';
import { PropertySubscreen } from '@/components/properties/PropertySubscreen';
import { getProperty } from '@/lib/properties';
export default async function ValuationPage({params}:{params:{slug:string}}){const r=await getProperty(params.slug);if(!r)notFound();return <><TopBar title="Valuation" backHref={`/properties/${params.slug}`}/><PropertySubscreen property={r.property} mode="valuation"/></>;}
