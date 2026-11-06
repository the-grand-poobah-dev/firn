'use client';
import useEmblaCarousel from 'embla-carousel-react';
import { PropertyCard } from './PropertyCard';
import type { PropertyRecord } from '@/lib/property-utils';
export function PropertyDeck({ properties }: { properties: PropertyRecord[] }) {
  const [viewportRef, embla] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });
  return <div><div ref={viewportRef} className="overflow-hidden touch-pan-y"><div className="flex gap-3">{properties.map((property) => <div key={property.slug} className="min-w-0 shrink-0">{/* Card width is fixed for predictable touch and mouse dragging. */}<PropertyCard property={property} /></div>)}</div></div><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => embla?.scrollPrev()} aria-label="Previous properties" className="grid size-9 place-items-center rounded-full border border-line bg-card text-muted">←</button><button type="button" onClick={() => embla?.scrollNext()} aria-label="Next properties" className="grid size-9 place-items-center rounded-full border border-line bg-card text-muted">→</button></div></div>;
}
