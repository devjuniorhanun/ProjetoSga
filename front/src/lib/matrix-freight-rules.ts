import type { MatrixFreight } from './api-services';

export type MatrixFreightSituation = 'VIGENTE' | 'ENCERRADA' | 'FUTURA' | 'INATIVA';

export const MATRIX_FREIGHT_SITUATION_LABELS: Record<MatrixFreightSituation, string> = {
  VIGENTE: 'Vigente',
  ENCERRADA: 'Encerrada',
  FUTURA: 'Futura',
  INATIVA: 'Inativa',
};

export const PRICE_CHANGE_WARNING =
  'A alteração de preço criará uma nova vigência. A tarifa anterior será preservada nos lançamentos históricos.';

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function matrixFreightSituation(
  item: Pick<MatrixFreight, 'status' | 'effective_from' | 'effective_to'>,
  reference: Date = new Date(),
): MatrixFreightSituation {
  if (item.status === 'I') return 'INATIVA';
  const from = toDate(item.effective_from);
  const to = toDate(item.effective_to);
  if (to && to <= reference) return 'ENCERRADA';
  if (from && from > reference) return 'FUTURA';
  return 'VIGENTE';
}

/** Versões encerradas são apenas consultadas: o preço não pode ser alterado. */
export function canEditMatrixFreightPrice(
  item: Pick<MatrixFreight, 'status' | 'effective_from' | 'effective_to'>,
): boolean {
  return matrixFreightSituation(item) !== 'ENCERRADA';
}

/** O fim da vigência precisa ser posterior ao início. */
export function isEffectiveRangeValid(from?: string | null, to?: string | null): boolean {
  if (!to) return true;
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return true;
  return end > start;
}

/** Ordenação inicial: vigências mais recentes primeiro. */
export function sortByEffectiveFromDesc<T extends Pick<MatrixFreight, 'effective_from'>>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aTime = toDate(a.effective_from)?.getTime() ?? 0;
    const bTime = toDate(b.effective_from)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

/** Converte o valor de um input datetime-local para o formato aceito pelo Laravel. */
export function toLaravelDateTime(value?: string | null): string | null {
  if (!value) return null;
  return value.includes('T') ? `${value.replace('T', ' ')}:00`.slice(0, 19) : value;
}

/** Converte o retorno do backend para o input datetime-local. */
export function toDateTimeLocalInput(value?: string | null): string {
  if (!value) return '';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  return normalized.slice(0, 16);
}

export function formatEffectiveDateTime(value?: string | null): string {
  const date = toDate(value);
  if (!date) return '-';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
