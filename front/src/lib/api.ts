import axios from 'axios';

// Quando VITE_API_URL não está definido, usa caminhos relativos ('/api')
// que são roteados pelo proxy do Vite (HTTPS local com backend em https://localhost:81).
// Quando definido, faz requisições diretas ao host informado.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

// Restaurar token ao carregar o módulo
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  setAuthToken(savedToken);
}

export const getCsrfCookie = async () => {
  const url = API_BASE_URL ? `${API_BASE_URL}/sanctum/csrf-cookie` : '/sanctum/csrf-cookie';
  await axios.get(url, {
    withCredentials: true,
  });
};

/**
 * A API migrou de UUID (string) para IDs sequenciais (number).
 * Para manter todo o frontend (Selects, Comboboxes, comparações, rotas)
 * funcionando com os dois formatos, normalizamos qualquer campo de
 * identificador numérico para string logo na resposta.
 */
const isIdKey = (key: string) =>
  key === 'id' || key.endsWith('_id') || key.endsWith('_ids');

export const normalizeIds = (data: unknown): unknown => {
  if (Array.isArray(data)) return data.map(normalizeIds);
  if (data && typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isIdKey(key)) {
        if (typeof value === 'number') {
          result[key] = String(value);
          continue;
        }
        if (Array.isArray(value)) {
          result[key] = value.map((v) =>
            typeof v === 'number' ? String(v) : normalizeIds(v)
          );
          continue;
        }
      }
      result[key] = normalizeIds(value);
    }
    return result;
  }
  return data;
};

/** Converte ids em string numérica de volta para number ao enviar à API. */
const denormalizeIds = (data: unknown): unknown => {
  if (Array.isArray(data)) return data.map(denormalizeIds);
  if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof FormData)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isIdKey(key)) {
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          result[key] = Number(value);
          continue;
        }
        if (Array.isArray(value)) {
          result[key] = value.map((v) =>
            typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : denormalizeIds(v)
          );
          continue;
        }
      }
      result[key] = denormalizeIds(value);
    }
    return result;
  }
  return data;
};

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // O navegador precisa definir o multipart/form-data com o boundary.
    config.headers.delete?.('Content-Type');
    return config;
  }
  if (config.data && typeof config.data === 'object') {
    config.data = denormalizeIds(config.data);
  }
  return config;
});

api.interceptors.response.use(

  (response) => {
    // Downloads (PDF/blob) não passam pela normalização: o conteúdo binário não é JSON.
    const isBinary =
      response.config?.responseType === 'blob' ||
      response.config?.responseType === 'arraybuffer' ||
      (typeof Blob !== 'undefined' && response.data instanceof Blob) ||
      response.data instanceof ArrayBuffer;
    if (!isBinary) {
      response.data = normalizeIds(response.data);
    }
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 419 && !originalRequest._retried) {
      originalRequest._retried = true;
      await getCsrfCookie();
      return api.request(originalRequest);
    }

    if (error.response?.status === 401) {
      const url = originalRequest?.url || '';
      if (!url.includes('/user') && !url.includes('/auth/login')) {
        localStorage.removeItem('auth_token');
        clearAuthToken();
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
