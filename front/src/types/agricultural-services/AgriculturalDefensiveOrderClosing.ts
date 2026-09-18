export interface AgriculturalDefensiveOrderClosingProduct {
  product_id: number;
  product_name: string;
  quantity: number;
}

export interface AgriculturalDefensiveOrderClosing {
  id: number;
  agricultural_defensive_order_id: number;
  operator_tank_id: number;
  closing_bomb: number;
  /** PARTIAL | FINAL */
  closing_type: string;
  closed_at: string;
  products: AgriculturalDefensiveOrderClosingProduct[];
}

export interface AgriculturalDefensiveOrderClosingRequest {
  order_id: number;
  operator_tank_id: number;
  closing_bomb: number;
  closing_type: string;
}
