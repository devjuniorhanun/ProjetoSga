import type { ElementType } from 'react';

export type AppRole = 'SUPER' | 'ADM' | 'USR';

export interface NavigationItem {
  /** Identificador estável do item (usado em estado do menu e testes). */
  id: string;
  title: string;
  /** Rota visual do React. Categorias conceituais não possuem path. */
  path?: string;
  icon?: ElementType;
  roles?: AppRole[];
  children?: NavigationItem[];
  /** Texto usado no breadcrumb quando diferente do título do menu. */
  breadcrumb?: string;
  /** Rótulo para segmentos dinâmicos filhos, ex.: 'OS nº {id}'. */
  idLabel?: string;
  /** Não exibir no menu lateral (usado apenas para breadcrumbs). */
  hidden?: boolean;
}

export interface FlatNavigationEntry {
  item: NavigationItem;
  /** Cadeia de ancestrais, do topo até o próprio item. */
  trail: NavigationItem[];
}

/** Percorre a árvore e devolve todos os itens com sua cadeia de ancestrais. */
export function flattenNavigation(
  items: NavigationItem[],
  trail: NavigationItem[] = [],
): FlatNavigationEntry[] {
  return items.flatMap((item) => {
    const currentTrail = [...trail, item];
    return [
      { item, trail: currentTrail },
      ...flattenNavigation(item.children ?? [], currentTrail),
    ];
  });
}

/** Remove acentos e caixa para permitir pesquisa tolerante. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Filtra a árvore pelos papéis do usuário, removendo grupos que ficaram vazios. */
export function filterNavigationByRole(
  items: NavigationItem[],
  hasRole: (...roles: string[]) => boolean,
): NavigationItem[] {
  return items.reduce<NavigationItem[]>((acc, item) => {
    if (item.hidden) return acc;
    if (item.roles?.length && !hasRole(...item.roles)) return acc;

    const children = item.children ? filterNavigationByRole(item.children, hasRole) : undefined;
    if (item.children && (!children || children.length === 0)) return acc;

    acc.push(children ? { ...item, children } : item);
    return acc;
  }, []);
}

/** Verifica se o item (ou algum descendente) corresponde à rota atual. */
export function containsPath(item: NavigationItem, pathname: string): boolean {
  if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) return true;
  return (item.children ?? []).some((child) => containsPath(child, pathname));
}
