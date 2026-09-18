import type {
  HarvestAdvancePayload,
  HarvestAdvanceType,
  HarvestMatrixFreight,
  HarvestReleasePayload,
} from './api-services-harvest';


export const BAG_WEIGHT_KG = 60;

export interface HarvestPreview {
  discount_weight: number;
  net_weight: number;
  gross_bags: number;
  liquid_bags: number;
  shipping_value: number;
}

/**
 * Prévia dos valores calculados. O backend é autoritativo: estes números servem
 * apenas para orientar o usuário antes de salvar.
 */
export function calculateHarvestPreview(
  grossWeight: number,
  discountPercent: number,
  matrixPrice?: number,
): HarvestPreview {
  const gross = Number.isFinite(grossWeight) ? grossWeight : 0;
  const percent = Number.isFinite(discountPercent) ? discountPercent : 0;
  const discountWeight = (gross * percent) / 100;
  const netWeight = gross - discountWeight;
  const grossBags = gross / BAG_WEIGHT_KG;
  const liquidBags = netWeight / BAG_WEIGHT_KG;
  // O frete usa SACAS BRUTAS.
  const shippingValue = grossBags * (matrixPrice ?? 0);
  return {
    discount_weight: discountWeight,
    net_weight: netWeight,
    gross_bags: grossBags,
    liquid_bags: liquidBags,
    shipping_value: shippingValue,
  };
}

/** Campos calculados/determinados pelo backend que nunca devem ser enviados. */
export const HARVEST_CALCULATED_FIELDS = [
  'matrix_freight_id',
  'discount_weight',
  'net_weight',
  'liquid_bags',
  'gross_bags',
  'shipping_value',
  'shipping_paid_value',
] as const;

export function buildHarvestReleasePayload(
  values: HarvestReleasePayload & Record<string, unknown>,
): HarvestReleasePayload {
  return {
    crop_id: values.crop_id,
    driver_id: values.driver_id,
    owner_id: values.owner_id,
    plot_field_id: values.plot_field_id,
    warehouse_id: values.warehouse_id,
    lanyard_id: values.lanyard_id,
    release_date: values.release_date,
    shipping_number: String(values.shipping_number ?? '').trim(),
    control_number: String(values.control_number ?? '').trim(),
    gross_weight: Number(values.gross_weight),
    discount: Number(values.discount),
    ...(values.status ? { status: values.status } : {}),
  };
}

/** A matriz só é consultada quando safra, talhão e armazém estão preenchidos. */
export function canQueryMatrixFreight(
  cropId?: string,
  plotFieldId?: string,
  warehouseId?: string,
): boolean {
  return Boolean(cropId && plotFieldId && warehouseId);
}

/** Sem percurso encontrado, o envio fica bloqueado. */
export function canSubmitHarvestRelease(
  matrix: HarvestMatrixFreight | undefined | null,
  isMatrixLoading: boolean,
): boolean {
  return Boolean(matrix?.matrix_freight_id) && !isMatrixLoading;
}

/** Restaurar sessão: o talhão só volta se ainda pertencer à safra carregada. */
export function keepRestoredPlotField(
  plotFieldId: string | undefined,
  plotFields: { id: string }[],
): string {
  if (!plotFieldId) return '';
  return plotFields.some((p) => String(p.id) === String(plotFieldId)) ? plotFieldId : '';
}

export function isTransferTypePayAccount(abbreviation?: string): boolean {
  return String(abbreviation ?? '').toUpperCase() === 'TR';
}

interface AdvanceFormValues {
  crop_id: string;
  supplier_id: string;
  producer_id: string;
  administrative_center_id: string;
  type_pay_account_id: string;
  document_date: string;
  due_date: string;
  document_number: string;
  value: number;
  observation?: string;
}

/**
 * Os adiantamentos geram diretamente uma conta paga. O centro de custo é
 * definido pelo backend (ADIANTAMENTO COLHEITA / FRETE) e nunca é enviado.
 */
function buildAdvancePayload(
  advanceType: HarvestAdvanceType,
  values: AdvanceFormValues,
): HarvestAdvancePayload {
  return {
    advance_type: advanceType,
    crop_id: values.crop_id,
    supplier_id: values.supplier_id,
    producer_id: values.producer_id,
    administrative_center_id: values.administrative_center_id,
    type_pay_account_id: values.type_pay_account_id,
    document_date: values.document_date,
    due_date: values.due_date,
    document_number: String(values.document_number ?? '').trim(),
    value: Number(values.value),
    observation: values.observation?.trim() || null,
  };
}

export function buildHarvesterAdvancePayload(values: AdvanceFormValues): HarvestAdvancePayload {
  return buildAdvancePayload('HARVESTER', values);
}

export function buildTransporterAdvancePayload(values: AdvanceFormValues): HarvestAdvancePayload {
  return buildAdvancePayload('TRANSPORTER', values);
}

/** O valor do adiantamento de transportador não pode ultrapassar o saldo em aberto. */
export function isTransporterAdvanceValueValid(value: number, openValue: number): boolean {
  return value > 0 && value <= openValue;
}

export function harvestAdvanceInvalidationKeys(
  advanceType: HarvestAdvanceType,
  cropId: string,
): unknown[][] {
  if (advanceType === 'HARVESTER') {
    return [
      ['harvest-advances', 'HARVESTER'],
      ['harvest-eligible-harvesters', cropId],
      ['pay-accounts'],
    ];
  }
  return [
    ['harvest-transporter-suppliers', cropId],
    ['harvest-advances', 'TRANSPORTER'],
    ['harvest-releases'],
    ['pay-accounts'],
  ];
}


export function formatWeightKg(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function formatBags(value: number | undefined, digits: number): string {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
