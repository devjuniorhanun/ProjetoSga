import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HarvestReportFilters } from '@/components/reports/HarvestReportFilters';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { ReportStateMessage } from '@/components/reports/ReportStateMessage';
import { harvestReportsService } from '@/lib/api-services-reports-harvest';
import { useHarvestReportOptions } from '@/hooks/use-harvest-report-options';
import { formatNullableNumber } from '@/lib/report-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateBR, formatWeight } from '@/lib/grain-format';
import type { HarvestReportFilterValues } from '@/types/harvest-reports';

export default function HarvestConsolidatedPage() {
  const { cropId, changeCrop, filters, setFilters, clearFilters, options, optionsLoading } =
    useHarvestReportOptions();
  const [applied, setApplied] = useState<{ cropId: string; filters: HarvestReportFilterValues } | null>(
    null,
  );

  const query = useQuery({
    queryKey: ['harvest-consolidated-report', applied?.cropId, applied?.filters],
    queryFn: () =>
      harvestReportsService.consolidated(
        applied?.cropId as string,
        applied?.filters as HarvestReportFilterValues,
      ),
    enabled: !!applied?.cropId,
  });

  const report = query.data;
  const summary = report?.summary;
  const consolidation = report?.consolidation ?? report?.rows ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consolidado de Colheita</h1>
        <p className="mt-1 text-muted-foreground">
          Entradas de colheita menos transferências de grãos, por produtor, armazém e cultura.
        </p>
      </div>

      <HarvestReportFilters
        cropId={cropId}
        onCropChange={(value) => {
          changeCrop(value);
          setApplied(null);
        }}
        values={filters}
        onChange={setFilters}
        onSubmit={() => setApplied({ cropId, filters: { ...filters } })}
        onClear={() => {
          clearFilters();
          setApplied(null);
        }}
        onDownloadPdf={() => harvestReportsService.consolidatedPdf(cropId, filters)}
        options={options}
        optionsLoading={optionsLoading}
        submitDisabled={query.isFetching}
        showOrderBy={false}
      />

      {!applied ? (
        <p className="py-10 text-center text-muted-foreground">
          Escolha a safra, ajuste os filtros e clique em Consultar.
        </p>
      ) : (
        <>
          <ReportStateMessage
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => query.refetch()}
          />
          {report && !query.isLoading && !query.error && (
            <div className="space-y-4">
              {(report.warnings ?? []).map((warning) => (
                <Alert key={warning}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}

              {summary?.reconciled === false && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Saldo inconsistente</AlertTitle>
                  <AlertDescription>
                    O saldo consolidado não fecha com as entradas e transferências registradas.
                  </AlertDescription>
                </Alert>
              )}

              <ReportSummaryCards
                cards={[
                  { label: 'Entrada líquida', value: `${formatWeight(summary?.input_net_weight_kg)} kg` },
                  { label: 'Transferências', value: `${formatWeight(summary?.transferred_weight_kg)} kg` },
                  { label: 'Saldo consolidado', value: `${formatWeight(summary?.balance_weight_kg)} kg` },
                  { label: 'Sacas disponíveis', value: formatNullableNumber(summary?.balance_bags) },
                  { label: 'Valor do frete', value: formatCurrencyBRL(summary?.shipping_value ?? 0) },
                  { label: 'Entradas', value: String(summary?.entries_count ?? 0) },
                  { label: 'Transferências (qtd.)', value: String(summary?.transfers_count ?? 0) },
                ]}
              />

              <Tabs defaultValue="consolidation">
                <TabsList className="w-full flex-wrap">
                  <TabsTrigger value="consolidation" className="flex-1">Consolidação</TabsTrigger>
                  <TabsTrigger value="entries" className="flex-1">Entradas</TabsTrigger>
                  <TabsTrigger value="transfers" className="flex-1">Transferências</TabsTrigger>
                </TabsList>

                <TabsContent value="consolidation" className="pt-3">
                  <div className="overflow-x-auto rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produtor</TableHead>
                          <TableHead>Armazém</TableHead>
                          <TableHead>Cultura</TableHead>
                          <TableHead className="text-right">Entrada (kg)</TableHead>
                          <TableHead className="text-right">Entrada (sc)</TableHead>
                          <TableHead className="text-right">Transferido (kg)</TableHead>
                          <TableHead className="text-right">Transferido (sc)</TableHead>
                          <TableHead className="text-right">Saldo (kg)</TableHead>
                          <TableHead className="text-right">Saldo (sc)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consolidation.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                              Nenhum resultado para os filtros informados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          consolidation.map((row, index) => (
                            <TableRow key={`${row.producer_id}-${row.warehouse_id}-${row.culture_id}-${index}`}>
                              <TableCell>{row.producer_name ?? '-'}</TableCell>
                              <TableCell>{row.warehouse_name ?? '-'}</TableCell>
                              <TableCell>{row.culture_name ?? '-'}</TableCell>
                              <TableCell className="text-right">{formatWeight(row.input_weight_kg)}</TableCell>
                              <TableCell className="text-right">{formatNullableNumber(row.input_bags)}</TableCell>
                              <TableCell className="text-right">{formatWeight(row.transferred_weight_kg)}</TableCell>
                              <TableCell className="text-right">{formatNullableNumber(row.transferred_bags)}</TableCell>
                              <TableCell className="text-right">{formatWeight(row.balance_weight_kg)}</TableCell>
                              <TableCell className="text-right">{formatNullableNumber(row.balance_bags)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="entries" className="pt-3">
                  <div className="overflow-x-auto rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Romaneio</TableHead>
                          <TableHead>Controle</TableHead>
                          <TableHead>Produtor</TableHead>
                          <TableHead>Proprietário</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Colhedor</TableHead>
                          <TableHead>Talhão</TableHead>
                          <TableHead>Armazém</TableHead>
                          <TableHead>Cultura</TableHead>
                          <TableHead className="text-right">Peso bruto</TableHead>
                          <TableHead className="text-right">Desconto</TableHead>
                          <TableHead className="text-right">Peso líquido</TableHead>
                          <TableHead className="text-right">Sacas brutas</TableHead>
                          <TableHead className="text-right">Sacas líquidas</TableHead>
                          <TableHead className="text-right">Frete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(report.entries ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={16} className="py-8 text-center text-muted-foreground">
                              Nenhuma entrada no período.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (report.entries ?? []).map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{formatDateBR(entry.release_date)}</TableCell>
                              <TableCell>{entry.shipping_number ?? '-'}</TableCell>
                              <TableCell>{entry.control_number ?? '-'}</TableCell>
                              <TableCell>{entry.producer_name ?? '-'}</TableCell>
                              <TableCell>{entry.owner_name ?? '-'}</TableCell>
                              <TableCell>{entry.driver_name ?? '-'}</TableCell>
                              <TableCell>{entry.lanyard_name ?? '-'}</TableCell>
                              <TableCell>{entry.plot_field_name ?? '-'}</TableCell>
                              <TableCell>{entry.warehouse_name ?? '-'}</TableCell>
                              <TableCell>{entry.culture_name ?? '-'}</TableCell>
                              <TableCell className="text-right">{formatWeight(entry.gross_weight)}</TableCell>
                              <TableCell className="text-right">{formatWeight(entry.discount_weight)}</TableCell>
                              <TableCell className="text-right">{formatWeight(entry.net_weight)}</TableCell>
                              <TableCell className="text-right">{formatNullableNumber(entry.gross_bags)}</TableCell>
                              <TableCell className="text-right">{formatNullableNumber(entry.liquid_bags, 3)}</TableCell>
                              <TableCell className="text-right">{formatCurrencyBRL(entry.shipping_value ?? 0)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="transfers" className="pt-3">
                  <div className="overflow-x-auto rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produtor</TableHead>
                          <TableHead>Proprietário destino</TableHead>
                          <TableHead>Armazém</TableHead>
                          <TableHead>Cultura</TableHead>
                          <TableHead className="text-right">Quantidade (kg)</TableHead>
                          <TableHead className="text-right">Quantidade (sc)</TableHead>
                          <TableHead>Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(report.transfers ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                              Nenhuma transferência no período.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (report.transfers ?? []).map((transfer) => (
                            <TableRow key={transfer.id}>
                              <TableCell>{formatDateBR(transfer.transfer_date)}</TableCell>
                              <TableCell>{transfer.producer_name ?? '-'}</TableCell>
                              <TableCell>{transfer.owner_name ?? '-'}</TableCell>
                              <TableCell>{transfer.warehouse_name ?? '-'}</TableCell>
                              <TableCell>{transfer.culture_name ?? '-'}</TableCell>
                              <TableCell className="text-right">{formatWeight(transfer.quantity_kg)}</TableCell>
                              <TableCell className="text-right">{formatNullableNumber(transfer.quantity_bags)}</TableCell>
                              <TableCell>{transfer.observation ?? '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}
