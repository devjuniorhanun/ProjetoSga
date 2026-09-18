import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HarvestReportFilters } from './HarvestReportFilters';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportStateMessage } from './ReportStateMessage';
import { harvestReportsService } from '@/lib/api-services-reports-harvest';
import { useHarvestReportOptions } from '@/hooks/use-harvest-report-options';
import { formatNullableNumber } from '@/lib/report-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatWeight } from '@/lib/grain-format';
import type {
  HarvestProductivityDimension,
  HarvestReportFilterValues,
} from '@/types/harvest-reports';

interface Props {
  dimension: HarvestProductivityDimension;
  title: string;
  description: string;
  firstColumnLabel: string;
}

/** Tela comum das quatro dimensões de produtividade. */
export function HarvestProductivityReportPage({
  dimension,
  title,
  description,
  firstColumnLabel,
}: Props) {
  const {
    cropId,
    changeCrop,
    filters,
    setFilters,
    clearFilters,
    options,
    optionsLoading,
  } = useHarvestReportOptions();
  const [applied, setApplied] = useState<{ cropId: string; filters: HarvestReportFilterValues } | null>(
    null,
  );

  const query = useQuery({
    queryKey: ['harvest-productivity-report', dimension, applied?.cropId, applied?.filters],
    queryFn: () =>
      harvestReportsService.productivity(
        dimension,
        applied?.cropId as string,
        applied?.filters as HarvestReportFilterValues,
      ),
    enabled: !!applied?.cropId,
  });

  const report = query.data;
  const summary = report?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
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
        onDownloadPdf={() => harvestReportsService.productivityPdf(dimension, cropId, filters)}
        options={options}
        optionsLoading={optionsLoading}
        submitDisabled={query.isFetching}
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

              <ReportSummaryCards
                cards={[
                  { label: 'Viagens', value: String(summary?.trips_count ?? 0) },
                  { label: 'Peso bruto', value: `${formatWeight(summary?.gross_weight_kg)} kg` },
                  { label: 'Descontos', value: `${formatWeight(summary?.discount_weight_kg)} kg` },
                  { label: 'Peso líquido', value: `${formatWeight(summary?.net_weight_kg)} kg` },
                  { label: 'Sacas brutas', value: formatNullableNumber(summary?.gross_bags) },
                  { label: 'Sacas líquidas', value: formatNullableNumber(summary?.net_bags) },
                  {
                    label: 'Área colhida',
                    value: `${formatNullableNumber(summary?.harvested_area_ha)} ha`,
                    hint: report.area_method,
                  },
                  {
                    label: 'Produtividade média',
                    value: `${formatNullableNumber(summary?.average_productivity_bags_ha)} sc/ha`,
                  },
                  { label: 'Frete total', value: formatCurrencyBRL(summary?.shipping_value ?? 0) },
                  {
                    label: 'Frete médio por saca bruta',
                    value:
                      summary?.average_shipping_per_gross_bag === null ||
                      summary?.average_shipping_per_gross_bag === undefined
                        ? '—'
                        : formatCurrencyBRL(summary.average_shipping_per_gross_bag),
                  },
                ]}
              />

              {(summary?.by_culture?.length ?? 0) > 0 && (
                <div className="overflow-x-auto rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cultura</TableHead>
                        <TableHead className="text-right">Viagens</TableHead>
                        <TableHead className="text-right">Sacas líquidas</TableHead>
                        <TableHead className="text-right">Área (ha)</TableHead>
                        <TableHead className="text-right">Produtividade (sc/ha)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(summary?.by_culture ?? []).map((row, index) => (
                        <TableRow key={`${row.culture_id ?? index}`}>
                          <TableCell>{row.culture_name ?? '-'}</TableCell>
                          <TableCell className="text-right">{row.trips_count ?? 0}</TableCell>
                          <TableCell className="text-right">{formatNullableNumber(row.net_bags)}</TableCell>
                          <TableCell className="text-right">
                            {formatNullableNumber(row.harvested_area_ha)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNullableNumber(row.productivity_bags_ha)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {report.rows.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  Nenhum resultado para os filtros informados.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{firstColumnLabel}</TableHead>
                        <TableHead>Cultura</TableHead>
                        <TableHead className="text-right">Viagens</TableHead>
                        <TableHead className="text-right">Produção líquida (sc)</TableHead>
                        <TableHead className="text-right">Peso bruto (kg)</TableHead>
                        <TableHead className="text-right">Desconto (kg)</TableHead>
                        <TableHead className="text-right">Peso líquido (kg)</TableHead>
                        <TableHead className="text-right">Área (ha)</TableHead>
                        <TableHead className="text-right">Produtividade (sc/ha)</TableHead>
                        <TableHead className="text-right">Frete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.rows.map((row) => (
                        <TableRow key={`${row.id}-${row.culture_id ?? ''}`}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.culture_name ?? '-'}</TableCell>
                          <TableCell className="text-right">{row.trips_count}</TableCell>
                          <TableCell className="text-right">{formatNullableNumber(row.net_bags)}</TableCell>
                          <TableCell className="text-right">{formatWeight(row.gross_weight_kg)}</TableCell>
                          <TableCell className="text-right">{formatWeight(row.discount_weight_kg)}</TableCell>
                          <TableCell className="text-right">{formatWeight(row.net_weight_kg)}</TableCell>
                          <TableCell className="text-right">
                            {formatNullableNumber(row.harvested_area_ha)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNullableNumber(row.productivity_bags_ha)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrencyBRL(row.shipping_value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
