'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { articles, featured } from '@/content/learn/articles';
import { PropertyArt } from '@/components/art/PropertyArt';
import { Card } from '@/components/ui/Card';

export function LearnHome() {
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false, pointerId: -1 });

  function pointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !rail.current) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: rail.current.scrollLeft, moved: false, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active || !rail.current) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    if (drag.current.moved) {
      e.preventDefault();
      rail.current.scrollLeft = drag.current.scrollLeft - delta;
    }
  }
  function pointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current.pointerId === e.pointerId && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current.active = false;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Learn at your pace</p>
        <h2 className="text-xl font-semibold">Featured reads</h2>
        <p className="mt-1 text-xs text-muted">Swipe, scroll or drag to explore</p>
      </div>
      <div
        ref={rail}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onLostPointerCapture={() => { drag.current.active = false; }}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide touch-pan-y cursor-grab active:cursor-grabbing select-none px-4 pb-2"
      >
        {featured.map(article => (
          <Link
            key={article.slug}
            href={'/learn/' + article.slug}
            draggable={false}
            onClick={e => { if (drag.current.moved) e.preventDefault(); drag.current.moved = false; }}
            className="w-[82%] shrink-0 snap-center overflow-hidden rounded-2xl border border-line bg-card"
          >
            <div className="h-36"><PropertyArt kind={article.art} /></div>
            <div className="p-4">
              <p className="text-xs text-muted">{article.category} · 3 min read</p>
              <h3 className="mt-2 font-semibold">{article.title}</h3>
              <p className="mt-1 text-sm text-muted">{article.summary}</p>
            </div>
          </Link>
        ))}
      </div>
      <Card>
        <h2 className="mb-3 font-semibold">The basics</h2>
        <div className="divide-y divide-line">
          {articles.map(article => (
            <Link key={article.slug} href={'/learn/' + article.slug} className="flex items-center justify-between gap-3 py-3">
              <div><p className="text-xs text-muted">{article.category}</p><strong className="text-sm">{article.title}</strong></div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
