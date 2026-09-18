import { Badge } from '@/components/ui/badge';
import {
  AUTHORIZATION_STATUS_LABELS,
  CONTRACT_STATUS_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/grain-labels';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const TICKET_VARIANTS: Record<string, Variant> = {
  WAITING_FIRST_WEIGHT: 'secondary',
  WAITING_DISCOUNTS: 'secondary',
  WAITING_SECOND_WEIGHT: 'secondary',
  SECOND_WEIGHED: 'default',
  CLOSED: 'default',
  CANCELED: 'destructive',
};

const CONTRACT_VARIANTS: Record<string, Variant> = {
  DRAFT: 'outline',
  OPEN: 'default',
  PARTIAL: 'secondary',
  SUSPENDED: 'secondary',
  CANCELED: 'destructive',
  FINISHED: 'outline',
};

const AUTH_VARIANTS: Record<string, Variant> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  USED: 'outline',
};

interface Props {
  kind: 'ticket' | 'contract' | 'authorization';
  status?: string | null;
}

export function GrainStatusBadge({ kind, status }: Props) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const labels =
    kind === 'ticket'
      ? TICKET_STATUS_LABELS
      : kind === 'contract'
        ? CONTRACT_STATUS_LABELS
        : AUTHORIZATION_STATUS_LABELS;
  const variants =
    kind === 'ticket' ? TICKET_VARIANTS : kind === 'contract' ? CONTRACT_VARIANTS : AUTH_VARIANTS;

  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {(labels as Record<string, string>)[status] ?? status}
    </Badge>
  );
}
