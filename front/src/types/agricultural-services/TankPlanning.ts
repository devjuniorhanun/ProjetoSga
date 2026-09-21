export interface TankPlanningOrder {
  order_id: number;
  os_number: string;
  field_id: number;
  field_name: string | null;
  area: number;
  planned_quantity: number;
  actual_quantity: number;
  remaining_quantity: number;
}

export interface TankPlanningProduct {
  product_id: number;
  product_name: string;
  pump: number;
  planned_quantity: number;
  used_quantity: number;
  open_quantity: number;
  tank_balance: number;
  additional_need: number;
  /** Sugestão calculada pelo backend para preencher o campo Retirar. */
  suggested_withdrawal?: number;
  orders?: TankPlanningOrder[];
}

export interface TankPlanningSummary {
  open_orders: number;
  total_open_area: number;
  partially_completed_area: number;
  remaining_area: number;
}

export interface TankPlanning {
  operator_tank_id: number;
  crop: { id: number; name: string };
  operator: { id: number; name: string };
  date: string;
  summary?: TankPlanningSummary;
  products: TankPlanningProduct[];
}
