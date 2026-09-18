import { BarChart3, Building2, Grid3X3, LayoutList, Receipt, Tractor, Wheat } from 'lucide-react';
import type { NavigationItem } from './navigation.types';

export const reportsMenu: NavigationItem = {
  id: 'reports',
  title: 'Relatórios',
  icon: BarChart3,
  children: [
    {
      id: 'reports.financial',
      title: 'Financeiro',
      icon: Building2,
      children: [
        { id: 'reports.financial.analytical', title: 'Contas Pagas — Analítico', breadcrumb: 'Contas Pagas — Analítico', path: '/reports/financial/paid-accounts', icon: Receipt },
        { id: 'reports.financial.by-cost-center', title: 'Contas Pagas por Centro de Custo', path: '/reports/financial/paid-accounts/by-cost-center', icon: Building2 },
        { id: 'reports.financial.by-crop', title: 'Contas Pagas por Ano Agrícola e Safra', path: '/reports/financial/paid-accounts/by-crop', icon: Wheat },
      ],
    },
    {
      id: 'reports.harvest',
      title: 'Colheita',
      icon: Wheat,
      children: [
        { id: 'reports.harvest.consolidated', title: 'Consolidado de Colheita', path: '/reports/harvest/consolidated', icon: LayoutList },
        { id: 'reports.harvest.plots', title: 'Produtividade por Talhão', path: '/reports/harvest/productivity/plots', icon: Grid3X3 },
        { id: 'reports.harvest.farms', title: 'Produtividade por Fazenda', path: '/reports/harvest/productivity/farms', icon: Building2 },
        { id: 'reports.harvest.varieties', title: 'Produtividade por Variedade', path: '/reports/harvest/productivity/varieties', icon: Wheat },
        { id: 'reports.harvest.harvesters', title: 'Produtividade por Colhedor', path: '/reports/harvest/productivity/harvesters', icon: Tractor },
      ],
    },
  ],
};
