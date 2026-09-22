import api from '@/lib/api';

export interface DefensiveReportOption {
  id: string | number;
  name: string;
  area?: number;
}

export interface DefensiveReportProduct {
  product_id: string | number;
  product_name: string;
  recommended_quantity: number;
  recommended_dose: number | null;
  used_quantity: number;
  used_per_area: number | null;
}

export interface DefensiveReportOrder {
  id: string | number;
  os_number: string | number;
  application_date: string;
  crop_name: string;
  culture_name: string;
  operation_name: string;
  field_name: string;
  area: number;
  field_real_area: number;
  recommended_pump: number;
  used_bomb: number;
  pump_difference_percentage: number | null;
  status: string;
  observation?: string;
  operators: Array<{ name?: string; fleet?: string; function: string }>;
  products: DefensiveReportProduct[];
}

const endpoint = '/reports/agricultural/defensive-orders';
const unwrap = <T>(response: { data: { data?: T } | T }): T => ((response.data as { data?: T }).data ?? response.data) as T;

export const defensiveReportsService = {
  options: async (cropId?: string, operationId?: string) => unwrap<{
    crops: DefensiveReportOption[];
    operations: DefensiveReportOption[];
    fields: DefensiveReportOption[];
  }>(await api.get(`${endpoint}/options`, { params: { crop_id: cropId || undefined, type_operation_id: operationId || undefined } })),

  orders: async (cropId: string, operationId: string, fieldId: string) => unwrap<{
    crop: DefensiveReportOption;
    operation: DefensiveReportOption;
    field: DefensiveReportOption & { real_area: number };
    considered_area: number;
    orders: DefensiveReportOrder[];
    products: DefensiveReportProduct[];
  }>(await api.get(endpoint, { params: { crop_id: cropId, type_operation_id: operationId, field_id: fieldId } })),

  products: async (cropId: string, operationId: string) => unwrap<{
    crop: DefensiveReportOption;
    operation: DefensiveReportOption;
    field_count: number;
    order_count: number;
    considered_area: number;
    products: DefensiveReportProduct[];
  }>(await api.get(`${endpoint}/products`, { params: { crop_id: cropId, type_operation_id: operationId } })),

  totalProducts: async (cropId: string) => unwrap<{
    crop: DefensiveReportOption;
    operation_count: number;
    field_count: number;
    order_count: number;
    considered_area: number;
    products: DefensiveReportProduct[];
  }>(await api.get(`${endpoint}/products-total`, { params: { crop_id: cropId } })),
};
