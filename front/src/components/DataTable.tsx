import { useState, useMemo, isValidElement, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, ChevronsLeft, ChevronsRight, FileText, FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { configsService, Config } from '@/lib/api-services-admin';
import { routeNames } from '@/lib/route-names';
import { exportToPdf, exportToXls } from '@/lib/export-utils';

function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join(' ').trim();
  if (isValidElement(node)) return nodeToText((node.props as { children?: ReactNode }).children);
  return '';
}

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  actions?: (item: T) => React.ReactNode;
  pageSize?: number;
  exportTitle?: string;
  showExport?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  actions,
  pageSize: initialPageSize = 25,
  exportTitle,
  showExport = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSizeOption, setPageSizeOption] = useState<string>(String(initialPageSize));
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const location = useLocation();


  const { data: configs } = useQuery({
    queryKey: ['configs'],
    queryFn: configsService.getAll,
    enabled: showExport,
    staleTime: 5 * 60 * 1000,
  });
  const config = (configs as Config[] | undefined)?.[0];

  const reportTitle = useMemo(() => {
    if (exportTitle) return exportTitle;
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || '';
    return routeNames[last] || 'Relatório';
  }, [exportTitle, location.pathname]);

  const searched = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(item =>
      searchKeys.some(key => String(item[key] || '').toLowerCase().includes(term))
    );
  }, [data, search, searchKeys]);

  const filtered = useMemo(() => {
    if (!sort) return searched;
    const col = columns.find(c => c.key === sort.key);
    const cellValue = (item: T) => {
      const raw = item[sort.key];
      if (raw !== undefined && raw !== null && typeof raw !== 'object') return raw;
      return col?.render ? nodeToText(col.render(item)) : '';
    };
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...searched].sort((a, b) => {
      const va = cellValue(a);
      const vb = cellValue(b);
      const na = typeof va === 'number' ? va : Number(String(va).replace(',', '.'));
      const nb = typeof vb === 'number' ? vb : Number(String(vb).replace(',', '.'));
      if (!Number.isNaN(na) && !Number.isNaN(nb) && String(va).trim() !== '' && String(vb).trim() !== '') {
        return (na - nb) * factor;
      }
      return String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base' }) * factor;
    });
  }, [searched, sort, columns]);


  const exportColumns = useMemo(
    () => columns.map(col => ({ key: col.key, label: col.label })),
    [columns],
  );

  const exportRows = useMemo(
    () =>
      filtered.map(item => {
        const row: Record<string, unknown> = {};
        columns.forEach(col => {
          row[col.key] = col.render ? nodeToText(col.render(item)) : (item[col.key] ?? '');
        });
        return row;
      }),
    [filtered, columns],
  );

  const effectivePageSize = pageSizeOption === 'all' ? filtered.length || 1 : Number(pageSizeOption);
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paged = filtered.slice((page - 1) * effectivePageSize, page * effectivePageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={pageSizeOption} onValueChange={(v) => { setPageSizeOption(v); setPage(1); }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 registros</SelectItem>
            <SelectItem value="50">50 registros</SelectItem>
            <SelectItem value="100">100 registros</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        {showExport && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPdf(reportTitle, exportColumns, exportRows, config)}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToXls(reportTitle, exportColumns, exportRows, config)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              XLS
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => {
                      setPage(1);
                      setSort(prev =>
                        prev?.key === col.key
                          ? (prev.dir === 'asc' ? { key: col.key, dir: 'desc' } : null)
                          : { key: col.key, dir: 'asc' },
                      );
                    }}
                  >
                    {col.label}
                    {sort?.key === col.key
                      ? (sort.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)
                      : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                  </button>
                </TableHead>
              ))}
              {actions && <TableHead className="w-[120px]">Ações</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-32 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item, i) => (
                <TableRow key={item.id || i} className="hover:bg-muted/50 transition-colors">
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(item) : item[col.key]}
                    </TableCell>
                  ))}
                  {actions && <TableCell>{actions(item)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} registro(s) encontrado(s)
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
