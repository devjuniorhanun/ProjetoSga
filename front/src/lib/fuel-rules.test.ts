import { describe, it, expect } from 'vitest';
import {
  FUEL_BASE,
  fuelStationsService,
  fuelTanksService,
  fuelStationProductsService,
  fuelRegistersService,
  fuelRegisterReadingsService,
  fuelGaugeTablesService,
  fuelGaugeReadingsService,
  fuelEntriesService,
  fuelTransfersService,
  fuelRefuelingsService,
  fuelStockAdjustmentsService,
  fleetMeterReadingsService,
  fleetOilChangesService,
  fleetMaintenancePlansService,
  fleetMaintenanceRecordsService,
} from '@/lib/api-services-fuel-phase6';
import {
  adjustmentRequiresReason,
  canConfirmTransfer,
  consumptionIndex,
  interpolateLiters,
  lubricantTransferIsAllowed,
  movementsCanBeDeleted,
  readingMovesStock,
  refuelingMovesStock,
  registerQuantity,
  transferInitialStatus,
  transferMovesStock,
} from '@/lib/fuel-rules';

describe('Endpoints oficiais de combustível', () => {
  it('usa o namespace Releases/Fuel e nunca Entries/Fuel', () => {
    expect(FUEL_BASE).toBe('/releases/fuel');
    const endpoints = [
      fuelStationsService, fuelTanksService, fuelStationProductsService, fuelRegistersService,
      fuelRegisterReadingsService, fuelGaugeTablesService, fuelGaugeReadingsService, fuelEntriesService,
      fuelTransfersService, fuelRefuelingsService, fuelStockAdjustmentsService, fleetMeterReadingsService,
      fleetOilChangesService, fleetMaintenancePlansService, fleetMaintenanceRecordsService,
    ].map((service) => service.endpoint);

    endpoints.forEach((endpoint) => {
      expect(endpoint.startsWith('/releases/fuel/')).toBe(true);
      expect(endpoint).not.toContain('/entries/fuel');
      expect(endpoint).not.toContain('/api/');
    });

    expect(fuelStationsService.endpoint).toBe('/releases/fuel/stations');
    expect(fuelRegistersService.endpoint).toBe('/releases/fuel/registradoras');
    expect(fleetMaintenanceRecordsService.endpoint).toBe('/releases/fuel/maintenance-records');
  });
});

describe('Régua: conversão cm → litros', () => {
  const table = [
    { centimeters: 0, liters: 0 },
    { centimeters: 10, liters: 500 },
    { centimeters: 20, liters: 1200 },
  ];

  it('usa o ponto exato quando existe na tabela', () => {
    expect(interpolateLiters(table, 10)).toBe(500);
  });

  it('interpola linearmente entre os pontos cadastrados', () => {
    expect(interpolateLiters(table, 15)).toBe(850);
    expect(interpolateLiters(table, '5')).toBe(250);
  });

  it('não converte valores fora da faixa da régua', () => {
    expect(interpolateLiters(table, 25)).toBeNull();
    expect(interpolateLiters([], 5)).toBeNull();
  });

  it('a leitura não altera o estoque contábil', () => {
    expect(readingMovesStock()).toBe(false);
  });
});

describe('Registradora', () => {
  it('calcula final menos inicial e não baixa estoque', () => {
    expect(registerQuantity(1000, 1250)).toBe(250);
    expect(registerQuantity(1000, 900)).toBeNull();
    expect(readingMovesStock()).toBe(false);
    expect(refuelingMovesStock()).toBe(true);
  });
});

describe('Transferências', () => {
  it('nasce pendente e só a confirmação movimenta o estoque', () => {
    expect(transferInitialStatus()).toBe('D');
    expect(canConfirmTransfer('D')).toBe(true);
    expect(canConfirmTransfer('C')).toBe(false);
    expect(canConfirmTransfer('X')).toBe(false);
    expect(transferMovesStock('D')).toBe(false);
    expect(transferMovesStock('C')).toBe(true);
  });

  it('permite lubrificante do posto físico para o posto móvel', () => {
    expect(lubricantTransferIsAllowed('F', 'M')).toBe(true);
    expect(lubricantTransferIsAllowed('M', 'F')).toBe(true);
    expect(lubricantTransferIsAllowed('F', '')).toBe(false);
  });
});

describe('Ajustes de estoque', () => {
  it('exige justificativa e nunca apaga movimentos', () => {
    expect(adjustmentRequiresReason('Diferença de régua')).toBe(true);
    expect(adjustmentRequiresReason('   ')).toBe(false);
    expect(movementsCanBeDeleted()).toBe(false);
  });
});

describe('Consumo da frota por tipo de marcação', () => {
  it('H calcula litros por hora e K calcula litros por quilômetro', () => {
    expect(consumptionIndex('H', 100, 20, 0)).toEqual({ unit: 'L/h', value: 5 });
    expect(consumptionIndex('K', 100, 0, 200)).toEqual({ unit: 'L/km', value: 0.5 });
  });

  it('não mostra índice quando a divisão seria por zero', () => {
    expect(consumptionIndex('H', 100, 0, 500)).toBeNull();
    expect(consumptionIndex('K', 100, 10, 0)).toBeNull();
    expect(consumptionIndex('', 100, 10, 10)).toBeNull();
  });
});
