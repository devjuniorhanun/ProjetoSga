import api from './api';

export interface Role {
  id: string;
  name: string;
  abbreviation: string;
  status: 'A' | 'I';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role_ids: string[];
  role_names?: string[];
  roles?: { id: string; name: string }[];
  status: 'A' | 'I';
}

export interface Config {
  id: string;
  producer_name: string;
  property_name: string;
  producer_color: string;
  property_color: string;
  logo_url?: string | null;
}

export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

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

export const rolesService = createCrudService<Role>('/registrations/admin/roles');
export const adminUsersService = createCrudService<AdminUser>('/registrations/admin/users');
const baseConfigsService = createCrudService<Config>('/registrations/admin/configs');

/** A logomarca usa endpoints próprios (multipart), nunca o CRUD padrão. */
export const configsService = {
  ...baseConfigsService,
  uploadLogo: async (configId: string, file: File): Promise<Config> => {
    const form = new FormData();
    form.append('logo', file);
    const { data } = await api.post(`/registrations/admin/configs/${configId}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data?.data ?? data) as Config;
  },
  deleteLogo: async (configId: string): Promise<void> => {
    await api.delete(`/registrations/admin/configs/${configId}/logo`);
  },
};
