import { Card, CardContent } from '@/components/ui/card';

export interface ReportSummaryCard {
  label: string;
  value: string;
  hint?: string;
}

interface Props {
  cards: ReportSummaryCard[];
  className?: string;
}

/** Cards de totais. Os valores sempre vêm prontos do backend. */
export function ReportSummaryCards({ cards, className }: Props) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className ?? ''}`}
    >
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-lg font-semibold">{card.value}</p>
            {card.hint && <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
