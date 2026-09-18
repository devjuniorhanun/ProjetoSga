import api from '@/lib/api';
import {
  ActiveCrop,
  AgriculturalDefensiveOrder,
  AgriculturalDefensiveOrderClosing,
  AgriculturalDefensiveOrderClosingRequest,
  AgriculturalDefensiveOrderRequest,
  OperatorTank,
  OperatorTankMovementRequest,
  OperatorTankWithdrawal,
  OperatorTankWithdrawalFilters,
  OperatorTankWithdrawalRequest,
  TankDate,
  TankOpenDate,
  TankOperator,
  TankPlanning,
  TankWithdrawalRequest,
} from '@/types/agricultural-services';
import type { Fleet } from '@/lib/api-services-vehicles';

const BASE = '/releases/agricultural/services/defensive';

const unwrap = <T>(payload: any): T => (payload?.data ?? payload) as T;
const unwrapList = <T>(payload: any): T[] => {
  const raw = payload?.data ?? payload;
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
};

export const agriculturalServicesDefensiveService = {
  getActiveCrops: async (): Promise<ActiveCrop[]> => {
    const { data } = await api.get(`${BASE}/crops`);
    return unwrapList<ActiveCrop>(data).filter((c) => c.status === 'A');
  },

  /** Frotas permitidas para a função do operador: O = PULVERIZADO, T = TRATOR. */
  getFleetsByFunction: async (fn: 'O' | 'T', signal?: AbortSignal): Promise<Fleet[]> => {
    const { data } = await api.get(`${BASE}/fleets/by-function`, { params: { function: fn }, signal });
    return unwrapList<Fleet>(data);
  },

  /** @deprecated Mantido apenas para telas antigas; o tanque usa getOpenTankDates. */
  getTankDates: async (cropId: number | string): Promise<TankDate[]> => {
    const { data } = await api.get(`${BASE}/crops/${cropId}/tank-dates`);
    return unwrapList<TankDate>(data);
  },

  /** Datas que ainda possuem O.S. abertas para o tanqueiro informado. */
  getOpenTankDates: async (
    cropId: number | string,
    operatorId: number | string,
    signal?: AbortSignal,
  ): Promise<TankOpenDate[]> => {
    const { data } = await api.get(
      `${BASE}/crops/${cropId}/tank-operators/${operatorId}/open-dates`,
      { signal },
    );
    return unwrapList<TankOpenDate>(data);
  },

  /** Registra a retirada agrupada (rota plural oficial). */
  createTankWithdrawal: async (
    payload: OperatorTankWithdrawalRequest,
  ): Promise<OperatorTankWithdrawal> => {
    const { data } = await api.post(`${BASE}/tank/withdrawals`, payload);
    return unwrap<OperatorTankWithdrawal>(data);
  },

  getTankWithdrawals: async (
    filters: OperatorTankWithdrawalFilters = {},
  ): Promise<OperatorTankWithdrawal[]> => {
    const { data } = await api.get(`${BASE}/tank/withdrawals`, { params: filters });
    return unwrapList<OperatorTankWithdrawal>(data);
  },

  getTankWithdrawal: async (
    withdrawalId: number | string,
  ): Promise<OperatorTankWithdrawal> => {
    const { data } = await api.get(`${BASE}/tank/withdrawals/${withdrawalId}`);
    return unwrap<OperatorTankWithdrawal>(data);
  },

  getTankOperators: async (cropId: number | string): Promise<TankOperator[]> => {
    const { data } = await api.get(`${BASE}/crops/${cropId}/tank-operators`);
    return unwrapList<TankOperator>(data);
  },

  getTankPlanning: async (
    cropId: number | string,
    operatorId: number | string,
    date?: string,
  ): Promise<TankPlanning> => {
    const { data } = await api.get(
      `${BASE}/crops/${cropId}/tank-operators/${operatorId}/planning`,
      date ? { params: { date } } : undefined,
    );
    return unwrap<TankPlanning>(data);
  },

  getOrders: async (params?: Record<string, unknown>): Promise<AgriculturalDefensiveOrder[]> => {
    const { data } = await api.get(`${BASE}/orders`, { params });
    return unwrapList<AgriculturalDefensiveOrder>(data);
  },

  /** PATCH da sequência de produtos da O.S. (todos os ids, exatamente uma vez). */
  updateProductsSequence: async (
    orderId: number | string,
    productIds: Array<string | number>,
  ): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.patch(`${BASE}/orders/${orderId}/products/sequence`, {
      product_ids: productIds.map(String),
    });
    return unwrap<AgriculturalDefensiveOrder>(data);
  },

  getOrder: async (orderId: number | string): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.get(`${BASE}/orders/${orderId}`);
    return unwrap<AgriculturalDefensiveOrder>(data);
  },

  createOrder: async (
    payload: AgriculturalDefensiveOrderRequest | Record<string, unknown>,
  ): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.post(`${BASE}/orders`, payload);
    return unwrap<AgriculturalDefensiveOrder>(data);
  },

  reissueOrder: async (
    orderId: number | string,
    payload?: Record<string, unknown>,
  ): Promise<AgriculturalDefensiveOrder> => {
    const { data } = await api.post(`${BASE}/orders/${orderId}/reissue`, payload ?? {});
    return unwrap<AgriculturalDefensiveOrder>(data);
  },

  closeOrder: async (
    payload: AgriculturalDefensiveOrderClosingRequest,
  ): Promise<AgriculturalDefensiveOrderClosing> => {
    const { data } = await api.post(`${BASE}/orders/close`, payload);
    return unwrap<AgriculturalDefensiveOrderClosing>(data);
  },

  getOperatorTank: async (
    operatorId: number | string,
    date?: string,
  ): Promise<OperatorTank> => {
    const { data } = await api.get(
      `${BASE}/tank/operator/${operatorId}`,
      date ? { params: { date } } : undefined,
    );
    return unwrap<OperatorTank>(data);
  },

  moveTank: async (payload: OperatorTankMovementRequest): Promise<OperatorTank> => {
    const { data } = await api.post(`${BASE}/tank/movement`, payload);
    return unwrap<OperatorTank>(data);
  },

  withdrawToTank: async (payload: TankWithdrawalRequest): Promise<OperatorTank> => {
    const { data } = await api.post(`${BASE}/tank/withdrawal`, payload);
    return unwrap<OperatorTank>(data);
  },
};

export default agriculturalServicesDefensiveService;
