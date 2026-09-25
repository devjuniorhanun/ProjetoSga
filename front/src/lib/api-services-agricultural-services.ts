import api from './api';
import { unwrapItem, unwrapList, unwrapMeta, type PaginationMeta, type QueryParams } from './api-services-grain';
import type {
  AgriculturalService,
  AgriculturalServicePayload,
  SeedTreatment,
  SeedTreatmentPayload,
} from '@/types/agricultural';

/** Prefixos oficiais do backend Laravel. */
export const AGRICULTURAL_RELEASES_BASE = '/releases/agricultural';
export const AGRICULTURAL_SERVICES_ENDPOINT = `${AGRICULTURAL_RELEASES_BASE}/services`;
export const SEED_TREATMENTS_ENDPOINT = `${AGRICULTURAL_RELEASES_BASE}/seed-treatments`;
export const DEFENSIVE_SERVICES_BASE = `${AGRICULTURAL_SERVICES_ENDPOINT}/defensive`;

export const agriculturalServicesService = {
  endpoint: AGRICULTURAL_SERVICES_ENDPOINT,
  list: async (
    params?: QueryParams,
  ): Promise<{ items: AgriculturalService[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(AGRICULTURAL_SERVICES_ENDPOINT, { params });
    return { items: unwrapList<AgriculturalService>(data), meta: unwrapMeta(data) };
  },
  getById: async (id: string): Promise<AgriculturalService> => {
    const { data } = await api.get(`${AGRICULTURAL_SERVICES_ENDPOINT}/${id}`);
    return unwrapItem<AgriculturalService>(data);
  },
  create: async (payload: AgriculturalServicePayload): Promise<AgriculturalService> => {
    const { data } = await api.post(AGRICULTURAL_SERVICES_ENDPOINT, payload);
    return unwrapItem<AgriculturalService>(data);
  },
  update: async (
    id: string,
    payload: Partial<AgriculturalServicePayload>,
  ): Promise<AgriculturalService> => {
    const { data } = await api.put(`${AGRICULTURAL_SERVICES_ENDPOINT}/${id}`, payload);
    return unwrapItem<AgriculturalService>(data);
  },
  /** PLANNED não reserva nem baixa estoque. */
  plan: async (id: string): Promise<AgriculturalService> => {
    const { data } = await api.post(`${AGRICULTURAL_SERVICES_ENDPOINT}/${id}/plan`, {});
    return unwrapItem<AgriculturalService>(data);
  },
  start: async (id: string): Promise<AgriculturalService> => {
    const { data } = await api.post(`${AGRICULTURAL_SERVICES_ENDPOINT}/${id}/start`, {});
    return unwrapItem<AgriculturalService>(data);
  },
  /** Somente a conclusão movimenta estoque, com as quantidades reais. */
  complete: async (
    id: string,
    payload?: Record<string, unknown>,
  ): Promise<AgriculturalService> => {
    const { data } = await api.post(`${AGRICULTURAL_SERVICES_ENDPOINT}/${id}/complete`, payload ?? {});
    return unwrapItem<AgriculturalService>(data);
  },
};

export const seedTreatmentsService = {
  endpoint: SEED_TREATMENTS_ENDPOINT,
  list: async (params?: QueryParams): Promise<{ items: SeedTreatment[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(SEED_TREATMENTS_ENDPOINT, { params });
    return { items: unwrapList<SeedTreatment>(data), meta: unwrapMeta(data) };
  },
  getById: async (id: string): Promise<SeedTreatment> => {
    const { data } = await api.get(`${SEED_TREATMENTS_ENDPOINT}/${id}`);
    return unwrapItem<SeedTreatment>(data);
  },
  create: async (payload: SeedTreatmentPayload): Promise<SeedTreatment> => {
    const { data } = await api.post(SEED_TREATMENTS_ENDPOINT, {
      service_date: payload.treatment_date,
      crop_id: payload.crop_id,
      culture_id: payload.culture_id,
      number_of_treatment_batches: payload.batch_count,
      observation: payload.observation,
      seeds: (payload.seeds ?? []).map((seed) => ({
        product_id: seed.product_id,
        culture_id: seed.culture_id,
        variety_culture_id: seed.variety_id,
        product_stock_id: seed.product_stock_id,
        lot_number: seed.batch,
        treated_quantity: seed.treated_quantity,
        unit: seed.unit,
        treatment_batch_quantity: seed.quantity_per_batch
          ?? (Number(seed.treated_quantity) / Number(payload.batch_count)),
      })),
      products: (payload.chemicals ?? []).map((chemical) => ({
        product_id: chemical.product_id,
        product_stock_id: chemical.product_stock_id,
        dose_per_batch: chemical.dose_per_batch,
        real_quantity: chemical.actual_quantity,
        unit: chemical.unit,
      })),
    });
    return unwrapItem<SeedTreatment>(data);
  },
  /** Converte semente não tratada em tratada e baixa os químicos. */
  complete: async (id: string, payload?: Record<string, unknown>): Promise<SeedTreatment> => {
    const { data } = await api.post(`${SEED_TREATMENTS_ENDPOINT}/${id}/complete`, payload ?? {});
    return unwrapItem<SeedTreatment>(data);
  },
};
