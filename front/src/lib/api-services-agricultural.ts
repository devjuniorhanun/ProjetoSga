import api from './api';

export interface OperationDefensive {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface TypeOperation {
  id: string;
  operation_defensive_id: string;
  operation_defensive_name?: string;
  name: string;
  status: 'A' | 'I';
}

export interface AgriculturalOperator {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  number_feet?: number;
  status: 'A' | 'I';
}

function createCrudService<T extends { id: string }>(endpoint: string) {
  return {
    getAll: async (params?: Record<string, unknown>): Promise<T[]> => {
      const { data } = await api.get(endpoint, { params });
      const result = data.data ?? data;
      const rows = Array.isArray(result) ? result : [];
      return params?.status ? rows.filter((item) => (item as T & { status?: string }).status === params.status) : rows;
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

export const operationDefensivesService = createCrudService<OperationDefensive>('/registrations/agricultural/defensive/operation-defensives');
export const typeOperationsService = createCrudService<TypeOperation>('/registrations/agricultural/defensive/type-operations');
export const agriculturalOperatorsService = createCrudService<AgriculturalOperator>('/registrations/agricultural/defensive/agricultural-operators');

export interface TypeFormulation {
  id: string;
  formulation: string;
  abbreviation: string;
  order: number | string;
  status: 'A' | 'I';
}

export interface ActiveIngredientItem {
  active_ingredient: string;
  concentration: string;
}

export interface AgriculturalProduct {
  id: string;
  product_id: string;
  product_name?: string;
  active_ingredient: ActiveIngredientItem[] | string[] | string;
  type_formulation_id: string;
  formulation?: string;
  status: 'A' | 'I';
}

export const typeFormulationsService = createCrudService<TypeFormulation>('/registrations/agricultural/defensive/type-formulations');
export const agriculturalProductsService = createCrudService<AgriculturalProduct>('/registrations/agricultural/defensive/agricultural-products');
