import { notFound } from 'next/navigation';
import { TopBar } from '@/components/app/TopBar';
import { PropertySubscreen } from '@/components/properties/PropertySubscreen';
import { getProperty } from '@/lib/properties';
export default async function DocumentsPage({params}:{params:{slug:string}}){const r=await getProperty(params.slug);if(!r)notFound();return <><TopBar title="Documents" backHref={`/properties/${params.slug}`}/><PropertySubscreen property={r.property} mode="documents"/></>;}
