import { requireUser } from '@/lib/auth';
import { getProperties } from '@/lib/data';
import { SearchProperties } from '@/components/home/SearchProperties';
import { TopBar } from '@/components/app/TopBar';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  await requireUser();
  const properties = await getProperties();
  return <div className="space-y-5"><TopBar title="Search properties" backHref="/home"/><SearchProperties properties={properties}/></div>;
}
