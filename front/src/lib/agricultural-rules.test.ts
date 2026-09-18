import { describe, it, expect } from 'vitest';
import {
  AGRICULTURAL_SERVICES_ENDPOINT,
  SEED_TREATMENTS_ENDPOINT,
  DEFENSIVE_SERVICES_BASE,
} from '@/lib/api-services-agricultural-services';
import {
  actualProductQuantity,
  accumulateClosings,
  applicationProductIsValid,
  areaIsReadOnly,
  buildSequencePayload,
  canCompleteService,
  canReorderOrderProducts,
  canSwapProducts,
  chemicalQuantityFromDose,
  countPasses,
  firebreakArea,
  fleetGroupMatchesFunction,
  hasTankerOperator,
  moveWithinOrderGroup,
  movesStock,
  operatorIsValid,
  plannedProductQuantity,
  recommendedForItem,
  reservesStock,
  seedTreatmentIsValid,
  seedTreatmentMovesStock,
  sortProductsByFormulationOrder,
  totalArea,
  totalRecommended,
} from '@/lib/agricultural-rules';
import type { AgriculturalServiceItem } from '@/types/agricultural';
import type { AgriculturalServiceType } from '@/lib/api-services-inventory';

const serviceType = (overrides: Partial<AgriculturalServiceType> = {}): AgriculturalServiceType => ({
  id: '1',
  name: 'Aplicação',
  code: 'APL',
  category: 'INPUT_APPLICATION',
  requires_input: true,
  requires_rate: true,
  requires_fleet: true,
  requires_implement: true,
  status: 'A',
  ...overrides,
});

const item = (overrides: Partial<AgriculturalServiceItem> = {}): AgriculturalServiceItem => ({
  plot_field_id: '10',
  area: 100,
  pass_number: 1,
  ...overrides,
});

describe('Endpoints oficiais dos serviços agrícolas', () => {
  it('usa os prefixos do backend Laravel sem duplicar /api', () => {
    expect(AGRICULTURAL_SERVICES_ENDPOINT).toBe('/releases/agricultural/services');
    expect(SEED_TREATMENTS_ENDPOINT).toBe('/releases/agricultural/seed-treatments');
    expect(DEFENSIVE_SERVICES_BASE).toBe('/releases/agricultural/services/defensive');
  });
});

describe('Talhões e áreas', () => {
  it('permite o mesmo talhão em várias passadas (sem distinct)', () => {
    const items = [item({ pass_number: 1 }), item({ pass_number: 2 }), item({ plot_field_id: '11' })];
    expect(items).toHaveLength(3);
    expect(countPasses(items, '10')).toBe(2);
    expect(totalArea(items)).toBe(300);
  });

  it('mantém a área como valor somente leitura vindo do cadastro', () => {
    expect(areaIsReadOnly()).toBe(true);
  });
});

describe('Taxa fixa e variável', () => {
  it('calcula o recomendado por talhão e o total com taxa fixa', () => {
    const items = [item({ area: 10 }), item({ area: 5 })];
    expect(recommendedForItem(items[0], 'FIXED', 2)).toBe(20);
    expect(totalRecommended(items, 'FIXED', 2)).toBe(30);
  });

  it('usa a dose de cada talhão quando a taxa é variável', () => {
    const items = [item({ area: 10, rate_value: 3 }), item({ area: 5, rate_value: 1 })];
    expect(totalRecommended(items, 'VARIABLE', 99)).toBe(35);
  });

  it('exige um único produto e taxa válida na aplicação de insumos', () => {
    const type = serviceType();
    expect(applicationProductIsValid({ product_id: '', rate_type: 'FIXED', rate_unit: 'KG_HA', rate_value: 2 }, type)).toBe(false);
    expect(applicationProductIsValid({ product_id: '5', rate_type: 'FIXED', rate_unit: 'KG_HA', rate_value: 0 }, type)).toBe(false);
    expect(applicationProductIsValid({ product_id: '5', rate_type: 'FIXED', rate_unit: 'KG_HA', rate_value: 2 }, type)).toBe(true);
    expect(applicationProductIsValid({ product_id: null, rate_type: null, rate_unit: null, rate_value: null }, serviceType({ requires_input: false }))).toBe(true);
  });
});

describe('Operadores e implementos', () => {
  it('exige implemento quando o tipo de serviço pede', () => {
    const operator = {
      agricultural_operator_id: '3',
      traction_fleet_id: '7',
      implement_fleet_id: '',
      function: 'OPERADOR',
    };
    expect(operatorIsValid(operator, serviceType())).toBe(false);
    expect(operatorIsValid({ ...operator, implement_fleet_id: '9' }, serviceType())).toBe(true);
    expect(operatorIsValid(operator, serviceType({ requires_implement: false }))).toBe(true);
  });

  it('exige ao menos um operador com function T (Tanqueiro)', () => {
    expect(hasTankerOperator([])).toBe(false);
    expect(hasTankerOperator([{ function: 'O' }])).toBe(false);
    expect(hasTankerOperator([{ function: 'OPERADOR' }])).toBe(false);
    expect(hasTankerOperator([{ function: 'O' }, { function: 'T' }])).toBe(true);
    expect(hasTankerOperator([{ function: 'tanqueiro' }])).toBe(true);
  });
});

describe('Aceiro', () => {
  it('calcula a área por comprimento × largura em hectares', () => {
    expect(firebreakArea({ length: 1000, width: 10 })).toBe(1);
  });
});

describe('Estoque por estado do serviço', () => {
  it('não reserva nem baixa no planejamento e baixa só na conclusão', () => {
    expect(reservesStock('PLANNED')).toBe(false);
    expect(movesStock('PLANNED')).toBe(false);
    expect(movesStock('IN_PROGRESS')).toBe(false);
    expect(movesStock('COMPLETED')).toBe(true);
    expect(canCompleteService('IN_PROGRESS')).toBe(true);
    expect(canCompleteService('PLANNED')).toBe(false);
  });
});

describe('Tratamento de sementes', () => {
  const base = {
    crop_id: '1',
    culture_id: '2',
    treatment_date: '2026-01-10',
    batch_count: 4,
    seeds: [
      {
        product_id: '5',
        culture_id: '2',
        variety_id: '8',
        product_stock_id: '77',
        treated_quantity: 100,
        unit: 'KG',
      },
    ],
    chemicals: [
      { product_id: '9', product_stock_id: '80', dose_per_batch: 2, actual_quantity: 8, unit: 'L' },
    ],
  };

  it('valida semente, químico e número de batidas', () => {
    expect(seedTreatmentIsValid(base)).toBe(true);
    expect(seedTreatmentIsValid({ ...base, batch_count: 0 })).toBe(false);
    expect(seedTreatmentIsValid({ ...base, chemicals: [] })).toBe(false);
  });

  it('calcula a quantidade do químico pela dose por batida', () => {
    expect(chemicalQuantityFromDose(2, 4)).toBe(8);
  });

  it('converte a semente somente na finalização', () => {
    expect(seedTreatmentMovesStock('DRAFT')).toBe(false);
    expect(seedTreatmentMovesStock('COMPLETED')).toBe(true);
  });
});

describe('Sequência de produtos da O.S. de defensivos', () => {
  const products = [
    { product_id: 'a' },
    { product_id: 'b' },
    { product_id: 'c' },
  ];
  const orders: Record<string, number> = { a: 3, b: 1, c: 1 };
  const orderOf = (id: string) => orders[id];

  it('ordena pela ordem da formulação, do menor para o maior', () => {
    expect(sortProductsByFormulationOrder(products, orderOf).map((p) => p.product_id)).toEqual(['b', 'c', 'a']);
  });

  it('permite arrastar apenas dentro do mesmo grupo de ordem', () => {
    expect(canSwapProducts(1, 1)).toBe(true);
    expect(canSwapProducts(1, 3)).toBe(false);
    const sorted = sortProductsByFormulationOrder(products, orderOf);
    const moved = moveWithinOrderGroup(sorted, 0, 1, (p) => orderOf(String(p.product_id)));
    expect(moved.map((p) => p.product_id)).toEqual(['c', 'b', 'a']);
    const blocked = moveWithinOrderGroup(sorted, 0, 2, (p) => orderOf(String(p.product_id)));
    expect(blocked).toBe(sorted);
  });

  it('envia todos os produtos exatamente uma vez no PATCH', () => {
    expect(buildSequencePayload(['a', 'b', 'c'])).toEqual({ product_ids: ['a', 'b', 'c'] });
    expect(() => buildSequencePayload(['a', 'a'])).toThrow();
  });

  it('reordena somente O.S. abertas', () => {
    expect(canReorderOrderProducts('A')).toBe(true);
    expect(canReorderOrderProducts('F')).toBe(false);
  });
});

describe('Quantidades da O.S. de defensivos', () => {
  it('planejado = pump × área e real = bombas × pump', () => {
    expect(plannedProductQuantity(1.5, 100)).toBe(150);
    expect(actualProductQuantity(12, 1.5)).toBe(18);
  });

  it('acumula fechamentos sem sobrescrever os anteriores', () => {
    expect(accumulateClosings(10, 5)).toBe(15);
  });
});

describe('Frota de tração por função', () => {
  it('função T (Tanqueiro) traz somente veículos do grupo Trator', () => {
    expect(fleetGroupMatchesFunction('TRATOR', 'T')).toBe(true);
    expect(fleetGroupMatchesFunction('Trator agrícola', 'T')).toBe(true);
    expect(fleetGroupMatchesFunction('PULVERIZADOR', 'T')).toBe(false);
  });

  it('função O (Operador) traz somente veículos do grupo Pulverizador', () => {
    expect(fleetGroupMatchesFunction('PULVERIZADO', 'O')).toBe(true);
    expect(fleetGroupMatchesFunction('Pulverizador', 'O')).toBe(true);
    expect(fleetGroupMatchesFunction('TRATOR', 'O')).toBe(false);
  });

  it('sem função definida não filtra o grupo', () => {
    expect(fleetGroupMatchesFunction('TRATOR', '')).toBe(true);
    expect(fleetGroupMatchesFunction(undefined, undefined)).toBe(true);
  });
});
