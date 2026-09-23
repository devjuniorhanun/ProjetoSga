import { useQuery } from '@tanstack/react-query';
import { suppliersService, typeSuppliersService, producersService, farmsService, fieldsService, culturesService, varietiesService, cropsService } from '@/lib/api-services';
import { costCentersService } from '@/lib/api-services-financial';
import { getAdministrativeCentersByProducer } from '@/lib/api-services-financial';
import { productsService } from '@/lib/api-services-products';
import { stockLocationsService, freightRatesService } from '@/lib/api-services-inventory';
import { typePayAccountsService } from '@/lib/api-services-financial-entries';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { FiscalEntryType } from '@/types/fiscal';

const active = <T extends { status?: string }>(rows: T[]) => rows.filter((r) => !r.status || r.status === 'A');

const normalizeCatalogName = (value?: string | null) =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

const supplierTypeByEntry: Partial<Record<FiscalEntryType, string>> = {
  DEFENSIVE: 'INSUMOS',
  FUEL: 'COMBUSTIVEIS',
  LUBRICANT: 'LUBRIFICANTES',
  SEED: 'SEMENTES',
  INPUT: 'INSUMOS',
};

const productGroupByEntry: Partial<Record<FiscalEntryType, string>> = {
  DEFENSIVE: 'QUIMICOS',
  FUEL: 'COMBUSTIVEIS',
  LUBRICANT: 'LUBRIFICANTES',
  SEED: 'SEMENTES',
  INPUT: 'INSUMOS',
};

/** Listas de apoio compartilhadas pelas telas fiscais, de estoque e de frete. */
export function useFiscalOptions(entryType?: FiscalEntryType) {
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });
  const supplierTypes = useQuery({ queryKey: ['type-suppliers'], queryFn: typeSuppliersService.getAll });
  const producers = useQuery({ queryKey: ['producers'], queryFn: producersService.getAll });
  const costCenters = useQuery({ queryKey: ['cost-centers'], queryFn: costCentersService.getAll });
  const farms = useQuery({ queryKey: ['farms'], queryFn: farmsService.getAll });
  const fields = useQuery({ queryKey: ['fields'], queryFn: fieldsService.getAll });
  const products = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });
  const cultures = useQuery({ queryKey: ['cultures'], queryFn: culturesService.getAll });
  const varieties = useQuery({ queryKey: ['varieties'], queryFn: varietiesService.getAll });
  const crops = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const stockLocations = useQuery({
    queryKey: ['stock-locations', 'options'],
    queryFn: () => stockLocationsService.getAll({ per_page: 200, status: 'A' }),
  });
  const freightRates = useQuery({
    queryKey: ['freight-rates', 'options'],
    queryFn: () => freightRatesService.getAll({ per_page: 200, status: 'A' }),
  });
  const typePayAccounts = useQuery({ queryKey: ['type-pay-accounts'], queryFn: typePayAccountsService.getAll });

  const requiredSupplierType = entryType ? supplierTypeByEntry[entryType] : undefined;
  const allowedSupplierTypeIds = new Set(
    active(supplierTypes.data ?? [])
      .filter((type) => !requiredSupplierType || normalizeCatalogName(type.name) === requiredSupplierType)
      .map((type) => String(type.id)),
  );
  const filteredSuppliers = active(suppliers.data ?? []).filter(
    (supplier) =>
      !requiredSupplierType ||
      (supplier.type_supplier_ids ?? supplier.typeSuppliers ?? []).some((id) => allowedSupplierTypeIds.has(String(id))),
  );
  const requiredProductGroup = entryType ? productGroupByEntry[entryType] : undefined;
  const filteredProducts = active(products.data ?? []).filter(
    (product) => !requiredProductGroup || normalizeCatalogName(product.group_product_name) === requiredProductGroup,
  );

  const supplierOptions: ComboboxOption[] = filteredSuppliers.map((s) => ({
    value: String(s.id),
    label: s.corporate_reason || s.fantasy_name || String(s.id),
  }));
  const producerOptions: ComboboxOption[] = active(producers.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.owner_name || String(p.id),
  }));
  const costCenterOptions: ComboboxOption[] = active(costCenters.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name || String(c.id),
  }));
  const farmOptions: ComboboxOption[] = active(farms.data ?? []).map((f) => ({
    value: String(f.id),
    label: f.name || String(f.id),
  }));
  const fieldOptions: ComboboxOption[] = active(fields.data ?? []).map((f) => ({
    value: String(f.id),
    label: f.name || String(f.id),
  }));
  const productOptions: ComboboxOption[] = filteredProducts.map((p) => ({
    value: String(p.id),
    label: p.name || String(p.id),
  }));
  const cultureOptions: ComboboxOption[] = active(cultures.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name || String(c.id),
  }));
  const cropOptions: ComboboxOption[] = active(crops.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name || String(c.id),
  }));
  const stockLocationOptions: ComboboxOption[] = (stockLocations.data ?? []).map((l) => ({
    value: String(l.id),
    label: l.name || String(l.id),
  }));
  const varietyOptions: ComboboxOption[] = active(varieties.data ?? []).map((v) => ({
    value: String(v.id),
    label: v.name || String(v.id),
  }));
  const typePayAccountOptions: ComboboxOption[] = active(typePayAccounts.data ?? []).map((t) => ({
    value: String(t.id),
    label: t.name || String(t.id),
  }));

  const varietiesByCulture = (cultureId?: string | null): ComboboxOption[] =>
    active(varieties.data ?? [])
      .filter((v) => !cultureId || String(v.culture_id) === String(cultureId))
      .map((v) => ({ value: String(v.id), label: v.name || String(v.id) }));

  return {
    supplierOptions,
    producerOptions,
    costCenterOptions,
    farmOptions,
    fieldOptions,
    productOptions,
    cultureOptions,
    cropOptions,
    stockLocationOptions,
    varietyOptions,
    typePayAccountOptions,
    varietiesByCulture,
    products: filteredProducts,
    stockLocations: stockLocations.data ?? [],
    varieties: varieties.data ?? [],
    freightRates: freightRates.data ?? [],
    isLoading:
      suppliers.isLoading || supplierTypes.isLoading || producers.isLoading || products.isLoading || stockLocations.isLoading,
  };
}

/** Centros administrativos do produtor selecionado (cascata obrigatória). */
export function useAdministrativeCentersByProducer(producerId?: string | null) {
  return useQuery({
    queryKey: ['administrative-centers', 'producer', producerId],
    queryFn: () => getAdministrativeCentersByProducer(String(producerId)),
    enabled: !!producerId,
  });
}
