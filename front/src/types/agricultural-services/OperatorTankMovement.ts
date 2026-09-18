export interface OperatorTankMovement {
  id: number;
  product_id: number;
  product_name: string;
  /** WITHDRAWAL | USAGE | RETURN */
  movement_type: string;
  quantity: number;
  order_id: number | null;
  closing_id: number | null;
  observation: string | null;
  created_at: string;
}

export interface OperatorTankMovementRequest {
  operator_id: number;
  product_id: number;
  quantity: number;
  movement_type: string;
  observation?: string;
}
