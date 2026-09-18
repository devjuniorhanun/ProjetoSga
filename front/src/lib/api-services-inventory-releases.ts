import api from './api';
import { unwrapItem, unwrapList, unwrapMeta, type PaginationMeta, type QueryParams } from './api-services-grain';
import type {
  InventoryBalance,
  InventoryMovement,
  ProductOutput,
  ProductOutputPayload,
  ProductOutputReturnPayload,
} from '@/types/fiscal';

/** Endpoints oficiais do estoque unificado e das saídas de produtos. */
export const INVENTORY_RELEASES_BASE = '/releases/inventory';
export const INVENTORY_BALANCES_ENDPOINT = `${INVENTORY_RELEASES_BASE}/balances`;
export const INVENTORY_MOVEMENTS_ENDPOINT = `${INVENTORY_RELEASES_BASE}/movements`;
export const PRODUCT_OUTPUTS_ENDPOINT = `${INVENTORY_RELEASES_BASE}/product-outputs`;

export const inventoryBalancesService = {
  endpoint: INVENTORY_BALANCES_ENDPOINT,
  list: async (params?: QueryParams): Promise<{ items: InventoryBalance[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(INVENTORY_BALANCES_ENDPOINT, { params });
    return { items: unwrapList<InventoryBalance>(data), meta: unwrapMeta(data) };
  },
};

export const inventoryMovementsService = {
  endpoint: INVENTORY_MOVEMENTS_ENDPOINT,
  list: async (params?: QueryParams): Promise<{ items: InventoryMovement[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(INVENTORY_MOVEMENTS_ENDPOINT, { params });
    return { items: unwrapList<InventoryMovement>(data), meta: unwrapMeta(data) };
  },
};

export const productOutputsService = {
  endpoint: PRODUCT_OUTPUTS_ENDPOINT,
  list: async (params?: QueryParams): Promise<{ items: ProductOutput[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(PRODUCT_OUTPUTS_ENDPOINT, { params });
    return { items: unwrapList<ProductOutput>(data), meta: unwrapMeta(data) };
  },
  getById: async (id: string): Promise<ProductOutput> => {
    const { data } = await api.get(`${PRODUCT_OUTPUTS_ENDPOINT}/${id}`);
    return unwrapItem<ProductOutput>(data);
  },
  create: async (payload: ProductOutputPayload): Promise<ProductOutput> => {
    const { data } = await api.post(PRODUCT_OUTPUTS_ENDPOINT, payload);
    return unwrapItem<ProductOutput>(data);
  },
  /** Confirmação baixa o estoque no backend. */
  confirm: async (id: string): Promise<ProductOutput> => {
    const { data } = await api.post(`${PRODUCT_OUTPUTS_ENDPOINT}/${id}/confirm`);
    return unwrapItem<ProductOutput>(data);
  },
  /** Retorno é permitido apenas para empréstimos. */
  registerReturn: async (id: string, payload: ProductOutputReturnPayload): Promise<ProductOutput> => {
    const { data } = await api.post(`${PRODUCT_OUTPUTS_ENDPOINT}/${id}/returns`, payload);
    return unwrapItem<ProductOutput>(data);
  },
};
