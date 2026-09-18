import type {
  EntryMethod,
  FiscalEntryType,
  FreightResponsibility,
  InvoiceStatus,
  ProductOutputType,
} from '@/types/fiscal';

export const ENTRY_TYPE_LABELS: Record<FiscalEntryType, string> = {
  FUEL: 'Combustível',
  LUBRICANT: 'Lubrificante',
  DEFENSIVE: 'Defensivo',
  INPUT: 'Insumo',
  GENERAL: 'Geral',
  SEED: 'Semente',
};

/** Segmento de rota usado nas telas especializadas. */
export const ENTRY_TYPE_SLUGS: Record<string, FiscalEntryType> = {
  fuel: 'FUEL',
  lubricant: 'LUBRICANT',
  defensive: 'DEFENSIVE',
  input: 'INPUT',
  general: 'GENERAL',
  seed: 'SEED',
};

export const ENTRY_METHOD_LABELS: Record<EntryMethod, string> = {
  MANUAL: 'Manual',
  XML_IMPORT: 'Importação XML',
  EXTERNAL_API: 'API externa',
};

export const FREIGHT_RESPONSIBILITY_LABELS: Record<FreightResponsibility, string> = {
  NO_FREIGHT: 'Sem frete',
  ALREADY_PAID: 'Frete já pago',
  FARM_PAYABLE: 'Frete a pagar pela fazenda',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Rascunho',
  CONFIRMED: 'Confirmada',
  CANCELED: 'Cancelada',
};

export const OUTPUT_TYPE_LABELS: Record<ProductOutputType, string> = {
  SALE: 'Venda',
  LOAN: 'Empréstimo',
  DONATION: 'Doação',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRY: 'Entrada',
  OUTPUT: 'Saída',
  RETURN: 'Devolução',
  LOAN_RETURN: 'Retorno de empréstimo',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferência',
  CONSUMPTION: 'Consumo',
};

export function labelOr(map: Record<string, string>, key?: string | null): string {
  if (!key) return '-';
  return map[key] ?? key;
}

export function optionsFrom(map: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}
