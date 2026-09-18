import { Badge } from '@/components/ui/badge';
import { SERVICE_STATUS_LABELS } from '@/lib/agricultural-rules';
import type { AgriculturalServiceStatus } from '@/types/agricultural';

const VARIANTS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  PLANNED: 'bg-secondary text-secondary-foreground border-border',
  IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
  COMPLETED: 'bg-primary/20 text-primary border-primary/30',
};

export function ServiceStatusBadge({ status }: { status: AgriculturalServiceStatus | string }) {
  const key = String(status).toUpperCase();
  return (
    <Badge variant="outline" className={VARIANTS[key] ?? ''}>
      {SERVICE_STATUS_LABELS[key as AgriculturalServiceStatus] ?? key}
    </Badge>
  );
}
