import { useQuery } from '@tanstack/react-query';
import { grainAuthService } from '@/lib/api-services-grain';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Permissões e papéis vindos de GET /auth/me.
 * A interface esconde/desabilita ações sem permissão, mas o backend continua
 * sendo a autoridade (403 sempre é tratado).
 */
export function useGrainPermissions() {
  const { isSuper, isAdm } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: grainAuthService.me,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const permissions = data?.permissions ?? [];
  const roles = (data?.roles ?? []).map((r) =>
    typeof r === 'string' ? r : String(r?.abbreviation ?? r?.name ?? ''),
  ).map((r) => r.toUpperCase());

  const isSuperUser = isSuper || roles.includes('SUPER');
  const isAdmin = isSuperUser || isAdm || roles.includes('ADM') || roles.includes('ADMIN');

  /** Sem lista de permissões na API, SUPER/ADM seguem com acesso total. */
  const can = (permission: string): boolean => {
    if (permissions.length === 0) return isAdmin;
    return permissions.includes(permission) || isSuperUser;
  };

  return { can, isSuper: isSuperUser, isAdmin, isLoading, permissions, userId: data?.id };
}
