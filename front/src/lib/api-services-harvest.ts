import api from './api';

/**
 * Serviços oficiais do módulo de Colheita e Adiantamentos.
 * A instância de `./api` já adiciona `/api`, autenticação, CSRF e normalização de IDs.
 */

export const HARVEST_RELEASES_ENDPOINT = '/releases/harvest/harvest-releases';
export const HARVEST_PLOT_FIELDS_ENDPOINT = '/releases/harvest/plot-fields';
export const HARVEST_STATE_REGISTRATIONS_ENDPOINT = '/releases/harvest/state-registrations';
export const HARVEST_MATRIX_FREIGHT_ENDPOINT = '/releases/harvest/matrix-freight';
export const HARVEST_ADVANCES_ENDPOINT = '/releases/financial/advances/harvest';
export const HARVEST_ELIGIBLE_HARVESTERS_ENDPOINT =
  '/releases/financial/advances/harvest/eligible-harvesters';
export const HARVEST_TRANSPORTER_SUPPLIERS_ENDPOINT =
  '/releases/financial/advances/harvest/transporter-suppliers';


export interface HarvestRelease {
  id: string;
  crop_id: string;
  driver_id: string;
  owner_id: string;
  farm_state_registration_id: string;
  plot_field_id: string;
  warehouse_id: string;
  lanyard_id: string;
  matrix_freight_id?: string;
  release_date: string;
  shipping_number: string;
  control_number: string;
  gross_weight: number;
  discount_weight: number;
  discount: number;
  net_weight: number;
  liquid_bags: number;
  gross_bags: number;
  shipping_value: number;
  shipping_paid_value?: number;
  status: 'A' | 'I';
  crop_name?: string;
  driver_name?: string;
  driver_supplier_name?: string;
  owner_name?: string;
  state_registration?: string;
  plot_field_name?: string;
  plot_name?: string;
  field_name?: string;
  warehouse_name?: string;
  lanyard_name?: string;
  lanyard_supplier_name?: string;
  matrix_freight_price?: number;
}

export interface HarvestReleasePayload {
  crop_id: string;
  driver_id: string;
  owner_id: string;
  farm_state_registration_id: string;
  plot_field_id: string;
  warehouse_id: string;
  lanyard_id: string;
  release_date: string;
  shipping_number: string;
  control_number: string;
  gross_weight: number;
  discount: number;
  status?: 'A' | 'I';
}

export interface HarvestPlotField {
  id: string;
  crop_id: string;
  culture_id: string;
  variety_culture_id: string;
  area: number;
  field_id: string;
  /** Nome oficial da locação do talhão retornado pelo backend. */
  name?: string;
  plot_name?: string;
  block?: string;
  culture_name?: string;
}

export interface HarvestMatrixFreight {
  matrix_freight_id: string;
  price: number;
  plot_name: string;
  block: string;
  warehouse_name: string;
  route: string;
}

export interface HarvestStateRegistration {
  id: string;
  producer_id: string;
  farm_id: string;
  farm_name: string;
  state_registration: string;
  description?: string | null;
}

export type HarvestAdvanceType = 'HARVESTER' | 'TRANSPORTER';

export interface HarvestAdvance {
  id: string;
  advance_number?: string;
  advance_type: HarvestAdvanceType;
  crop_id: string;
  crop_name?: string;
  supplier_id: string;
  supplier_name?: string;
  producer_id: string;
  producer_name?: string;
  administrative_center_id: string;
  administrative_center_name?: string;
  type_pay_account_id: string;
  type_pay_account_name?: string;
  document_date: string;
  due_date: string;
  document_number: string;
  description?: string;
  value: number;
  observation?: string | null;
  accounted_for?: 'S' | 'N';
  status: string;
  pay_account_id?: string;
}

export interface HarvestAdvancePayload {
  advance_type: HarvestAdvanceType;
  crop_id: string;
  supplier_id: string;
  producer_id: string;
  administrative_center_id: string;
  type_pay_account_id: string;
  document_date: string;
  due_date: string;
  document_number: string;
  value: number;
  observation?: string | null;
}

export interface EligibleHarvester {
  supplier_id: string;
  supplier_name: string;
}

export interface TransporterSupplierSummary {
  supplier_id: string;
  supplier_name: string;
  total_gross_bags: number;
  total_shipping_value: number;
  paid_value: number;
  open_value: number;
}


export interface HarvestReleaseFilters {
  crop_id?: string;
  driver_id?: string;
  supplier_id?: string;
  per_page?: number;
}

function unwrapList<T>(payload: unknown): T[] {
  const data = payload as { data?: unknown };
  const first = data?.data ?? payload;
  const second = (first as { data?: unknown })?.data ?? first;
  return Array.isArray(second) ? (second as T[]) : Array.isArray(first) ? (first as T[]) : [];
}

function unwrapItem<T>(payload: unknown): T {
  const data = payload as { data?: unknown };
  return (data?.data ?? payload) as T;
}

export const harvestReleasesService = {
  list: async (filters: HarvestReleaseFilters = {}): Promise<HarvestRelease[]> => {
    const params: Record<string, string | number> = {};
    if (filters.crop_id) params.crop_id = filters.crop_id;
    if (filters.driver_id) params.driver_id = filters.driver_id;
    if (filters.supplier_id) params.supplier_id = filters.supplier_id;
    params.per_page = filters.per_page ?? 25;
    const { data } = await api.get(HARVEST_RELEASES_ENDPOINT, { params });
    return unwrapList<HarvestRelease>(data);
  },
  getById: async (id: string): Promise<HarvestRelease> => {
    const { data } = await api.get(`${HARVEST_RELEASES_ENDPOINT}/${id}`);
    return unwrapItem<HarvestRelease>(data);
  },
  create: async (payload: HarvestReleasePayload): Promise<HarvestRelease> => {
    const { data } = await api.post(HARVEST_RELEASES_ENDPOINT, payload);
    return unwrapItem<HarvestRelease>(data);
  },
  update: async (id: string, payload: HarvestReleasePayload): Promise<HarvestRelease> => {
    const { data } = await api.put(`${HARVEST_RELEASES_ENDPOINT}/${id}`, payload);
    return unwrapItem<HarvestRelease>(data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${HARVEST_RELEASES_ENDPOINT}/${id}`);
  },
};

export const harvestPlotFieldsService = {
  byCrop: async (cropId: string): Promise<HarvestPlotField[]> => {
    const { data } = await api.get(HARVEST_PLOT_FIELDS_ENDPOINT, { params: { crop_id: cropId } });
    return unwrapList<HarvestPlotField>(data);
  },
};

export const harvestStateRegistrationsService = {
  byOwner: async (ownerId: string): Promise<HarvestStateRegistration[]> => {
    const { data } = await api.get(HARVEST_STATE_REGISTRATIONS_ENDPOINT, { params: { owner_id: ownerId } });
    return unwrapList<HarvestStateRegistration>(data);
  },
};

export const harvestMatrixFreightService = {
  find: async (
    cropId: string,
    plotFieldId: string,
    warehouseId: string,
  ): Promise<HarvestMatrixFreight> => {
    const { data } = await api.get(HARVEST_MATRIX_FREIGHT_ENDPOINT, {
      params: { crop_id: cropId, plot_field_id: plotFieldId, warehouse_id: warehouseId },
    });
    return unwrapItem<HarvestMatrixFreight>(data);
  },
};

export const harvestAdvancesService = {
  list: async (
    filters: {
      advance_type?: HarvestAdvanceType;
      crop_id?: string;
      supplier_id?: string;
      producer_id?: string;
      per_page?: number;
    } = {},
  ): Promise<HarvestAdvance[]> => {
    const params: Record<string, string | number> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params[key] = value as string | number;
    });
    params.per_page = filters.per_page ?? 25;
    const { data } = await api.get(HARVEST_ADVANCES_ENDPOINT, { params });
    return unwrapList<HarvestAdvance>(data);
  },
  create: async (payload: HarvestAdvancePayload): Promise<HarvestAdvance> => {
    const { data } = await api.post(HARVEST_ADVANCES_ENDPOINT, payload);
    return unwrapItem<HarvestAdvance>(data);
  },
  eligibleHarvesters: async (cropId: string): Promise<EligibleHarvester[]> => {
    const { data } = await api.get(HARVEST_ELIGIBLE_HARVESTERS_ENDPOINT, {
      params: { crop_id: cropId },
    });
    return unwrapList<EligibleHarvester>(data);
  },
  transporterSuppliers: async (cropId: string): Promise<TransporterSupplierSummary[]> => {
    const { data } = await api.get(HARVEST_TRANSPORTER_SUPPLIERS_ENDPOINT, {
      params: { crop_id: cropId },
    });
    return unwrapList<TransporterSupplierSummary>(data);
  },
};
