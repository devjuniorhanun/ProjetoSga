import {
  ArrowRightLeft,
  Boxes,
  Building2,
  CarFront,
  ClipboardList,
  Cog,
  Droplets,
  FileText,
  FlaskConical,
  Fuel,
  Gauge,
  HandCoins,
  Handshake,
  Layers3,
  LayoutList,
  Package,
  Receipt,
  Ruler,
  Scale,
  Settings,
  ShieldCheck,
  Target,
  Tractor,
  Truck,
  Users,
  Wheat,
} from 'lucide-react';
import type { NavigationItem } from './navigation.types';

export const releasesMenu: NavigationItem = {
  id: 'releases',
  title: 'Lançamentos',
  icon: ClipboardList,
  children: [
    {
      id: 'releases.fiscal',
      title: 'Notas Fiscais',
      icon: FileText,
      children: [
        { id: 'releases.fiscal.all', title: 'Todas as Notas', path: '/entries/fiscal/entry-invoices', icon: FileText, idLabel: 'Nota nº {id}' },
        { id: 'releases.fiscal.general', title: 'Produtos Gerais', path: '/entries/fiscal/entry-invoices/general', icon: Package },
        { id: 'releases.fiscal.defensive', title: 'Defensivos', path: '/entries/fiscal/entry-invoices/defensive', icon: ShieldCheck },
        { id: 'releases.fiscal.fuel', title: 'Combustíveis', path: '/entries/fiscal/entry-invoices/fuel', icon: Fuel },
        { id: 'releases.fiscal.lubricant', title: 'Lubrificantes', path: '/entries/fiscal/entry-invoices/lubricant', icon: Droplets },
        { id: 'releases.fiscal.seed', title: 'Sementes', path: '/entries/fiscal/entry-invoices/seed', icon: Wheat },
        { id: 'releases.fiscal.input', title: 'Insumos', path: '/entries/fiscal/entry-invoices/input', icon: Boxes },
        { id: 'releases.fiscal.freights', title: 'Fretes das Notas', path: '/entries/fiscal/freights', icon: Truck },
        { id: 'releases.fiscal.freight-payments', title: 'Pagamentos de Fretes', path: '/entries/fiscal/freight-payments', icon: Building2 },
        { id: 'releases.fiscal.purchase-returns', title: 'Devoluções de Compra', path: '/entries/fiscal/purchase-returns', icon: ArrowRightLeft },
        { id: 'releases.fiscal.legacy-products', title: 'Nota Fiscal de Entrada', path: '/entries/products/entry-invoice-products', icon: Receipt, hidden: true },
      ],
    },
    {
      id: 'releases.agricultural',
      title: 'Serviços Agrícolas',
      icon: Tractor,
      children: [
        {
          id: 'releases.agricultural.defensives',
          title: 'Defensivos',
          icon: Tractor,
          children: [
            { id: 'releases.agricultural.defensives.orders', title: 'Ordens de Serviços Defensivos', path: '/entries/agricultural/defensives', icon: Tractor, idLabel: 'OS nº {id}' },
            { id: 'releases.agricultural.defensives.tanks', title: 'Tanque do Operador', path: '/entries/agricultural/tanks', icon: Fuel },
            { id: 'releases.agricultural.defensives.closings', title: 'Fechamentos', path: '/entries/agricultural/defensives/closings', icon: ClipboardList },
            { id: 'releases.agricultural.defensives.consolidation', title: 'Consolidação', path: '/entries/agricultural/defensives/consolidation', icon: Layers3 },
          ],
        },
        {
          id: 'releases.agricultural.services',
          title: 'Serviços Gerais',
          icon: ClipboardList,
          children: [
            { id: 'releases.agricultural.services.soil', title: 'Preparo do Solo', path: '/entries/agricultural/services/soil-preparation', icon: Tractor },
            { id: 'releases.agricultural.services.input', title: 'Aplicação de Insumos', path: '/entries/agricultural/services/input-application', icon: Layers3 },
            { id: 'releases.agricultural.services.seed', title: 'Tratamento de Sementes', path: '/entries/agricultural/seed-treatments', icon: Boxes },
            { id: 'releases.agricultural.services.firebreak', title: 'Manutenção de Aceiro', path: '/entries/agricultural/services/firebreak-maintenance', icon: ClipboardList },
          ],
        },
        {
          id: 'releases.agricultural.planning',
          title: 'Planejamento Diário',
          icon: LayoutList,
          children: [
            { id: 'releases.agricultural.planning.workforce', title: 'Quadro Diário de Funcionários', path: '/entries/agricultural/workforce', icon: Users },
          ],
        },
      ],
    },
    {
      id: 'releases.harvest',
      title: 'Colheita',
      icon: Wheat,
      children: [
        { id: 'releases.harvest.releases', title: 'Lançamentos de Colheita', path: '/entries/harvests/harvest-releases', icon: Wheat },
        { id: 'releases.harvest.grain-transfers', title: 'Transferências de Grãos para Proprietários', path: '/entries/harvests/grain-transfers', icon: ArrowRightLeft },
      ],
    },
    {
      id: 'releases.financial',
      title: 'Financeiro',
      icon: Building2,
      children: [
        { id: 'releases.financial.pay-accounts', title: 'Contas Pagas', path: '/entries/financial/pay-accounts', icon: Receipt },
        { id: 'releases.financial.transfers', title: 'Transferências Bancárias', path: '/entries/financial/transfers', icon: ArrowRightLeft },
        { id: 'releases.financial.payroll', title: 'Folha de Pagamento', path: '/entries/financial/payroll', icon: Users },
        { id: 'releases.financial.harvester-advances', title: 'Adiantamentos de Colhedores', path: '/entries/financial/advances/harvesters', icon: HandCoins },
        { id: 'releases.financial.transporter-advances', title: 'Adiantamentos de Transportadores', path: '/entries/financial/advances/transporters', icon: Truck },
      ],
    },
    {
      id: 'releases.inventory',
      title: 'Estoque',
      icon: Boxes,
      children: [
        { id: 'releases.inventory.balances', title: 'Posição de Estoque', path: '/entries/inventory/balances', icon: LayoutList },
        { id: 'releases.inventory.movements', title: 'Movimentações', path: '/entries/inventory/movements', icon: Layers3 },
        { id: 'releases.inventory.outputs', title: 'Saídas de Produtos', path: '/entries/inventory/product-outputs', icon: Boxes },
      ],
    },
    {
      id: 'releases.fuel',
      title: 'Combustíveis',
      icon: Fuel,
      children: [
        {
          id: 'releases.fuel.operations',
          title: 'Controle operacional',
          icon: Fuel,
          children: [
            { id: 'releases.fuel.operations.entries', title: 'Entradas', path: '/entries/fuel/fuel-entries', icon: Receipt },
            { id: 'releases.fuel.operations.transfers', title: 'Transferências entre Tanques', path: '/entries/fuel/transfers', icon: Truck },
            { id: 'releases.fuel.operations.refuelings', title: 'Abastecimentos', path: '/entries/fuel/refuelings', icon: Fuel },
          ],
        },
        {
          id: 'releases.fuel.readings',
          title: 'Leituras e conferência',
          icon: Gauge,
          children: [
            { id: 'releases.fuel.readings.registers', title: 'Leituras da Registradora', path: '/entries/fuel/register-readings', icon: LayoutList },
            { id: 'releases.fuel.readings.gauge', title: 'Leituras da Régua', path: '/entries/fuel/gauge-readings', icon: ClipboardList },
            { id: 'releases.fuel.readings.reconciliation', title: 'Conferência de Estoque', path: '/entries/fuel/reconciliation', icon: ShieldCheck },
          ],
        },
        {
          id: 'releases.fuel.stock',
          title: 'Estoque e análises',
          icon: Boxes,
          children: [
            { id: 'releases.fuel.stock.movements', title: 'Movimentações', path: '/entries/fuel/stock-movements', icon: LayoutList },
            { id: 'releases.fuel.stock.adjustments', title: 'Ajustes de Estoque', path: '/entries/fuel/stock-adjustments', icon: Settings },
            { id: 'releases.fuel.stock.consumption', title: 'Consumo', path: '/entries/fuel/consumption', icon: Target },
          ],
        },
      ],
    },
    {
      id: 'releases.fleet',
      title: 'Frotas e Manutenção',
      icon: CarFront,
      children: [
        { id: 'releases.fleet.meter-readings', title: 'Leituras de Frota', path: '/entries/fleet/meter-readings', icon: Gauge },
        { id: 'releases.fleet.oil-changes', title: 'Trocas de Óleo', path: '/entries/fleet/oil-changes', icon: FlaskConical },
        { id: 'releases.fleet.maintenance-plans', title: 'Planos de Manutenção', path: '/entries/fleet/maintenance-plans', icon: ClipboardList },
        { id: 'releases.fleet.maintenance-records', title: 'Manutenções', path: '/entries/fleet/maintenance-records', icon: Cog },
      ],
    },
    {
      id: 'releases.grain',
      title: 'Balança e Armazém',
      icon: Scale,
      children: [
        {
          id: 'releases.grain.weighing',
          title: 'Pesagem',
          icon: Scale,
          children: [
            { id: 'releases.grain.weighing.panel', title: 'Painel da Balança', path: '/entries/grain/panel', icon: Scale },
            { id: 'releases.grain.weighing.tickets', title: 'Portarias e Tickets', path: '/entries/grain/tickets', icon: ClipboardList, idLabel: 'Ticket nº {id}' },
            { id: 'releases.grain.weighing.receiving', title: 'Recebimento de Grãos', path: '/entries/grain/receiving', icon: Wheat },
            { id: 'releases.grain.weighing.shipping', title: 'Expedição de Grãos', path: '/entries/grain/shipping', icon: Truck },
          ],
        },
        {
          id: 'releases.grain.contracts',
          title: 'Contratos e Saldos',
          icon: FileText,
          children: [
            { id: 'releases.grain.contracts.sales', title: 'Contratos de Venda', path: '/entries/grain/contracts', icon: FileText, idLabel: 'Contrato nº {id}' },
            { id: 'releases.grain.contracts.transfers', title: 'Transferências entre Contratos', path: '/entries/grain/contract-transfers', icon: ArrowRightLeft },
            { id: 'releases.grain.contracts.assignments', title: 'Cessões entre Produtores', path: '/entries/grain/balance-assignments', icon: Handshake },
          ],
        },
        {
          id: 'releases.grain.stock',
          title: 'Estoque de Grãos',
          icon: Boxes,
          children: [
            { id: 'releases.grain.stock.balances', title: 'Posição de Estoque', path: '/entries/grain/balances', icon: LayoutList },
            { id: 'releases.grain.stock.movements', title: 'Movimentações', path: '/entries/grain/stock-movements', icon: Layers3 },
            { id: 'releases.grain.stock.impurity-outputs', title: 'Saídas de Impurezas', path: '/entries/grain/impurity-outputs', icon: Droplets },
            { id: 'releases.grain.stock.adjustments', title: 'Ajustes de Estoque', path: '/entries/grain/stock-adjustments', icon: Settings },
            { id: 'releases.grain.stock.technical-losses', title: 'Quebras Técnicas', path: '/entries/grain/technical-losses', icon: Ruler },
          ],
        },
        {
          id: 'releases.grain.control',
          title: 'Controle',
          icon: ShieldCheck,
          children: [
            { id: 'releases.grain.control.authorizations', title: 'Autorizações', path: '/entries/grain/authorizations', icon: ShieldCheck },
          ],
        },
      ],
    },
  ],
};

export const releasesHiddenIcons = { Package };
