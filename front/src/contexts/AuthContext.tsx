import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { getCsrfCookie, setAuthToken, clearAuthToken } from '@/lib/api';
import { useRoles } from './RolesContext';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  role_ids?: string[];
  role_names?: string[];
  role_abbreviations?: string[];
  roles?: any[];
}

export function getRoleAbbreviations(user: AuthUser | null): string[] {
  if (!user) return [];
  const abbrs = [
    ...(user.role_abbreviations ?? []),
    ...((user.roles ?? []).flatMap((r: any) =>
      typeof r === 'string' ? [r] : [r?.abb, r?.abbreviation, r?.abrev, r?.sigla, r?.name].filter(Boolean)
    )),
    ...(user.role_names ?? []),
  ];
  if (!abbrs.length && user.role) abbrs.push(user.role === 'admin' ? 'ADM' : 'USUARIO');
  return abbrs.filter(Boolean).map((a) => String(a).trim().toUpperCase());
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuper: boolean;
  isAdm: boolean;
  roleAbbreviations: string[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setRoles, clearRoles } = useRoles();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setAuthToken(token);

    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Não sobrescrever os perfis persistidos quando o usuário salvo não trouxer "roles"
        const storedRoles = Array.isArray(parsedUser?.roles) ? parsedUser.roles : [];
        if (storedRoles.length) {
          setRoles(storedRoles);
        } else {
          const abbrs = getRoleAbbreviations(parsedUser);
          if (abbrs.length) setRoles(abbrs.map((a) => ({ abbreviation: a })));
        }
      } catch {
        localStorage.removeItem('auth_user');
        setUser(null);
        clearRoles();
      }
    }


    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await getCsrfCookie();
      const { data } = await api.post('/auth/login', { email, password });

      // Salvar token retornado pela API
      const token = data.token || data.access_token;
      if (token) {
        localStorage.setItem('auth_token', token);
        setAuthToken(token);
      }

      // Usar dados do usuário retornados no login
      const userData = data.user || null;
      if (userData) {
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        const loginRoles = userData?.roles ?? data?.roles ?? [];
        if (Array.isArray(loginRoles) && loginRoles.length) {
          setRoles(loginRoles);
        } else {
          setRoles(getRoleAbbreviations(userData).map((a) => ({ abbreviation: a })));
        }
      }


      return { success: true };
    } catch (error: any) {
      const status = error.response?.status;
      const responseData = error.response?.data;

      if (status === 422 && responseData?.errors) {
        return { success: false, errors: responseData.errors };
      }

      return {
        success: false,
        errors: { email: [responseData?.message || 'Credenciais inválidas.'] },
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Ignorar erro no logout
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      clearAuthToken();
      setUser(null);
      clearRoles();
    }
  }, []);

  const abbrs = getRoleAbbreviations(user);
  const isSuper = abbrs.includes('SUPER');
  const isAdm = abbrs.includes('ADM') || abbrs.includes('ADMIN') || user?.role === 'admin';
  const isAdmin = isSuper || isAdm;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      isAdmin,
      isSuper,
      isAdm,
      roleAbbreviations: abbrs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
