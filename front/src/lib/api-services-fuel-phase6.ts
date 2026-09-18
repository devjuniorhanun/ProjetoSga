import api from './api';

/* ============================================================
 * Fase 6 — Combustíveis, Lubrificantes e Frota
 * ==========================================================*/

export type Id = string;
export type Status = 'A' | 'I';

function createCrudService<T extends { id: string }>(endpoint: string) {
  return {
    endpoint,
    getAll: async (): Promise<T[]> => {
      const { data } = await api.get(endpoint);
      const result = data.data ?? data;
      return Array.isArray(result) ? result : [];
    },
    getById: async (id: string): Promise<T> => {
      const { data } = await api.get(`${endpoint}/${id}`);
      return data.data ?? data;
    },
    create: async (payload: Omit<T, 'id'>): Promise<T> => {
      const { data } = await api.post(endpoint, payload);
      return data.data ?? data;
    },
    update: async (id: string, payload: Partial<T>): Promise<T> => {
      const { data } = await api.put(`${endpoint}/${id}`, payload);
      return data.data ?? data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}

/* ---------------- Postos ---------------- */
export interface FuelStation {
  id: Id;
  name: string;
  /** F = Físico, M = Móvel */
  type: 'F' | 'M';
  status: Status;
  observation?: string;
}

/* ---------------- Tanques ---------------- */
export interface FuelTank {
  id: Id;
  station_id: Id;
  station_name?: string;
  name: string;
  capacity: number;
  status: Status;
  observation?: string;
}

/* ---------------- Produtos por Posto ---------------- */
export interface FuelStationProduct {
  id: Id;
  station_id: Id;
  product_id: Id;
  station_name?: string;
  product_name?: string;
  minimum_stock: number;
  maximum_stock: number;
  actual_stock: number;
  status: Status;
}

/* ---------------- Registradoras ---------------- */
export interface FuelRegister {
  id: Id;
  station_id: Id;
  product_id: Id;
  station_name?: string;
  product_name?: string;
  name: string;
  status: Status;
  observation?: string;
}

export interface FuelRegisterReading {
  id: Id;
  station_id: Id;
  product_id: Id;
  register_id: Id;
  station_name?: string;
  product_name?: string;
  register_name?: string;
  reading_date: string;
  initial_reading: number;
  final_reading: number;
  quantity: number;
  observation?: string;
}

/* ---------------- Régua ---------------- */
export interface FuelTankGaugeTable {
  id: Id;
  tank_id: Id;
  tank_name?: string;
  centimeters: number;
  liters: number;
}

export interface FuelTankGaugeReading {
  id: Id;
  station_id: Id;
  tank_id: Id;
  station_name?: string;
  tank_name?: string;
  reading_date: string;
  centimeters: number;
  liters: number;
  observation?: string;
}

/* ---------------- Entradas ---------------- */
export interface FuelEntry {
  id: Id;
  supplier_id: Id;
  station_id: Id;
  product_id: Id;
  supplier_name?: string;
  station_name?: string;
  product_name?: string;
  entry_date: string;
  quantity: number;
  unit_price: number;
  document: string;
  observation?: string;
}

/* ---------------- Transferências ---------------- */
export interface FuelTransfer {
  id: Id;
  origin_station_id: Id;
  origin_tank_id?: Id;
  destination_station_id: Id;
  destination_tank_id?: Id;
  product_id: Id;
  origin_station_name?: string;
  origin_tank_name?: string;
  destination_station_name?: string;
  destination_tank_name?: string;
  product_name?: string;
  quantity: number;
  transfer_date: string;
  responsible: string;
  document?: string;
  observation?: string;
  /** D = Rascunho, C = Confirmada, X = Cancelada */
  status: 'D' | 'C' | 'X';
}

/* ---------------- Abastecimentos ---------------- */
export interface FuelRefueling {
  id: Id;
  station_id: Id;
  product_id: Id;
  fleet_id: Id;
  operator_id: Id;
  register_id?: Id;
  station_name?: string;
  product_name?: string;
  fleet_name?: string;
  operator_name?: string;
  register_name?: string;
  refueling_date: string;
  quantity: number;
  value: number;
  meter_reading: number;
  observation?: string;
}

/* ---------------- Estoque ---------------- */
export interface FuelStock {
  id: Id;
  station_id: Id;
  product_id: Id;
  station_name?: string;
  product_name?: string;
  actual_stock: number;
  minimum_stock: number;
  maximum_stock: number;
}

export interface FuelStockMovement {
  id: Id;
  movement_date: string;
  station_id?: Id;
  tank_id?: Id;
  product_id?: Id;
  station_name?: string;
  tank_name?: string;
  product_name?: string;
  /** E = Entrada, S = Saída, T = Transferência, D = Devolução, A = Ajuste */
  type: 'E' | 'S' | 'T' | 'D' | 'A';
  /** I = Entrada, O = Saída */
  direction: 'I' | 'O';
  quantity: number;
  previous_stock?: number;
  next_stock?: number;
  reference?: string;
  observation?: string;
  user_name?: string;
}

export interface FuelStockAdjustment {
  id: Id;
  station_id: Id;
  product_id: Id;
  tank_id?: Id;
  station_name?: string;
  product_name?: string;
  tank_name?: string;
  quantity: number;
  direction: 'I' | 'O';
  reason: string;
  responsible: string;
  adjustment_date: string;
  observation?: string;
}

export interface FuelReconciliationRow {
  station_id?: Id;
  product_id?: Id;
  tank_id?: Id;
  station_name?: string;
  product_name?: string;
  tank_name?: string;
  theoretical_stock?: number;
  physical_stock?: number;
  difference?: number;
  register_output?: number;
}

export interface FuelConsumptionRow {
  fleet_id?: Id;
  fleet_name?: string;
  station_name?: string;
  product_name?: string;
  marking_type?: string;
  liters?: number;
  worked_hours?: number;
  traveled_km?: number;
  liters_per_hour?: number;
  liters_per_km?: number;
  expected_consumption?: number;
  actual_consumption?: number;
  difference?: number;
}

/* ---------------- Frota ---------------- */
export interface FleetMeterReading {
  id: Id;
  fleet_id: Id;
  fleet_name?: string;
  marking_type?: string;
  reading_date: string;
  initial_reading: number;
  final_reading: number;
  total: number;
  observation?: string;
}

export interface FleetOilChange {
  id: Id;
  fleet_id: Id;
  product_id: Id;
  fleet_name?: string;
  product_name?: string;
  marking_type?: string;
  change_date: string;
  meter_reading: number;
  quantity: number;
  observation?: string;
}

export interface FleetMaintenancePlan {
  id: Id;
  fleet_id: Id;
  fleet_name?: string;
  marking_type: string;
  interval: number;
  description: string;
  status: Status;
}

export interface FleetMaintenanceRecord {
  id: Id;
  fleet_id: Id;
  maintenance_plan_id: Id;
  fleet_name?: string;
  maintenance_plan_name?: string;
  maintenance_date: string;
  meter_reading: number;
  description: string;
  observation?: string;
  last_maintenance?: number;
  next_maintenance?: number;
  interval?: number;
  remaining?: number;
}

/* ---------------- Serviços ---------------- */
/** Namespace oficial do backend: Releases/Fuel. */
export const FUEL_BASE = '/releases/fuel';
const FUEL = FUEL_BASE;


export const fuelStationsService = createCrudService<FuelStation>(`${FUEL}/stations`);
export const fuelTanksService = createCrudService<FuelTank>(`${FUEL}/tanks`);
export const fuelStationProductsService = createCrudService<FuelStationProduct>(`${FUEL}/station-products`);
export const fuelRegistersService = createCrudService<FuelRegister>(`${FUEL}/registradoras`);
export const fuelRegisterReadingsService = createCrudService<FuelRegisterReading>(`${FUEL}/registradora-readings`);
export const fuelGaugeTablesService = createCrudService<FuelTankGaugeTable>(`${FUEL}/gauge-tables`);
export const fuelGaugeReadingsService = createCrudService<FuelTankGaugeReading>(`${FUEL}/gauge-readings`);
export const fuelEntriesService = createCrudService<FuelEntry>(`${FUEL}/entries`);
export const fuelTransfersService = {
  ...createCrudService<FuelTransfer>(`${FUEL}/transfers`),
  confirm: async (id: Id): Promise<FuelTransfer> => {
    const { data } = await api.post(`${FUEL}/transfers/${id}/confirm`, {});
    return data.data ?? data;
  },
};
export const fuelRefuelingsService = createCrudService<FuelRefueling>(`${FUEL}/refuelings`);
export const fuelStockAdjustmentsService = createCrudService<FuelStockAdjustment>(`${FUEL}/stock-adjustments`);

export const fuelStockMovementsService = {
  getAll: async (params?: Record<string, string>): Promise<FuelStockMovement[]> => {
    const { data } = await api.get(`${FUEL}/stock-movements`, { params });
    const result = data.data ?? data;
    return Array.isArray(result) ? result : [];
  },
};

export const fuelReconciliationService = {
  get: async (params?: Record<string, string>): Promise<FuelReconciliationRow[]> => {
    const { data } = await api.get(`${FUEL}/dashboard/reconciliation`, { params });
    const result = data.data ?? data;
    return Array.isArray(result) ? result : [];
  },
};

export const fuelConsumptionService = {
  get: async (params?: Record<string, string>): Promise<FuelConsumptionRow[]> => {
    const { data } = await api.get(`${FUEL}/dashboard/consumption`, { params });
    const result = data.data ?? data;
    return Array.isArray(result) ? result : [];
  },
};

export const fleetMeterReadingsService = createCrudService<FleetMeterReading>(`${FUEL}/meter-readings`);
export const fleetOilChangesService = createCrudService<FleetOilChange>(`${FUEL}/oil-changes`);
export const fleetMaintenancePlansService = createCrudService<FleetMaintenancePlan>(`${FUEL}/maintenance-plans`);
export const fleetMaintenanceRecordsService = createCrudService<FleetMaintenanceRecord>(`${FUEL}/maintenance-records`);
