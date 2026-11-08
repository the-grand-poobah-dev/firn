import type { ReactNode } from 'react';
import { PropertyTabs } from '@/components/properties/PropertyTabs';
export default async function PropertyLayout({children,params}:{children:ReactNode;params:Promise<{slug:string}>}){const {slug}=await params;return <><PropertyTabs slug={slug}/>{children}</>;}
