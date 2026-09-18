import { describe, expect, it } from 'vitest';
import {
  ENTRY_INVOICES_ENDPOINT,
  FISCAL_BASE,
  FREIGHT_PAYMENTS_ENDPOINT,
  FISCAL_FREIGHTS_ENDPOINT,
  PURCHASE_RETURNS_ENDPOINT,
  IMPORT_ITEMS_ENDPOINT,
} from './api-services-fiscal';
import {
  INVENTORY_BALANCES_ENDPOINT,
  INVENTORY_MOVEMENTS_ENDPOINT,
  PRODUCT_OUTPUTS_ENDPOINT,
} from './api-services-inventory-releases';
import { unwrapList, unwrapMeta } from './api-services-grain';
import { ENTRY_TYPE_LABELS, ENTRY_TYPE_SLUGS } from './fiscal-labels';
import {
  canConfirmInvoice,
  canEditInvoice,
  canReturnOutput,
  destinationsMatchQuantity,
  freightPaymentValueIsValid,
  installmentsAreValid,
  installmentsMatchTotal,
  invoiceTotalPreview,
  isCompatibleFuelLocation,
  isValidAccessKey,
  itemTotal,
  outputItemPendingQuantity,
  outputTotal,
  productsValue,
  returnQuantityIsValid,
  validateInvoiceItem,
} from './fiscal-rules';
import type { EntryInvoiceItem } from '@/types/fiscal';

const baseItem = (overrides: Partial<EntryInvoiceItem> = {}): EntryInvoiceItem => ({
  product_id: '1',
  description: 'Produto',
  unit: 'KG',
  quantity: 10,
  unit_value: 5,
  destinations: [{ stock_location_id: '9', quantity: 10 }],
  ...overrides,
});

describe('endpoints oficiais do módulo fiscal e de estoque', () => {
  it('usa os caminhos do backend Laravel sem duplicar /api', () => {
    expect(FISCAL_BASE).toBe('/releases/fiscal');
    expect(ENTRY_INVOICES_ENDPOINT).toBe('/releases/fiscal/entry-invoices');
    expect(FISCAL_FREIGHTS_ENDPOINT).toBe('/releases/fiscal/freights');
    expect(FREIGHT_PAYMENTS_ENDPOINT).toBe('/releases/fiscal/freight-payments');
    expect(PURCHASE_RETURNS_ENDPOINT).toBe('/releases/fiscal/purchase-returns');
    expect(IMPORT_ITEMS_ENDPOINT).toBe('/releases/fiscal/import-items');
    expect(INVENTORY_BALANCES_ENDPOINT).toBe('/releases/inventory/balances');
    expect(INVENTORY_MOVEMENTS_ENDPOINT).toBe('/releases/inventory/movements');
    expect(PRODUCT_OUTPUTS_ENDPOINT).toBe('/releases/inventory/product-outputs');
    expect([ENTRY_INVOICES_ENDPOINT, PRODUCT_OUTPUTS_ENDPOINT].every((e) => !e.startsWith('/api'))).toBe(true);
  });
});

describe('tipos de nota', () => {
  it('cobre os seis tipos de formulário especializados', () => {
    expect(Object.keys(ENTRY_TYPE_LABELS)).toEqual(['FUEL', 'LUBRICANT', 'DEFENSIVE', 'INPUT', 'GENERAL', 'SEED']);
    expect(ENTRY_TYPE_SLUGS.seed).toBe('SEED');
    expect(ENTRY_TYPE_SLUGS.fuel).toBe('FUEL');
  });
});

describe('somas da nota', () => {
  it('soma itens, descontos e acréscimos', () => {
    const item = baseItem({ quantity: 3, unit_value: 10, discount_value: 5, addition_value: 2 });
    expect(itemTotal(item)).toBe(27);
    expect(productsValue([item, baseItem({ quantity: 1, unit_value: 3 })])).toBe(30);
  });

  it('calcula o total da nota somando frete, seguro e despesas e subtraindo desconto', () => {
    expect(
      invoiceTotalPreview({
        products_value: 1000,
        freight_value: 100,
        insurance_value: 50,
        other_expenses_value: 25,
        discount_value: 75,
      }),
    ).toBe(1100);
  });

  it('exige que a soma dos destinos seja igual à quantidade do item', () => {
    expect(destinationsMatchQuantity(baseItem())).toBe(true);
    expect(
      destinationsMatchQuantity(baseItem({ destinations: [{ stock_location_id: '9', quantity: 4 }] })),
    ).toBe(false);
  });
});

describe('validação por tipo de nota', () => {
  it('semente exige cultura, variedade, lote e local no destino', () => {
    const incomplete = validateInvoiceItem('SEED', baseItem());
    expect(incomplete.valid).toBe(false);

    const complete = validateInvoiceItem(
      'SEED',
      baseItem({
        destinations: [
          { culture_id: '1', variety_id: '2', batch: 'L-1', stock_location_id: '9', quantity: 10 },
        ],
      }),
    );
    expect(complete.valid).toBe(true);
  });

  it('insumo aceita destino em talhão sem local de estoque', () => {
    const result = validateInvoiceItem('INPUT', baseItem({ destinations: [{ field_id: '5', quantity: 10 }] }));
    expect(result.valid).toBe(true);
  });

  it('combustível só aceita local de posto compatível', () => {
    expect(isCompatibleFuelLocation({ id: '1', location_type: 'FUEL_POST' }, { invoice_type: 'FUEL' })).toBe(true);
    expect(isCompatibleFuelLocation({ id: '2', location_type: 'WAREHOUSE' }, { invoice_type: 'FUEL' })).toBe(false);
    expect(isCompatibleFuelLocation({ id: '1', location_type: 'FUEL_POST' }, { invoice_type: 'SEED' })).toBe(false);
  });
});

describe('chave de acesso e parcelas', () => {
  it('valida chave de 44 dígitos', () => {
    expect(isValidAccessKey('1'.repeat(44))).toBe(true);
    expect(isValidAccessKey('1'.repeat(43))).toBe(false);
    expect(isValidAccessKey('abc')).toBe(false);
  });

  it('parcelas exigem documento, vencimento e soma igual ao total', () => {
    const installments = [
      { document_number: '1/2', due_date: '2026-01-10', value: 500 },
      { document_number: '2/2', due_date: '2026-02-10', value: 500 },
    ];
    expect(installmentsAreValid(installments)).toBe(true);
    expect(installmentsMatchTotal(installments, 1000)).toBe(true);
    expect(installmentsMatchTotal(installments, 1200)).toBe(false);
    expect(installmentsAreValid([{ document_number: '1/1', due_date: '', value: 100 }])).toBe(false);
  });
});

describe('confirmação da nota', () => {
  it('somente rascunho pode ser editado ou confirmado', () => {
    expect(canEditInvoice('DRAFT')).toBe(true);
    expect(canEditInvoice('CONFIRMED')).toBe(false);
    expect(canConfirmInvoice('DRAFT')).toBe(true);
    expect(canConfirmInvoice('CANCELED')).toBe(false);
  });
});

describe('frete parcial', () => {
  it('não aceita valor acima do saldo da nota', () => {
    expect(freightPaymentValueIsValid(1000, 400)).toBe(true);
    expect(freightPaymentValueIsValid(1000, 1000)).toBe(true);
    expect(freightPaymentValueIsValid(1000, 1000.5)).toBe(false);
    expect(freightPaymentValueIsValid(1000, 0)).toBe(false);
  });
});

describe('retorno de empréstimo', () => {
  it('permite retorno só em empréstimo confirmado', () => {
    expect(canReturnOutput('LOAN', 'CONFIRMED')).toBe(true);
    expect(canReturnOutput('SALE', 'CONFIRMED')).toBe(false);
    expect(canReturnOutput('LOAN', 'DRAFT')).toBe(false);
  });

  it('nunca aceita quantidade acima do saldo emprestado', () => {
    const item = { quantity: 10, returned_quantity: 4 };
    expect(outputItemPendingQuantity(item)).toBe(6);
    expect(returnQuantityIsValid(item, 6)).toBe(true);
    expect(returnQuantityIsValid(item, 7)).toBe(false);
    expect(returnQuantityIsValid(item, 0)).toBe(false);
  });

  it('soma o valor total da saída', () => {
    expect(outputTotal([{ quantity: 2, unit_value: 10 }, { quantity: 1, unit_value: 5.5 }])).toBe(25.5);
  });
});

describe('respostas paginadas', () => {
  it('lê listas simples, Resource e paginator', () => {
    expect(unwrapList([{ id: '1' }])).toHaveLength(1);
    expect(unwrapList({ data: [{ id: '1' }] })).toHaveLength(1);
    expect(unwrapList({ data: { data: [{ id: '1' }, { id: '2' }] } })).toHaveLength(2);
    expect(unwrapMeta({ current_page: 2, last_page: 5, per_page: 25, total: 120 })?.last_page).toBe(5);
  });
});
