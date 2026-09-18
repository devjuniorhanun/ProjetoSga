/** Tipos do módulo de serviços agrícolas gerais e tratamento de sementes. */

export type AgriculturalServiceCategory =
  | 'SOIL_PREPARATION'
  | 'INPUT_APPLICATION'
  | 'FIREBREAK_MAINTENANCE';

export type AgriculturalServiceStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export type ApplicationRateType = 'FIXED' | 'VARIABLE';

export type ApplicationRateUnit = 'KG_HA' | 'T_HA' | 'L_HA';

/** Um talhão pode repetir (uma linha por passada). Nunca aplicar distinct. */
export interface AgriculturalServiceItem {
  id?: string;
  plot_field_id: string;
  plot_field_name?: string;
  /** Área vem do cadastro do talhão — nunca é digitada. */
  area: number;
  pass_number?: number | null;
  recommended_quantity?: number | null;
  /** Taxa variável: dose por talhão/passada. */
  rate_value?: number | null;
  observation?: string | null;
}

export interface AgriculturalServiceOperator {
  id?: string;
  agricultural_service_type_id?: string | null;
  agricultural_operator_id: string;
  agricultural_operator_name?: string;
  traction_fleet_id: string;
  traction_fleet_name?: string;
  implement_fleet_id?: string | null;
  implement_fleet_name?: string;
  function: string;
}

/** Local de aceiro: talhão opcional, com área calculada por comprimento × largura. */
export interface AgriculturalServiceLocation {
  id?: string;
  plot_field_id?: string | null;
  plot_field_name?: string;
  description: string;
  length: number;
  width: number;
  area?: number | null;
}

/** Baixa de estoque: só é movimentada na conclusão do serviço. */
export interface AgriculturalServiceStockAllocation {
  id?: string;
  product_id: string;
  product_stock_id?: string | null;
  stock_location_id?: string | null;
  quantity: number;
}

export interface AgriculturalService {
  id: string;
  agricultural_service_type_id: string;
  agricultural_service_type_name?: string;
  category: AgriculturalServiceCategory;
  crop_id: string;
  crop_name?: string;
  culture_id?: string | null;
  culture_name?: string;
  farm_id?: string | null;
  farm_name?: string;
  service_date: string;
  status: AgriculturalServiceStatus;
  description?: string | null;
  /** Aplicação de insumo trabalha com um único produto. */
  product_id?: string | null;
  product_name?: string;
  rate_type?: ApplicationRateType | null;
  rate_unit?: ApplicationRateUnit | null;
  rate_value?: number | null;
  total_recommended_quantity?: number | null;
  items?: AgriculturalServiceItem[];
  operators?: AgriculturalServiceOperator[];
  locations?: AgriculturalServiceLocation[];
  stock_allocations?: AgriculturalServiceStockAllocation[];
}

export type AgriculturalServicePayload = Omit<
  AgriculturalService,
  | 'id'
  | 'status'
  | 'agricultural_service_type_name'
  | 'crop_name'
  | 'culture_name'
  | 'farm_name'
  | 'product_name'
  | 'total_recommended_quantity'
>;

export type SeedTreatmentStatus = 'DRAFT' | 'COMPLETED';

export interface SeedTreatmentSeed {
  id?: string;
  product_id: string;
  product_name?: string;
  culture_id: string;
  culture_name?: string;
  variety_id: string;
  variety_name?: string;
  /** Posição/lote de semente NÃO TRATADA. */
  product_stock_id: string;
  batch?: string | null;
  treated_quantity: number;
  unit: string;
  quantity_per_batch?: number | null;
}

export interface SeedTreatmentChemical {
  id?: string;
  product_id: string;
  product_name?: string;
  product_stock_id: string;
  dose_per_batch?: number | null;
  actual_quantity: number;
  unit: string;
}

export interface SeedTreatment {
  id: string;
  crop_id: string;
  crop_name?: string;
  culture_id: string;
  culture_name?: string;
  treatment_date: string;
  batch_count: number;
  observation?: string | null;
  status: SeedTreatmentStatus;
  seeds?: SeedTreatmentSeed[];
  chemicals?: SeedTreatmentChemical[];
}

export type SeedTreatmentPayload = Omit<
  SeedTreatment,
  'id' | 'status' | 'crop_name' | 'culture_name'
>;
