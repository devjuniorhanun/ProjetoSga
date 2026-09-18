import api from './api';
import { unwrapItem, unwrapList, unwrapMeta, type PaginationMeta, type QueryParams } from './api-services-grain';
import type {
  EntryInvoice,
  EntryInvoicePayload,
  EntryInvoiceFreight,
  FreightPayment,
  FreightPaymentPayload,
  PurchaseReturn,
  PurchaseReturnPayload,
  XmlImportPreview,
} from '@/types/fiscal';

/** Endpoints oficiais do backend Laravel para o módulo fiscal. */
export const FISCAL_BASE = '/releases/fiscal';
export const ENTRY_INVOICES_ENDPOINT = `${FISCAL_BASE}/entry-invoices`;
export const FISCAL_FREIGHTS_ENDPOINT = `${FISCAL_BASE}/freights`;
export const FREIGHT_PAYMENTS_ENDPOINT = `${FISCAL_BASE}/freight-payments`;
export const PURCHASE_RETURNS_ENDPOINT = `${FISCAL_BASE}/purchase-returns`;
export const IMPORT_ITEMS_ENDPOINT = `${FISCAL_BASE}/import-items`;

export interface ListResult<T> {
  items: T[];
  meta?: PaginationMeta;
}

export const entryInvoicesService = {
  endpoint: ENTRY_INVOICES_ENDPOINT,
  list: async (params?: QueryParams): Promise<ListResult<EntryInvoice>> => {
    const { data } = await api.get(ENTRY_INVOICES_ENDPOINT, { params });
    return { items: unwrapList<EntryInvoice>(data), meta: unwrapMeta(data) };
  },
  getById: async (id: string): Promise<EntryInvoice> => {
    const { data } = await api.get(`${ENTRY_INVOICES_ENDPOINT}/${id}`);
    return unwrapItem<EntryInvoice>(data);
  },
  create: async (payload: EntryInvoicePayload): Promise<EntryInvoice> => {
    const { data } = await api.post(ENTRY_INVOICES_ENDPOINT, payload);
    return unwrapItem<EntryInvoice>(data);
  },
  update: async (id: string, payload: Partial<EntryInvoicePayload>): Promise<EntryInvoice> => {
    const { data } = await api.put(`${ENTRY_INVOICES_ENDPOINT}/${id}`, payload);
    return unwrapItem<EntryInvoice>(data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${ENTRY_INVOICES_ENDPOINT}/${id}`);
  },
  /** Confirma a nota: gera estoque e parcelas financeiras no backend. */
  confirm: async (id: string): Promise<EntryInvoice> => {
    const { data } = await api.post(`${ENTRY_INVOICES_ENDPOINT}/${id}/confirm`);
    return unwrapItem<EntryInvoice>(data);
  },
  /** Prévia do XML (multipart). Nunca confirma a nota automaticamente. */
  previewXml: async (file: File): Promise<XmlImportPreview> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`${ENTRY_INVOICES_ENDPOINT}/import/xml/preview`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapItem<XmlImportPreview>(data);
  },
  /** Relaciona um item importado do XML a um produto do cadastro. */
  linkImportItem: async (importItemId: string, productId: string, supplierProductId?: string) => {
    const { data } = await api.post(`${IMPORT_ITEMS_ENDPOINT}/${importItemId}/link-product`, {
      product_id: productId,
      supplier_product_id: supplierProductId,
    });
    return unwrapItem(data);
  },
};

export const fiscalFreightsService = {
  endpoint: FISCAL_FREIGHTS_ENDPOINT,
  list: async (params?: QueryParams): Promise<ListResult<EntryInvoiceFreight>> => {
    const { data } = await api.get(FISCAL_FREIGHTS_ENDPOINT, { params });
    return { items: unwrapList<EntryInvoiceFreight>(data), meta: unwrapMeta(data) };
  },
};

export const freightPaymentsService = {
  endpoint: FREIGHT_PAYMENTS_ENDPOINT,
  list: async (params?: QueryParams): Promise<ListResult<FreightPayment>> => {
    const { data } = await api.get(FREIGHT_PAYMENTS_ENDPOINT, { params });
    return { items: unwrapList<FreightPayment>(data), meta: unwrapMeta(data) };
  },
  create: async (payload: FreightPaymentPayload): Promise<FreightPayment> => {
    const { data } = await api.post(FREIGHT_PAYMENTS_ENDPOINT, payload);
    return unwrapItem<FreightPayment>(data);
  },
};

export const purchaseReturnsService = {
  endpoint: PURCHASE_RETURNS_ENDPOINT,
  list: async (params?: QueryParams): Promise<ListResult<PurchaseReturn>> => {
    const { data } = await api.get(PURCHASE_RETURNS_ENDPOINT, { params });
    return { items: unwrapList<PurchaseReturn>(data), meta: unwrapMeta(data) };
  },
  getById: async (id: string): Promise<PurchaseReturn> => {
    const { data } = await api.get(`${PURCHASE_RETURNS_ENDPOINT}/${id}`);
    return unwrapItem<PurchaseReturn>(data);
  },
  create: async (payload: PurchaseReturnPayload): Promise<PurchaseReturn> => {
    const { data } = await api.post(PURCHASE_RETURNS_ENDPOINT, payload);
    return unwrapItem<PurchaseReturn>(data);
  },
  /** Confirmar devolução altera apenas o estoque — não gera conta a pagar. */
  confirm: async (id: string): Promise<PurchaseReturn> => {
    const { data } = await api.post(`${PURCHASE_RETURNS_ENDPOINT}/${id}/confirm`);
    return unwrapItem<PurchaseReturn>(data);
  },
};
