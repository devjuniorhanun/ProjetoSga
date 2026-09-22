import api from './api';

export interface EntryInvoiceProduct {
  id: string;
  supplier_id: string;
  producer_id: string;
  supplier_name?: string;
  producer_name?: string;
  note_number: string;
  serie: string;
  mission_date: string;
  arrival_date: string;
  total_value: number;
  status: 'A' | 'I';
  items?: EntryInvoiceItem[];
}

export interface EntryInvoiceItem {
  id?: string;
  entry_invoice_product_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}

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

export const entryInvoiceProductsService = createCrudService<EntryInvoiceProduct>('/entries/products/entry-invoice-products');

// Entrada de Combustível
export interface EntryInvoiceFuel {
  id: string;
  supplier_id: string;
  producer_id: string;
  type_post_id?: string;
  post_id: string;
  supplier_name?: string;
  producer_name?: string;
  type_post_name?: string;
  post_name?: string;
  note_number: string;
  serie: string;
  mission_date: string;
  arrival_date: string;
  total_value: number;
  status: 'A' | 'I';
  items?: EntryInvoiceFuelItem[];
}

export interface EntryInvoiceFuelItem {
  id?: string;
  entry_invoice_fuel_id?: string;
  product_post_id: string;
  product_name?: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}


// Combustíveis
export interface ClosingRelease {
  id: string;
  post_id: string;
  product_id: string;
  post_name?: string;
  product_name?: string;
  release_date: string;
  initial_closing: number;
  final_closing: number;
  quantity_output: number;
  quantity_entries: number;
  daily_stock: number;
  ruler: number;
}

export interface DailyRelease {
  id: string;
  post_id: string;
  post_name?: string;
  items?: DailyReleaseItem[];
}

export interface DailyReleaseItem {
  id?: string;
  daily_release_id?: string;
  product_id: string;
  fleet_id: string;
  product_name?: string;
  fleet_name?: string;
  release_date: string;
  quantity: number;
  hour_meter_kilometer: number;
}

// Colheitas
// Agrícola
export interface DefensiveServiceField {
  id?: string;
  defensive_service_id?: string;
  field_id: string;
  field_name?: string;
  area: number;
}

export interface DefensiveServiceOperator {
  id?: string;
  defensive_service_id?: string;
  operator_id: string;
  fleet_id: string;
  operator_name?: string;
  fleet_name?: string;
  function: 'O' | 'T';
}

export interface DefensiveServiceProduct {
  id?: string;
  defensive_service_id?: string;
  product_id: string;
  product_name?: string;
  dose: number;
  pump: number;
  order?: number;
}

export interface DefensiveServicePreviousOS {
  id?: string;
  defensive_service_id?: string;
  os_number: string;
  quantity_used: number;
}

export interface DefensiveService {
  id: string;
  crop_id: string;
  culture_id: string;
  type_operation_id: string;
  crop_name?: string;
  culture_name?: string;
  type_operation_name?: string;
  farm_name?: string;
  owner_name?: string;
  application_date: string;
  pump_volume: number;
  flow: number;
  ump_capacity: number;
  recommended_pump_volume: number;
  used_bomb: number;
  difference_bomb: number;
  applied_area: number;
  field_id?: string;
  field_name?: string;
  observation: string;
  status: 'A' | 'F' | 'C' | 'D';
  fields?: DefensiveServiceField[];
  operators?: DefensiveServiceOperator[];
  products?: DefensiveServiceProduct[];
  previous_os?: DefensiveServicePreviousOS[];
}



/* ============================================================
 * Fase 5 - Ordens de Serviço de Defensivos Agrícolas
 * ==========================================================*/

export type DefensiveOrderId = string | number;

export interface AgriculturalDefensiveOrderField {
  id?: DefensiveOrderId;
  field_id: DefensiveOrderId;
  field_name?: string;
  area: number;
}

export interface AgriculturalDefensiveOrderOperator {
  id?: DefensiveOrderId;
  operator_id: DefensiveOrderId;
  fleet_id: DefensiveOrderId;
  operator_name?: string;
  fleet_name?: string;
  operator_tank_id?: DefensiveOrderId;
  function: 'O' | 'T';
}

export interface AgriculturalDefensiveOrderProduct {
  id?: DefensiveOrderId;
  product_id: DefensiveOrderId;
  product_name?: string;
  dose: number;
  pump: number;
  order?: number;
  used_bomb?: number;
  recommended_quantity?: number;
  actual_quantity?: number;
  actual_dose?: number;
}

export interface AgriculturalDefensiveOrderPreviousOrder {
  id?: DefensiveOrderId;
  os_number: string;
  quantity_used: number;
}

export interface DefensiveOrderReissuePayload {
  previous_os: Array<{
    os_number: string;
    quantity_used: number;
  }>;
}

export interface AgriculturalDefensiveOrderClosingProductRef {
  product_id?: DefensiveOrderId;
  product_name?: string;
  quantity?: number;
}

export interface AgriculturalDefensiveOrderClosing {
  id?: DefensiveOrderId;
  agricultural_defensive_order_id?: DefensiveOrderId;
  operator_tank_id?: DefensiveOrderId;
  closing_type?: string;
  closed_at?: string;
  closing_date?: string;
  operator_id?: DefensiveOrderId;
  operator_name?: string;
  closing_bomb: number;
  accumulated_bomb?: number;
  products?: AgriculturalDefensiveOrderClosingProductRef[];
}


export interface AgriculturalDefensiveOrder {
  id: string;
  os_number?: string;
  crop_id: string;
  culture_id: string;
  type_operation_id: string;
  crop_name?: string;
  culture_name?: string;
  type_operation_name?: string;
  farm_name?: string;
  owner_name?: string;
  application_date: string;
  pump_volume: number;
  flow: number;
  pump_capacity: number;
  recommended_pump: number;
  used_bomb?: number;
  difference_bomb?: number;
  closing_date?: string;
  area?: number;
  field_id?: DefensiveOrderId;
  field_name?: string;
  observation?: string;
  status: string;
  parent_id?: DefensiveOrderId;
  parent_order_id?: DefensiveOrderId | null;
  fields?: AgriculturalDefensiveOrderField[];
  operators?: AgriculturalDefensiveOrderOperator[];
  products?: AgriculturalDefensiveOrderProduct[];
  previous_os?: AgriculturalDefensiveOrderPreviousOrder[];
  previous_orders?: AgriculturalDefensiveOrder[];
  operator_products?: unknown[];
  closings?: AgriculturalDefensiveOrderClosing[];
}

export interface DefensiveOrderClosingPayload {
  order_id: DefensiveOrderId;
  operator_tank_id: DefensiveOrderId;
  closing_bomb: number;
  closing_type: string;
}

export type {
  OperatorTank,
  OperatorTankProduct,
  OperatorTankMovement,
} from '@/types/agricultural-services';

import type {
  OperatorTank as OperatorTankContract,
} from '@/types/agricultural-services';

export interface TankMovementPayload {
  operator_id: DefensiveOrderId;
  product_id: DefensiveOrderId;
  quantity: number;
  movement_type: string;
  observation?: string;
}

const DEFENSIVE_BASE = '/releases/agricultural/services/defensive';
const DEFENSIVE_ORDERS_ENDPOINT = `${DEFENSIVE_BASE}/orders`;

export const defensiveOrdersService = {
  ...createCrudService<AgriculturalDefensiveOrder>(DEFENSIVE_ORDERS_ENDPOINT),
  reissue: async (
    id: DefensiveOrderId,
    payload: DefensiveOrderReissuePayload,
  ): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.post(`${DEFENSIVE_ORDERS_ENDPOINT}/${id}/reissue`, payload);
    return data.data ?? data;
  },
  close: async (payload: DefensiveOrderClosingPayload): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.post(`${DEFENSIVE_ORDERS_ENDPOINT}/close`, payload);
    return data.data ?? data;
  },
  tankByOperator: async (operatorId: DefensiveOrderId): Promise<OperatorTankContract> => {
    const { data } = await api.get(`${DEFENSIVE_BASE}/tank/operator/${operatorId}`);
    return data.data ?? data;
  },
  tankMovement: async (payload: TankMovementPayload): Promise<OperatorTankContract> => {
    const { data } = await api.post(`${DEFENSIVE_BASE}/tank/movement`, payload);
    return data.data ?? data;
  },
  /** Sequência de aplicação dos produtos: envia todos os ids exatamente uma vez. */
  updateProductsSequence: async (
    id: DefensiveOrderId,
    productIds: Array<string | number>,
  ): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.patch(`${DEFENSIVE_ORDERS_ENDPOINT}/${id}/products/sequence`, {
      product_ids: productIds.map(String),
    });
    return data.data ?? data;
  },
};

