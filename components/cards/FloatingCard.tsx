import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export function FloatingCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Card variant="hero" className={'relative overflow-hidden border-line/80 shadow-[0_18px_48px_-28px_rgba(0,0,0,.7)] ' + className}>{children}</Card>;
}
