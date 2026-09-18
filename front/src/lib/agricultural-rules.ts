import type {
  AgriculturalService,
  AgriculturalServiceItem,
  AgriculturalServiceLocation,
  AgriculturalServiceOperator,
  AgriculturalServiceStatus,
  ApplicationRateType,
  ApplicationRateUnit,
  SeedTreatment,
} from '@/types/agricultural';
import type { AgriculturalServiceType } from '@/lib/api-services-inventory';

export const SERVICE_STATUS_LABELS: Record<AgriculturalServiceStatus, string> = {
  DRAFT: 'Rascunho',
  PLANNED: 'Planejado',
  IN_PROGRESS: 'Em execução',
  COMPLETED: 'Concluído',
};

export const RATE_TYPE_LABELS: Record<ApplicationRateType, string> = {
  FIXED: 'Fixa',
  VARIABLE: 'Variável',
};

export const RATE_UNIT_LABELS: Record<ApplicationRateUnit, string> = {
  KG_HA: 'kg/ha',
  T_HA: 't/ha',
  L_HA: 'L/ha',
};

export const SEED_TREATMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  COMPLETED: 'Concluído',
};

const round = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/** Área do talhão vem do cadastro; a tela nunca deixa digitar. */
export function areaIsReadOnly(): true {
  return true;
}

/** Talhão pode repetir por passada — nunca remover duplicados. */
export function countPasses(items: AgriculturalServiceItem[], plotFieldId: string): number {
  return items.filter((i) => String(i.plot_field_id) === String(plotFieldId)).length;
}

export function totalArea(items: AgriculturalServiceItem[]): number {
  return round(items.reduce((sum, i) => sum + (Number(i.area) || 0), 0), 4);
}

/** Quantidade recomendada de uma passada: taxa × área. */
export function recommendedForItem(
  item: AgriculturalServiceItem,
  rateType: ApplicationRateType | null | undefined,
  rateValue: number | null | undefined,
): number {
  const rate = rateType === 'VARIABLE' ? Number(item.rate_value ?? 0) : Number(rateValue ?? 0);
  return round(rate * (Number(item.area) || 0), 4);
}

export function totalRecommended(
  items: AgriculturalServiceItem[],
  rateType: ApplicationRateType | null | undefined,
  rateValue: number | null | undefined,
): number {
  return round(
    items.reduce((sum, item) => sum + recommendedForItem(item, rateType, rateValue), 0),
    4,
  );
}

/** Área do aceiro: comprimento × largura, em hectares (m² / 10.000). */
export function firebreakArea(location: Pick<AgriculturalServiceLocation, 'length' | 'width'>): number {
  return round(((Number(location.length) || 0) * (Number(location.width) || 0)) / 10000, 4);
}

export function operatorIsValid(
  operator: AgriculturalServiceOperator,
  type?: AgriculturalServiceType | null,
): boolean {
  if (!operator.agricultural_operator_id) return false;
  if (!operator.function) return false;
  if (type?.requires_fleet && !operator.traction_fleet_id) return false;
  if (type?.requires_implement && !operator.implement_fleet_id) return false;
  return true;
}

/** Ao validar operadores, é obrigatório ao menos um com function = T (Tanqueiro). */
export function hasTankerOperator(
  operators: Pick<AgriculturalServiceOperator, 'function'>[],
): boolean {
  return operators.some((op) => {
    const fn = String(op.function ?? '').trim().toUpperCase();
    return fn === 'T' || fn === 'TANQUEIRO';
  });
}

/**
 * Frota de tração por função do operador:
 * - T (Tanqueiro): somente veículos do grupo Trator.
 * - O (Operador): somente veículos do grupo Pulverizador.
 * Sem função definida, nenhum veículo é elegível para seleção direcionada.
 */
export function fleetGroupMatchesFunction(
  groupName: string | null | undefined,
  fn: string | null | undefined,
): boolean {
  const f = String(fn ?? '').trim().toUpperCase();
  const g = String(groupName ?? '').trim().toUpperCase();
  if (f === 'T' || f === 'TANQUEIRO') return g.includes('TRATOR');
  if (f === 'O' || f === 'OPERADOR') return g.includes('PULVERIZAD');
  return true;
}

/** Aplicação trabalha com um único produto. */
export function applicationProductIsValid(
  service: Pick<AgriculturalService, 'product_id' | 'rate_type' | 'rate_unit' | 'rate_value'>,
  type?: AgriculturalServiceType | null,
): boolean {
  if (!type?.requires_input) return true;
  if (!service.product_id) return false;
  if (!type.requires_rate) return true;
  if (!service.rate_type || !service.rate_unit) return false;
  if (service.rate_type === 'FIXED') return Number(service.rate_value ?? 0) > 0;
  return true;
}

export function canEditService(status: AgriculturalServiceStatus): boolean {
  return status === 'DRAFT' || status === 'PLANNED';
}

export function canPlanService(status: AgriculturalServiceStatus): boolean {
  return status === 'DRAFT';
}

export function canStartService(status: AgriculturalServiceStatus): boolean {
  return status === 'PLANNED';
}

export function canCompleteService(status: AgriculturalServiceStatus): boolean {
  return status === 'IN_PROGRESS';
}

/** Planejamento nunca reserva nem baixa estoque; só a conclusão movimenta. */
export function movesStock(status: AgriculturalServiceStatus): boolean {
  return status === 'COMPLETED';
}

export function reservesStock(status: AgriculturalServiceStatus): boolean {
  return false;
}

export function seedTreatmentIsValid(treatment: {
  crop_id?: string;
  culture_id?: string;
  treatment_date?: string;
  batch_count?: number;
  seeds?: SeedTreatment['seeds'];
  chemicals?: SeedTreatment['chemicals'];
}): boolean {
  if (!treatment.crop_id || !treatment.culture_id || !treatment.treatment_date) return false;
  if (!(Number(treatment.batch_count) > 0)) return false;
  if (!treatment.seeds?.length || !treatment.chemicals?.length) return false;
  const seedsOk = treatment.seeds.every(
    (s) => s.product_id && s.culture_id && s.variety_id && s.product_stock_id && Number(s.treated_quantity) > 0 && s.unit,
  );
  const chemicalsOk = treatment.chemicals.every(
    (c) => c.product_id && c.product_stock_id && Number(c.actual_quantity) > 0 && c.unit,
  );
  return seedsOk && chemicalsOk;
}

/** Rascunho de tratamento não antecipa estoque. */
export function seedTreatmentMovesStock(status: SeedTreatment['status']): boolean {
  return status === 'COMPLETED';
}

export function chemicalQuantityFromDose(
  dosePerBatch: number | null | undefined,
  batchCount: number,
): number {
  return round((Number(dosePerBatch) || 0) * (Number(batchCount) || 0), 4);
}

/**
 * Ordem inicial dos produtos da O.S. de defensivos: TypeFormulation.order do menor
 * para o maior. Empates mantêm a ordem atual (podem ser reordenados manualmente).
 */
export function sortProductsByFormulationOrder<T extends { product_id: string | number }>(
  products: T[],
  formulationOrderOf: (productId: string) => number | null | undefined,
): T[] {
  return [...products]
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const orderA = Number(formulationOrderOf(String(a.product.product_id)) ?? Number.MAX_SAFE_INTEGER);
      const orderB = Number(formulationOrderOf(String(b.product.product_id)) ?? Number.MAX_SAFE_INTEGER);
      if (orderA !== orderB) return orderA - orderB;
      return a.index - b.index;
    })
    .map((entry) => entry.product);
}

/** Drag-and-drop só é permitido dentro do mesmo grupo de order (empate). */
export function canSwapProducts(
  orderA: number | null | undefined,
  orderB: number | null | undefined,
): boolean {
  return Number(orderA ?? NaN) === Number(orderB ?? NaN) && !Number.isNaN(Number(orderA ?? NaN));
}

/** Reordena apenas dentro do grupo de mesma order; fora disso mantém a lista. */
export function moveWithinOrderGroup<T>(
  items: T[],
  from: number,
  to: number,
  orderOf: (item: T) => number | null | undefined,
): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  if (!canSwapProducts(orderOf(items[from]), orderOf(items[to]))) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** PATCH envia todos os produtos exatamente uma vez. */
export function buildSequencePayload(productIds: Array<string | number>): { product_ids: string[] } {
  const ids = productIds.map(String);
  const unique = Array.from(new Set(ids));
  if (unique.length !== ids.length) {
    throw new Error('A sequência não pode repetir produtos.');
  }
  return { product_ids: ids };
}

/** Reordenação de formulação vale só para O.S. abertas; fechadas preservam histórico. */
export function canReorderOrderProducts(status: string | null | undefined): boolean {
  return String(status ?? '').toUpperCase() === 'A';
}

/** Planejado = pump × área. */
export function plannedProductQuantity(pump: number, area: number): number {
  return round((Number(pump) || 0) * (Number(area) || 0), 4);
}

/** Real do fechamento = bombas × pump. */
export function actualProductQuantity(usedBombs: number, pump: number): number {
  return round((Number(usedBombs) || 0) * (Number(pump) || 0), 4);
}

/** Fechamentos são acumulativos: nunca substituem os anteriores. */
export function accumulateClosings(previousBombs: number, newBombs: number): number {
  return round((Number(previousBombs) || 0) + (Number(newBombs) || 0), 4);
}

/** Operadores com function T compartilham a mesma sequência de produtos. */
export function sequenceForOperator(
  baseSequence: string[],
  operatorFunction: string,
): string[] {
  return operatorFunction === 'T' ? [...baseSequence] : [...baseSequence];
}
