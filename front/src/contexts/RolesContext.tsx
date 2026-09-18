import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface LoginRole {
  id?: string;
  name?: string;
  abbreviation?: string;
  abb?: string;
  abrev?: string;
  sigla?: string;
  [key: string]: unknown;
}

interface RolesContextType {
  roles: LoginRole[];
  setRoles: (roles: LoginRole[]) => void;
  clearRoles: () => void;
  hasRole: (...abbreviations: string[]) => boolean;
  hasAnyRole: (abbreviations: string[]) => boolean;
  roleAbbreviations: string[];
  isSuper: boolean;
  isAdm: boolean;
  isAdmin: boolean;
}

const RolesContext = createContext<RolesContextType | null>(null);

const STORAGE_KEY = 'auth_roles';

function normalizeAbbreviation(value?: string | null): string {
  return String(value ?? '').trim().toUpperCase();
}

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRolesState] = useState<LoginRole[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });

  const setRoles = useCallback((nextRoles: LoginRole[]) => {
    const normalized = Array.isArray(nextRoles) ? nextRoles : [];
    setRolesState(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  const clearRoles = useCallback(() => {
    setRolesState([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  const roleAbbreviations = (Array.isArray(roles) ? roles : []).flatMap((r) => {
    if (typeof r === 'string') return [normalizeAbbreviation(r)];
    if (!r || typeof r !== 'object') return [];
    return [r.abb, r.abbreviation, r.abrev, r.sigla, r.name]
      .filter(Boolean)
      .map((v) => normalizeAbbreviation(v as string));
  }).filter(Boolean);

  const hasRole = useCallback(
    (...abbreviations: string[]) => abbreviations.some((abbr) => roleAbbreviations.includes(normalizeAbbreviation(abbr))),
    [roleAbbreviations]
  );

  const hasAnyRole = useCallback(
    (abbreviations: string[]) => abbreviations.some((abbr) => hasRole(abbr)),
    [hasRole]
  );

  const isSuper = hasRole('SUPER');
  const isAdm = hasRole('ADM') || hasRole('ADMIN');
  const isAdmin = isSuper || isAdm;

  return (
    <RolesContext.Provider
      value={{
        roles,
        setRoles,
        clearRoles,
        hasRole,
        hasAnyRole,
        roleAbbreviations,
        isSuper,
        isAdm,
        isAdmin,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
}

export function useRoles() {
  const ctx = useContext(RolesContext);
  if (!ctx) throw new Error('useRoles must be used within RolesProvider');
  return ctx;
}
