import api from './api';
import { unwrapItem, unwrapList, unwrapMeta, type PaginationMeta, type QueryParams } from './api-services-grain';
import { AGRICULTURAL_RELEASES_BASE } from './api-services-agricultural-services';
import type {
  WorkforceBoard,
  WorkforceHistoryEntry,
  WorkforceWorkspace,
  WorkforceWorkspacePayload,
} from '@/types/workforce';

/** Prefixo oficial do backend Laravel. */
export const WORKFORCE_BOARDS_ENDPOINT = `${AGRICULTURAL_RELEASES_BASE}/workforce/boards`;

export const workforceBoardsService = {
  endpoint: WORKFORCE_BOARDS_ENDPOINT,

  list: async (params?: QueryParams): Promise<{ items: WorkforceBoard[]; meta?: PaginationMeta }> => {
    const { data } = await api.get(WORKFORCE_BOARDS_ENDPOINT, { params });
    return { items: unwrapList<WorkforceBoard>(data), meta: unwrapMeta(data) };
  },

  /** Consulta a data sem criar registro. */
  byDate: async (date: string): Promise<WorkforceWorkspace> => {
    const { data } = await api.get(`${WORKFORCE_BOARDS_ENDPOINT}/by-date`, { params: { date } });
    return unwrapItem<WorkforceWorkspace>(data);
  },

  /** Obtém ou cria o quadro da data. */
  resolve: async (workDate: string): Promise<WorkforceWorkspace> => {
    const { data } = await api.post(`${WORKFORCE_BOARDS_ENDPOINT}/resolve`, { work_date: workDate });
    return unwrapItem<WorkforceWorkspace>(data);
  },

  getWorkspace: async (boardId: string): Promise<WorkforceWorkspace> => {
    const { data } = await api.get(`${WORKFORCE_BOARDS_ENDPOINT}/${boardId}`);
    return unwrapItem<WorkforceWorkspace>(data);
  },

  /** Salva todo o workspace em uma única requisição. */
  saveWorkspace: async (
    boardId: string,
    payload: WorkforceWorkspacePayload,
  ): Promise<WorkforceWorkspace> => {
    const { data } = await api.put(`${WORKFORCE_BOARDS_ENDPOINT}/${boardId}/workspace`, payload);
    return unwrapItem<WorkforceWorkspace>(data);
  },

  history: async (boardId: string): Promise<WorkforceHistoryEntry[]> => {
    const { data } = await api.get(`${WORKFORCE_BOARDS_ENDPOINT}/${boardId}/history`);
    return unwrapList<WorkforceHistoryEntry>(data);
  },
};
