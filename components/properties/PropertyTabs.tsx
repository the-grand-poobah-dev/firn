import Link from 'next/link';
const tabs = [['Overview',''],['Financials','financials'],['Rent','rent'],['Documents','documents'],['Location','location'],['Updates','updates'],['Valuation','valuation'],['Your share','share']] as const;
export function PropertyTabs({ slug, active = '' }: { slug: string; active?: string }) {
  return <nav aria-label="Property sections" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">{tabs.map(([label,path]) => <Link key={label} href={path ? \`/properties/\${slug}/\${path}\` : \`/properties/\${slug}\`} aria-current={active===path?'page':undefined} className={\`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium \${active===path?'border-accent bg-accent/15 text-accent':'border-line bg-card text-muted'}\`}>{label}</Link>)}</nav>;
}
