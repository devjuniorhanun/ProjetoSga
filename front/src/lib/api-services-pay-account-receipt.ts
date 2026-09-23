import api from './api';

export interface PayAccountReceiptParty {
  name?: string;
  cpf_cnpj?: string;
  document?: string;
  address?: string;
  farm?: string;
  farm_name?: string;
}

export interface PayAccountReceiptBankAccount {
  bank_name?: string;
  agency_number?: string;
  account_number?: string;
  operation_number?: string;
  account_type?: string;
  pix_key?: string;
}

export interface PayAccountReceipt {
  receipt_number: string;
  document_number?: string;
  document_date?: string;
  description?: string;
  value: number | string;
  is_monetary: boolean;
  unit?: string | null;
  payment_method?: string | {
    id?: string | number;
    name?: string;
    abbreviation?: string;
  };
  payer?: PayAccountReceiptParty | null;
  payee?: PayAccountReceiptParty | null;
  bank_account?: PayAccountReceiptBankAccount | null;
  crop?: { id?: string; name?: string } | null;
  logo_url?: string | null;
}

export const payAccountReceiptService = {
  get: async (payAccountId: string): Promise<PayAccountReceipt> => {
    const { data } = await api.get(`/releases/financial/pay-accounts/${payAccountId}/receipt`);
    return (data?.data ?? data) as PayAccountReceipt;
  },
};
