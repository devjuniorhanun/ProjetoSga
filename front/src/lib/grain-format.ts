/** Formatação e conversão de pesos (kg) e percentuais do módulo de grãos. */

/** Converte texto no padrão pt-BR ("1.234,567") para número. */
export function parseWeightBR(display: string | number | null | undefined): number {
  if (typeof display === 'number') return Number.isFinite(display) ? display : 0;
  if (display === null || display === undefined) return 0;
  const cleaned = String(display)
    .replace(/\s|kg/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/** Peso em kg formatado no padrão pt-BR, com até 3 casas decimais. */
export function formatWeight(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? parseWeightBR(value) : value;
  if (!Number.isFinite(num)) return '-';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export function formatWeightKg(value: number | string | null | undefined): string {
  const formatted = formatWeight(value);
  return formatted === '-' ? '-' : `${formatted} kg`;
}

/** Percentual com até 5 casas decimais. */
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? parsePercentageBR(value) : value;
  if (!Number.isFinite(num)) return '-';
  return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 5 })}%`;
}

export function parsePercentageBR(display: string | number | null | undefined): number {
  if (typeof display === 'number') return Number.isFinite(display) ? display : 0;
  if (display === null || display === undefined) return 0;
  const cleaned = String(display).replace(/%/g, '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/** Data/hora ISO → dd/MM/yyyy HH:mm. */
export function formatDateTimeBR(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Data yyyy-MM-dd → dd/MM/yyyy (sem deslocamento de fuso). */
export function formatDateBR(value?: string | null): string {
  if (!value) return '-';
  const onlyDate = value.slice(0, 10);
  const date = new Date(`${onlyDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

/** Idade da leitura em segundos. */
export function readingAgeSeconds(readAt?: string | null, now: number = Date.now()): number {
  if (!readAt) return Number.POSITIVE_INFINITY;
  const time = new Date(readAt).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - time) / 1000);
}

export const MAX_READING_AGE_SECONDS = 30;

/** A captura automática só é liberada com leitura estável e recente. */
export function canCaptureReading(
  reading: { stable: boolean; read_at: string } | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!reading) return false;
  if (!reading.stable) return false;
  return readingAgeSeconds(reading.read_at, now) <= MAX_READING_AGE_SECONDS;
}
