/**
 * Regras de apoio do módulo de Combustíveis, Lubrificantes e Frota.
 * Cálculos aqui são apenas prévias de exibição: o saldo oficial vem sempre do backend.
 */

export type GaugeRow = { centimeters: number | string; liters: number | string };

const toNumber = (value: unknown): number => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : NaN;
};

/**
 * Converte centímetros em litros pela tabela da régua, interpolando linearmente
 * entre os dois pontos cadastrados mais próximos.
 */
export function interpolateLiters(rows: GaugeRow[], centimeters: number | string): number | null {
  const cm = toNumber(centimeters);
  if (!Number.isFinite(cm)) return null;

  const points = rows
    .map((row) => ({ cm: toNumber(row.centimeters), liters: toNumber(row.liters) }))
    .filter((point) => Number.isFinite(point.cm) && Number.isFinite(point.liters))
    .sort((a, b) => a.cm - b.cm);

  if (!points.length) return null;
  if (cm < points[0].cm || cm > points[points.length - 1].cm) return null;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (point.cm === cm) return point.liters;
    if (point.cm > cm) {
      const previous = points[index - 1];
      if (!previous) return null;
      const ratio = (cm - previous.cm) / (point.cm - previous.cm);
      return previous.liters + ratio * (point.liters - previous.liters);
    }
  }
  return null;
}

/** Transferência nasce pendente (rascunho) e só a confirmação movimenta estoque. */
export const TRANSFER_PENDING = 'D';
export const TRANSFER_CONFIRMED = 'C';
export const TRANSFER_CANCELED = 'X';

export const transferInitialStatus = (): string => TRANSFER_PENDING;
export const canConfirmTransfer = (status?: string | null): boolean => status === TRANSFER_PENDING;
export const transferMovesStock = (status?: string | null): boolean => status === TRANSFER_CONFIRMED;

/** Leituras (régua e registradora) nunca alteram o estoque contábil. */
export const readingMovesStock = (): boolean => false;
/** O abastecimento efetivo baixa estoque. */
export const refuelingMovesStock = (): boolean => true;

/** Registradora: quantidade = leitura final - leitura inicial. */
export function registerQuantity(initial: number | string, final: number | string): number | null {
  const start = toNumber(initial);
  const end = toNumber(final);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const quantity = end - start;
  return quantity < 0 ? null : quantity;
}

/**
 * Índice de consumo da frota: H calcula L/h, K calcula L/km.
 * Divisão por zero (ou marcação incompatível) não gera índice.
 */
export function consumptionIndex(
  markingType: string | null | undefined,
  liters: number | string | null | undefined,
  hours: number | string | null | undefined,
  kilometers: number | string | null | undefined,
): { unit: 'L/h' | 'L/km'; value: number } | null {
  const marking = String(markingType ?? '').toUpperCase();
  const litersValue = toNumber(liters);
  if (!Number.isFinite(litersValue)) return null;

  if (marking === 'H') {
    const base = toNumber(hours);
    if (!Number.isFinite(base) || base <= 0) return null;
    return { unit: 'L/h', value: litersValue / base };
  }
  if (marking === 'K') {
    const base = toNumber(kilometers);
    if (!Number.isFinite(base) || base <= 0) return null;
    return { unit: 'L/km', value: litersValue / base };
  }
  return null;
}

/** Correção de saldo é feita por ajuste com justificativa, nunca apagando movimentos. */
export const adjustmentRequiresReason = (reason?: string | null): boolean =>
  String(reason ?? '').trim().length > 0;
export const movementsCanBeDeleted = (): boolean => false;

/** Lubrificante pode sair de posto físico para posto móvel. */
export function lubricantTransferIsAllowed(originType?: string | null, destinationType?: string | null): boolean {
  const origin = String(originType ?? '').toUpperCase();
  const destination = String(destinationType ?? '').toUpperCase();
  if (!origin || !destination) return false;
  return ['F', 'M'].includes(origin) && ['F', 'M'].includes(destination);
}
