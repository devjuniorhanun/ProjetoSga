import { OperatorTankMovement } from './OperatorTankMovement';
import { OperatorTankProduct } from './OperatorTankProduct';

export interface OperatorTank {
  operator_id: number;
  operator_name: string;
  date: string;
  products: OperatorTankProduct[];
  movements: OperatorTankMovement[];
}

export interface TankOperator {
  id: number;
  name: string;
}

export interface TankDate {
  date: string;
}
