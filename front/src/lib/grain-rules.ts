import type { GrainTicketStatus, GrainDiscountType } from '@/types/grain';

/** A impressão só fica disponível depois que o ticket é fechado. */
export function canPrintTicket(status: GrainTicketStatus | null | undefined): boolean {
  return status === 'CLOSED';
}

/** Configuração do canal: limites coerentes e divisão positiva. */
export function validateChannelLimits(values: {
  minimum_weight: number;
  maximum_weight: number;
  division_weight: number;
}): string | undefined {
  if (!(values.maximum_weight > 0)) return 'O peso máximo deve ser maior que zero.';
  if (values.minimum_weight < 0) return 'O peso mínimo não pode ser negativo.';
  if (values.minimum_weight >= values.maximum_weight)
    return 'O peso mínimo deve ser menor que o peso máximo.';
  if (!(values.division_weight > 0)) return 'A divisão deve ser maior que zero.';
  return undefined;
}

/** Placa Mercosul ou padrão antigo, sem separadores. */
export function normalizePlate(plate: string): string {
  return (plate ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidPlate(plate: string): boolean {
  const normalized = normalizePlate(plate);
  return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalized);
}

/** Peso bruto de saída nunca pode superar a capacidade do caminhão. */
export function grossWeightWithinTruckCapacity(
  grossWeight: number,
  maximumGrossWeight: number | null | undefined,
): boolean {
  if (!maximumGrossWeight || maximumGrossWeight <= 0) return true;
  return Number(grossWeight) <= Number(maximumGrossWeight);
}

interface EffectivePeriod {
  id?: string;
  producer_id: string;
  culture_id: string;
  effective_from: string;
  effective_until?: string | null;
}

/** Vigências do mesmo produtor + cultura não podem se sobrepor. */
export function hasOverlappingEffectivePeriod(
  candidate: EffectivePeriod,
  existing: EffectivePeriod[],
): boolean {
  const start = candidate.effective_from;
  const end = candidate.effective_until || '9999-12-31';
  return existing.some((item) => {
    if (candidate.id && item.id === candidate.id) return false;
    if (String(item.producer_id) !== String(candidate.producer_id)) return false;
    if (String(item.culture_id) !== String(candidate.culture_id)) return false;
    const itemStart = item.effective_from;
    const itemEnd = item.effective_until || '9999-12-31';
    return start <= itemEnd && itemStart <= end;
  });
}

/** Um caminhão com ticket em aberto não pode iniciar uma nova portaria. */
export function canOpenTicketForTruck(openTicketsForTruck: { id: string }[] | null | undefined): boolean {
  return !openTicketsForTruck || openTicketsForTruck.length === 0;
}

/** Todos os descontos ativos da cultura entram na grade, inclusive os zerados. */
export function buildDiscountRows(
  types: GrainDiscountType[],
  saved: { grain_discount_type_id: string; percentage: number }[] = [],
): { grain_discount_type_id: string; percentage: number }[] {
  return types
    .filter((t) => t.status === 'A')
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((t) => ({
      grain_discount_type_id: t.id,
      percentage: saved.find((s) => s.grain_discount_type_id === t.id)?.percentage ?? 0,
    }));
}

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/** A soma das impurezas informadas deve ser igual ao peso líquido do ticket. */
export function impuritySumMatchesNetWeight(
  items: { quantity: number | string }[],
  netWeight: number,
): boolean {
  const sum = items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  return round3(sum) === round3(netWeight);
}

/** Expedição só pode fechar quando o backend confirma saldo suficiente. */
export function canCloseShipping(
  preview: { can_close: boolean; missing_weight?: number | null } | null | undefined,
): boolean {
  return Boolean(preview?.can_close);
}

/** Mais de um contrato alocado exige autorização prévia. */
export function requiresMultipleContractAuthorization(
  preview: { allocations?: { grain_contract_id: string }[] | null; requires_authorization?: boolean } | null | undefined,
): boolean {
  if (!preview) return false;
  if (preview.requires_authorization) return true;
  return (preview.allocations?.length ?? 0) > 1;
}

/** Ninguém aprova a própria solicitação de autorização. */
export function canApproveAuthorization(
  authorization: { requested_by_id?: string | null; status: string },
  currentUserId: string | null | undefined,
  isAdmin: boolean,
): boolean {
  if (!isAdmin) return false;
  if (authorization.status !== 'PENDING') return false;
  return String(authorization.requested_by_id ?? '') !== String(currentUserId ?? '');
}

/** Mais de um contrato na alocação FIFO gera ticket pai e subtickets. */
export function generatesParentAndSubtickets(
  preview: { allocations?: { grain_contract_id: string }[] | null } | null | undefined,
): boolean {
  return (preview?.allocations?.length ?? 0) > 1;
}
