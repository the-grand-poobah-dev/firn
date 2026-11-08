import type { IconName } from '@/components/ui/Icon';

export type PaymentMethodStatus = 'active' | 'coming_soon';

export type PaymentMethod = {
  id: 'crypto' | 'mpesa' | 'card' | 'bank';
  label: string;
  description: string;
  icon: IconName;
  status: PaymentMethodStatus;
  order: number;
};

// To launch another method, change its status to 'active' and add its payment flow.
// Keep order explicit so the active USDT option remains first in every selector.
const configuredPaymentMethods: PaymentMethod[] = [
  { id: 'crypto', label: 'USDT (TRC20)', description: 'Tether on the Tron network', icon: 'bolt', status: 'active', order: 1 },
  { id: 'mpesa', label: 'M-Pesa', description: 'Mobile money', icon: 'phone', status: 'coming_soon', order: 2 },
  { id: 'card', label: 'Debit or credit card', description: 'Card payment', icon: 'card', status: 'coming_soon', order: 3 },
  { id: 'bank', label: 'Bank transfer', description: 'Local bank transfer', icon: 'bank', status: 'coming_soon', order: 4 },
];

export const paymentMethods: PaymentMethod[] = [...configuredPaymentMethods].sort((a, b) => a.order - b.order);
