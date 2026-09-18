/**
 * Relatórios financeiros aceitam somente tipos de pagamento monetários.
 * Pagamentos físicos (diesel, grãos etc.) não entram em filtros nem em totais.
 */
export const MONETARY_PAY_ACCOUNT_TYPES = ['BO', 'TR', 'DI', 'CH', 'CHQ', 'CQ', 'LG'];

export function isMonetaryPayAccountType(abbreviation?: string | null): boolean {
  if (!abbreviation) return false;
  return MONETARY_PAY_ACCOUNT_TYPES.includes(abbreviation.trim().toUpperCase());
}

export function filterMonetaryTypePayAccounts<
  T extends { abbreviation?: string; status?: string },
>(types: T[]): T[] {
  return types.filter((type) => type.status === 'A' && isMonetaryPayAccountType(type.abbreviation));
}
