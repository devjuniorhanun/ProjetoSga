import type {
  PaidAccountReportFilterValues,
  PaidAccountSectionCode,
} from '@/types/financial-reports';
import type { HarvestReportFilterValues } from '@/types/harvest-reports';

export const BAG_WEIGHT_KG = 60;

export const ACCOUNTED_FOR_LABELS: Record<string, string> = {
  N: 'Não contabilizado',
  S: 'Contabilizado',
};

export const PAID_ACCOUNT_STATUS_LABELS: Record<string, string> = {
  CA: 'Caixa',
  CO: 'Comércio',
  RI: 'Ribeirão',
  FA: 'Fazenda',
};

export const PAID_ACCOUNT_ENTRY_TYPE_LABELS: Record<string, string> = {
  ACCOUNT: 'Contas Pagas',
  PAYROLL: 'Folha de Pagamento',
};

export const PAID_ACCOUNT_SECTION_LABELS: Record<PaidAccountSectionCode, string> = {
  ALL: 'Todas',
  PAYROLL: 'Folha de Pagamento',
  ADVANCE: 'Adiantamentos',
  CASH: 'Caixa',
  CHECK: 'Cheques',
  BOLETO: 'Boletos',
  TRANSFER: 'Transferências',
  OTHER: 'Outros',
};

export const PAID_ACCOUNT_GROUP_BY_LABELS: Record<string, string> = {
  SUPPLIER: 'Fornecedor',
  COST_CENTER: 'Centro de custo',
  PAYMENT_TYPE: 'Tipo de pagamento',
};

export const PAID_ACCOUNT_ORDER_BY_LABELS: Record<string, string> = {
  NAME_ASC: 'Nome (A-Z)',
  VALUE_ASC: 'Valor (menor primeiro)',
  VALUE_DESC: 'Valor (maior primeiro)',
};

export const HARVEST_ORDER_BY_LABELS: Record<string, string> = {
  NAME_ASC: 'Nome (A-Z)',
  PRODUCTIVITY_ASC: 'Produtividade (menor primeiro)',
  PRODUCTIVITY_DESC: 'Produtividade (maior primeiro)',
  PRODUCTION_DESC: 'Produção (maior primeiro)',
};

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function firstDayOfCurrentMonth(today: Date = new Date()): string {
  return toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
}

export function lastDayOfCurrentMonth(today: Date = new Date()): string {
  return toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
}

/** Diferença em meses entre duas datas ISO (yyyy-MM-dd). */
export function monthsBetween(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return months;
}

export interface PeriodValidation {
  valid: boolean;
  field?: 'date_from' | 'date_to';
  message?: string;
}

/** date_to >= date_from e período máximo de 12 meses. */
export function validateReportPeriod(dateFrom?: string, dateTo?: string): PeriodValidation {
  if (!dateFrom) return { valid: false, field: 'date_from', message: 'Informe a data inicial.' };
  if (!dateTo) return { valid: false, field: 'date_to', message: 'Informe a data final.' };
  if (dateTo < dateFrom) {
    return { valid: false, field: 'date_to', message: 'A data final não pode ser anterior à data inicial.' };
  }
  if (monthsBetween(dateFrom, dateTo) >= 12) {
    return { valid: false, field: 'date_to', message: 'O período máximo é de 12 meses.' };
  }
  return { valid: true };
}

type ParamValue = string | number;

/** Remove chaves vazias para não enviar filtros em branco ao backend. */
export function compactParams(
  values: Record<string, string | number | undefined | null>,
): Record<string, ParamValue> {
  const params: Record<string, ParamValue> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params[key] = value as ParamValue;
  });
  return params;
}

export function buildPaidAccountParams(
  filters: PaidAccountReportFilterValues,
): Record<string, ParamValue> {
  return compactParams({ ...filters });
}

export function buildHarvestReportParams(
  filters: HarvestReportFilterValues,
): Record<string, ParamValue> {
  return compactParams({ ...filters });
}

export interface CropOptionsValidation {
  valid: boolean;
  field?: 'agricultural_year_id' | 'crop_id';
  message?: string;
}

export function validateCropSelection(
  agriculturalYearId: string | undefined,
  cropId: string | undefined,
  cropsOfYear: { id: string }[],
): CropOptionsValidation {
  if (!agriculturalYearId) {
    return { valid: false, field: 'agricultural_year_id', message: 'Informe o ano agrícola.' };
  }
  if (!cropId) return { valid: false, field: 'crop_id', message: 'Informe a safra.' };
  if (cropsOfYear.length && !cropsOfYear.some((c) => String(c.id) === String(cropId))) {
    return {
      valid: false,
      field: 'crop_id',
      message: 'A safra selecionada deve pertencer ao ano agrícola informado.',
    };
  }
  return { valid: true };
}

/** Ao trocar a safra, filtros dependentes que não existem nas novas opções são descartados. */
export function keepOptionIfPresent(value: string | undefined, options: { id: string }[]): string {
  if (!value) return '';
  return options.some((o) => String(o.id) === String(value)) ? value : '';
}

export function kgToBags(kg: number): number {
  const value = Number(kg);
  if (!Number.isFinite(value)) return 0;
  return value / BAG_WEIGHT_KG;
}

/** Prévia local: o backend recalcula e grava quantity_bags. */
export function transferExceedsBalance(quantityKg: number, availableKg: number | null | undefined): boolean {
  if (availableKg === null || availableKg === undefined) return false;
  return Number(quantityKg) > Number(availableKg);
}

export function canQueryTransferBalance(
  cropId?: string,
  producerId?: string,
  warehouseId?: string,
  cultureId?: string,
): boolean {
  return Boolean(cropId && producerId && warehouseId && cultureId);
}

/** Número que pode vir nulo do backend: nunca substituir por zero. */
export function formatNullableNumber(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercentageShare(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** Um pagamento de frete só pode agrupar notas da mesma safra. */
export function freightsShareSameCrop(
  crops: (string | null | undefined)[],
): boolean {
  const defined = crops.map((c) => (c ? String(c) : ''));
  return new Set(defined).size <= 1;
}

export const SAME_CROP_FREIGHT_MESSAGE =
  'Agrupe no mesmo pagamento somente fretes pertencentes à mesma safra.';
