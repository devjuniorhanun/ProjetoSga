import { AgriculturalDefensiveOrderOperatorProduct } from './AgriculturalDefensiveOrderOperatorProduct';

export interface AgriculturalDefensiveOrderOperator {
  id: number;
  agricultural_defensive_order_id: number;
  operator_id: number;
  operator_name: string | null;
  /** 'O' = Operador, 'T' = Tanqueiro */
  function: string;
  operator_tank_id?: number | null;
  products: AgriculturalDefensiveOrderOperatorProduct[];
}
