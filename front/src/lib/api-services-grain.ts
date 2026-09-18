import api from './api';
import type {
  AvailableContractsPreview,
  CaptureWeightPayload,
  CloseTicketPayload,
  FarmStateRegistration,
  GrainAuthorization,
  GrainAuthorizationPayload,
  GrainBalance,
  GrainBalanceAssignment,
  GrainBuyer,
  GrainContract,
  GrainContractPayload,
  GrainContractTransfer,
  GrainDiscountType,
  GrainImpurityType,
  GrainScale,
  GrainScaleChannel,
  GrainScaleReading,
  GrainStockAdjustmentPayload,
  GrainStockMovement,
  GrainStorageLocation,
  GrainTechnicalLoss,
  GrainTechnicalLossConfig,
  GrainTicket,
  GrainTicketPayload,
  GrainTicketPrintData,
  GrainTransportDriver,
  GrainTransportTruck,
  GrainWarehouse,
  SaveDiscountsPayload,
} from '@/types/grain';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/** Extrai a lista de uma resposta simples ou paginada do Laravel. */
export function unwrapList<T>(data: unknown): T[] {
  const payload = data as { data?: unknown };
  const first = payload?.data ?? data;
  if (Array.isArray(first)) return first as T[];
  const nested = (first as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as T[];
  return [];
}

export function unwrapItem<T>(data: unknown): T {
  const payload = data as { data?: unknown };
  return ((payload?.data ?? data) as T);
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export function unwrapMeta(data: unknown): PaginationMeta | undefined {
  const root = data as Record<string, unknown>;
  const source = (root?.meta as Record<string, unknown>) ?? (root?.data as Record<string, unknown>) ?? root;
  if (source && typeof source.current_page === 'number') {
    return {
      current_page: Number(source.current_page),
      last_page: Number(source.last_page ?? 1),
      per_page: Number(source.per_page ?? 25),
      total: Number(source.total ?? 0),
    };
  }
  return undefined;
}

/** CRUD padrão dos catálogos do módulo. */
export function createGrainCrudService<T extends { id: string }, P = Partial<T>>(endpoint: string) {
  return {
    endpoint,
    list: async (params?: QueryParams): Promise<{ items: T[]; meta?: PaginationMeta }> => {
      const { data } = await api.get(endpoint, { params });
      return { items: unwrapList<T>(data), meta: unwrapMeta(data) };
    },
    getAll: async (params?: QueryParams): Promise<T[]> => {
      const { data } = await api.get(endpoint, { params });
      return unwrapList<T>(data);
    },
    getById: async (id: string): Promise<T> => {
      const { data } = await api.get(`${endpoint}/${id}`);
      return unwrapItem<T>(data);
    },
    create: async (payload: P): Promise<T> => {
      const { data } = await api.post(endpoint, payload);
      return unwrapItem<T>(data);
    },
    update: async (id: string, payload: Partial<P>): Promise<T> => {
      const { data } = await api.put(`${endpoint}/${id}`, payload);
      return unwrapItem<T>(data);
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Catálogos                                                           */
/* ------------------------------------------------------------------ */

const CATALOG = (name: string) => `/registrations/grain/${name}`;

export const grainScalesService = createGrainCrudService<GrainScale>(CATALOG('scales'));
export const grainScaleChannelsService = createGrainCrudService<GrainScaleChannel>(CATALOG('scale-channels'));
export const grainWarehousesService = createGrainCrudService<GrainWarehouse>(CATALOG('warehouses'));
export const grainStorageLocationsService = createGrainCrudService<GrainStorageLocation>(CATALOG('storage-locations'));
export const grainTransportDriversService = createGrainCrudService<GrainTransportDriver>(CATALOG('transport-drivers'));
export const grainTransportTrucksService = createGrainCrudService<GrainTransportTruck>(CATALOG('transport-trucks'));
export const grainImpurityTypesService = createGrainCrudService<GrainImpurityType>(CATALOG('impurity-types'));
export const grainDiscountTypesService = createGrainCrudService<GrainDiscountType>(CATALOG('discount-types'));
export const grainTechnicalLossConfigsService =
  createGrainCrudService<GrainTechnicalLossConfig>(CATALOG('technical-loss-configs'));

export const farmStateRegistrationsService = createGrainCrudService<FarmStateRegistration>(
  '/registrations/property/registration/farm-state-registrations',
);

/* ------------------------------------------------------------------ */
/* Cadastros de apoio já existentes                                    */
/* ------------------------------------------------------------------ */

export interface SupportOption {
  id: string;
  name: string;
}

const nameOf = (item: Record<string, unknown>): string =>
  String(
    item.name ??
      item.description ??
      item.corporate_reason ??
      item.fantasy_name ??
      item.owner_name ??
      item.title ??
      item.id ??
      '',
  );

export const grainSupportService = {
  producers: async (): Promise<SupportOption[]> => {
    const { data } = await api.get('/registrations/properties/producers');
    return unwrapList<Record<string, unknown>>(data).map((p) => ({ id: String(p.id), name: nameOf(p) }));
  },
  farms: async (producerId?: string): Promise<Array<SupportOption & { producer_id?: string }>> => {
    const { data } = await api.get('/registrations/property/areas/farms', {
      params: producerId ? { producer_id: producerId } : undefined,
    });
    return unwrapList<Record<string, unknown>>(data)
      .map((f) => ({ id: String(f.id), name: nameOf(f), producer_id: f.producer_id ? String(f.producer_id) : undefined }))
      .filter((f) => !producerId || !f.producer_id || f.producer_id === producerId);
  },
  crops: async (): Promise<SupportOption[]> => {
    const { data } = await api.get('/registrations/harvest/crops');
    return unwrapList<Record<string, unknown>>(data).map((c) => ({ id: String(c.id), name: nameOf(c) }));
  },
  cultures: async (): Promise<SupportOption[]> => {
    const { data } = await api.get('/registrations/harvest/cultures');
    return unwrapList<Record<string, unknown>>(data).map((c) => ({ id: String(c.id), name: nameOf(c) }));
  },
  culturesByCrop: async (cropId: string): Promise<SupportOption[]> => {
    const { data } = await api.get(`/registrations/harvest/crops/${cropId}/cultures`);
    return unwrapList<Record<string, unknown>>(data).map((c) => ({ id: String(c.id), name: nameOf(c) }));
  },
  suppliers: async (): Promise<SupportOption[]> => {
    const { data } = await api.get('/registrations/supplier/suppliers');
    return unwrapList<Record<string, unknown>>(data).map((s) => ({ id: String(s.id), name: nameOf(s) }));
  },
  buyers: async (): Promise<GrainBuyer[]> => {
    const { data } = await api.get('/releases/grain/buyers');
    return unwrapList<Record<string, unknown>>(data).map((b) => ({
      id: String(b.id),
      name: nameOf(b),
      cpf_cnpj: (b.cpf_cnpj as string) ?? null,
    }));
  },
  stateRegistrations: async (params: {
    producer_id?: string;
    farm_id?: string;
    culture_id?: string;
  }): Promise<FarmStateRegistration[]> =>
    farmStateRegistrationsService.getAll({ ...params, status: 'A' }),
  storageLocations: async (warehouseId: string): Promise<GrainStorageLocation[]> =>
    grainStorageLocationsService.getAll({ grain_warehouse_id: warehouseId, status: 'A' }),
};

/* ------------------------------------------------------------------ */
/* Leituras da balança                                                 */
/* ------------------------------------------------------------------ */

export const grainReadingsService = {
  /**
   * Publicado pelo agente local (conector RS-232/RS-485 → Laravel).
   * Documentado aqui apenas por completude; a interface não usa normalmente.
   */
  publish: async (payload: {
    grain_scale_id: string;
    grain_scale_channel_id: string;
    node_code: string;
    sequence: number;
    weight: number;
    unit: 'kg';
    stable: boolean;
    raw_message?: string;
    read_at: string;
  }): Promise<GrainScaleReading> => {
    const { data } = await api.post('/integrations/scales/readings', payload);
    return unwrapItem<GrainScaleReading>(data);
  },
  latest: async (channelId: string): Promise<GrainScaleReading | null> => {
    const { data } = await api.get('/integrations/scales/readings/latest', {
      params: { grain_scale_channel_id: channelId },
    });
    const item = unwrapItem<GrainScaleReading | null>(data);
    return item && (item as GrainScaleReading).id ? item : null;
  },
};

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

const TICKETS = '/releases/grain/tickets';

export const grainTicketsService = {
  list: async (params?: QueryParams): Promise<{ items: GrainTicket[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(TICKETS, { params });
    return { items: unwrapList<GrainTicket>(data), meta: unwrapMeta(data) };
  },
  getAll: async (params?: QueryParams): Promise<GrainTicket[]> => {
    const { data } = await api.get(TICKETS, { params });
    return unwrapList<GrainTicket>(data);
  },
  getById: async (id: string): Promise<GrainTicket> => {
    const { data } = await api.get(`${TICKETS}/${id}`);
    return unwrapItem<GrainTicket>(data);
  },
  create: async (payload: GrainTicketPayload): Promise<GrainTicket> => {
    const { data } = await api.post(TICKETS, payload);
    return unwrapItem<GrainTicket>(data);
  },
  captureWeight: async (id: string, payload: CaptureWeightPayload): Promise<GrainTicket> => {
    const { data } = await api.post(`${TICKETS}/${id}/capture-weight`, payload);
    return unwrapItem<GrainTicket>(data);
  },
  saveDiscounts: async (id: string, payload: SaveDiscountsPayload): Promise<GrainTicket> => {
    const { data } = await api.put(`${TICKETS}/${id}/discounts`, payload);
    return unwrapItem<GrainTicket>(data);
  },
  availableContracts: async (id: string): Promise<AvailableContractsPreview> => {
    const { data } = await api.get(`${TICKETS}/${id}/available-contracts`);
    return unwrapItem<AvailableContractsPreview>(data);
  },
  close: async (id: string, payload: CloseTicketPayload = {}): Promise<GrainTicket> => {
    const { data } = await api.post(`${TICKETS}/${id}/close`, payload);
    return unwrapItem<GrainTicket>(data);
  },
  cancel: async (id: string, payload: { authorization_request_id: string; reason: string }): Promise<GrainTicket> => {
    const { data } = await api.post(`${TICKETS}/${id}/cancel`, payload);
    return unwrapItem<GrainTicket>(data);
  },
  printData: async (id: string): Promise<GrainTicketPrintData> => {
    const { data } = await api.get(`${TICKETS}/${id}/print-data`);
    return unwrapItem<GrainTicketPrintData>(data);
  },
  openByTruck: async (truckId: string): Promise<GrainTicket[]> => {
    const { data } = await api.get(TICKETS, { params: { grain_transport_truck_id: truckId } });
    return unwrapList<GrainTicket>(data).filter(
      (t) => t.status !== 'CLOSED' && t.status !== 'CANCELED',
    );
  },
};

/* ------------------------------------------------------------------ */
/* Contratos                                                           */
/* ------------------------------------------------------------------ */

const CONTRACTS = '/releases/grain/contracts';

export const grainContractsService = {
  getAll: async (params?: QueryParams): Promise<GrainContract[]> => {
    const { data } = await api.get(CONTRACTS, { params });
    return unwrapList<GrainContract>(data);
  },
  getById: async (id: string): Promise<GrainContract> => {
    const { data } = await api.get(`${CONTRACTS}/${id}`);
    return unwrapItem<GrainContract>(data);
  },
  create: async (payload: GrainContractPayload): Promise<GrainContract> => {
    const { data } = await api.post(CONTRACTS, payload);
    return unwrapItem<GrainContract>(data);
  },
  update: async (
    id: string,
    payload: Partial<GrainContractPayload> & { authorization_request_id: string },
  ): Promise<GrainContract> => {
    const { data } = await api.put(`${CONTRACTS}/${id}`, payload);
    return unwrapItem<GrainContract>(data);
  },
  changeStatus: async (
    id: string,
    payload: { status: 'OPEN' | 'SUSPENDED' | 'CANCELED'; authorization_request_id: string },
  ): Promise<GrainContract> => {
    const { data } = await api.post(`${CONTRACTS}/${id}/status`, payload);
    return unwrapItem<GrainContract>(data);
  },
};

/* ------------------------------------------------------------------ */
/* Transferências de saldo                                             */
/* ------------------------------------------------------------------ */

const TRANSFERS = '/releases/grain/contract-transfers';

export const grainContractTransfersService = {
  getAll: async (params?: QueryParams): Promise<GrainContractTransfer[]> => {
    const { data } = await api.get(TRANSFERS, { params });
    return unwrapList<GrainContractTransfer>(data);
  },
  create: async (payload: {
    grain_balance_id: string;
    destination_contract_id: string;
    weight: number;
    reason: string | null;
  }): Promise<GrainContractTransfer> => {
    const { data } = await api.post(TRANSFERS, payload);
    return unwrapItem<GrainContractTransfer>(data);
  },
  betweenContracts: async (payload: {
    grain_balance_id: string;
    origin_contract_id: string;
    destination_contract_id: string;
    weight: number;
    reason: string;
    authorization_request_id: string;
  }): Promise<GrainContractTransfer> => {
    const { data } = await api.post(`${TRANSFERS}/between-contracts`, payload);
    return unwrapItem<GrainContractTransfer>(data);
  },
  reverse: async (
    id: string,
    payload: { authorization_request_id: string; reason: string },
  ): Promise<GrainContractTransfer> => {
    const { data } = await api.post(`${TRANSFERS}/${id}/reverse`, payload);
    return unwrapItem<GrainContractTransfer>(data);
  },
};

/* ------------------------------------------------------------------ */
/* Cessões entre produtores                                            */
/* ------------------------------------------------------------------ */

const ASSIGNMENTS = '/releases/grain/balance-assignments';

export const grainBalanceAssignmentsService = {
  getAll: async (params?: QueryParams): Promise<GrainBalanceAssignment[]> => {
    const { data } = await api.get(ASSIGNMENTS, { params });
    return unwrapList<GrainBalanceAssignment>(data);
  },
  create: async (payload: {
    origin_grain_balance_id: string;
    destination_producer_id: string;
    destination_farm_state_registration_id: string;
    destination_ownership_type: 'OW' | 'TP';
    weight: number;
    reason: string;
    authorization_request_id: string;
  }): Promise<GrainBalanceAssignment> => {
    const { data } = await api.post(ASSIGNMENTS, payload);
    return unwrapItem<GrainBalanceAssignment>(data);
  },
};

/* ------------------------------------------------------------------ */
/* Estoque                                                             */
/* ------------------------------------------------------------------ */

export const grainBalancesService = {
  getAll: async (params?: QueryParams): Promise<GrainBalance[]> => {
    const { data } = await api.get('/releases/grain/balances', { params });
    return unwrapList<GrainBalance>(data);
  },
};

export const grainStockMovementsService = {
  getAll: async (params?: QueryParams): Promise<GrainStockMovement[]> => {
    const { data } = await api.get('/releases/grain/stock-movements', { params });
    return unwrapList<GrainStockMovement>(data);
  },
};

export const grainStockAdjustmentsService = {
  create: async (payload: GrainStockAdjustmentPayload): Promise<unknown> => {
    const { data } = await api.post('/releases/grain/stock-adjustments', payload);
    return unwrapItem<unknown>(data);
  },
};

/* ------------------------------------------------------------------ */
/* Quebras técnicas                                                    */
/* ------------------------------------------------------------------ */

const LOSSES = '/releases/grain/technical-losses';

export const grainTechnicalLossesService = {
  getAll: async (params?: QueryParams): Promise<GrainTechnicalLoss[]> => {
    const { data } = await api.get(LOSSES, { params });
    return unwrapList<GrainTechnicalLoss>(data);
  },
  process: async (): Promise<{ processed: number }> => {
    const { data } = await api.post(`${LOSSES}/process`, {});
    const item = unwrapItem<{ processed?: number }>(data);
    return { processed: Number(item?.processed ?? 0) };
  },
  reverse: async (
    id: string,
    payload: { authorization_request_id: string; reason: string },
  ): Promise<GrainTechnicalLoss> => {
    const { data } = await api.post(`${LOSSES}/${id}/reverse`, payload);
    return unwrapItem<GrainTechnicalLoss>(data);
  },
};

/* ------------------------------------------------------------------ */
/* Autorizações                                                        */
/* ------------------------------------------------------------------ */

const AUTHORIZATIONS = '/releases/grain/authorizations';

export const grainAuthorizationsService = {
  getAll: async (params?: QueryParams): Promise<GrainAuthorization[]> => {
    const { data } = await api.get(AUTHORIZATIONS, { params });
    return unwrapList<GrainAuthorization>(data);
  },
  create: async (payload: GrainAuthorizationPayload): Promise<GrainAuthorization> => {
    const { data } = await api.post(AUTHORIZATIONS, payload);
    return unwrapItem<GrainAuthorization>(data);
  },
  approve: async (id: string, payload: { reason: string | null }): Promise<GrainAuthorization> => {
    const { data } = await api.post(`${AUTHORIZATIONS}/${id}/approve`, payload);
    return unwrapItem<GrainAuthorization>(data);
  },
  reject: async (id: string, payload: { reason: string }): Promise<GrainAuthorization> => {
    const { data } = await api.post(`${AUTHORIZATIONS}/${id}/reject`, payload);
    return unwrapItem<GrainAuthorization>(data);
  },
};

/* ------------------------------------------------------------------ */
/* Permissões do usuário autenticado                                   */
/* ------------------------------------------------------------------ */

export interface AuthMeResponse {
  id?: string;
  name?: string;
  roles?: Array<string | { abbreviation?: string; name?: string }>;
  permissions?: string[];
}

export const grainAuthService = {
  me: async (): Promise<AuthMeResponse> => {
    const { data } = await api.get('/auth/me');
    return unwrapItem<AuthMeResponse>(data);
  },
};
