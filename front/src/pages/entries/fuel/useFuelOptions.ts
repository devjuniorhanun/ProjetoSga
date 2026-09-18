import { useQuery } from '@tanstack/react-query';
import {
  fuelStationsService,
  fuelTanksService,
  fuelRegistersService,
  fuelStationProductsService,
  fleetMaintenancePlansService,
} from '@/lib/api-services-fuel-phase6';
import { productsService } from '@/lib/api-services-products';
import { fleetsService } from '@/lib/api-services-vehicles';
import { agriculturalOperatorsService } from '@/lib/api-services-agricultural';
import { suppliersService } from '@/lib/api-services';

export interface Option { value: string; label: string }

export function useFuelOptions() {
  const { data: stations = [] } = useQuery({ queryKey: ['fuel-stations'], queryFn: fuelStationsService.getAll });
  const { data: tanks = [] } = useQuery({ queryKey: ['fuel-tanks'], queryFn: fuelTanksService.getAll });
  const { data: registers = [] } = useQuery({ queryKey: ['fuel-registers'], queryFn: fuelRegistersService.getAll });
  const { data: stationProducts = [] } = useQuery({ queryKey: ['fuel-station-products'], queryFn: fuelStationProductsService.getAll });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });
  const { data: fleets = [] } = useQuery({ queryKey: ['fleets'], queryFn: fleetsService.getAll });
  const { data: operators = [] } = useQuery({ queryKey: ['agricultural-operators'], queryFn: agriculturalOperatorsService.getAll });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });

  /** Mantém apenas registros ativos (quando a entidade possuir status). */
  const onlyActive = <T extends { status?: string }>(list: T[]): T[] =>
    list.filter((i) => i.status === undefined || i.status === null || i.status === 'A');

  const stationOptions: Option[] = onlyActive(stations).map((s) => ({ value: String(s.id), label: s.name }));
  const productOptions: Option[] = onlyActive(products).map((p) => ({ value: String(p.id), label: p.name }));
  const fleetOptions: Option[] = onlyActive(fleets).map((f) => ({ value: String(f.id), label: f.name || f.code }));
  const operatorOptions: Option[] = onlyActive(operators).map((o) => ({ value: String(o.id), label: o.supplier_name || String(o.id) }));
  const supplierOptions: Option[] = onlyActive(suppliers).map((s) => ({
    value: String(s.id),
    label: s.fantasy_name || s.corporate_reason || String(s.id),
  }));

  /** Tanques filtrados pelo posto selecionado. */
  const tanksByStation = (stationId?: string): Option[] =>
    onlyActive(tanks)
      .filter((t) => !stationId || String(t.station_id) === String(stationId))
      .map((t) => ({ value: String(t.id), label: t.name }));

  /** Registradoras filtradas por posto e produto. */
  const registersBy = (stationId?: string, productId?: string): Option[] =>
    onlyActive(registers)
      .filter((r) => (!stationId || String(r.station_id) === String(stationId))
        && (!productId || String(r.product_id) === String(productId)))
      .map((r) => ({ value: String(r.id), label: r.name }));

  /** Produtos disponíveis no posto selecionado (cadastro Produtos por Posto). */
  const productsByStation = (stationId?: string): Option[] => {
    if (!stationId) return productOptions;
    const allowed = onlyActive(stationProducts)
      .filter((sp) => String(sp.station_id) === String(stationId))
      .map((sp) => String(sp.product_id));
    if (allowed.length === 0) return productOptions;
    return productOptions.filter((p) => allowed.includes(p.value));
  };

  /** Tipo de medição da frota: H = Horímetro, K = Quilômetro. */
  const markingTypeOf = (fleetId?: string): string =>
    fleets.find((f) => String(f.id) === String(fleetId))?.marking_type ?? '';

  return {
    stations, tanks, registers, stationProducts, products, fleets, operators, suppliers,
    stationOptions, productOptions, fleetOptions, operatorOptions, supplierOptions,
    tanksByStation, registersBy, productsByStation, markingTypeOf,
  };
}

export function useMaintenancePlanOptions() {
  const { data: plans = [] } = useQuery({
    queryKey: ['fleet-maintenance-plans'],
    queryFn: fleetMaintenancePlansService.getAll,
  });
  const plansByFleet = (fleetId?: string): Option[] =>
    plans
      .filter((p) => !fleetId || String(p.fleet_id) === String(fleetId))
      .map((p) => ({ value: String(p.id), label: p.description || String(p.id) }));
  return { plans, plansByFleet };
}

/** Rótulo da leitura conforme o tipo de medição da frota. */
export function meterLabels(markingType?: string) {
  const isHour = markingType === 'H';
  return {
    initial: isHour ? 'Horímetro inicial' : 'KM inicial',
    final: isHour ? 'Horímetro final' : 'KM final',
    total: isHour ? 'Horas trabalhadas' : 'KM percorridos',
    current: isHour ? 'Horímetro atual' : 'KM atual',
    unit: isHour ? 'h' : 'km',
  };
}
