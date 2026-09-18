import { Card, CardContent } from '@/components/ui/card';
import type { LegacyImportSummary as Summary } from '@/lib/api-services-imports';

interface LegacyImportSummaryProps {
  summary?: Summary;
}

const formatNumber = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString('pt-BR') : '—';

export function LegacyImportSummary({ summary }: LegacyImportSummaryProps) {
  if (!summary) return null;

  const cards = ([
    { label: 'Arquivos encontrados', value: summary.files },
    { label: 'Registros identificados', value: summary.records },
    { label: 'Entidades', value: summary.entities },
    { label: 'Avisos', value: summary.warnings, tone: 'warning' },
    { label: 'Erros', value: summary.errors, tone: 'destructive' },
    { label: 'Registros processados', value: summary.processed },
    { label: 'Registros importados', value: summary.imported },
    { label: 'Registros ignorados', value: summary.skipped },
  ] as { label: string; value?: number; tone?: 'warning' | 'destructive' }[]).filter(
    (card) => typeof card.value === 'number'
  );

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                card.tone === 'destructive' && (card.value ?? 0) > 0
                  ? 'text-destructive'
                  : card.tone === 'warning' && (card.value ?? 0) > 0
                  ? 'text-amber-600'
                  : ''
              }`}
            >
              {formatNumber(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
