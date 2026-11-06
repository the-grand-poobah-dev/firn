import type { ReactNode } from 'react';
import { PropertyTabs } from '@/components/properties/PropertyTabs';
export default function PropertyLayout({children,params}:{children:ReactNode;params:{slug:string}}){return <><PropertyTabs slug={params.slug}/>{children}</>;}
