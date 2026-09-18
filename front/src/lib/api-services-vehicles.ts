import api from './api';

// Types
export interface FleetGroup {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface FleetBrand {
  id: string;
  name: string;
}

export interface FleetModel {
  id: string;
  fleet_brand_id: string;
  fleet_brand_name?: string;
  name: string;
}

export interface Fleet {
  id: string;
  fleet_group_id: string;
  fleet_brand_id: string;
  fleet_model_id: string;
  fleet_group_name?: string;
  fleet_brand_name?: string;
  fleet_model_name?: string;
  name: string;
  code: string;
  plate: string;
  fleet_type: 'P' | 'T';
  year: string;
  chassi: string;
  acquisition_date: string;
  acquisition_value: number;
  fuel_type: string;
  marking_type: string;
  starting_meter: string;
  end_gauge: string;
  status: 'A' | 'I';
}

// Generic CRUD service factory
function createCrudService<T extends { id: string }>(endpoint: string) {
  return {
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

export const fleetGroupsService = createCrudService<FleetGroup>('/registrations/vehicle/fleet-groups');
export const fleetBrandsService = createCrudService<FleetBrand>('/registrations/vehicle/fleet-brands');
export const fleetModelsService = createCrudService<FleetModel>('/registrations/vehicle/fleet-models');
export const fleetsService = createCrudService<Fleet>('/registrations/vehicle/fleets');
