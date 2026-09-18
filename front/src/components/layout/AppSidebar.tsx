import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/contexts/RolesContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logoSisdeve from '@/assets/logo-sisdeve-agro.webp';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  containsPath,
  filterNavigationByRole,
  flattenNavigation,
  navigation,
  normalizeSearchText,
  type NavigationItem,
} from '@/config/navigation';

const MENU_STATE_KEY = 'sisdeve-sidebar-menus';

function readMenuState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(MENU_STATE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMenuState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(MENU_STATE_KEY, JSON.stringify(state));
  } catch {
    /* preferências visuais são opcionais */
  }
}

/** Ids de todos os ancestrais (inclusive o próprio) que contêm a rota informada. */
function activeTrailIds(items: NavigationItem[], pathname: string): string[] {
  const ids: string[] = [];
  const walk = (list: NavigationItem[]) => {
    list.forEach((item) => {
      if (item.children?.length && containsPath(item, pathname)) {
        ids.push(item.id);
        walk(item.children);
      }
    });
  };
  walk(items);
  return ids;
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { hasRole } = useRoles();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mini, setMiniState] = useState<boolean>(() => readMenuState().mini === true);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => readMenuState());

  const setMini = (value: boolean) => {
    setMiniState(value);
    writeMenuState({ ...readMenuState(), mini: value });
  };

  const items = useMemo(() => filterNavigationByRole(navigation, hasRole), [hasRole]);

  // A rota ativa tem prioridade: todos os ancestrais da página atual abrem.
  useEffect(() => {
    const trail = activeTrailIds(items, location.pathname);
    if (trail.length === 0) return;
    setOpenIds((prev) => {
      const next = { ...prev };
      trail.forEach((id) => { next[id] = true; });
      return next;
    });
  }, [items, location.pathname]);

  const persist = (next: Record<string, boolean>) => {
    setOpenIds(next);
    writeMenuState({ ...next, mini });
  };

  const toggle = (item: NavigationItem, siblings: NavigationItem[], open: boolean) => {
    const next = { ...openIds };
    if (open) {
      siblings.forEach((sibling) => {
        if (sibling.id !== item.id) next[sibling.id] = false;
      });
    }
    next[item.id] = open;
    persist(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(search);
    if (!query) return [];
    return flattenNavigation(items)
      .filter(({ item }) => item.path && !item.hidden && normalizeSearchText(item.title).includes(query))
      .slice(0, 20);
  }, [items, search]);

  const linkClass = `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-sidebar-accent ${mini ? 'md:justify-center md:px-0' : ''}`;

  const renderLeaf = (item: NavigationItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.id}
        to={item.path!}
        end={item.path === '/'}
        title={item.title}
        onClick={() => setMobileOpen(false)}
        className={linkClass}
        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className={mini ? 'md:hidden' : ''}>{item.title}</span>
      </NavLink>
    );
  };

  const renderItems = (list: NavigationItem[], depth: number) =>
    list.map((item) => {
      if (!item.children?.length) return item.path ? renderLeaf(item) : null;

      const Icon = item.icon;
      const open = !!openIds[item.id];
      return (
        <Collapsible
          key={item.id}
          open={mini ? false : open}
          onOpenChange={(value) => toggle(item, list, value)}
        >
          <CollapsibleTrigger
            title={item.title}
            onClick={() => { if (mini) { setMini(false); toggle(item, list, true); } }}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent ${mini ? 'md:justify-center md:px-0' : ''}`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className={mini ? 'md:hidden' : ''}>{item.title}</span>
            </div>
            {!mini && (open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          </CollapsibleTrigger>
          <CollapsibleContent className={`mt-1 space-y-0.5 ${mini ? '' : 'ml-4'}`}>
            {renderItems(item.children!, depth + 1)}
          </CollapsibleContent>
        </Collapsible>
      );
    });

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card shadow-md border"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen
          flex flex-col
          bg-sidebar text-sidebar-foreground
          border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${mini ? 'md:w-16' : 'md:w-64'} w-64 shrink-0
        `}
      >
        <div className={`border-b border-sidebar-border ${mini ? 'md:p-2' : ''} p-4`}>
          <div className={`flex items-center gap-2 ${mini ? 'md:flex-col' : 'justify-between'}`}>
            <img
              src={logoSisdeve}
              alt="Sisdeve Agro"
              className={`object-contain ${mini ? 'h-8 w-8' : 'h-10 w-auto'}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMini(!mini)}
              aria-label={mini ? 'Expandir menu' : 'Recolher menu'}
              title={mini ? 'Expandir menu' : 'Recolher menu'}
              className="hidden md:inline-flex h-8 w-8 shrink-0 hover:bg-sidebar-accent"
            >
              {mini ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!mini && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar funcionalidade"
                aria-label="Pesquisar funcionalidade"
                className="pl-8 h-9"
              />
            </div>
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto space-y-1 ${mini ? 'md:p-2' : ''} p-3`}>
          {search.trim() && !mini ? (
            searchResults.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma funcionalidade encontrada.</p>
            ) : (
              searchResults.map(({ item, trail }) => (
                <NavLink
                  key={item.id}
                  to={item.path!}
                  onClick={() => { setSearch(''); setMobileOpen(false); }}
                  className="flex flex-col px-3 py-2 rounded-lg text-sm transition-colors hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {trail.slice(0, -1).map((parent) => parent.title).join(' › ')}
                  </span>
                </NavLink>
              ))
            )
          ) : (
            renderItems(items, 0)
          )}
        </nav>

        <div className={`border-t border-sidebar-border ${mini ? 'md:p-2' : ''} p-4 space-y-2`}>
          <NavLink
            to="/profile"
            title="Meu perfil"
            onClick={() => setMobileOpen(false)}
            className={linkClass}
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className={mini ? 'md:hidden' : ''}>Meu perfil</span>
          </NavLink>
          <div className={`flex items-center ${mini ? 'md:flex-col md:gap-2' : 'justify-between'}`}>
            <div className={`min-w-0 ${mini ? 'md:hidden' : ''}`}>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
              className="shrink-0 text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
