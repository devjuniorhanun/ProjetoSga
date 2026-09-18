import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LegacyImportSummary } from './LegacyImportSummary';
import { LegacyImportFilesTable } from './LegacyImportFilesTable';
import { LegacyImportRelationships } from './LegacyImportRelationships';
import { LegacyImportWarnings } from './LegacyImportWarnings';
import { legacyImportsService, legacyImportStatusLabel } from '@/lib/api-services-imports';

interface LegacyImportDetailsProps {
  batch: string | number | null;
  onOpenChange: (open: boolean) => void;
}

const RUNNING = ['processando', 'processing', 'pending', 'pendente', 'running', 'em andamento'];

export function LegacyImportDetails({ batch, onOpenChange }: LegacyImportDetailsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['legacy-imports', 'detail', batch],
    queryFn: () => legacyImportsService.getById(batch!),
    enabled: batch !== null && batch !== undefined,
    refetchInterval: (query) => {
      const status = String(query.state.data?.status ?? '').toLowerCase();
      return status && RUNNING.includes(status) ? 5000 : false;
    },
  });

  return (
    <Dialog open={batch !== null && batch !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Importação</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível consultar os detalhes da importação.
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Importação</p>
                <p className="font-medium">{data.batch ?? data.id ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arquivo</p>
                <p className="font-medium">{data.file_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {data.created_at ? new Date(data.created_at).toLocaleString('pt-BR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p>
                  {data.status ? (
                    <Badge variant={String(data.status).toUpperCase() === 'FAILED' ? 'destructive' : 'secondary'}>
                      {legacyImportStatusLabel(data.status)}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
            </div>

            <LegacyImportSummary summary={data.summary} />
            <LegacyImportFilesTable files={data.files} />
            <LegacyImportRelationships relationships={data.relationships} />
            <LegacyImportWarnings warnings={data.warnings} errors={data.errors} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
