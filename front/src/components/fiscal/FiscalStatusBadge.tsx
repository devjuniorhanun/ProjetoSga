import { Badge } from '@/components/ui/badge';
import { INVOICE_STATUS_LABELS } from '@/lib/fiscal-labels';
import type { InvoiceStatus } from '@/types/fiscal';

const VARIANTS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  CONFIRMED: 'bg-primary/10 text-primary',
  CANCELED: 'bg-destructive/10 text-destructive',
};

export function FiscalStatusBadge({ status }: { status?: string | null }) {
  const key = (status ?? 'DRAFT') as InvoiceStatus;
  return (
    <Badge variant="outline" className={VARIANTS[key] ?? 'bg-muted text-muted-foreground'}>
      {INVOICE_STATUS_LABELS[key] ?? key}
    </Badge>
  );
}
