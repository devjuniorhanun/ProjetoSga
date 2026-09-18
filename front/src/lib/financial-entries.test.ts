import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import api from './api';
import {
  PAY_ACCOUNTS_ENDPOINT,
  PayAccount,
  isTransferPayAccount,
  payAccountsService,
  typePayAccountsService,
} from './api-services-financial-entries';
import { handleCurrencyMaskChange, parseCurrencyBRL } from './format-helpers';
import { buildTransfersPdf, TransferPdfItem } from './financial-transfer-pdf';

const account = (over: Partial<PayAccount> = {}): PayAccount =>
  ({ id: '1', value: 10, status: 'RI', accounted_for: 'N', entry_type: 'ACCOUNT', ...over }) as PayAccount;

describe('máscara de valor brasileira', () => {
  it('aplica milhares e duas casas e devolve número ao formulário', () => {
    const display: string[] = [];
    const numbers: number[] = [];
    handleCurrencyMaskChange(
      { target: { value: '123456' } } as React.ChangeEvent<HTMLInputElement>,
      (v) => display.push(v),
      (v) => numbers.push(v),
    );
    expect(display[0].replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56');
    expect(numbers[0]).toBe(1234.56);
    expect(parseCurrencyBRL('R$ 1.234,56')).toBe(1234.56);
  });
});

describe('serviço de contas pagas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa os endpoints oficiais', () => {
    expect(PAY_ACCOUNTS_ENDPOINT).toBe('/releases/financial/pay-accounts');
  });

  it('envia todos os filtros aceitos pela listagem', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    const params = {
      producer_id: '1',
      administrative_center_id: '2',
      cost_center_id: '3',
      supplier_id: '4',
      type_pay_account_id: '5',
      document_number: '100',
      date: '2026-01-10',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      accounted_for: 'S',
      status: 'RI',
      entry_type: 'ACCOUNT',
      per_page: '25',
    };
    await payAccountsService.getAll(params);
    expect(api.get).toHaveBeenCalledWith(PAY_ACCOUNTS_ENDPOINT, { params });
  });

  it('busca transferências pela data informada', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await payAccountsService.getTransfers('2026-02-03');
    expect(api.get).toHaveBeenCalledWith(`${PAY_ACCOUNTS_ENDPOINT}/transfers`, {
      params: { date: '2026-02-03' },
    });
  });

  it('sem data usa o padrão do backend (hoje)', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await payAccountsService.getTransfers();
    expect(api.get).toHaveBeenCalledWith(`${PAY_ACCOUNTS_ENDPOINT}/transfers`, { params: undefined });
  });

  it('folha não envia cost_center_id, due_date nem entry_type', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: account() } });
    await payAccountsService.createPayroll({
      crop_id: '9',
      producer_id: '1',

      administrative_center_id: '2',
      supplier_id: '3',
      type_pay_account_id: '4',
      document_number: 'FP-1',
      document_date: '2026-03-01',
      description: 'Folha',
      value: 1500,
      accounted_for: 'N',
      status: 'RI',
    });
    const [url, payload] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe(`${PAY_ACCOUNTS_ENDPOINT}/payroll`);
    expect(payload).not.toHaveProperty('cost_center_id');
    expect(payload).not.toHaveProperty('due_date');
    expect(payload).not.toHaveProperty('entry_type');
    expect(payload).toMatchObject({ crop_id: '9' });

  });

  it('propaga erros 422 para o formulário', async () => {
    const error = { response: { status: 422, data: { errors: { value: ['Valor inválido'] } } } };
    vi.mocked(api.post).mockRejectedValueOnce(error);
    await expect(payAccountsService.create({} as never)).rejects.toBe(error);
  });

  it('mantém o catálogo de tipos de pagamento no endpoint canônico', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await typePayAccountsService.getAll();
    expect(api.get).toHaveBeenCalledWith('/registrations/financial/type-pay-accounts');
  });
});

describe('transferências', () => {
  it('aceita apenas tipo com abreviação TR', () => {
    expect(isTransferPayAccount(account({ type_pay_account_abbreviation: 'TR' }))).toBe(true);
    expect(isTransferPayAccount(account({ type_pay_account: { abbreviation: 'tr' } }))).toBe(true);
    expect(isTransferPayAccount(account({ type_pay_account_abbreviation: 'DI' }))).toBe(false);
  });

  it('mantém o tipo source_type/source_id para registros de outros módulos', () => {
    const item = account({ source_type: 'GRAIN_TICKET', source_id: '9' });
    expect(item.source_type).toBe('GRAIN_TICKET');
    expect(item.source_id).toBe('9');
  });

  it('gera PDF A4 retrato com no máximo quatro transferências por página', () => {
    const item: TransferPdfItem = {
      documentNumber: '1',
      documentDate: '2026-01-10',
      producerName: 'Produtor',
      farmName: 'Fazenda',
      supplierName: 'Fornecedor',
      supplierDocument: '000',
      bankName: 'Banco',
      agencyNumber: '1',
      accountNumber: '2',
      operationNumber: '001',
      pixKey: '',
      accountType: 'CC',
      value: 100,
      description: 'Pagamento',
      authorizedBy: 'Usuário',
      accountedFor: 'N',
    };
    expect(buildTransfersPdf(Array.from({ length: 4 }, () => item)).getNumberOfPages()).toBe(1);
    expect(buildTransfersPdf(Array.from({ length: 5 }, () => item)).getNumberOfPages()).toBe(2);
    expect(buildTransfersPdf(Array.from({ length: 9 }, () => item)).getNumberOfPages()).toBe(3);
  });
});
