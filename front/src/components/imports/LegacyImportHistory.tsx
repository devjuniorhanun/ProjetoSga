import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  legacyImportsService,
  legacyImportStatusLabel,
  LegacyImportHistoryFilters,
} from '@/lib/api-services-imports';
import { LegacyImportDetails } from './LegacyImportDetails';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Concluída' },
  { value: 'processing', label: 'Processando' },
  { value: 'failed', label: 'Falhou' },
];

export function LegacyImportHistory() {
  const [form, setForm] = useState<LegacyImportHistoryFilters>({});
  const [filters, setFilters] = useState<LegacyImportHistoryFilters>({});
  const [detailBatch, setDetailBatch] = useState<string | number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['legacy-imports', 'history', filters],
    queryFn: () => legacyImportsService.history(filters),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="import-start">Data inicial</Label>
            <Input
              id="import-start"
              type="date"
              value={form.start_date ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="import-end">Data final</Label>
            <Input
              id="import-end"
              type="date"
              value={form.end_date ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="import-status">Status</Label>
            <Select
              value={form.status ?? 'all'}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, status: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger id="import-status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="import-file">Arquivo</Label>
            <Input
              id="import-file"
              value={form.file_name ?? ''}
              placeholder="dados.zip"
              onChange={(e) => setForm((prev) => ({ ...prev, file_name: e.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={() => setFilters(form)}>Filtrar</Button>
            <Button type="button" variant="outline" onClick={() => { setForm({}); setFilters({}); }}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível consultar o histórico de importações.
        </p>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhuma importação encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((item, index) => {
                    const identifier = item.batch ?? item.id ?? index;
                    const userName =
                      typeof item.user === 'string' ? item.user : item.user?.name ?? item.user_name;
                    return (
                      <TableRow key={String(identifier)}>
                        <TableCell>
                          {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell className="font-medium">{item.file_name ?? '—'}</TableCell>
                        <TableCell>
                          {item.status ? (
                            <Badge
                              variant={
                                String(item.status).toUpperCase() === 'FAILED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {legacyImportStatusLabel(item.status)}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof (item.records ?? item.summary?.records) === 'number'
                            ? (item.records ?? item.summary?.records)!.toLocaleString('pt-BR')
                            : '—'}
                        </TableCell>
                        <TableCell>{userName ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailBatch(item.batch ?? item.id ?? null)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <LegacyImportDetails batch={detailBatch} onOpenChange={() => setDetailBatch(null)} />
    </div>
  );
}
