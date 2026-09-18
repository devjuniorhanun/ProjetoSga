import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from './api';
import {
  HARVEST_RELEASES_ENDPOINT,
  HARVEST_PLOT_FIELDS_ENDPOINT,
  HARVEST_MATRIX_FREIGHT_ENDPOINT,
  HARVEST_ADVANCES_ENDPOINT,
  HARVEST_TRANSPORTER_SUPPLIERS_ENDPOINT,
  harvestPlotFieldsService,
  harvestReleasesService,
  harvestAdvancesService,
} from './api-services-harvest';
import {
  buildTransporterAdvancePayload,
  buildHarvesterAdvancePayload,
  buildHarvestReleasePayload,
  calculateHarvestPreview,
  canQueryMatrixFreight,
  canSubmitHarvestRelease,
  harvestAdvanceInvalidationKeys,
  isTransporterAdvanceValueValid,
  keepRestoredPlotField,
} from './harvest-rules';


const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

describe('endpoints oficiais da colheita', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa /releases/harvest e nunca os endpoints antigos', () => {
    expect(HARVEST_RELEASES_ENDPOINT).toBe('/releases/harvest/harvest-releases');
    expect(HARVEST_PLOT_FIELDS_ENDPOINT).toBe('/releases/harvest/plot-fields');
    expect(HARVEST_MATRIX_FREIGHT_ENDPOINT).toBe('/releases/harvest/matrix-freight');
    expect(HARVEST_RELEASES_ENDPOINT).not.toContain('/entries/');
  });

  it('carrega apenas os talhões da safra selecionada', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
    await harvestPlotFieldsService.byCrop('7');
    expect(mockedApi.get).toHaveBeenCalledWith(HARVEST_PLOT_FIELDS_ENDPOINT, {
      params: { crop_id: '7' },
    });
  });

  it('envia filtros de safra, motorista e fornecedor na listagem', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
    await harvestReleasesService.list({ crop_id: '1', driver_id: '2', supplier_id: '3' });
    expect(mockedApi.get).toHaveBeenCalledWith(HARVEST_RELEASES_ENDPOINT, {
      params: { crop_id: '1', driver_id: '2', supplier_id: '3', per_page: 25 },
    });
  });
});

describe('consulta da matriz de frete', () => {
  it('só habilita com safra, talhão e armazém', () => {
    expect(canQueryMatrixFreight('1', '', '3')).toBe(false);
    expect(canQueryMatrixFreight('1', '2', '')).toBe(false);
    expect(canQueryMatrixFreight('1', '2', '3')).toBe(true);
  });

  it('bloqueia o envio quando não há percurso', () => {
    expect(canSubmitHarvestRelease(undefined, false)).toBe(false);
    expect(canSubmitHarvestRelease({ matrix_freight_id: '9' } as never, true)).toBe(false);
    expect(canSubmitHarvestRelease({ matrix_freight_id: '9' } as never, false)).toBe(true);
  });
});

describe('prévia dos valores', () => {
  it('usa sacas brutas para calcular o frete', () => {
    const preview = calculateHarvestPreview(60000, 10, 5);
    expect(preview.discount_weight).toBe(6000);
    expect(preview.net_weight).toBe(54000);
    expect(preview.gross_bags).toBe(1000);
    expect(preview.liquid_bags).toBe(900);
    expect(preview.shipping_value).toBe(5000);
  });
});

describe('payload do lançamento', () => {
  it('não envia campos calculados pelo backend', () => {
    const payload = buildHarvestReleasePayload({
      crop_id: '1',
      driver_id: '2',
      owner_id: '3',
      plot_field_id: '4',
      warehouse_id: '5',
      lanyard_id: '6',
      release_date: '2026-01-10',
      shipping_number: ' 100 ',
      control_number: ' 200 ',
      gross_weight: 1000,
      discount: 2,
      matrix_freight_id: '9',
      net_weight: 980,
      gross_bags: 16,
      liquid_bags: 16,
      discount_weight: 20,
      shipping_value: 80,
      shipping_paid_value: 10,
    } as never);
    expect(Object.keys(payload).sort()).toEqual(
      [
        'control_number',
        'crop_id',
        'discount',
        'driver_id',
        'gross_weight',
        'lanyard_id',
        'owner_id',
        'plot_field_id',
        'release_date',
        'shipping_number',
        'warehouse_id',
      ].sort(),
    );
    expect(payload.shipping_number).toBe('100');
  });
});

describe('criação contínua', () => {
  it('não restaura talhão que não pertence à safra carregada', () => {
    expect(keepRestoredPlotField('10', [{ id: '11' }])).toBe('');
    expect(keepRestoredPlotField('11', [{ id: '11' }])).toBe('11');
  });
});

describe('adiantamento de colhedor', () => {
  it('usa o fornecedor colhedor e nunca lanyard, armazém ou cultura', () => {
    const payload = buildHarvesterAdvancePayload({
      crop_id: '1',
      supplier_id: '2',
      producer_id: '3',
      administrative_center_id: '4',
      type_pay_account_id: '5',
      document_date: '2026-01-01',
      due_date: '2026-02-01',
      document_number: 'ADC-001',
      value: 100,
    });
    expect(payload.advance_type).toBe('HARVESTER');
    expect(payload.supplier_id).toBe('2');
    expect(payload).not.toHaveProperty('lanyard_id');
    expect(payload).not.toHaveProperty('warehouse_id');
    expect(payload).not.toHaveProperty('culture_id');
    expect(payload).not.toHaveProperty('cost_center_id');
  });
});

describe('adiantamento de transportador', () => {
  it('não permite valor acima do saldo em aberto', () => {
    expect(isTransporterAdvanceValueValid(0, 100)).toBe(false);
    expect(isTransporterAdvanceValueValid(150, 100)).toBe(false);
    expect(isTransporterAdvanceValueValid(100, 100)).toBe(true);
  });

  it('é consolidado por fornecedor e nunca informa motorista', () => {
    const payload = buildTransporterAdvancePayload({
      crop_id: '1',
      supplier_id: '2',
      producer_id: '3',
      administrative_center_id: '4',
      type_pay_account_id: '5',
      document_date: '2026-01-01',
      due_date: '2026-02-01',
      document_number: 'ADT-001',
      value: 50,
    });
    expect(payload.advance_type).toBe('TRANSPORTER');
    expect(payload.supplier_id).toBe('2');
    expect(payload).not.toHaveProperty('driver_id');
  });

  it('cria o adiantamento pelo endpoint de adiantamentos, nunca em pay-accounts', async () => {
    mockedApi.post.mockResolvedValue({ data: { data: { id: '1' } } });
    await harvestAdvancesService.create({
      advance_type: 'TRANSPORTER',
      crop_id: '1',
      supplier_id: '2',
      producer_id: '3',
      administrative_center_id: '4',
      type_pay_account_id: '5',
      document_date: '2026-01-01',
      due_date: '2026-02-01',
      document_number: 'ADT-001',
      value: 50,
    });
    expect(mockedApi.post).toHaveBeenCalledWith(HARVEST_ADVANCES_ENDPOINT, expect.any(Object));
  });

  it('consulta os transportadores pelo endpoint oficial', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
    await harvestAdvancesService.transporterSuppliers('9');
    expect(mockedApi.get).toHaveBeenCalledWith(HARVEST_TRANSPORTER_SUPPLIERS_ENDPOINT, {
      params: { crop_id: '9' },
    });
  });
});

describe('invalidações do React Query', () => {
  it('invalida as chaves corretas após cada tipo de adiantamento', () => {
    expect(harvestAdvanceInvalidationKeys('HARVESTER', '1')).toEqual([
      ['harvest-advances', 'HARVESTER'],
      ['harvest-eligible-harvesters', '1'],
      ['pay-accounts'],
    ]);
    expect(harvestAdvanceInvalidationKeys('TRANSPORTER', '9')).toEqual([
      ['harvest-transporter-suppliers', '9'],
      ['harvest-advances', 'TRANSPORTER'],
      ['harvest-releases'],
      ['pay-accounts'],
    ]);
  });
});

