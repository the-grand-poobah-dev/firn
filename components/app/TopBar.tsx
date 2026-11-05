import Link from 'next/link';
import type {ReactNode} from 'react';
import {Icon} from '@/components/ui/Icon';
export function TopBar({title,backHref,right,rightLabel}:{title:string;backHref?:string;right?:ReactNode;rightLabel?:string}){
 return <header className="mb-5 flex min-h-11 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{backHref&&<Link href={backHref} aria-label="Go back" className="grid size-10 place-items-center rounded-full bg-card2 text-fg"><Icon name="back"/></Link>}<h1 className="truncate text-lg font-semibold">{title}</h1></div>{right&&<div aria-label={rightLabel}>{right}</div>}</header>;
}