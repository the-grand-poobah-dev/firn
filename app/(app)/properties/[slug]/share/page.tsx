import { notFound } from 'next/navigation';
import { TopBar } from '@/components/app/TopBar';
import { PropertySubscreen } from '@/components/properties/PropertySubscreen';
import { getProperty, getProperties } from '@/lib/properties';
import { getPortfolio } from '@/lib/data';
export default async function SharePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;
  const r=await getProperty(slug);if(!r)notFound();
  const [portfolio,properties]=await Promise.all([getPortfolio(),getProperties()]);
  const totalWeight=properties.reduce((sum,p)=>sum+p.target_return,0);
  const principal=portfolio.positions.reduce((sum,p)=>sum+p.principal/8,0);
  const profit=totalWeight>0?portfolio.totals.earned*r.property.target_return/totalWeight:0;
  return <><TopBar title="Your share" backHref={`/properties/${slug}`}/><PropertySubscreen property={r.property} mode="share" share={{principal,profit,positions:portfolio.positions.length}}/></>;
}
