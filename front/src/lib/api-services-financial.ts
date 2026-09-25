import api from './api';

export interface AdministrativeCenter {
  id: string;
  producer_id: string;
  producer_name?: string;
  farm_id: string;
  farm_name?: string;
  cei: string;
  state_registration: string;
  status: 'A' | 'I';
}

export interface CostCenter {
  id: string;
  name: string;
  status: 'A' | 'I';
}

// Generic CRUD service factory
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

export const administrativeCentersService = createCrudService<AdministrativeCenter>('/registrations/financial/administrative-centers');
export const costCentersService = createCrudService<CostCenter>('/registrations/financial/cost-centers');

// Get administrative centers filtered by producer (backend may ignore the filter)
export async function getAdministrativeCentersByProducer(producerId: string): Promise<AdministrativeCenter[]> {
  const { data } = await api.get('/registrations/financial/administrative-centers', {
    params: { producer_id: producerId },
  });
  const result = data.data ?? data;
  const list: AdministrativeCenter[] = Array.isArray(result) ? result : [];
  return list.filter((c) => String(c.producer_id) === String(producerId));
}

// Get farms by producer
export async function getFarmsByProducer(producerId: string) {
  const { data } = await api.get(`/registrations/properties/areas/farms?producer_id=${producerId}`);
  const result = data.data ?? data;
  return Array.isArray(result) ? result : [];
}
