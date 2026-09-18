/** Relatórios financeiros de contas pagas. Todos os totais vêm do backend. */

export type PaidAccountSectionCode =
  | 'ALL'
  | 'PAYROLL'
  | 'ADVANCE'
  | 'CASH'
  | 'CHECK'
  | 'BOLETO'
  | 'TRANSFER'
  | 'OTHER';

export type PaidAccountGroupBy = 'SUPPLIER' | 'COST_CENTER' | 'PAYMENT_TYPE';
export type PaidAccountOrderBy = 'NAME_ASC' | 'VALUE_ASC' | 'VALUE_DESC';

export interface PaidAccountReportFilterValues {
  date_from: string;
  date_to: string;
  producer_id?: string;
  administrative_center_id?: string;
  cost_center_id?: string;
  supplier_id?: string;
  type_pay_account_id?: string;
  accounted_for?: 'N' | 'S';
  status?: 'CA' | 'CO' | 'RI' | 'FA';
  entry_type?: 'ACCOUNT' | 'PAYROLL';
  section?: PaidAccountSectionCode;
  group_by?: PaidAccountGroupBy;
  order_by?: PaidAccountOrderBy;
  agricultural_year_id?: string;
  crop_id?: string;
}

export interface PaidAccountReportItem {
  id: string;
  supplier_name?: string;
  producer_name?: string;
  administrative_center_name?: string;
  cost_center_name?: string;
  type_pay_account_name?: string;
  type_pay_account_abbreviation?: string;
  document_number?: string;
  document_date?: string;
  due_date?: string;
  description?: string;
  value: number;
  accounted_for?: 'N' | 'S';
  status?: string;
  entry_type?: string;
  source_type?: string | null;
  source_id?: string | null;
  crop_id?: string | null;
  crop_name?: string | null;
  agricultural_year_id?: string | null;
  agricultural_year_name?: string | null;
}

export interface PaidAccountReportSupplier {
  supplier_id: string;
  supplier_name?: string;
  total: number;
  items: PaidAccountReportItem[];
}

export interface PaidAccountReportSection {
  code: string;
  name: string;
  payments_count: number;
  total: number;
  suppliers: PaidAccountReportSupplier[];
}

export interface PaidAccountReconciliation {
  reconciled: boolean;
  difference?: number;
  message?: string;
  [key: string]: unknown;
}

export interface PaidAccountAnalyticalReport {
  report: string;
  period?: { date_from?: string; date_to?: string };
  filters?: Record<string, unknown>;
  generated_at?: string;
  summary: {
    payments_count: number;
    suppliers_count: number;
    grand_total: number;
    accounted_total: number;
    not_accounted_total: number;
  };
  sections: PaidAccountReportSection[];
  reconciliation?: PaidAccountReconciliation;
  agricultural_year?: { id: string; name: string };
  crop?: { id: string; name: string };
}

export interface PaidAccountDimensionRow {
  id: string;
  name: string;
  code?: string;
  payments_count: number;
  total: number;
  percentage: number;
}

export interface PaidAccountByCostCenterReport {
  report: string;
  period?: { date_from?: string; date_to?: string };
  filters?: Record<string, unknown>;
  generated_at?: string;
  summary: {
    payments_count: number;
    cost_centers_count: number;
    suppliers_count: number;
    accounts_total: number;
    payroll_total: number;
    grand_total: number;
  };
  by_cost_center: PaidAccountDimensionRow[];
  by_payment_type: PaidAccountDimensionRow[];
  by_status: PaidAccountDimensionRow[];
  by_entry_type: PaidAccountDimensionRow[];
  reconciliation?: PaidAccountReconciliation;
}

export interface PaidAccountCropOption {
  id: string;
  name: string;
  status?: 'A' | 'I';
  agricultural_year_id?: string;
}

export interface PaidAccountCropOptions {
  selected_agricultural_year_id?: string | null;
  selected_crop_id?: string | null;
  agricultural_years: PaidAccountCropOption[];
  crops: PaidAccountCropOption[];
}
