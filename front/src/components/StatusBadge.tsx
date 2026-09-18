import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'A' | 'I';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant={status === 'A' ? 'default' : 'secondary'}
      className={status === 'A' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : ''}
    >
      {status === 'A' ? 'Ativo' : 'Inativo'}
    </Badge>
  );
}
