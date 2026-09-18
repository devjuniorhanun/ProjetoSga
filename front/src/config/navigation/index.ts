import { LayoutDashboard } from 'lucide-react';
import type { NavigationItem } from './navigation.types';
import { registrationsMenu } from './registrations-menu';
import { releasesMenu } from './releases-menu';
import { reportsMenu } from './reports-menu';
import { administrationMenu } from './administration-menu';

export * from './navigation.types';
export { registrationsMenu, releasesMenu, reportsMenu, administrationMenu };

export const dashboardItem: NavigationItem = {
  id: 'dashboard',
  title: 'Dashboard',
  path: '/',
  icon: LayoutDashboard,
};

/** Fonte única de nomes para o menu lateral e para os breadcrumbs. */
export const navigation: NavigationItem[] = [
  dashboardItem,
  registrationsMenu,
  releasesMenu,
  reportsMenu,
  administrationMenu,
];
