import api from './api';

export interface Contract {
  id: string;
  crop_id: string;
  crop_name?: string;
  opening_date: string;
  closing_date: string;
  shipping_cost: number;
  body: string;
}

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

export const contractDriversService = createCrudService<Contract>('/registrations/supplier/contracts/drivers-contracts');
export const contractLanyardsService = createCrudService<Contract>('/registrations/supplier/contracts/lanyards-contracts');

export interface DriverContract {
  id: string;
  drivers_contract_id: string;
  supplier_id: string;
  crop_name?: string;
  supplier_name?: string;
  body?: string;
  variables?: Record<string, string | number | null>;
}

export const driverContractsService = createCrudService<DriverContract>(
  '/registrations/supplier/contracts/driver-contracts',
);

export interface LanyardContract {
  id: string;
  lanyard_contract_id: string;
  supplier_id: string;
  crop_name?: string;
  supplier_name?: string;
  body?: string;
  variables?: Record<string, string | number | null>;
}

export const lanyardContractsService = createCrudService<LanyardContract>(
  '/registrations/supplier/contracts/lanyard-contracts',
);
