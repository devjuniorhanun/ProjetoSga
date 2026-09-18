import { AgriculturalDefensiveOrderOperator } from './AgriculturalDefensiveOrderOperator';
import { AgriculturalDefensiveOrderOperatorProduct } from './AgriculturalDefensiveOrderOperatorProduct';
import { AgriculturalDefensiveOrderProduct } from './AgriculturalDefensiveOrderProduct';
import { AgriculturalDefensiveOrderClosing } from './AgriculturalDefensiveOrderClosing';

export interface AgriculturalDefensiveOrder {
  id: number;
  os_number: string;
  parent_order_id: number | null;
  field_id: number;
  field_name: string | null;
  area: number;
  crop_id: number;
  crop_name: string | null;
  culture_id: number;
  culture_name: string | null;
  type_operation_id: number;
  type_operation_name: string | null;
  application_date: string;
  pump_volume: number | null;
  recommended_pump: number | null;
  flow: number | null;
  pump_capacity: number | null;
  used_bomb: number;
  /** A = Ativo, I = Inativo */
  status: string;
  created_at: string | null;
  updated_at: string | null;
  operators: AgriculturalDefensiveOrderOperator[];
  products: AgriculturalDefensiveOrderProduct[];
  closings: AgriculturalDefensiveOrderClosing[];
  previous_orders: AgriculturalDefensiveOrder[];
  operator_products: AgriculturalDefensiveOrderOperatorProduct[];
}

export interface AgriculturalDefensiveOrderRequest {
  field_id: number;
  area: number;
  crop_id: number;
  culture_id: number;
  type_operation_id: number;
  application_date: string;
  pump_volume?: number;
  recommended_pump?: number;
  flow?: number;
  pump_capacity?: number;
  operators: { operator_id: number; function: string }[];
  products: { product_id: number; dose?: number; pump: number }[];
}

export interface ActiveCrop {
  id: number;
  name: string;
  status: string;
}
