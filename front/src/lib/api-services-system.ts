import api from './api';

/** Endpoints de autenticação e healthcheck expostos pelo backend. */
export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  me: '/auth/me',
  logout: '/auth/logout',
  health: '/health',
} as const;

export const systemService = {
  /** Healthcheck simples do backend. */
  health: async (): Promise<{ status?: string } & Record<string, unknown>> => {
    const { data } = await api.get(AUTH_ENDPOINTS.health);
    return (data?.data ?? data) as Record<string, unknown>;
  },
};
