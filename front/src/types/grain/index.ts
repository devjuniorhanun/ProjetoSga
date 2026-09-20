/**
 * Tipos do módulo de Balança e Armazém de Grãos.
 * Todos os IDs são string no frontend (o interceptor converte para number no envio).
 */

export type ActiveStatus = 'A' | 'I';
export type OwnershipType = 'OW' | 'TP';
export type GrainOperationType = 'ENTRY' | 'EXIT' | 'IMPURITY_OUTPUT';

export type GrainTicketStatus =
  | 'WAITING_FIRST_WEIGHT'
  | 'WAITING_DISCOUNTS'
  | 'WAITING_SECOND_WEIGHT'
  | 'SECOND_WEIGHED'
  | 'CLOSED'
  | 'CANCELED';

export type StorageType = 'CONVENTIONAL_SILO' | 'SILO_BAG' | 'WAREHOUSE' | 'OTHER';
export type DiscountCalculationMethod = 'MANUAL' | 'FORMULA';
export type ContractStatus = 'DRAFT' | 'OPEN' | 'PARTIAL' | 'SUSPENDED' | 'CANCELED' | 'FINISHED';
export type AuthorizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'USED';
export type WeighingStage = 'FIRST' | 'SECOND';
export type WeighingSource = 'AUTOMATIC' | 'MANUAL';

export type GrainAuthorizationOperation =
  | 'MANUAL_WEIGHT'
  | 'EXTRA_DISCOUNT'
  | 'MULTIPLE_CONTRACT_SHIPMENT'
  | 'CANCEL_TICKET'
  | 'CHANGE_CONTRACT'
  | 'CHANGE_CONTRACT_STATUS'
  | 'CONTRACT_TO_CONTRACT_TRANSFER'
  | 'REVERSE_CONTRACT_TRANSFER'
  | 'BALANCE_ASSIGNMENT'
  | 'STOCK_ADJUSTMENT'
  | 'REVERSE_TECHNICAL_LOSS';

/** Lista paginada padrão do Laravel. */
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface GrainScale {
  id: string;
  name: string;
  code: string;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  location?: string | null;
  status: ActiveStatus;
  notes?: string | null;
}

export interface SerialConfiguration {
  baud_rate?: number;
  data_bits?: number;
  parity?: string;
  stop_bits?: number;
  protocol?: string;
  connection_type?: 'RS232' | 'RS485';
  [key: string]: unknown;
}

export interface GrainScaleChannel {
  id: string;
  grain_scale_id: string;
  grain_scale_name?: string;
  code: string;
  description?: string | null;
  maximum_weight: number;
  minimum_weight: number;
  division_weight: number;
  unit: 'kg';
  serial_configuration?: SerialConfiguration | null;
  status: ActiveStatus;
  scale?: { id: string; name: string } | null;
}

export interface GrainWarehouse {
  id: string;
  name: string;
  code: string;
  producer_id?: string | null;
  producer_name?: string | null;
  address?: string | null;
  status: ActiveStatus;
  notes?: string | null;
}

export interface GrainStorageLocation {
  id: string;
  grain_warehouse_id: string;
  grain_warehouse_name?: string | null;
  name: string;
  code: string;
  storage_type: StorageType;
  capacity?: number | null;
  status: ActiveStatus;
  notes?: string | null;
}

export interface GrainTransportDriver {
  id: string;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  status: ActiveStatus;
  notes?: string | null;
}

export interface GrainTransportTruck {
  id: string;
  license_plate: string;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  maximum_gross_weight: number;
  status: ActiveStatus;
  notes?: string | null;
}

export interface FarmStateRegistration {
  id: string;
  producer_id: string;
  farm_id: string;
  state_registration: string;
  description?: string | null;
  status: ActiveStatus;
  producer_name?: string | null;
  farm_name?: string | null;
}

export interface GrainImpurityType {
  id: string;
  name: string;
  code: string;
  measurement_unit: 'KG';
  requires_destination: boolean;
  status: ActiveStatus;
  description?: string | null;
}

export interface GrainDiscountType {
  id: string;
  culture_id: string;
  culture_name?: string | null;
  name: string;
  code: string;
  measurement_type: 'PERCENTAGE';
  measurement_unit: 'PERCENT';
  calculation_method: DiscountCalculationMethod;
  affects_commercial_weight: boolean;
  generates_impurity: boolean;
  grain_impurity_type_id?: string | null;
  display_order: number;
  status: ActiveStatus;
  description?: string | null;
}

export interface GrainTechnicalLossConfig {
  id: string;
  producer_id: string;
  producer_name?: string | null;
  culture_id: string;
  culture_name?: string | null;
  monthly_percentage: number;
  effective_from: string;
  effective_until?: string | null;
  status: ActiveStatus;
}

export interface GrainScaleReading {
  id: string;
  grain_scale_id: string;
  grain_scale_channel_id: string;
  node_code: string;
  sequence: number;
  weight: number;
  unit: 'kg';
  stable: boolean;
  raw_message?: string | null;
  read_at: string;
}

export interface GrainTicketWeighing {
  id?: string;
  stage: WeighingStage;
  source: WeighingSource;
  weight: number;
  grain_scale_id?: string | null;
  grain_scale_name?: string | null;
  grain_scale_channel_id?: string | null;
  grain_scale_channel_code?: string | null;
  weighed_at?: string | null;
  user_name?: string | null;
}

export interface GrainTicketDiscount {
  id?: string;
  grain_discount_type_id: string;
  grain_discount_type_name?: string | null;
  percentage: number;
  discount_weight?: number | null;
  justification?: string | null;
}

export interface GrainTicketAllocation {
  id?: string;
  grain_contract_id: string;
  contract_number?: string | null;
  allocated_weight: number;
  ticket_id?: string | null;
  ticket_number?: string | null;
}

export interface GrainTicket {
  id: string;
  ticket_number?: string | null;
  operation_type: GrainOperationType;
  ownership_type: OwnershipType;
  flow_type?: string;
  status: GrainTicketStatus;
  producer_id: string;
  producer_name?: string | null;
  farm_id: string;
  farm_name?: string | null;
  farm_state_registration_id: string;
  state_registration?: string | null;
  crop_id: string;
  crop_name?: string | null;
  culture_id: string;
  culture_name?: string | null;
  buyer_id?: string | null;
  buyer_name?: string | null;
  grain_warehouse_id: string;
  grain_warehouse_name?: string | null;
  grain_storage_location_id: string;
  grain_storage_location_name?: string | null;
  grain_transport_driver_id?: string | null;
  grain_transport_driver_name?: string | null;
  grain_transport_truck_id: string;
  license_plate?: string | null;
  maximum_gross_weight?: number | null;
  first_weight?: number | null;
  second_weight?: number | null;
  gross_weight?: number | null;
  tare_weight?: number | null;
  net_weight?: number | null;
  quality_discount_weight?: number | null;
  commercial_net_weight?: number | null;
  pending_impurity_weight?: number | null;
  notes?: string | null;
  cancel_reason?: string | null;
  verification_code?: string | null;
  weighings?: GrainTicketWeighing[];
  discounts?: GrainTicketDiscount[];
  allocations?: GrainTicketAllocation[];
  children?: GrainTicket[];
  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
}

export interface GrainTicketPayload {
  operation_type: GrainOperationType;
  ownership_type: OwnershipType;
  producer_id: string;
  farm_id: string;
  farm_state_registration_id: string;
  crop_id: string;
  culture_id: string;
  buyer_id: string | null;
  grain_warehouse_id: string;
  grain_storage_location_id: string;
  grain_transport_driver_id: string | null;
  grain_transport_truck_id: string;
  notes: string | null;
}

export interface CaptureWeightAutomaticPayload {
  stage: WeighingStage;
  source: 'AUTOMATIC';
  reading_id: string;
}

export interface CaptureWeightManualPayload {
  stage: WeighingStage;
  source: 'MANUAL';
  weight: number;
  grain_scale_id: string;
  grain_scale_channel_id: string;
  authorization_request_id: string;
}

export type CaptureWeightPayload = CaptureWeightAutomaticPayload | CaptureWeightManualPayload;

export interface SaveDiscountsPayload {
  discounts: Array<{
    grain_discount_type_id: string;
    percentage: number;
    discount_weight: number | null;
    justification: string | null;
  }>;
  authorization_request_id: string | null;
}

export interface ContractAllocationPreviewItem {
  grain_contract_id: string;
  contract_number?: string | null;
  allocated_weight: number;
  available_weight?: number | null;
  will_finish?: boolean;
}

export interface AvailableContractsPreview {
  ticket_id: string;
  commercial_net_weight: number;
  allocations: ContractAllocationPreviewItem[];
  notices: string[];
  missing_weight: number;
  can_close: boolean;
  requires_authorization: boolean;
}

export interface ImpurityItemPayload {
  grain_impurity_type_id: string;
  source_entry_ticket_id: string;
  quantity: number;
}

export interface CloseTicketPayload {
  authorization_request_id?: string | null;
  operator_name?: string;
  vehicle_description?: string | null;
  destination?: string | null;
  impurity_items?: ImpurityItemPayload[];
}

export interface GrainBuyer {
  id: string;
  name: string;
  cpf_cnpj?: string | null;
}

export interface GrainContract {
  id: string;
  contract_number: string;
  buyer_id: string;
  buyer_name?: string | null;
  producer_id: string;
  producer_name?: string | null;
  farm_state_registration_id: string;
  state_registration?: string | null;
  crop_id: string;
  crop_name?: string | null;
  culture_id: string;
  culture_name?: string | null;
  ownership_type: OwnershipType;
  contract_date?: string | null;
  start_date?: string | null;
  expiration_date?: string | null;
  contracted_weight: number;
  tolerance_percentage: number;
  transferred_weight?: number;
  shipped_weight?: number;
  status: ContractStatus;
  notes?: string | null;
  created_at?: string;
}

export interface GrainContractPayload {
  contract_number: string;
  buyer_id: string;
  producer_id: string;
  farm_state_registration_id: string;
  crop_id: string;
  culture_id: string;
  ownership_type: OwnershipType;
  contract_date: string | null;
  start_date: string | null;
  expiration_date: string | null;
  contracted_weight: number;
  tolerance_percentage: number;
  status: 'DRAFT' | 'OPEN';
  notes: string | null;
}

export interface GrainBalance {
  id: string;
  producer_id: string;
  producer_name?: string | null;
  farm_state_registration_id: string;
  state_registration?: string | null;
  crop_id: string;
  crop_name?: string | null;
  culture_id: string;
  culture_name?: string | null;
  ownership_type: OwnershipType;
  physical_balance: number;
  pending_impurity_weight: number;
  usable_physical_balance: number;
  commercial_balance: number;
  contract_balance: number;
  estimated_technical_reserve: number;
  available_for_contract: number;
}

export interface GrainStockMovement {
  id: string;
  grain_balance_id: string;
  movement_type: string;
  physical_quantity: number;
  commercial_quantity: number;
  physical_balance_before?: number | null;
  physical_balance_after?: number | null;
  commercial_balance_before?: number | null;
  commercial_balance_after?: number | null;
  origin_type?: string | null;
  origin_id?: string | null;
  reason?: string | null;
  user_name?: string | null;
  occurred_at: string;
}

export interface GrainContractTransfer {
  id: string;
  grain_balance_id: string;
  origin_contract_id?: string | null;
  origin_contract_number?: string | null;
  destination_contract_id: string;
  destination_contract_number?: string | null;
  weight: number;
  reason?: string | null;
  reversed_at?: string | null;
  user_name?: string | null;
  created_at?: string;
}

export interface GrainBalanceAssignment {
  id: string;
  origin_grain_balance_id: string;
  origin_producer_name?: string | null;
  destination_producer_id: string;
  destination_producer_name?: string | null;
  destination_farm_state_registration_id: string;
  destination_ownership_type: OwnershipType;
  weight: number;
  reason: string;
  requested_by_name?: string | null;
  authorized_by_name?: string | null;
  created_at?: string;
}

export interface GrainStockAdjustmentPayload {
  grain_balance_id: string;
  physical_quantity: number;
  commercial_quantity: number;
  reason: string;
  authorization_request_id: string;
}

export interface GrainTechnicalLoss {
  id: string;
  producer_id: string;
  producer_name?: string | null;
  culture_id: string;
  culture_name?: string | null;
  reference_year: number;
  reference_month: number;
  base_weight: number;
  percentage: number;
  loss_weight: number;
  period_start?: string | null;
  period_end?: string | null;
  reversed_at?: string | null;
  created_at?: string;
}

export interface GrainAuthorization {
  id: string;
  operation_type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  reason: string;
  payload_before?: Record<string, unknown> | null;
  payload_requested: Record<string, unknown>;
  status: AuthorizationStatus;
  expires_at?: string | null;
  requested_by_name?: string | null;
  requested_by_id?: string | null;
  reviewed_by_name?: string | null;
  review_reason?: string | null;
  created_at?: string;
}

export interface GrainAuthorizationPayload {
  operation_type: string;
  resource_type: string | null;
  resource_id: string | null;
  reason: string;
  payload_before: Record<string, unknown> | null;
  payload_requested: Record<string, unknown>;
  expires_at: string | null;
}

export interface GrainTicketPrintData {
  ticket: GrainTicket;
  [key: string]: unknown;
}
