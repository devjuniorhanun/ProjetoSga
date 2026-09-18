import api from './api';
import type {
  ServiceContract,
  ServiceContractListFilters,
  ServiceContractParticipantsResponse,
  ServiceContractPayload,
  ServiceContractPdfData,
  ServiceContractPreview,
  ServiceContractSupplierOption,
  ServiceContractType,
} from '@/types/service-contracts';

const BASE = '/registrations/supplier/service-contracts';

function unwrap<T>(payload: unknown): T {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
}

function unwrapList<T>(payload: unknown): T[] {
  const result = unwrap<unknown>(payload);
  if (Array.isArray(result)) return result as T[];
  const nested = (result as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

export const serviceContractsService = {
  endpoint: BASE,

  /** Fornecedores ativos do tipo correspondente (TRANSPORTADOR ou COLHEDOR). */
  getSuppliers: async (type: ServiceContractType): Promise<ServiceContractSupplierOption[]> => {
    const { data } = await api.get(`${BASE}/${type}/suppliers`);
    return unwrapList<ServiceContractSupplierOption>(data);
  },

  /** Participantes ativos e contas bancárias do fornecedor. */
  getParticipants: async (
    type: ServiceContractType,
    supplierId: string,
  ): Promise<ServiceContractParticipantsResponse> => {
    const { data } = await api.get(`${BASE}/${type}/suppliers/${supplierId}/participants`);
    const payload = unwrap<Partial<ServiceContractParticipantsResponse>>(data);
    return {
      participants: payload?.participants ?? [],
      bank_accounts: payload?.bank_accounts ?? [],
      bank_account: payload?.bank_account ?? null,
      bank_selection_required: payload?.bank_selection_required ?? false,
      warnings: payload?.warnings ?? [],
    };
  },

  previewBatch: async (
    type: ServiceContractType,
    payload: ServiceContractPayload,
  ): Promise<ServiceContractPreview> => {
    const { data } = await api.post(`${BASE}/${type}/preview-batch`, payload);
    const result = unwrap<Partial<ServiceContractPreview>>(data);
    return {
      can_generate: result?.can_generate ?? false,
      contracts_count: result?.contracts_count ?? 0,
      supplier: result?.supplier ?? null,
      participants: result?.participants ?? [],
      producers: result?.producers ?? [],
      bank_account: result?.bank_account ?? null,
      bank_accounts: result?.bank_accounts ?? [],
      bank_selection_required: result?.bank_selection_required ?? false,
      warnings: result?.warnings ?? [],
      errors: result?.errors ?? [],
    };
  },

  generateBatch: async (
    type: ServiceContractType,
    payload: ServiceContractPayload,
  ): Promise<ServiceContract[]> => {
    const { data } = await api.post(`${BASE}/${type}/generate-batch`, payload);
    const result = unwrap<unknown>(data);
    if (Array.isArray(result)) return result as ServiceContract[];
    const contracts = (result as { contracts?: ServiceContract[] })?.contracts;
    return Array.isArray(contracts) ? contracts : [];
  },

  /** Histórico consolidado dos dois tipos de contrato. */
  list: async (filters: ServiceContractListFilters = {}): Promise<ServiceContract[]> => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = String(value);
    });
    const { data } = await api.get(BASE, { params });
    return unwrapList<ServiceContract>(data);
  },

  /** Snapshot imutável usado na impressão. */
  getPdfData: async (
    type: ServiceContractType,
    contractId: string,
  ): Promise<ServiceContractPdfData> => {
    const { data } = await api.get(`${BASE}/${type}/${contractId}/pdf-data`);
    return unwrap<ServiceContractPdfData>(data);
  },

  uploadPdf: async (
    type: ServiceContractType,
    contractId: string,
    file: Blob,
    fileName: string,
  ): Promise<void> => {
    const form = new FormData();
    form.append('pdf', file, fileName);
    await api.post(`${BASE}/${type}/${contractId}/pdf`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadPdf: async (type: ServiceContractType, contractId: string): Promise<Blob> => {
    const { data } = await api.get(`${BASE}/${type}/${contractId}/pdf`, { responseType: 'blob' });
    return data as Blob;
  },
};

export const MAX_CONTRACT_PDF_BYTES = 10 * 1024 * 1024;
