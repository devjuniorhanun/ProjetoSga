import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { harvestReportsService } from '@/lib/api-services-reports-harvest';
import { keepOptionIfPresent } from '@/lib/report-rules';
import type { HarvestReportFilterValues } from '@/types/harvest-reports';

const emptyFilters = (): HarvestReportFilterValues => ({ order_by: 'NAME_ASC' });

/**
 * Opções compartilhadas dos relatórios de colheita.
 * A safra ativa (default_crop_id) é selecionada automaticamente e, ao trocar
 * a safra, os filtros dependentes que não existirem nas novas opções são limpos.
 */
export function useHarvestReportOptions() {
  const [cropId, setCropId] = useState('');
  const [filters, setFilters] = useState<HarvestReportFilterValues>(emptyFilters);

  const optionsQuery = useQuery({
    queryKey: ['harvest-report-options', cropId || null],
    queryFn: () => harvestReportsService.options(cropId || undefined),
  });

  const options = optionsQuery.data;

  useEffect(() => {
    if (!cropId && options?.default_crop_id) {
      setCropId(String(options.default_crop_id));
    }
  }, [cropId, options?.default_crop_id]);

  // Descarta filtros que não existem nas opções da safra selecionada.
  useEffect(() => {
    if (!options) return;
    setFilters((prev) => ({
      ...prev,
      producer_id: keepOptionIfPresent(prev.producer_id, options.producers ?? []),
      owner_id: keepOptionIfPresent(prev.owner_id, options.owners ?? []),
      warehouse_id: keepOptionIfPresent(prev.warehouse_id, options.warehouses ?? []),
      culture_id: keepOptionIfPresent(prev.culture_id, options.cultures ?? []),
      farm_id: keepOptionIfPresent(prev.farm_id, options.farms ?? []),
      plot_field_id: keepOptionIfPresent(prev.plot_field_id, options.plot_fields ?? []),
      variety_culture_id: keepOptionIfPresent(prev.variety_culture_id, options.varieties ?? []),
      driver_id: keepOptionIfPresent(prev.driver_id, options.drivers ?? []),
      lanyard_id: keepOptionIfPresent(prev.lanyard_id, options.harvesters ?? []),
    }));
  }, [options]);

  const changeCrop = (value: string) => {
    setCropId(value);
    setFilters(emptyFilters());
  };

  const clearFilters = () => setFilters(emptyFilters());

  return {
    cropId,
    changeCrop,
    filters,
    setFilters,
    clearFilters,
    options,
    optionsLoading: optionsQuery.isFetching,
    optionsError: optionsQuery.error,
    refetchOptions: optionsQuery.refetch,
  };
}
