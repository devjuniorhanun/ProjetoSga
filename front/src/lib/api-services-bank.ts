import api from './api';

export interface BankSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  cpf_cnpj: string;
  type: 'F' | 'J' | '';
  bank_name: string;
  agency_number: string;
  account_number: string;
  operation_number: string;
  pix_key: string;
  account_type: string;
  status: 'A' | 'I';
}

/** Consulta por fornecedor (prefixo singular). */
const lookupEndpoint = '/registrations/supplier/bankSupplier';
/** CRUD canônico (prefixo plural). */
const endpoint = '/registrations/suppliers/bankSupplier';

export const bankSuppliersService = {
  lookupEndpoint,
  endpoint,
  getBySupplier: async (supplierId: string): Promise<BankSupplier[]> => {
    const { data } = await api.get(`${lookupEndpoint}/${supplierId}`);
    const result = data.data ?? data;
    return Array.isArray(result) ? result : [];
  },
  create: async (payload: Omit<BankSupplier, 'id'>): Promise<BankSupplier> => {
    const { data } = await api.post(endpoint, payload);
    return data.data ?? data;
  },
  update: async (id: string, payload: Partial<BankSupplier>): Promise<BankSupplier> => {
    const { data } = await api.put(`${endpoint}/${id}`, payload);
    return data.data ?? data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${endpoint}/${id}`);
  },
};
