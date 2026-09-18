import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle } from 'lucide-react';
import {
  legacyImportSeverityLabel,
  normalizeError,
  normalizeWarning,
  type LegacyErrorInput,
  type LegacyImportError,
  type LegacyImportWarning,
  type LegacyWarningInput,
} from '@/lib/api-services-imports';

interface LegacyImportWarningsProps {
  warnings?: LegacyWarningInput[];
  errors?: LegacyErrorInput[];
}

const VISIBLE_LIMIT = 10;

const itemKey = (
  item: { message: string; file?: string | null; record?: string | number | null },
  index: number
) => `${item.file ?? ''}-${item.record ?? ''}-${item.message}-${index}`;

const describeOrigin = (item: { file?: string | null; record?: string | number | null }) => {
  const parts: string[] = [];
  if (item.file) parts.push(`Arquivo: ${item.file}`);
  if (item.record !== undefined && item.record !== null && item.record !== '') {
    parts.push(`Registro: ${item.record}`);
  }
  return parts.join(' • ');
};

export function LegacyImportWarnings({ warnings, errors }: LegacyImportWarningsProps) {
  const [showAllWarnings, setShowAllWarnings] = useState(false);

  const safeWarnings: LegacyImportWarning[] = (warnings ?? []).map((item, index) =>
    normalizeWarning(item, index)
  );
  const safeErrors: LegacyImportError[] = (errors ?? []).map((item, index) =>
    normalizeError(item, index)
  );

  if (safeWarnings.length === 0 && safeErrors.length === 0) return null;

  const visibleWarnings = showAllWarnings ? safeWarnings : safeWarnings.slice(0, VISIBLE_LIMIT);

  return (
    <div className="space-y-4">
      {safeErrors.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <XCircle className="h-5 w-5" aria-hidden="true" />
              Erros encontrados
              <Badge variant="destructive">{safeErrors.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeErrors.map((item, index) => {
              const origin = describeOrigin(item);
              return (
                <Alert key={itemKey(item, index)} variant="destructive">
                  <AlertTitle className="text-sm">{item.message}</AlertTitle>
                  {origin && <AlertDescription className="text-xs">{origin}</AlertDescription>}
                </Alert>
              );
            })}
          </CardContent>
        </Card>
      )}

      {safeWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Avisos da Importação
              <Badge variant="secondary">{safeWarnings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleWarnings.map((item, index) => {
              const origin = describeOrigin(item);
              return (
                <div key={itemKey(item, index)} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.message}</p>
                    {item.severity && (
                      <Badge variant="outline">{legacyImportSeverityLabel(item.severity)}</Badge>
                    )}
                  </div>
                  {origin && <p className="mt-1 text-xs text-muted-foreground">{origin}</p>}
                </div>
              );
            })}

            {safeWarnings.length > VISIBLE_LIMIT && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllWarnings((prev) => !prev)}
              >
                {showAllWarnings ? 'Mostrar menos' : 'Mostrar todos'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
