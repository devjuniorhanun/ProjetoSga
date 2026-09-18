import type {
  EntryInvoiceInstallment,
  EntryInvoiceItem,
  FiscalEntryType,
  InvoiceItemDestination,
  ProductOutputItem,
} from '@/types/fiscal';

/** Tolerância usada nas somas monetárias/quantitativas (prévias locais). */
const EPSILON = 0.005;

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function nearlyEqual(a: number, b: number, epsilon = EPSILON): boolean {
  return Math.abs((Number(a) || 0) - (Number(b) || 0)) <= epsilon;
}

/** Chave de acesso da NF-e: exatamente 44 dígitos. */
export function isValidAccessKey(key?: string | null): boolean {
  if (!key) return false;
  return /^\d{44}$/.test(String(key).trim());
}

export function sumDestinations(destinations: InvoiceItemDestination[] = []): number {
  return destinations.reduce((total, d) => total + (Number(d.quantity) || 0), 0);
}

/** A soma dos destinos/lotes deve ser igual à quantidade do item. */
export function destinationsMatchQuantity(item: Pick<EntryInvoiceItem, 'quantity' | 'destinations'>): boolean {
  return nearlyEqual(sumDestinations(item.destinations), Number(item.quantity) || 0, 0.0005);
}

export function itemTotal(item: Pick<EntryInvoiceItem, 'quantity' | 'unit_value' | 'discount_value' | 'addition_value'>): number {
  const base = (Number(item.quantity) || 0) * (Number(item.unit_value) || 0);
  return roundMoney(base - (Number(item.discount_value) || 0) + (Number(item.addition_value) || 0));
}

export function productsValue(items: EntryInvoiceItem[] = []): number {
  return roundMoney(items.reduce((total, item) => total + itemTotal(item), 0));
}

/** Prévia local do total da nota — o valor persistido é sempre o retornado pela API. */
export function invoiceTotalPreview(values: {
  products_value: number;
  freight_value?: number;
  insurance_value?: number;
  discount_value?: number;
  other_expenses_value?: number;
}): number {
  return roundMoney(
    (Number(values.products_value) || 0) +
      (Number(values.freight_value) || 0) +
      (Number(values.insurance_value) || 0) +
      (Number(values.other_expenses_value) || 0) -
      (Number(values.discount_value) || 0),
  );
}

export function installmentsTotal(installments: EntryInvoiceInstallment[] = []): number {
  return roundMoney(installments.reduce((total, i) => total + (Number(i.value) || 0), 0));
}

export function installmentsMatchTotal(installments: EntryInvoiceInstallment[], invoiceTotal: number): boolean {
  return nearlyEqual(installmentsTotal(installments), invoiceTotal);
}

export function installmentsAreValid(installments: EntryInvoiceInstallment[] = []): boolean {
  return installments.every((i) => !!i.due_date && !!i.document_number && (Number(i.value) || 0) > 0);
}

/** Semente exige cultura, variedade, lote, local e quantidade em cada destino. */
export function seedDestinationIsValid(destination: InvoiceItemDestination): boolean {
  return (
    !!destination.culture_id &&
    !!destination.variety_id &&
    !!destination.batch &&
    !!destination.stock_location_id &&
    (Number(destination.quantity) || 0) > 0
  );
}

/** Insumo pode ir para talhões ou locais de estoque — sempre um dos dois. */
export function inputDestinationIsValid(destination: InvoiceItemDestination): boolean {
  return (!!destination.field_id || !!destination.stock_location_id) && (Number(destination.quantity) || 0) > 0;
}

export function defaultDestinationIsValid(destination: InvoiceItemDestination): boolean {
  return !!destination.stock_location_id && (Number(destination.quantity) || 0) > 0;
}

export function destinationIsValid(entryType: FiscalEntryType, destination: InvoiceItemDestination): boolean {
  if (entryType === 'SEED') return seedDestinationIsValid(destination);
  if (entryType === 'INPUT') return inputDestinationIsValid(destination);
  return defaultDestinationIsValid(destination);
}

/** Combustível só entra em local de estoque de posto compatível com o produto. */
export function isCompatibleFuelLocation(
  location: { id: string; location_type?: string | null } | undefined | null,
  profile: { invoice_type?: string; default_stock_location_id?: string | null } | undefined | null,
): boolean {
  if (!location) return false;
  if (profile && profile.invoice_type && profile.invoice_type !== 'FUEL') return false;
  return String(location.location_type ?? '').toUpperCase().includes('POST');
}

export interface ItemValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateInvoiceItem(entryType: FiscalEntryType, item: EntryInvoiceItem): ItemValidationResult {
  const errors: string[] = [];
  if (!item.product_id) errors.push('Produto obrigatório.');
  if (!(Number(item.quantity) > 0)) errors.push('Quantidade deve ser maior que zero.');
  if (!item.unit) errors.push('Unidade obrigatória.');
  if (!(item.destinations?.length > 0)) errors.push('Informe ao menos um destino.');
  if (item.destinations?.length && !destinationsMatchQuantity(item)) {
    errors.push('A soma dos destinos deve ser igual à quantidade do item.');
  }
  item.destinations?.forEach((destination, index) => {
    if (!destinationIsValid(entryType, destination)) {
      errors.push(`Destino ${index + 1} incompleto.`);
    }
  });
  return { valid: errors.length === 0, errors };
}

/** Somente notas em rascunho podem ser editadas ou excluídas. */
export function canEditInvoice(status?: string | null): boolean {
  return status === 'DRAFT';
}

export function canConfirmInvoice(status?: string | null): boolean {
  return status === 'DRAFT';
}

/** Retorno é exclusivo de empréstimo e nunca acima do saldo emprestado. */
export function canReturnOutput(outputType?: string | null, status?: string | null): boolean {
  return outputType === 'LOAN' && status === 'CONFIRMED';
}

export function outputItemPendingQuantity(item: Pick<ProductOutputItem, 'quantity' | 'returned_quantity'>): number {
  return Math.max(0, (Number(item.quantity) || 0) - (Number(item.returned_quantity) || 0));
}

export function returnQuantityIsValid(
  item: Pick<ProductOutputItem, 'quantity' | 'returned_quantity'>,
  quantity: number,
): boolean {
  const requested = Number(quantity) || 0;
  return requested > 0 && requested <= outputItemPendingQuantity(item) + 0.0005;
}

export function outputTotal(items: Pick<ProductOutputItem, 'quantity' | 'unit_value'>[] = []): number {
  return roundMoney(items.reduce((total, i) => total + (Number(i.quantity) || 0) * (Number(i.unit_value) || 0), 0));
}

/** Valor parcial de pagamento de frete nunca pode ultrapassar o saldo da nota. */
export function freightPaymentValueIsValid(balance: number, value: number): boolean {
  const requested = Number(value) || 0;
  return requested > 0 && requested <= (Number(balance) || 0) + EPSILON;
}
