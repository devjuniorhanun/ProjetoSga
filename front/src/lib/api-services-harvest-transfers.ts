import api from './api';
import type {
  EligibleTransferOwner,
  HarvestGrainTransfer,
  HarvestGrainTransferFilters,
  HarvestGrainTransferPayload,
  HarvestTransferAvailableBalance,
} from '@/types/harvest-transfers';
import { compactParams } from './report-rules';

export const HARVEST_GRAIN_TRANSFERS_ENDPOINT = '/releases/harvest/grain-transfers';
export const HARVEST_TRANSFER_ELIGIBLE_OWNERS_ENDPOINT =
  '/releases/harvest/grain-transfers/eligible-owners';
export const HARVEST_TRANSFER_AVAILABLE_BALANCE_ENDPOINT =
  '/releases/harvest/grain-transfers/available-balance';

function unwrapList<T>(payload: unknown): T[] {
  const first = (payload as { data?: unknown })?.data ?? payload;
  const second = (first as { data?: unknown })?.data ?? first;
  if (Array.isArray(second)) return second as T[];
  if (Array.isArray(first)) return first as T[];
  return [];
}

function unwrapItem<T>(payload: unknown): T {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
}

export const harvestGrainTransfersService = {
  list: async (filters: HarvestGrainTransferFilters = {}): Promise<HarvestGrainTransfer[]> => {
    const params = compactParams({ ...filters, per_page: filters.per_page ?? 25 });
    const { data } = await api.get(HARVEST_GRAIN_TRANSFERS_ENDPOINT, { params });
    return unwrapList<HarvestGrainTransfer>(data);
  },
  getById: async (id: string): Promise<HarvestGrainTransfer> => {
    const { data } = await api.get(`${HARVEST_GRAIN_TRANSFERS_ENDPOINT}/${id}`);
    return unwrapItem<HarvestGrainTransfer>(data);
  },
  create: async (payload: HarvestGrainTransferPayload): Promise<HarvestGrainTransfer> => {
    const { data } = await api.post(HARVEST_GRAIN_TRANSFERS_ENDPOINT, payload);
    return unwrapItem<HarvestGrainTransfer>(data);
  },
  update: async (
    id: string,
    payload: HarvestGrainTransferPayload,
  ): Promise<HarvestGrainTransfer> => {
    const { data } = await api.put(`${HARVEST_GRAIN_TRANSFERS_ENDPOINT}/${id}`, payload);
    return unwrapItem<HarvestGrainTransfer>(data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${HARVEST_GRAIN_TRANSFERS_ENDPOINT}/${id}`);
  },
  eligibleOwners: async (params: { crop_id?: string; producer_id?: string } = {}): Promise<
    EligibleTransferOwner[]
  > => {
    const { data } = await api.get(HARVEST_TRANSFER_ELIGIBLE_OWNERS_ENDPOINT, {
      params: compactParams(params),
    });
    return unwrapList<EligibleTransferOwner>(data);
  },
  availableBalance: async (args: {
    crop_id: string;
    producer_id: string;
    warehouse_id: string;
    culture_id: string;
    /** Na edição o backend desconsidera a própria transferência. */
    grain_transfer_id?: string;
  }): Promise<HarvestTransferAvailableBalance> => {
    const { data } = await api.get(HARVEST_TRANSFER_AVAILABLE_BALANCE_ENDPOINT, {
      params: compactParams(args),
    });
    return unwrapItem<HarvestTransferAvailableBalance>(data);
  },
};
