import { useQuery } from '@tanstack/react-query';
import { cropsService, culturesService, varietiesService, farmsService, plotFieldsService } from '@/lib/api-services';
import { productsService } from '@/lib/api-services-products';
import { fleetsService, fleetGroupsService } from '@/lib/api-services-vehicles';
import { agriculturalOperatorsService } from '@/lib/api-services-agricultural';
import {
  agriculturalServiceTypesService,
  type AgriculturalServiceType,
} from '@/lib/api-services-inventory';
import { inventoryBalancesService } from '@/lib/api-services-inventory-releases';
import type { AgriculturalServiceCategory } from '@/types/agricultural';
import type { ComboboxOption } from '@/components/ui/combobox';

const active = <T extends { status?: string }>(rows: T[]) => rows.filter((r) => !r.status || r.status === 'A');

/** Listas de apoio compartilhadas pelas telas de serviços agrícolas e tratamento de sementes. */
export function useAgriculturalOptions(category?: AgriculturalServiceCategory) {
  const crops = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const cultures = useQuery({ queryKey: ['cultures'], queryFn: culturesService.getAll });
  const varieties = useQuery({ queryKey: ['varieties'], queryFn: varietiesService.getAll });
  const farms = useQuery({ queryKey: ['farms'], queryFn: farmsService.getAll });
  const plotFields = useQuery({ queryKey: ['plot-fields'], queryFn: plotFieldsService.getAll });
  const products = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });
  const fleets = useQuery({ queryKey: ['fleets'], queryFn: fleetsService.getAll });
  const fleetGroups = useQuery({ queryKey: ['fleet-groups'], queryFn: fleetGroupsService.getAll });
  const operators = useQuery({
    queryKey: ['agricultural-operators'],
    queryFn: agriculturalOperatorsService.getAll,
  });
  const serviceTypes = useQuery({
    queryKey: ['agricultural-service-types', 'options'],
    queryFn: () => agriculturalServiceTypesService.getAll({ per_page: 200, status: 'A' }),
  });

  const serviceTypesOfCategory: AgriculturalServiceType[] = (serviceTypes.data ?? []).filter(
    (t) => !category || t.category === category,
  );

  const toOption = <T extends { id: string | number }>(rows: T[], label: (row: T) => string): ComboboxOption[] =>
    rows.map((row) => ({ value: String(row.id), label: label(row) || String(row.id) }));

  const plotFieldRows = active(plotFields.data ?? []);

  /** Nome do grupo vindo do cadastro quando a API da frota não devolve fleet_group_name. */
  const groupNameById = new Map((fleetGroups.data ?? []).map((g) => [String(g.id), g.name]));
  const fleetRows = active(fleets.data ?? []).map((f) => ({
    ...f,
    fleet_group_name: f.fleet_group_name || groupNameById.get(String(f.fleet_group_id)) || '',
  }));

  return {
    cropOptions: toOption(active(crops.data ?? []), (c) => c.name),
    cultureOptions: toOption(active(cultures.data ?? []), (c) => c.name),
    farmOptions: toOption(active(farms.data ?? []), (f) => f.name),
    productOptions: toOption(active(products.data ?? []), (p) => p.name),
    fleetOptions: toOption(fleetRows, (f) => f.name || f.plate),
    fleets: fleetRows,
    operatorOptions: toOption(active(operators.data ?? []), (o) => o.supplier_name ?? String(o.id)),
    serviceTypeOptions: toOption(serviceTypesOfCategory, (t) => t.name),
    serviceTypes: serviceTypesOfCategory,
    plotFields: plotFieldRows,
    plotFieldOptions: toOption(plotFieldRows, (p) => p.name),
    varietiesByCulture: (cultureId?: string | null): ComboboxOption[] =>
      active(varieties.data ?? [])
        .filter((v) => !cultureId || String(v.culture_id) === String(cultureId))
        .map((v) => ({ value: String(v.id), label: v.name || String(v.id) })),
    plotFieldsByCrop: (cropId?: string | null) =>
      plotFieldRows.filter((p) => !cropId || String(p.crop_id) === String(cropId)),
    isLoading: crops.isLoading || plotFields.isLoading || serviceTypes.isLoading,
  };
}

/** Posições de estoque disponíveis de um produto (usadas nas baixas reais). */
export function useProductStockPositions(productId?: string | null) {
  return useQuery({
    queryKey: ['inventory-balances', 'product', productId],
    queryFn: () => inventoryBalancesService.list({ product_id: productId!, per_page: 100 }),
    enabled: !!productId,
  });
}
