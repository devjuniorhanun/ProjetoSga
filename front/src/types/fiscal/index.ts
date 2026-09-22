/** Tipos do módulo fiscal, estoque unificado, fretes e saídas de produtos. */

export type FiscalEntryType = 'FUEL' | 'LUBRICANT' | 'DEFENSIVE' | 'INPUT' | 'GENERAL' | 'SEED';

export type EntryMethod = 'MANUAL' | 'XML_IMPORT' | 'EXTERNAL_API';

export type FreightResponsibility = 'NO_FREIGHT' | 'ALREADY_PAID' | 'FARM_PAYABLE';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED';

export interface InvoiceItemDestination {
  id?: string;
  stock_location_id?: string | null;
  stock_location_name?: string;
  plot_field_id?: string | null;
  plot_field_name?: string;
  fuel_station_id?: string | null;
  batch?: string | null;
  lot_number?: string | null;
  manufacturing_date?: string | null;
  expiration_date?: string | null;
  culture_id?: string | null;
  variety_culture_id?: string | null;
  sieve?: string | null;
  quantity: number;
}

export interface EntryInvoiceItem {
  id?: string;
  entry_invoice_id?: string;
  product_id: string;
  product_name?: string;
  supplier_product_id?: string | null;
  supplier_product_code?: string | null;
  description: string;
  ncm?: string | null;
  cfop?: string | null;
  unit: string;
  quantity: number;
  unit_value: number;
  discount_value?: number;
  addition_value?: number;
  other_expenses_value?: number;
  total_value?: number;
  destinations: InvoiceItemDestination[];
  allocations?: InvoiceItemDestination[];
  seed_lots?: InvoiceItemDestination[];
}

export interface EntryInvoiceInstallment {
  id?: string;
  entry_invoice_id?: string;
  document_number: string;
  due_date: string;
  value: number;
  pay_account_id?: string | null;
  status?: string;
}

export interface EntryInvoiceFreight {
  id?: string;
  entry_invoice_id?: string;
  product_id?: string | null;
  product_name?: string;
  crop_id?: string | null;
  crop_name?: string;
  supplier_id?: string | null;
  carrier_name?: string;
  freight_rate_id?: string | null;
  driver_name?: string | null;
  driver_document?: string | null;
  driver_phone?: string | null;
  plate?: string | null;
  invoice_weight?: number | null;
  value_per_ton?: number | null;
  total_value?: number | null;
  paid_value?: number | null;
  balance_value?: number | null;
}

export interface EntryInvoiceFreightPayload {
  product_id: string;
  crop_id: string;
  carrier_id: string;
  freight_rate_id?: string | null;
  driver_name?: string | null;
  driver_cpf?: string | null;
  driver_phone?: string | null;
  vehicle_plate?: string | null;
  invoice_weight: number;
  value_per_ton: number;
}

export interface EntryInvoice {
  id: string;
  entry_type: FiscalEntryType;
  entry_method: EntryMethod;
  status: InvoiceStatus;
  supplier_id: string;
  supplier_name?: string;
  producer_id: string;
  producer_name?: string;
  administrative_center_id: string;
  administrative_center_name?: string;
  cost_center_id: string;
  cost_center_name?: string;
  farm_id?: string | null;
  farm_name?: string;
  /** Safra vinculada à nota (usada nos relatórios e nos fretes). */
  crop_id?: string | null;
  crop_name?: string;
  access_key?: string | null;
  document_model?: string | null;
  invoice_number: string;
  series?: string | null;
  issue_date: string;
  entry_date: string;
  operation_nature?: string | null;
  products_value: number;
  freight_value: number;
  insurance_value: number;
  discount_value: number;
  other_expenses_value: number;
  invoice_total: number;
  freight_responsibility: FreightResponsibility;
  observation?: string | null;
  items?: EntryInvoiceItem[];
  installments?: EntryInvoiceInstallment[];
  freight?: EntryInvoiceFreight | null;
  freights?: EntryInvoiceFreight[];
}

export type EntryInvoiceItemPayload = Omit<EntryInvoiceItem, 'destinations'>;

export type EntryInvoicePayload = Omit<
  EntryInvoice,
  | 'id'
  | 'status'
  | 'supplier_name'
  | 'producer_name'
  | 'administrative_center_name'
  | 'cost_center_name'
  | 'farm_name'
  | 'items'
  | 'freight'
  | 'freights'
> & {
  items: EntryInvoiceItemPayload[];
  freights?: EntryInvoiceFreightPayload[];
};

export interface XmlImportItem {
  id: string;
  supplier_product_code?: string | null;
  description: string;
  ncm?: string | null;
  cfop?: string | null;
  unit?: string | null;
  quantity: number;
  unit_value: number;
  product_id?: string | null;
  product_name?: string | null;
  linked: boolean;
}

export interface XmlImportPreview {
  access_key?: string | null;
  invoice_number?: string | null;
  series?: string | null;
  issue_date?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  supplier_document?: string | null;
  invoice_total?: number | null;
  items: XmlImportItem[];
  warnings?: string[];
  errors?: string[];
}

export interface FreightPaymentInvoice {
  entry_invoice_id: string;
  invoice_number?: string;
  issue_date?: string;
  total_value: number;
  paid_value: number;
  balance_value: number;
}

export interface FreightPaymentItemPayload {
  entry_invoice_id: string;
  value: number;
}

export interface FreightPaymentPayload {
  supplier_id: string;
  product_id?: string | null;
  payment_date: string;
  type_pay_account_id?: string | null;
  document_number?: string | null;
  observation?: string | null;
  items: FreightPaymentItemPayload[];
}

export interface FreightPayment {
  id: string;
  supplier_id: string;
  carrier_name?: string;
  product_id?: string | null;
  product_name?: string;
  payment_date: string;
  total_value: number;
  pay_account_id?: string | null;
  items?: FreightPaymentItemPayload[];
}

export interface PurchaseReturnItem {
  id?: string;
  entry_invoice_item_id: string;
  product_id?: string;
  product_name?: string;
  product_stock_id?: string | null;
  quantity: number;
  unit_value?: number;
}

export interface PurchaseReturn {
  id: string;
  entry_invoice_id: string;
  invoice_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  return_date: string;
  status: InvoiceStatus;
  reason?: string | null;
  total_value?: number;
  items?: PurchaseReturnItem[];
}

export type PurchaseReturnPayload = {
  entry_invoice_id: string;
  return_date: string;
  reason?: string | null;
  items: PurchaseReturnItem[];
};

export interface InventoryBalance {
  id: string;
  product_id: string;
  product_name?: string;
  stock_location_id?: string | null;
  stock_location_name?: string;
  batch?: string | null;
  treatment?: string | null;
  quantity: number;
  reserved_quantity?: number;
  available_quantity?: number;
  average_cost?: number;
  total_quantity?: number;
  unit?: string | null;
}

export interface InventoryMovement {
  id: string;
  occurred_at: string;
  movement_type: string;
  product_id: string;
  product_name?: string;
  stock_location_id?: string | null;
  stock_location_name?: string;
  quantity: number;
  balance_after?: number;
  unit_cost?: number;
  origin_type?: string | null;
  origin_id?: string | null;
  user_name?: string;
}

export type ProductOutputType = 'SALE' | 'LOAN' | 'DONATION';

export interface ProductOutputItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_stock_id: string;
  stock_location_name?: string;
  quantity: number;
  unit_value: number;
  returned_quantity?: number;
}

export interface ProductOutput {
  id: string;
  output_type: ProductOutputType;
  output_date: string;
  status: InvoiceStatus;
  supplier_id?: string | null;
  supplier_name?: string;
  recipient_name?: string | null;
  expected_return_date?: string | null;
  observation?: string | null;
  total_value?: number;
  items?: ProductOutputItem[];
}

export type ProductOutputPayload = {
  output_type: ProductOutputType;
  output_date: string;
  supplier_id?: string | null;
  recipient_name?: string | null;
  expected_return_date?: string | null;
  observation?: string | null;
  items: ProductOutputItem[];
};

export interface ProductOutputReturnPayload {
  return_date: string;
  items: { product_output_item_id: string; quantity: number }[];
  observation?: string | null;
}
