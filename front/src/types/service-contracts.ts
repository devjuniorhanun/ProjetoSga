/**
 * Contratos de serviço (transportadores e colhedores).
 * Os campos seguem exatamente os endpoints service-contracts do backend Laravel.
 */

export type ServiceContractType = 'TRANSPORT' | 'HARVEST';

export type FuelSuppliedBy = 'CONTRACTING_PARTY' | 'CONTRACTOR';

export const FUEL_SUPPLIED_BY_LABELS: Record<FuelSuppliedBy, string> = {
  CONTRACTING_PARTY: 'Contratante',
  CONTRACTOR: 'Contratado',
};

export const SERVICE_CONTRACT_TYPE_LABELS: Record<ServiceContractType, string> = {
  TRANSPORT: 'Transportador',
  HARVEST: 'Colhedor',
};

export interface ServiceContractSupplierOption {
  supplier_id: string;
  supplier_name: string;
  cpf_cnpj?: string;
  status?: 'A' | 'I';
}

export interface ServiceContractBankAccount {
  id?: string;
  bank_supplier_id?: string;
  bank_name?: string;
  agency_number?: string;
  account_number?: string;
  operation_number?: string;
  account_type?: string;
  pix_key?: string;
  status?: 'A' | 'I';
}

export interface ServiceContractParticipant {
  id?: string;
  name?: string;
  participant_name?: string;
  cpf?: string;
  cpf_cnpj?: string;
  cnh?: string;
  plate?: string;
  vehicle?: string;
  description?: string;
  status?: 'A' | 'I';
}

export interface ServiceContractParticipantsResponse {
  participants: ServiceContractParticipant[];
  bank_accounts: ServiceContractBankAccount[];
  bank_account?: ServiceContractBankAccount | null;
  bank_selection_required?: boolean;
  warnings?: string[];
}

export interface ServiceContractProducer {
  id?: string;
  producer_id?: string;
  producer_name?: string;
  name?: string;
  cpf_cnpj?: string;
  farm_name?: string;
}

export interface ServiceContractPreview {
  can_generate: boolean;
  contracts_count: number;
  supplier?: ServiceContractSupplierOption | null;
  participants: ServiceContractParticipant[];
  producers: ServiceContractProducer[];
  bank_account?: ServiceContractBankAccount | null;
  bank_accounts: ServiceContractBankAccount[];
  bank_selection_required: boolean;
  warnings: string[];
  errors: string[];
}

export interface ServiceContract {
  id: string;
  contract_number: string;
  contract_type: ServiceContractType;
  crop_id?: string;
  crop_name?: string;
  producer_id?: string;
  producer_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  opening_date?: string;
  closing_date?: string;
  generated_at?: string;
  created_at?: string;
  has_pdf?: boolean;
  pdf_url?: string | null;
  status?: 'A' | 'I';
}

export interface ServiceContractListFilters {
  contract_number?: string;
  contract_type?: ServiceContractType | '';
  crop_id?: string;
  producer_id?: string;
  supplier_id?: string;
  status?: 'A' | 'I' | '';
  per_page?: string;
}

export interface TransportContractPayload {
  crop_id: string;
  supplier_id: string;
  bank_supplier_id?: string | null;
  opening_date: string;
  closing_date: string;
  shipping_cost: number;
  service_hours?: string;
  extra_service_description?: string;
  observations?: string;
}

export interface HarvestContractPayload {
  crop_id: string;
  supplier_id: string;
  bank_supplier_id?: string | null;
  opening_date: string;
  closing_date: string;
  remuneration_percentage: number;
  fuel_supplied_by: FuelSuppliedBy;
  meal_allowance_description?: string;
  observations?: string;
}

export type ServiceContractPayload = TransportContractPayload | HarvestContractPayload;

/** Snapshot devolvido por /pdf-data. Campos opcionais: renderização defensiva. */
export interface ServiceContractPdfData {
  contract?: Record<string, unknown>;
  contract_number?: string;
  contract_type?: ServiceContractType;
  opening_date?: string;
  closing_date?: string;
  generated_at?: string;
  shipping_cost?: number | string;
  remuneration_percentage?: number | string;
  fuel_supplied_by?: FuelSuppliedBy;
  service_hours?: string;
  extra_service_description?: string;
  meal_allowance_description?: string;
  observations?: string;
  calculation_base?: string;
  bag_weight_kg?: number | string;
  crop?: { id?: string; name?: string } | null;
  producer?: Record<string, unknown> | null;
  contracting_party?: Record<string, unknown> | null;
  supplier?: Record<string, unknown> | null;
  contractor?: Record<string, unknown> | null;
  bank_account?: ServiceContractBankAccount | null;
  participants?: ServiceContractParticipant[];
  logo_url?: string | null;
  city?: string;
  [key: string]: unknown;
}
