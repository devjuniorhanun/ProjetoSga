import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaidAccountReportFilters } from '@/components/reports/PaidAccountReportFilters';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { ReportStateMessage } from '@/components/reports/ReportStateMessage';
import { paidAccountReportsService } from '@/lib/api-services-reports-financial';
import {
  firstDayOfCurrentMonth,
  formatPercentageShare,
  lastDayOfCurrentMonth,
  validateReportPeriod,
} from '@/lib/report-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import type {
  PaidAccountDimensionRow,
  PaidAccountReportFilterValues,
} from '@/types/financial-reports';

const defaultFilters = (): PaidAccountReportFilterValues => ({
  date_from: firstDayOfCurrentMonth(),
  date_to: lastDayOfCurrentMonth(),
  section: 'ALL',
  group_by: 'COST_CENTER',
  order_by: 'VALUE_DESC',
});

function DimensionTable({ rows, label }: { rows: PaidAccountDimensionRow[]; label: string }) {
  if (!rows?.length) {
    return <p className="py-8 text-center text-muted-foreground">Nenhum registro nesta dimensão.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{label}</TableHead>
            <TableHead className="text-right">Pagamentos</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Participação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.id}-${row.code ?? ''}`}>
              <TableCell>{row.name}</TableCell>
              <TableCell className="text-right">{row.payments_count}</TableCell>
              <TableCell className="text-right">{formatCurrencyBRL(row.total)}</TableCell>
              <TableCell className="text-right">{formatPercentageShare(row.percentage)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PaidAccountsByCostCenterPage() {
  const [filters, setFilters] = useState<PaidAccountReportFilterValues>(defaultFilters);
  const [applied, setApplied] = useState<PaidAccountReportFilterValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const periodCheck = useMemo(
    () => validateReportPeriod(filters.date_from, filters.date_to),
    [filters.date_from, filters.date_to],
  );

  const query = useQuery({
    queryKey: ['paid-account-report', 'cost-center', applied],
    queryFn: () => paidAccountReportsService.byCostCenter(applied as PaidAccountReportFilterValues),
    enabled: !!applied,
  });

  const handleSubmit = () => {
    if (!periodCheck.valid) {
      setErrors({ [periodCheck.field as string]: periodCheck.message as string });
      return;
    }
    setErrors({});
    setApplied({ ...filters });
  };

  const handleDownloadPdf = async () => {
    if (!periodCheck.valid) {
      setErrors({ [periodCheck.field as string]: periodCheck.message as string });
      toast.error(periodCheck.message as string);
      return;
    }
    await paidAccountReportsService.byCostCenterPdf(filters);
  };

  const report = query.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contas Pagas — Centro de Custo</h1>
        <p className="mt-1 text-muted-foreground">
          Distribuição dos pagamentos por centro de custo, tipo, unidade e tipo de lançamento.
        </p>
      </div>

      <PaidAccountReportFilters
        values={filters}
        onChange={setFilters}
        onSubmit={handleSubmit}
        onClear={() => {
          setFilters(defaultFilters());
          setApplied(null);
          setErrors({});
        }}
        onDownloadPdf={handleDownloadPdf}
        errors={errors}
        submitDisabled={query.isFetching}
      />

      {!applied ? (
        <p className="py-10 text-center text-muted-foreground">
          Informe o período e clique em Consultar.
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
              <ReportSummaryCards
                cards={[
                  { label: 'Pagamentos', value: String(report.summary?.payments_count ?? 0) },
                  { label: 'Centros de custo', value: String(report.summary?.cost_centers_count ?? 0) },
                  { label: 'Fornecedores', value: String(report.summary?.suppliers_count ?? 0) },
                  { label: 'Contas pagas', value: formatCurrencyBRL(report.summary?.accounts_total ?? 0) },
                  { label: 'Folha de pagamento', value: formatCurrencyBRL(report.summary?.payroll_total ?? 0) },
                  { label: 'Total geral', value: formatCurrencyBRL(report.summary?.grand_total ?? 0) },
                ]}
              />

              {report.reconciliation && report.reconciliation.reconciled === false && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Conferência inconsistente</AlertTitle>
                  <AlertDescription>
                    {report.reconciliation.message ??
                      'Os totais por dimensão não fecham com o total geral informado pelo sistema.'}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="cost-center">
                <TabsList className="w-full flex-wrap">
                  <TabsTrigger value="cost-center" className="flex-1">Centro de custo</TabsTrigger>
                  <TabsTrigger value="payment-type" className="flex-1">Tipo de pagamento</TabsTrigger>
                  <TabsTrigger value="status" className="flex-1">Unidade</TabsTrigger>
                  <TabsTrigger value="entry-type" className="flex-1">Tipo de lançamento</TabsTrigger>
                </TabsList>
                <TabsContent value="cost-center" className="pt-3">
                  <DimensionTable rows={report.by_cost_center ?? []} label="Centro de custo" />
                </TabsContent>
                <TabsContent value="payment-type" className="pt-3">
                  <DimensionTable rows={report.by_payment_type ?? []} label="Tipo de pagamento" />
                </TabsContent>
                <TabsContent value="status" className="pt-3">
                  <DimensionTable rows={report.by_status ?? []} label="Unidade" />
                </TabsContent>
                <TabsContent value="entry-type" className="pt-3">
                  <DimensionTable rows={report.by_entry_type ?? []} label="Tipo de lançamento" />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}
