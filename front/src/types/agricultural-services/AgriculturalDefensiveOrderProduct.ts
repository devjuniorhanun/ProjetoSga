export interface AgriculturalDefensiveOrderProduct {
  id: number;
  agricultural_defensive_order_id: number;
  product_id: number;
  product_name: string | null;
  dose: number | null;
  /** quantidade do produto aplicada em UMA bomba */
  pump: number;
  used_bomb: number;
  recommended_quantity: number | null;
  actual_quantity: number | null;
  actual_dose: number | null;
}
