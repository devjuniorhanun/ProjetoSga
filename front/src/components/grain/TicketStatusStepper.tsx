import { Check } from 'lucide-react';
import type { GrainOperationType, GrainTicketStatus } from '@/types/grain';

interface Props {
  status: GrainTicketStatus;
  operationType: GrainOperationType;
}

const stepsFor = (operationType: GrainOperationType): Array<{ key: string; label: string }> =>
  operationType === 'ENTRY'
    ? [
        { key: 'WAITING_FIRST_WEIGHT', label: '1ª pesagem' },
        { key: 'WAITING_DISCOUNTS', label: 'Descontos' },
        { key: 'WAITING_SECOND_WEIGHT', label: '2ª pesagem' },
        { key: 'SECOND_WEIGHED', label: 'Conferência' },
        { key: 'CLOSED', label: 'Fechado' },
      ]
    : [
        { key: 'WAITING_FIRST_WEIGHT', label: '1ª pesagem' },
        { key: 'WAITING_SECOND_WEIGHT', label: '2ª pesagem' },
        { key: 'SECOND_WEIGHED', label: 'Conferência' },
        { key: 'CLOSED', label: 'Fechado' },
      ];

export function TicketStatusStepper({ status, operationType }: Props) {
  const steps = stepsFor(operationType);
  const currentIndex = steps.findIndex((s) => s.key === status);
  const canceled = status === 'CANCELED';

  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Etapas do ticket">
      {steps.map((step, index) => {
        const done = !canceled && currentIndex > index;
        const active = !canceled && currentIndex === index;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : active
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`text-sm ${active ? 'font-medium' : 'text-muted-foreground'}`}>{step.label}</span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        );
      })}
      {canceled && <li className="text-sm font-medium text-destructive">Cancelado</li>}
    </ol>
  );
}
