import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles } from '@/content/learn/articles';
import { PropertyArt } from '@/components/art/PropertyArt';
import { Card } from '@/components/ui/Card';
export function Article({slug}:{slug:string}){const article=articles.find(a=>a.slug===slug);if(!article)notFound();return <article className="space-y-4"><Link href="/learn" className="text-sm text-muted">← Learn</Link><div className="h-44 overflow-hidden rounded-2xl"><PropertyArt kind={article.art}/></div><p className="text-xs text-muted">{article.category} · 3 min read</p><h1 className="text-2xl font-semibold">{article.title}</h1><p className="text-sm text-muted">{article.summary}</p><Card><div className="space-y-4 text-sm leading-7">{article.body.map((p,i)=><p key={i}>{p}</p>)}</div></Card><p className="text-xs text-muted">Educational information only. Figures are targets, not guarantees. Capital can be lost.</p></article>}
