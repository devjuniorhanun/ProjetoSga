import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { PaidAccountReportFilters } from '@/components/reports/PaidAccountReportFilters';
import { PaidAccountAnalyticalResult } from '@/components/reports/PaidAccountAnalyticalResult';
import { ReportStateMessage } from '@/components/reports/ReportStateMessage';
import { paidAccountReportsService } from '@/lib/api-services-reports-financial';
import {
  firstDayOfCurrentMonth,
  lastDayOfCurrentMonth,
  validateCropSelection,
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

export default function PaidAccountsByCropPage() {
  const [filters, setFilters] = useState<PaidAccountReportFilterValues>(defaultFilters);
  const [applied, setApplied] = useState<PaidAccountReportFilterValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yearTouched, setYearTouched] = useState(false);

  const agriculturalYearId = filters.agricultural_year_id ?? '';

  const optionsQuery = useQuery({
    queryKey: ['paid-account-crop-options', agriculturalYearId || null],
    queryFn: () => paidAccountReportsService.cropOptions(agriculturalYearId || undefined),
  });

  const options = optionsQuery.data;

  // Seleção inicial vinda do backend; ao trocar o ano, aplica selected_crop_id quando existir.
  useEffect(() => {
    if (!options) return;
    setFilters((prev) => {
      const next = { ...prev };
      if (!prev.agricultural_year_id && options.selected_agricultural_year_id) {
        next.agricultural_year_id = String(options.selected_agricultural_year_id);
      }
      if (!prev.crop_id && options.selected_crop_id) {
        next.crop_id = String(options.selected_crop_id);
      }
      return next;
    });
  }, [options]);

  const periodCheck = useMemo(
    () => validateReportPeriod(filters.date_from, filters.date_to),
    [filters.date_from, filters.date_to],
  );

  const cropCheck = useMemo(
    () => validateCropSelection(filters.agricultural_year_id, filters.crop_id, options?.crops ?? []),
    [filters.agricultural_year_id, filters.crop_id, options?.crops],
  );

  const query = useQuery({
    queryKey: ['paid-account-report', 'crop', applied],
    queryFn: () => paidAccountReportsService.byCrop(applied as PaidAccountReportFilterValues),
    enabled: !!applied,
  });

  const validateAll = (): boolean => {
    if (!cropCheck.valid) {
      setErrors({ [cropCheck.field as string]: cropCheck.message as string });
      toast.error(cropCheck.message as string);
      return false;
    }
    if (!periodCheck.valid) {
      setErrors({ [periodCheck.field as string]: periodCheck.message as string });
      return false;
    }
    setErrors({});
    return true;
  };

  const yearOptions = (options?.agricultural_years ?? []).map((y) => ({
    value: String(y.id),
    label: y.name,
  }));
  const cropOptions = (options?.crops ?? []).map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contas Pagas — Safra</h1>
        <p className="mt-1 text-muted-foreground">
          Pagamentos vinculados a um ano agrícola e safra. Contas sem safra não aparecem aqui.
        </p>
      </div>

      <PaidAccountReportFilters
        values={filters}
        onChange={setFilters}
        onSubmit={() => {
          if (!validateAll()) return;
          setApplied({ ...filters });
        }}
        onClear={() => {
          setFilters({
            ...defaultFilters(),
            agricultural_year_id: options?.selected_agricultural_year_id
              ? String(options.selected_agricultural_year_id)
              : undefined,
            crop_id: options?.selected_crop_id ? String(options.selected_crop_id) : undefined,
          });
          setApplied(null);
          setErrors({});
          setYearTouched(false);
        }}
        onDownloadPdf={async () => {
          if (!validateAll()) return;
          await paidAccountReportsService.byCropPdf(filters);
        }}
        errors={errors}
        submitDisabled={query.isFetching || !filters.crop_id}
        pdfDisabled={!filters.crop_id}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ano agrícola</Label>
            <Combobox
              options={yearOptions}
              value={agriculturalYearId}
              onValueChange={(v) => {
                setYearTouched(true);
                setApplied(null);
                setFilters((prev) => ({ ...prev, agricultural_year_id: v, crop_id: '' }));
              }}
              placeholder="Selecione o ano agrícola"
              searchPlaceholder="Buscar ano agrícola..."
            />
            {errors.agricultural_year_id && (
              <p className="text-sm text-destructive">{errors.agricultural_year_id}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Safra</Label>
            <Combobox
              options={cropOptions}
              value={filters.crop_id ?? ''}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, crop_id: v }))}
              placeholder={agriculturalYearId ? 'Selecione a safra' : 'Selecione o ano agrícola primeiro'}
              searchPlaceholder="Buscar safra..."
              emptyText={optionsQuery.isFetching ? 'Carregando safras...' : 'Nenhuma safra para este ano'}
              disabled={!agriculturalYearId || (yearTouched && optionsQuery.isFetching)}
            />
            {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id}</p>}
          </div>
        </div>
      </PaidAccountReportFilters>

      {!applied ? (
        <p className="py-10 text-center text-muted-foreground">
          Selecione o ano agrícola, a safra e clique em Consultar.
        </p>
      ) : (
        <>
          <ReportStateMessage
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => query.refetch()}
          />
          {query.data && !query.isLoading && !query.error && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {query.data.agricultural_year?.name} — {query.data.crop?.name}
              </p>
              <PaidAccountAnalyticalResult report={query.data} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
