export interface OperatorTankWithdrawalItem {
  id: number | string;
  product_id: number | string;
  product_name: string;
  unit: string | null;
  quantity: number;
  stock_before: number;
  stock_after: number;
  tank_balance_before: number;
  tank_balance_after: number;
}

export interface OperatorTankWithdrawal {
  id: number | string;
  withdrawal_number: string;
  crop_id: number | string;
  crop_name: string | null;
  operator_tank_id: number | string | null;
  operator_id: number | string;
  operator_name: string | null;
  /** Data de corte informada na consulta do planejamento. */
  cutoff_date: string;
  /** Data/hora real do registro da retirada. */
  occurred_at: string;
  observation: string | null;
  created_by: number | string | null;
  created_by_name: string | null;
  status: string;
  items_count: number;
  items: OperatorTankWithdrawalItem[];
  fields: Array<{
    id: number | string;
    name: string;
  }>;
}

export interface OperatorTankWithdrawalRequest {
  crop_id: number;
  operator_id: number;
  date: string;
  products: { product_id: number; quantity: number }[];
  observation?: string;
}

export interface OperatorTankWithdrawalFilters {
  crop_id?: number | string;
  operator_id?: number | string;
  product_id?: number | string;
  date_from?: string;
  date_to?: string;
}

/** Datas que ainda possuem O.S. abertas para o tanqueiro. */
export interface TankOpenDate {
  date: string;
  open_orders: number;
}
