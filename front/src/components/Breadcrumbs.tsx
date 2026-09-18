import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';

export function Breadcrumbs() {
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Caminho de navegação" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
      <Link to="/" className="hover:text-foreground transition-colors" aria-label="Início">
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        // No mobile, caminhos longos mantêm apenas Início e a página atual.
        const hideOnMobile = !isLast && crumbs.length > 2;

        return (
          <span
            key={`${crumb.label}-${index}`}
            className={`items-center gap-1.5 ${hideOnMobile ? 'hidden md:flex' : 'flex'}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[60vw] md:max-w-none">{crumb.label}</span>
            ) : crumb.path ? (
              <Link to={crumb.path} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
