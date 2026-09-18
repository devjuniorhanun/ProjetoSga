export interface TankWithdrawalRequest {
  crop_id: number;
  operator_id: number;
  date: string;
  products: { product_id: number; quantity: number }[];
  observation?: string;
}
