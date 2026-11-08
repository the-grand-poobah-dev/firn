import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const steps = ['Identity document', 'Proof of address', 'Source of funds'];

export function KycChecklist() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2 border-warm/40">
        <p className="text-sm font-semibold">Identity verification is not connected yet</p>
        <p className="text-xs leading-5 text-muted">FIRN is not currently collecting identity documents. Your account remains unverified. Do not send identity documents by email or through an unapproved channel.</p>
      </Card>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step} className="flex items-center justify-between rounded-2xl border border-line bg-card2 p-4">
            <span className="text-sm font-medium">{step}</span>
            <span className="rounded-full bg-card px-2 py-1 text-[10px] font-semibold text-muted">Not started</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted">You can continue browsing FIRN. Starting a savings plan or depositing funds remains restricted until identity verification is completed by an approved provider.</p>
      <Link href="/home" className="flex min-h-12 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-on">Continue to dashboard</Link>
    </div>
  );
}
