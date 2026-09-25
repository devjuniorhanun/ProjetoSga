import api from './api';

export interface ProductGroup {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface SubGroupProduct {
  id: string;
  product_group_id: string;
  product_group_name?: string;
  name: string;
  status: 'A' | 'I';
}

export interface PurposeProduct {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface Product {
  id: string;
  product_group_id: string;
  group_product_id?: string;
  sub_group_product_id: string;
  purpose_product_id: string;
  group_product_name?: string;
  sub_group_product_name?: string;
  purpose_product_name?: string;
  name: string;
  stock: number;
  stock_location: string;
  minimum_quantity: number;
  maximum_quantity: number;
  drum_box: string;
  gallon_package: string;
  unit: 'K' | 'L';
  status: 'A' | 'I';
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_name?: string;
  product_name?: string;
  product_code: string;
  volume: string;
  status: 'A' | 'I';
}

function createCrudService<T extends { id: string }>(endpoint: string) {
  return {
    endpoint,
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

export const productGroupsService = createCrudService<ProductGroup>('/registrations/product/product-groups');
export const subGroupProductsService = createCrudService<SubGroupProduct>('/registrations/product/sub-group-products');
export const purposeProductsService = createCrudService<PurposeProduct>('/registrations/product/purpose-products');
export const productsService = createCrudService<Product>('/registrations/product/products');
export const supplierProductsService = createCrudService<SupplierProduct>('/registrations/product/supplier-products');
