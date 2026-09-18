import { describe, it, expect } from 'vitest';
import {
  canPrintTicket,
  canOpenTicketForTruck,
  buildDiscountRows,
  impuritySumMatchesNetWeight,
  canCloseShipping,
  requiresMultipleContractAuthorization,
  canApproveAuthorization,
  validateChannelLimits,
  isValidPlate,
  normalizePlate,
  grossWeightWithinTruckCapacity,
  hasOverlappingEffectivePeriod,
  generatesParentAndSubtickets,
} from './grain-rules';
import {
  parseWeightBR,
  formatWeight,
  formatPercentage,
  canCaptureReading,
} from './grain-format';
import { getApiValidationErrors } from './form-errors';
import type { GrainDiscountType } from '@/types/grain';

const discountType = (over: Partial<GrainDiscountType>): GrainDiscountType =>
  ({
    id: '1',
    culture_id: '1',
    name: 'Umidade',
    code: 'UMI',
    type: 'PERCENTAGE',
    calculation_method: 'MANUAL',
    affects_commercial_weight: true,
    generates_impurity: false,
    display_order: 1,
    status: 'A',
    ...over,
  }) as GrainDiscountType;

describe('máscara de peso', () => {
  it('formata em pt-BR com milhar e 3 decimais', () => {
    expect(formatWeight(41250.5)).toBe('41.250,5');
    expect(formatWeight(41250.125)).toBe('41.250,125');
  });

  it('converte texto mascarado de volta para número', () => {
    expect(parseWeightBR('41.250,500')).toBe(41250.5);
    expect(parseWeightBR('')).toBe(0);
  });

  it('formata percentual com até 5 casas', () => {
    expect(formatPercentage(1.5)).toContain('1,5');
  });
});

describe('captura de leitura da balança', () => {
  const now = new Date('2026-01-01T12:00:00Z').getTime();

  it('libera leitura estável e recente', () => {
    expect(canCaptureReading({ stable: true, read_at: '2026-01-01T11:59:58Z' }, now)).toBe(true);
  });

  it('bloqueia leitura instável', () => {
    expect(canCaptureReading({ stable: false, read_at: '2026-01-01T11:59:58Z' }, now)).toBe(false);
  });

  it('bloqueia leitura antiga (acima de 30s)', () => {
    expect(canCaptureReading({ stable: true, read_at: '2026-01-01T11:59:00Z' }, now)).toBe(false);
  });

  it('bloqueia quando não há leitura', () => {
    expect(canCaptureReading(null, now)).toBe(false);
  });
});

describe('regras de ticket', () => {
  it('imprime somente ticket fechado', () => {
    expect(canPrintTicket('WAITING_FIRST_WEIGHT')).toBe(false);
    expect(canPrintTicket('SECOND_WEIGHED')).toBe(false);
    expect(canPrintTicket('CANCELED')).toBe(false);
    expect(canPrintTicket('CLOSED')).toBe(true);
  });

  it('bloqueia caminhão com ticket em aberto', () => {
    expect(canOpenTicketForTruck([])).toBe(true);
    expect(canOpenTicketForTruck([{ id: '7' }])).toBe(false);
  });
});

describe('grade de descontos', () => {
  it('inclui todos os tipos ativos, inclusive zerados, na ordem de exibição', () => {
    const rows = buildDiscountRows(
      [
        discountType({ id: '2', display_order: 2, name: 'Impureza' }),
        discountType({ id: '1', display_order: 1 }),
        discountType({ id: '3', display_order: 3, status: 'I' }),
      ],
      [{ grain_discount_type_id: '2', percentage: 1.25 }],
    );
    expect(rows).toEqual([
      { grain_discount_type_id: '1', percentage: 0 },
      { grain_discount_type_id: '2', percentage: 1.25 },
    ]);
  });
});

describe('saída de impureza', () => {
  it('exige soma igual ao peso líquido', () => {
    expect(impuritySumMatchesNetWeight([{ quantity: 600 }, { quantity: 400 }], 1000)).toBe(true);
    expect(impuritySumMatchesNetWeight([{ quantity: 600 }], 1000)).toBe(false);
  });
});

describe('expedição', () => {
  it('não fecha sem saldo suficiente', () => {
    expect(canCloseShipping({ can_close: false, missing_weight: 500 })).toBe(false);
    expect(canCloseShipping({ can_close: true })).toBe(true);
    expect(canCloseShipping(null)).toBe(false);
  });

  it('exige autorização na prévia com múltiplos contratos', () => {
    expect(
      requiresMultipleContractAuthorization({
        allocations: [{ grain_contract_id: '1' }, { grain_contract_id: '2' }],
      }),
    ).toBe(true);
    expect(
      requiresMultipleContractAuthorization({ allocations: [{ grain_contract_id: '1' }] }),
    ).toBe(false);
  });
});

describe('autorizações', () => {
  it('impede aprovar a própria solicitação', () => {
    expect(canApproveAuthorization({ requested_by_id: '5', status: 'PENDING' }, '5', true)).toBe(false);
    expect(canApproveAuthorization({ requested_by_id: '9', status: 'PENDING' }, '5', true)).toBe(true);
    expect(canApproveAuthorization({ requested_by_id: '9', status: 'PENDING' }, '5', false)).toBe(false);
  });
});

describe('erros 422', () => {
  it('extrai campos aninhados no nome correto', () => {
    const errors = getApiValidationErrors({
      response: {
        data: {
          errors: {
            'discounts.0.percentage': ['O percentual é inválido.'],
            'impurity_items.0.quantity': ['A quantidade é obrigatória.'],
          },
        },
      },
    });
    expect(Object.keys(errors ?? {})).toEqual([
      'discounts.0.percentage',
      'impurity_items.0.quantity',
    ]);
  });
});


describe('cadastros da balança', () => {
  it('valida os limites do canal', () => {
    expect(validateChannelLimits({ minimum_weight: 0, maximum_weight: 80000, division_weight: 20 })).toBeUndefined();
    expect(validateChannelLimits({ minimum_weight: 0, maximum_weight: 0, division_weight: 20 })).toBeTruthy();
    expect(validateChannelLimits({ minimum_weight: -1, maximum_weight: 100, division_weight: 20 })).toBeTruthy();
    expect(validateChannelLimits({ minimum_weight: 200, maximum_weight: 100, division_weight: 20 })).toBeTruthy();
    expect(validateChannelLimits({ minimum_weight: 0, maximum_weight: 100, division_weight: 0 })).toBeTruthy();
  });

  it('normaliza e valida a placa do caminhão', () => {
    expect(normalizePlate('abc-1d23')).toBe('ABC1D23');
    expect(isValidPlate('abc1d23')).toBe(true);
    expect(isValidPlate('ABC1234')).toBe(true);
    expect(isValidPlate('AB1234')).toBe(false);
  });

  it('impede vigências sobrepostas na quebra técnica', () => {
    const existing = [
      { id: '1', producer_id: '1', culture_id: '2', effective_from: '2026-01-01', effective_until: '2026-06-30' },
    ];
    expect(
      hasOverlappingEffectivePeriod(
        { producer_id: '1', culture_id: '2', effective_from: '2026-06-01', effective_until: null },
        existing,
      ),
    ).toBe(true);
    expect(
      hasOverlappingEffectivePeriod(
        { producer_id: '1', culture_id: '2', effective_from: '2026-07-01', effective_until: null },
        existing,
      ),
    ).toBe(false);
    expect(
      hasOverlappingEffectivePeriod(
        { id: '1', producer_id: '1', culture_id: '2', effective_from: '2026-01-01', effective_until: '2026-06-30' },
        existing,
      ),
    ).toBe(false);
    expect(
      hasOverlappingEffectivePeriod(
        { producer_id: '9', culture_id: '2', effective_from: '2026-01-01', effective_until: null },
        existing,
      ),
    ).toBe(false);
  });
});

describe('capacidade do caminhão', () => {
  it('bloqueia peso bruto acima do máximo', () => {
    expect(grossWeightWithinTruckCapacity(48000, 50000)).toBe(true);
    expect(grossWeightWithinTruckCapacity(50000, 50000)).toBe(true);
    expect(grossWeightWithinTruckCapacity(51000, 50000)).toBe(false);
    expect(grossWeightWithinTruckCapacity(51000, null)).toBe(true);
  });
});

describe('FIFO de contratos', () => {
  it('gera ticket pai e subtickets quando usa mais de um contrato', () => {
    expect(
      generatesParentAndSubtickets({
        allocations: [{ grain_contract_id: '1' }, { grain_contract_id: '2' }],
      }),
    ).toBe(true);
    expect(generatesParentAndSubtickets({ allocations: [{ grain_contract_id: '1' }] })).toBe(false);
    expect(generatesParentAndSubtickets(null)).toBe(false);
  });
});
