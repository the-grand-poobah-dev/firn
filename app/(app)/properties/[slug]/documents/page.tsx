import { notFound } from 'next/navigation';
import { TopBar } from '@/components/app/TopBar';
import { PropertySubscreen } from '@/components/properties/PropertySubscreen';
import { getProperty } from '@/lib/properties';
export default async function DocumentsPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const r=await getProperty(slug);if(!r)notFound();return <><TopBar title="Documents" backHref={`/properties/${slug}`}/><PropertySubscreen property={r.property} mode="documents"/></>;}
