export interface AgriculturalDefensiveOrderOperatorProduct {
  id: number;
  agricultural_defensive_order_id: number;
  agricultural_defensive_order_operator_id: number;
  product_id: number;
  product_name: string | null;
  dose: number | null;
  pump: number;
  area: number;
  planned_quantity: number;
}
