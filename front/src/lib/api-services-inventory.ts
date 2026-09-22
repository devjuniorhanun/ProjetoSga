import api from './api';
import { unwrapItem, unwrapList, unwrapMeta, type PaginationMeta, type QueryParams } from './api-services-grain';

/** Catálogos de estoque expostos pelo backend em /registrations/inventory/{catalog}. */
export const INVENTORY_BASE = '/registrations/inventory';

export type ActiveStatus = 'A' | 'I';

export type AgriculturalServiceCategory =
  | 'SOIL_PREPARATION'
  | 'INPUT_APPLICATION'
  | 'FIREBREAK_MAINTENANCE';

export interface StockLocation {
  id: string;
  name: string;
  code: string;
  location_type: string;
  farm_id?: string | null;
  farm_name?: string;
  fuel_station_id?: string | null;
  fuel_station_type?: 'F' | 'M' | null;
  grain_warehouse_id?: string | null;
  grain_warehouse_name?: string;
  maximum_capacity?: number | null;
  status: ActiveStatus;
  notes?: string | null;
}

export interface SeedProductProfile {
  id: string;
  product_id: string;
  product_name?: string;
  culture_id: string;
  culture_name?: string;
  variety_id: string;
  variety_name?: string;
  category: string;
  seed_class: string;
  unit: string;
  status: ActiveStatus;
}

export interface AgriculturalServiceType {
  id: string;
  name: string;
  code: string;
  category: AgriculturalServiceCategory;
  requires_input: boolean;
  requires_rate: boolean;
  requires_fleet: boolean;
  requires_implement: boolean;
  status: ActiveStatus;
  notes?: string | null;
}

export interface FreightRate {
  id: string;
  crop_id: string;
  crop_name?: string;
  supplier_id: string;
  supplier_name?: string;
  product_id: string;
  product_name?: string;
  value_per_ton: number;
  effective_from: string;
  effective_until?: string | null;
  status: ActiveStatus;
}

/** CRUD padrão dos catálogos de estoque (respostas simples, Resource ou paginadas). */
export function createInventoryCrudService<T extends { id: string }>(endpoint: string) {
  return {
    endpoint,
    list: async (params?: QueryParams): Promise<{ items: T[]; meta?: PaginationMeta }> => {
      const { data } = await api.get(endpoint, { params });
      return { items: unwrapList<T>(data), meta: unwrapMeta(data) };
    },
    getAll: async (params?: QueryParams): Promise<T[]> => {
      const { data } = await api.get(endpoint, { params: { per_page: 25, ...params } });
      return unwrapList<T>(data);
    },
    getById: async (id: string): Promise<T> => {
      const { data } = await api.get(`${endpoint}/${id}`);
      return unwrapItem<T>(data);
    },
    create: async (payload: Omit<T, 'id'>): Promise<T> => {
      const { data } = await api.post(endpoint, payload);
      return unwrapItem<T>(data);
    },
    update: async (id: string, payload: Partial<T>): Promise<T> => {
      const { data } = await api.put(`${endpoint}/${id}`, payload);
      return unwrapItem<T>(data);
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}

export const stockLocationsService = createInventoryCrudService<StockLocation>(
  `${INVENTORY_BASE}/stock-locations`,
);
export const seedProductProfilesService = createInventoryCrudService<SeedProductProfile>(
  `${INVENTORY_BASE}/seed-product-profiles`,
);
export const agriculturalServiceTypesService = createInventoryCrudService<AgriculturalServiceType>(
  `${INVENTORY_BASE}/agricultural-service-types`,
);
export const freightRatesService = createInventoryCrudService<FreightRate>(
  `${INVENTORY_BASE}/freight-rates`,
);

export const SERVICE_CATEGORY_LABELS: Record<AgriculturalServiceCategory, string> = {
  SOIL_PREPARATION: 'Preparo de solo',
  INPUT_APPLICATION: 'Aplicação de insumos',
  FIREBREAK_MAINTENANCE: 'Manutenção de aceiro',
};

/** Converte o valor de um select 1/0 em booleano para o payload. */
export const toBool = (value: string | undefined) => value === '1' || value === 'true';
/** Converte um booleano da API no valor usado pelo select. */
export const fromBool = (value: unknown) => (value === true || value === 1 || value === '1' ? '1' : '0');

export const BOOL_OPTIONS = [
  { value: '1', label: 'Sim' },
  { value: '0', label: 'Não' },
];
