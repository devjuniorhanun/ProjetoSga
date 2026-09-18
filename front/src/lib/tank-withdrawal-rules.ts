import type { OperatorTankWithdrawalRequest } from '@/types/agricultural-services';

export const MAX_WITHDRAWAL_DECIMALS = 3;

/** Converte o texto digitado (aceita vírgula) em número, ou null quando inválido. */
export function parseQuantity(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Arredonda para no máximo três casas decimais, como exige o backend. */
export function roundQuantity(value: number): number {
  return Number(value.toFixed(MAX_WITHDRAWAL_DECIMALS));
}

export interface WithdrawalInput {
  crop_id: string | number;
  operator_id: string | number;
  date: string;
  quantities: Record<string, string | number>;
  observation?: string;
}

export interface BuildWithdrawalResult {
  payload?: OperatorTankWithdrawalRequest;
  error?: string;
}

/**
 * Monta o payload da retirada agrupada.
 * Produtos com quantidade zero ou vazia não são enviados; retiradas parciais são permitidas.
 */
export function buildWithdrawalPayload(input: WithdrawalInput): BuildWithdrawalResult {
  if (!input.crop_id || !input.operator_id || !input.date) {
    return { error: 'Selecione safra, tanqueiro e data.' };
  }

  const products: OperatorTankWithdrawalRequest['products'] = [];

  for (const [productId, raw] of Object.entries(input.quantities)) {
    const quantity = parseQuantity(raw);
    if (quantity === null || quantity === 0) continue;
    if (quantity < 0) {
      return { error: 'A quantidade deve ser maior que zero.' };
    }
    products.push({ product_id: Number(productId), quantity: roundQuantity(quantity) });
  }

  if (products.length === 0) {
    return { error: 'Informe a quantidade de pelo menos um produto.' };
  }

  const observation = input.observation?.trim();
  if (observation && observation.length > 500) {
    return { error: 'A observação deve ter no máximo 500 caracteres.' };
  }

  return {
    payload: {
      crop_id: Number(input.crop_id),
      operator_id: Number(input.operator_id),
      date: input.date,
      products,
      ...(observation ? { observation } : {}),
    },
  };
}

/** Formata quantidades com até três casas decimais no padrão brasileiro. */
export function formatQuantity(value: number | string | null | undefined): string {
  const parsed = parseQuantity(value);
  if (parsed === null) return '-';
  return parsed.toLocaleString('pt-BR', { maximumFractionDigits: MAX_WITHDRAWAL_DECIMALS });
}
