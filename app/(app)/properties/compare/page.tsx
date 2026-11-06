import { TopBar } from '@/components/app/TopBar';
import { CompareSelector } from '@/components/properties/CompareSelector';
import { getProperties } from '@/lib/properties';
export default async function ComparePage({searchParams}:{searchParams:{slugs?:string}}){const properties=await getProperties();const initial=(searchParams.slugs??'').split(',').filter(Boolean);return <div className="space-y-4"><TopBar title="Compare properties" backHref="/properties"/><p className="text-sm text-muted">Compare up to three assets across target return, occupancy, funding and valuation.</p><CompareSelector properties={properties} initial={initial}/></div>;}
