import { Cog, Database, ShieldCheck, Users } from 'lucide-react';
import type { NavigationItem } from './navigation.types';

export const administrationMenu: NavigationItem = {
  id: 'administration',
  title: 'Administração',
  icon: ShieldCheck,
  roles: ['SUPER', 'ADM'],
  children: [
    { id: 'administration.users', title: 'Usuários', path: '/registrations/admin/users', icon: Users, roles: ['SUPER', 'ADM'] },
    { id: 'administration.roles', title: 'Perfis', path: '/registrations/admin/roles', icon: ShieldCheck, roles: ['SUPER'] },
    { id: 'administration.configs', title: 'Configurações', path: '/registrations/admin/configs', icon: Cog, roles: ['SUPER', 'ADM'] },
    { id: 'administration.imports', title: 'Importação de Dados Legados', path: '/registrations/admin/imports', icon: Database, roles: ['SUPER', 'ADM'] },
  ],
};
