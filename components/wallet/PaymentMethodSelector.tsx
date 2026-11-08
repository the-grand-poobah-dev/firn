'use client';

import { useRouter } from 'next/navigation';
import { paymentMethods } from '@/lib/payment-methods';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ComingSoonBadge } from './ComingSoonBadge';

type Props = {
  selectedId?: string;
  returnTo?: string;
  onSelect?: (id: string) => void;
};

export function PaymentMethodSelector({ selectedId, returnTo = '/wallet', onSelect }: Props) {
  const router = useRouter();

  function selectMethod(id: string) {
    const method = paymentMethods.find((item) => item.id === id);
    if (!method || method.status !== 'active') return;

    if (onSelect) {
      onSelect(id);
      return;
    }

    const safeReturnTo = returnTo.startsWith('/save/') ? returnTo : '/wallet';
    router.push('/wallet/deposit/usdt?returnTo=' + encodeURIComponent(safeReturnTo));
  }

  return (
    <div className="space-y-2" aria-label="Payment methods">
      {paymentMethods.map((method) => {
        const active = method.status === 'active';
        const selected = selectedId === method.id;

        return (
          <button
            key={method.id}
            type="button"
            aria-disabled={!active}
            aria-pressed={active ? selected : undefined}
            title={active ? undefined : 'Coming soon'}
            onClick={() => selectMethod(method.id)}
            className={[
              'flex min-h-[76px] w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              active
                ? selected
                  ? 'border-accent bg-accent/10'
                  : 'border-accent/50 bg-card hover:border-accent hover:bg-accent/5'
                : 'cursor-not-allowed border-line bg-card opacity-55',
            ].join(' ')}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card2 text-fg">
              <Icon name={method.icon} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{method.label}</span>
                {active ? (
                  <span className="inline-flex items-center rounded-full bg-pos/15 px-2 py-1 text-[10px] font-semibold text-pos">
                    Available
                  </span>
                ) : (
                  <ComingSoonBadge />
                )}
              </span>
              <span className="mt-1 block text-xs text-muted">{method.description}</span>
              {!active && <span className="sr-only">This payment method is coming soon and cannot be selected.</span>}
            </span>
            {active && (
              <Icon
                name={selected ? 'check' : 'arrow'}
                className={selected ? 'shrink-0 text-accent' : 'shrink-0 text-muted'}
                size={18}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
