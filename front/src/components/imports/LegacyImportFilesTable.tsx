import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LegacyImportFile } from '@/lib/api-services-imports';

interface LegacyImportFilesTableProps {
  files?: LegacyImportFile[];
  title?: string;
  variant?: 'supported' | 'unsupported';
}

const FILE_STATUS_LABELS: Record<string, string> = {
  SUPPORTED: 'Suportado',
  UNSUPPORTED: 'Não suportado',
  IGNORED: 'Ignorado',
};

const statusLabel = (status?: string) =>
  status ? FILE_STATUS_LABELS[status.toUpperCase()] ?? status : undefined;

export function LegacyImportFilesTable({
  files,
  title = 'Arquivos encontrados',
  variant = 'supported',
}: LegacyImportFilesTableProps) {
  if (!files || files.length === 0) return null;

  return (
    <Card className={variant === 'unsupported' ? 'border-amber-500/40' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
          <Badge variant="secondary">{files.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="text-right">Registros</TableHead>
                <TableHead>Colunas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((item, index) => {
                const name = item.name ?? item.file ?? '—';
                const records = item.records ?? item.rows;
                const label = statusLabel(item.status);
                return (
                  <TableRow key={`${name}-${index}`}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>{item.entity_label ?? item.entity ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {typeof records === 'number' ? records.toLocaleString('pt-BR') : '—'}
                    </TableCell>
                    <TableCell>
                      {item.columns?.length ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-sm text-primary underline-offset-2 hover:underline"
                              >
                                Ver colunas ({item.columns.length})
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {item.columns.join(', ')}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {label ? (
                        <Badge variant={variant === 'unsupported' ? 'outline' : 'secondary'}>
                          {label}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
