import { describe, expect, it } from 'vitest';
import { buildBreadcrumbs } from './breadcrumbs';

describe('breadcrumbs', () => {
  it('não transforma categorias conceituais em links', () => {
    const crumbs = buildBreadcrumbs('/entries/agricultural/tanks');
    expect(crumbs.map((c) => c.label)).toEqual([
      'Lançamentos',
      'Serviços Agrícolas',
      'Defensivos',
      'Tanque do Operador',
    ]);
    expect(crumbs.slice(0, 3).every((c) => !c.path)).toBe(true);
  });

  it('usa contexto para a ordem de serviço', () => {
    const crumbs = buildBreadcrumbs('/entries/agricultural/defensives/order/3');
    expect(crumbs[crumbs.length - 2]).toEqual({
      label: 'Ordens de Serviço',
      path: '/entries/agricultural/defensives',
    });
    expect(crumbs[crumbs.length - 1]).toEqual({ label: 'OS nº 3' });
  });

  it('usa contexto para tickets e impressão', () => {
    const crumbs = buildBreadcrumbs('/entries/grain/tickets/15/print');
    expect(crumbs.map((c) => c.label)).toEqual([
      'Lançamentos',
      'Balança e Armazém',
      'Pesagem',
      'Portarias e Tickets',
      'Ticket nº 15',
      'Impressão',
    ]);
    expect(crumbs[crumbs.length - 1].path).toBeUndefined();
  });

  it('monta relatórios de produtividade', () => {
    const crumbs = buildBreadcrumbs('/reports/harvest/productivity/harvesters');
    expect(crumbs.map((c) => c.label)).toEqual([
      'Relatórios',
      'Colheita',
      'Produtividade por Colhedor',
    ]);
  });

  it('prefere o nome vindo da API quando informado', () => {
    const crumbs = buildBreadcrumbs('/entries/agricultural/defensives/order/3', {
      dynamicLabels: { '3': 'OS 2026-0003' },
    });
    expect(crumbs[crumbs.length - 1].label).toBe('OS 2026-0003');
  });
});
