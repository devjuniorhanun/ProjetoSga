import type {
  ContractStatus,
  GrainOperationType,
  GrainTicketStatus,
  OwnershipType,
  StorageType,
  AuthorizationStatus,
  DiscountCalculationMethod,
  WeighingSource,
  WeighingStage,
} from '@/types/grain';

export const OPERATION_TYPE_LABELS: Record<GrainOperationType, string> = {
  ENTRY: 'Recebimento',
  EXIT: 'Expedição',
  IMPURITY_OUTPUT: 'Saída de impureza',
};

export const TICKET_STATUS_LABELS: Record<GrainTicketStatus, string> = {
  WAITING_FIRST_WEIGHT: 'Aguardando 1ª pesagem',
  WAITING_DISCOUNTS: 'Aguardando descontos',
  WAITING_SECOND_WEIGHT: 'Aguardando 2ª pesagem',
  SECOND_WEIGHED: 'Pronto para fechamento',
  CLOSED: 'Fechado',
  CANCELED: 'Cancelado',
};

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  OW: 'Próprio',
  TP: 'Terceiro',
};

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  CONVENTIONAL_SILO: 'Silo convencional',
  SILO_BAG: 'Silo bolsa',
  WAREHOUSE: 'Armazém',
  OTHER: 'Outro',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberto',
  PARTIAL: 'Parcial',
  SUSPENDED: 'Suspenso',
  CANCELED: 'Cancelado',
  FINISHED: 'Finalizado',
};

export const AUTHORIZATION_STATUS_LABELS: Record<AuthorizationStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  USED: 'Utilizada',
};

export const AUTHORIZATION_OPERATION_LABELS: Record<string, string> = {
  MANUAL_WEIGHT: 'Peso manual',
  EXTRA_DISCOUNT: 'Desconto excepcional',
  MULTIPLE_CONTRACT_SHIPMENT: 'Expedição com múltiplos contratos',
  CANCEL_TICKET: 'Cancelamento de ticket',
  CHANGE_CONTRACT: 'Alteração de contrato',
  CHANGE_CONTRACT_STATUS: 'Alteração de situação do contrato',
  CONTRACT_TO_CONTRACT_TRANSFER: 'Transferência entre contratos',
  REVERSE_CONTRACT_TRANSFER: 'Estorno de transferência',
  BALANCE_ASSIGNMENT: 'Cessão de saldo',
  STOCK_ADJUSTMENT: 'Ajuste de estoque',
  REVERSE_TECHNICAL_LOSS: 'Estorno de quebra técnica',
};

export const CALCULATION_METHOD_LABELS: Record<DiscountCalculationMethod, string> = {
  MANUAL: 'Manual',
  FORMULA: 'Fórmula',
};

export const WEIGHING_STAGE_LABELS: Record<WeighingStage, string> = {
  FIRST: '1ª pesagem',
  SECOND: '2ª pesagem',
};

export const WEIGHING_SOURCE_LABELS: Record<WeighingSource, string> = {
  AUTOMATIC: 'Automática',
  MANUAL: 'Manual',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Saída',
  IMPURITY_OUTPUT: 'Saída de impureza',
  TECHNICAL_LOSS: 'Quebra técnica',
  ADJUSTMENT: 'Ajuste',
  ASSIGNMENT: 'Cessão',
  CONTRACT_TRANSFER: 'Transferência para contrato',
  CONTRACT_TRANSFER_REVERSAL: 'Estorno de transferência',
  REVERSAL: 'Estorno',
};

export const labelOr = (map: Record<string, string>, value?: string | null): string =>
  (value && map[value]) || value || '-';
