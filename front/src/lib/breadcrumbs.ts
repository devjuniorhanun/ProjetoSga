import { navigation, type NavigationItem } from '@/config/navigation';

export interface Crumb {
  label: string;
  /** Quando ausente, o item é apenas texto (categoria conceitual ou página atual). */
  path?: string;
}

/** Rótulos de segmentos finais que não possuem página própria registrada. */
const SEGMENT_LABELS: Record<string, string> = {
  print: 'Impressão',
  new: 'Novo',
  edit: 'Editar',
};

/** Segmentos técnicos que não geram um nível de breadcrumb. */
const SKIPPED_SEGMENTS = new Set(['order', 'orders', 'detail', 'view']);

function matchesPath(itemPath: string, pathname: string): boolean {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

interface Match {
  trail: NavigationItem[];
  path: string;
}

function findMatch(items: NavigationItem[], pathname: string, trail: NavigationItem[] = []): Match | null {
  let best: Match | null = null;

  for (const item of items) {
    const currentTrail = [...trail, item];

    if (item.path && item.path !== '/' && matchesPath(item.path, pathname)) {
      if (!best || item.path.length > best.path.length) {
        best = { trail: currentTrail, path: item.path };
      }
    }

    const childMatch = findMatch(item.children ?? [], pathname, currentTrail);
    if (childMatch && (!best || childMatch.path.length > best.path.length)) {
      best = childMatch;
    }
  }

  return best;
}

function formatIdLabel(template: string | undefined, value: string, fallbackName?: string): string {
  if (fallbackName) return fallbackName;
  if (!template) return value;
  return template.replace('{id}', value);
}

/**
 * Monta os breadcrumbs a partir da configuração de navegação.
 * Categorias sem página própria nunca viram link e a página atual nunca é clicável.
 */
export function buildBreadcrumbs(
  pathname: string,
  options: { dynamicLabels?: Record<string, string>; items?: NavigationItem[] } = {},
): Crumb[] {
  const items = options.items ?? navigation;
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return [];

  const match = findMatch(items, clean);
  if (!match) {
    // Sem correspondência: mostra apenas o último segmento como texto.
    const segments = clean.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return [{ label: SEGMENT_LABELS[last] ?? last }];
  }

  const crumbs: Crumb[] = match.trail.map((item) => ({
    label: item.breadcrumb ?? item.title,
    path: item.path,
  }));

  const rest = clean.slice(match.path.length).split('/').filter(Boolean);
  const owner = match.trail[match.trail.length - 1];

  rest.forEach((segment) => {
    if (SKIPPED_SEGMENTS.has(segment)) return;
    if (/^\d+$/.test(segment)) {
      crumbs.push({
        label: formatIdLabel(owner.idLabel, segment, options.dynamicLabels?.[segment]),
      });
      return;
    }
    crumbs.push({ label: SEGMENT_LABELS[segment] ?? options.dynamicLabels?.[segment] ?? segment });
  });

  // A página atual nunca é clicável.
  return crumbs.map((crumb, index) =>
    index === crumbs.length - 1 ? { label: crumb.label } : crumb,
  );
}
