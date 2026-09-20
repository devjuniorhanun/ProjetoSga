import api from './api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AgriculturalYear {
  id: string;
  name: string;
  opening_date: string;
  closing_date: string;
  status: 'A' | 'I';
}

export interface Culture {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface Crop {
  id: string;
  agricultural_year_id: string;
  name: string;
  opening_date: string;
  closing_date: string;
  status: 'A' | 'I';
  culture_ids?: string[];
}

export interface VarietyCulture {
  id: string;
  culture_id: string;
  culture_name?: string;
  name: string;
  technology: string;
  cycle: string;
  flowering_days?: number;
  status: 'A' | 'I';
}

export interface Owner {
  id: string;
  corporate_name: string;
  fantasy_name: string;
  payment_type: string;
  status: 'A' | 'I';
}

export interface Producer {
  id: string;
  owner_id: string;
  owner_name?: string;
  status: 'A' | 'I';
}

export interface Farm {
  id: string;
  owner_id: string;
  producer_id: string;
  owner_name?: string;
  producer_name?: string;
  name: string;
  total_area: number;
  status: 'A' | 'I';
}

export interface Field {
  id: string;
  farm_id: string;
  farm_name?: string;
  name: string;
  area: number;
  block: string;
  status: 'A' | 'I';
}

export interface PlotField {
  id: string;
  field_id: string;
  crop_id: string;
  culture_id: string;
  field_name?: string;
  crop_name?: string;
  culture_name?: string;
  variety_culture_id?: string;
  variety_culture_name?: string;
  name: string;
  area: number;
  pms?: number | null;
  linear_seed?: number | null;
  start_planting?: string | null;
  final_planting?: string | null;
  expected_date?: string | null;
  observations?: string | null;
  status: 'A' | 'I';
}

export interface MatrixFreight {
  id: string;
  crop_id: string;
  crop_name?: string;
  block: string;
  route: string;
  price: number;
  /** Vigência da versão de preço (histórico preservado pelo backend). */
  effective_from?: string | null;
  effective_to?: string | null;
  status: 'A' | 'I';
}


export interface TypeSupplier {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface Supplier {
  id: string;
  corporate_reason: string;
  fantasy_name: string;
  cpf_cnpj: string;
  rg_ie: string;
  type: 'F' | 'J';
  status: 'A' | 'I';
  supplier_name: string;
  bank_name: string;
  agency_number: string;
  account_number: string;
  operation_number: string;
  pix_key: string;
  account_type: string;
  type_supplier_ids?: string[];
  typeSuppliers?: string[];
}

export interface Warehouse {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  name: string;
  city: string;
  route: string;
  type: 'P' | 'T';
  status: 'A' | 'I';
}

export interface Lanyard {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  front: string;
  machine_quantity: number;
  number_feet?: number;
  status: 'A' | 'I';
}

export interface Driver {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  name: string;
  code: string;
  plate: string;
  area: string;
  status: 'A' | 'I';
}

// Generic CRUD service factory
function createCrudService<T extends { id: string }>(endpoint: string) {
  return {
    endpoint,
    getAll: async (): Promise<T[]> => {
      const { data } = await api.get(endpoint);
      const result = data.data ?? data;
      return Array.isArray(result) ? result : [];
    },
    getById: async (id: string): Promise<T> => {
      const { data } = await api.get(`${endpoint}/${id}`);
      return data.data ?? data;
    },
    create: async (payload: Omit<T, 'id'>): Promise<T> => {
      const { data } = await api.post(endpoint, payload);
      return data.data ?? data;
    },
    update: async (id: string, payload: Partial<T>): Promise<T> => {
      const { data } = await api.put(`${endpoint}/${id}`, payload);
      return data.data ?? data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}

export const agriculturalYearsService = createCrudService<AgriculturalYear>('/registrations/harvest/agricultural-years');
export const culturesService = createCrudService<Culture>('/registrations/harvest/cultures');
export const cropsService = createCrudService<Crop>('/registrations/harvest/crops');
export const varietiesService = createCrudService<VarietyCulture>('/registrations/harvest/varieties');
export const usersService = createCrudService<User>('/registrations/admin/users');
export const ownersService = createCrudService<Owner>('/registrations/properties/owners');
export const producersService = createCrudService<Producer>('/registrations/properties/producers');
export const farmsService = createCrudService<Farm>('/registrations/properties/areas/farms');
export const fieldsService = createCrudService<Field>('/registrations/properties/areas/fields');
export const plotFieldsService = createCrudService<PlotField>('/registrations/properties/areas/plot-fields');
export const matrixFreightsService = createCrudService<MatrixFreight>('/registrations/properties/areas/matrix-freights');
export const typeSuppliersService = createCrudService<TypeSupplier>('/registrations/supplier/type-suppliers');
export const suppliersService = createCrudService<Supplier>('/registrations/supplier/suppliers');
export const warehousesService = createCrudService<Warehouse>('/registrations/supplier/warehouses');
export const lanyardsService = createCrudService<Lanyard>('/registrations/supplier/lanyards');
export const driversService = createCrudService<Driver>('/registrations/supplier/drivers');
