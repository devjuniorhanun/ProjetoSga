import api from './api';
import type { BankSupplier } from './api-services-bank';

export interface TypePayAccount {
  id: string;
  name: string;
  abbreviation: string;
  status: 'A' | 'I';
}

export type PayAccountStatus = 'CA' | 'CO' | 'RI' | 'FA';
export type AccountedFor = 'N' | 'S';
export type PayAccountEntryType =
  | 'ACCOUNT'
  | 'PAYROLL'
  | 'HARVESTER_ADVANCE'
  | 'TRANSPORTER_ADVANCE';

export const PAY_ACCOUNT_STATUS_LABELS: Record<PayAccountStatus, string> = {
  CA: 'CAIXA',
  CO: 'COMÉRCIO',
  RI: 'RIBEIRÃO',
  FA: 'FAZENDA',
};

export const ENTRY_TYPE_LABELS: Record<PayAccountEntryType, string> = {
  ACCOUNT: 'Contas Pagas',
  PAYROLL: 'Folha de Pagamento',
  HARVESTER_ADVANCE: 'Adiantamento de Colhedor',
  TRANSPORTER_ADVANCE: 'Adiantamento de Transportador',
};


export interface PayAccount {
  id: string;
  administrative_center_id: string;
  cost_center_id: string;
  supplier_id: string;
  producer_id: string;
  type_pay_account_id: string;
  document_number: string;
  document_date: string;
  due_date: string;
  description: string;
  value: number;
  accounted_for: AccountedFor;
  status: PayAccountStatus;
  entry_type: PayAccountEntryType;
  administrative_center_name?: string;
  cost_center_name?: string;
  supplier_name?: string;
  supplier_cpf_cnpj?: string;
  producer_name?: string;
  farm_name?: string;
  type_pay_account_name?: string;
  type_pay_account_abbreviation?: string;
  /** Vínculo opcional com ano agrícola e safra. */
  agricultural_year_id?: string | null;
  agricultural_year_name?: string | null;
  crop_id?: string | null;
  crop_name?: string | null;
  administrative_center?: Record<string, any>;
  cost_center?: Record<string, any>;
  supplier?: Record<string, any>;
  producer?: Record<string, any>;
  type_pay_account?: Record<string, any>;
  bank_suppliers?: BankSupplier[];
  authorized_by?: string;
  /** Preenchidos pelo backend quando o registro nasce de outro módulo. */
  source_type?: string | null;
  source_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PayAccountPayload = {
  /** Safra obrigatória em todo lançamento de conta paga. */
  crop_id: string;
  administrative_center_id: string;
  cost_center_id: string;
  supplier_id: string;
  producer_id: string;
  type_pay_account_id: string;
  document_number: string;
  document_date: string;
  due_date: string;
  description: string;
  value: number;
  accounted_for: AccountedFor;
  status: PayAccountStatus;
  /** Vínculo opcional com o ano agrícola (auxilia a seleção da safra). */
  agricultural_year_id?: string | null;
};


/** A folha não envia cost_center_id, due_date nem entry_type: o backend define esses valores. */
export type PayrollPayload = Omit<PayAccountPayload, 'cost_center_id' | 'due_date'>;

export const PAY_ACCOUNTS_ENDPOINT = '/releases/financial/pay-accounts';

function unwrapList<T>(data: any): T[] {
  const result = data?.data ?? data;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function unwrapItem<T>(data: any): T {
  return (data?.data ?? data) as T;
}

/** Safe display helpers — never render objects. */
export function payAccountProducerName(item: PayAccount): string {
  return item.producer_name || (item.producer?.owner_name as string) || '';
}

export function payAccountFarmName(item: PayAccount): string {
  return (
    item.farm_name ||
    (item.administrative_center?.farm_name as string) ||
    (item.administrative_center?.farm?.name as string) ||
    ''
  );
}

export function payAccountAdministrativeCenterName(item: PayAccount): string {
  const farm = payAccountFarmName(item);
  const producer = payAccountProducerName(item);
  if (item.administrative_center_name) return item.administrative_center_name;
  if (farm && producer) return `${farm} - ${producer}`;
  return farm || (item.administrative_center?.cei as string) || String(item.administrative_center_id ?? '');
}

export function payAccountSupplierName(item: PayAccount): string {
  return (
    item.supplier_name ||
    (item.supplier?.corporate_reason as string) ||
    (item.supplier?.fantasy_name as string) ||
    ''
  );
}

export function payAccountSupplierDocument(item: PayAccount): string {
  return item.supplier_cpf_cnpj || (item.supplier?.cpf_cnpj as string) || '';
}

export function payAccountTypeName(item: PayAccount): string {
  return item.type_pay_account_name || (item.type_pay_account?.name as string) || '';
}

/** Abreviação do tipo de pagamento usada para identificar transferências. */
export const TRANSFER_TYPE_ABBREVIATION = 'TR';

export function payAccountTypeAbbreviation(item: PayAccount): string {
  return String(
    item.type_pay_account_abbreviation || (item.type_pay_account?.abbreviation as string) || ''
  ).toUpperCase();
}

export function isTransferPayAccount(item: PayAccount): boolean {
  const abbreviation = payAccountTypeAbbreviation(item);
  // Sem abreviação disponível confiamos na listagem oficial de transferências do backend.
  return abbreviation === '' || abbreviation === TRANSFER_TYPE_ABBREVIATION;
}

export function payAccountCostCenterName(item: PayAccount): string {
  return item.cost_center_name || (item.cost_center?.name as string) || '';
}

export function payAccountBankSuppliers(item: PayAccount): BankSupplier[] {
  const list = item.bank_suppliers ?? (item.supplier?.bank_suppliers as BankSupplier[]) ?? [];
  return Array.isArray(list) ? list : [];
}

export const payAccountsService = {
  getAll: async (params?: Record<string, any>): Promise<PayAccount[]> => {
    const { data } = await api.get(PAY_ACCOUNTS_ENDPOINT, { params });
    return unwrapList<PayAccount>(data);
  },
  getById: async (id: string): Promise<PayAccount> => {
    const { data } = await api.get(`${PAY_ACCOUNTS_ENDPOINT}/${id}`);
    return unwrapItem<PayAccount>(data);
  },
  create: async (payload: PayAccountPayload): Promise<PayAccount> => {
    const { data } = await api.post(PAY_ACCOUNTS_ENDPOINT, payload);
    return unwrapItem<PayAccount>(data);
  },
  update: async (id: string, payload: Partial<PayAccountPayload>): Promise<PayAccount> => {
    const { data } = await api.put(`${PAY_ACCOUNTS_ENDPOINT}/${id}`, payload);
    return unwrapItem<PayAccount>(data);
  },
  patch: async (id: string, payload: Partial<PayAccountPayload>): Promise<PayAccount> => {
    const { data } = await api.patch(`${PAY_ACCOUNTS_ENDPOINT}/${id}`, payload);
    return unwrapItem<PayAccount>(data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${PAY_ACCOUNTS_ENDPOINT}/${id}`);
  },
  getTransfers: async (date?: string): Promise<PayAccount[]> => {
    const { data } = await api.get(`${PAY_ACCOUNTS_ENDPOINT}/transfers`, {
      params: date ? { date } : undefined,
    });
    return unwrapList<PayAccount>(data);
  },
  getPayroll: async (params?: Record<string, any>): Promise<PayAccount[]> => {
    const { data } = await api.get(PAY_ACCOUNTS_ENDPOINT, {
      params: { ...(params ?? {}), entry_type: 'PAYROLL' },
    });
    return unwrapList<PayAccount>(data);
  },
  /** O backend fixa entry_type=PAYROLL, cost_center_id=1 e due_date=document_date. */
  createPayroll: async (payload: PayrollPayload): Promise<PayAccount> => {
    const { data } = await api.post(`${PAY_ACCOUNTS_ENDPOINT}/payroll`, payload);
    return unwrapItem<PayAccount>(data);
  },
};

function createCrudService<T extends { id: string }>(endpoint: string) {
  return {
    getAll: async (): Promise<T[]> => {
      const { data } = await api.get(endpoint);
      return unwrapList<T>(data);
    },
    getById: async (id: string): Promise<T> => {
      const { data } = await api.get(`${endpoint}/${id}`);
      return unwrapItem<T>(data);
    },
    create: async (payload: Omit<T, 'id'>): Promise<T> => {
      const { data } = await api.post(endpoint, payload);
      return unwrapItem<T>(data);
    },
    update: async (id: string, payload: Partial<T>): Promise<T> => {
      const { data } = await api.put(`${endpoint}/${id}`, payload);
      return unwrapItem<T>(data);
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}

export const typePayAccountsService = createCrudService<TypePayAccount>(
  '/registrations/financial/type-pay-accounts'
);
