import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PaidAccountReportFilters } from '@/components/reports/PaidAccountReportFilters';
import { PaidAccountAnalyticalResult } from '@/components/reports/PaidAccountAnalyticalResult';
import { ReportStateMessage } from '@/components/reports/ReportStateMessage';
import { paidAccountReportsService } from '@/lib/api-services-reports-financial';
import {
  firstDayOfCurrentMonth,
  lastDayOfCurrentMonth,
  validateReportPeriod,
} from '@/lib/report-rules';
import type { PaidAccountReportFilterValues } from '@/types/financial-reports';

const defaultFilters = (): PaidAccountReportFilterValues => ({
  date_from: firstDayOfCurrentMonth(),
  date_to: lastDayOfCurrentMonth(),
  section: 'ALL',
  group_by: 'SUPPLIER',
  order_by: 'NAME_ASC',
});

export default function PaidAccountsAnalyticalPage() {
  const [filters, setFilters] = useState<PaidAccountReportFilterValues>(defaultFilters);
  const [applied, setApplied] = useState<PaidAccountReportFilterValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const periodCheck = useMemo(
    () => validateReportPeriod(filters.date_from, filters.date_to),
    [filters.date_from, filters.date_to],
  );

  const query = useQuery({
    queryKey: ['paid-account-report', 'analytical', applied],
    queryFn: () => paidAccountReportsService.analytical(applied as PaidAccountReportFilterValues),
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
    await paidAccountReportsService.analyticalPdf(filters);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contas Pagas — Analítico</h1>
        <p className="mt-1 text-muted-foreground">
          Pagamentos por seção e fornecedor no período. Os totais são calculados pelo sistema.
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
          {query.data && !query.isLoading && !query.error && (
            <PaidAccountAnalyticalResult report={query.data} />
          )}
        </>
      )}
    </div>
  );
}
