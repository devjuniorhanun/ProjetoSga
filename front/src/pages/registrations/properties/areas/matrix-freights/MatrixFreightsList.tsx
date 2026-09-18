import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { matrixFreightsService, MatrixFreight } from '@/lib/api-services';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MatrixFreightForm } from './MatrixFreightForm';
import {
  MATRIX_FREIGHT_SITUATION_LABELS,
  MatrixFreightSituation,
  canEditMatrixFreightPrice,
  formatEffectiveDateTime,
  matrixFreightSituation,
  sortByEffectiveFromDesc,
} from '@/lib/matrix-freight-rules';

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ALL = '__all__';

const situationVariant: Record<MatrixFreightSituation, 'default' | 'secondary' | 'outline'> = {
  VIGENTE: 'default',
  FUTURA: 'outline',
  ENCERRADA: 'secondary',
  INATIVA: 'secondary',
};

function SituationBadge({ item }: { item: MatrixFreight }) {
  const situation = matrixFreightSituation(item);
  return (
    <Badge
      variant={situationVariant[situation]}
      className={situation === 'VIGENTE' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : ''}
    >
      {MATRIX_FREIGHT_SITUATION_LABELS[situation]}
    </Badge>
  );
}

export default function MatrixFreightsList() {
  const { data, isLoading, remove } = useCrud<MatrixFreight>('matrix-freights', matrixFreightsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MatrixFreight | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<MatrixFreight | null>(null);

  const [filters, setFilters] = useState({ crop: '', block: '', route: '', status: '', from: '', to: '' });
  const setFilter = (key: keyof typeof filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const rows = useMemo(() => {
    const filtered = data.filter((item) => {
      if (filters.crop && !(item.crop_name ?? '').toLowerCase().includes(filters.crop.toLowerCase())) return false;
      if (filters.block && (item.block ?? '').toLowerCase() !== filters.block.toLowerCase()) return false;
      if (filters.route && (item.route ?? '').toLowerCase() !== filters.route.toLowerCase()) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.from && item.effective_from && item.effective_from.slice(0, 10) < filters.from) return false;
      if (filters.to && item.effective_from && item.effective_from.slice(0, 10) > filters.to) return false;
      return true;
    });
    return sortByEffectiveFromDesc(filtered);
  }, [data, filters]);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await remove.mutateAsync(deleteId);
        toast.success('Registro excluído!');
      } catch {
        toast.error('Erro ao excluir registro.');
      }
      setDeleteId(null);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditItem(null);
  };

  const columns = [
    { key: 'crop_name', label: 'Safra' },
    { key: 'block', label: 'Bloco' },
    { key: 'route', label: 'Percurso' },
    { key: 'price', label: 'Preço', render: (item: MatrixFreight) => formatBRL(item.price) },
    { key: 'effective_from', label: 'Início da vigência', render: (item: MatrixFreight) => formatEffectiveDateTime(item.effective_from) },
    { key: 'effective_to', label: 'Fim da vigência', render: (item: MatrixFreight) => formatEffectiveDateTime(item.effective_to) },
    { key: 'status', label: 'Status', render: (item: MatrixFreight) => <StatusBadge status={item.status} /> },
    { key: 'situation', label: 'Situação da versão', render: (item: MatrixFreight) => <SituationBadge item={item} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matriz de Frete</h1>
          <p className="text-muted-foreground mt-1">Gerencie as matrizes de frete e suas vigências</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Nova</Button>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <Label className="text-xs">Safra</Label>
          <Input value={filters.crop} onChange={(e) => setFilter('crop', e.target.value)} placeholder="Buscar safra" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Bloco</Label>
          <Input value={filters.block} maxLength={1} onChange={(e) => setFilter('block', e.target.value)} placeholder="A" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Percurso</Label>
          <Input value={filters.route} maxLength={1} onChange={(e) => setFilter('route', e.target.value)} placeholder="1" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={filters.status || ALL} onValueChange={(v) => setFilter('status', v === ALL ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="A">Ativo</SelectItem>
              <SelectItem value="I">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Vigência de</Label>
          <Input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Vigência até</Label>
          <Input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
        </div>
      </div>

      <DataTable data={rows} columns={columns} searchKeys={['block']} searchPlaceholder="Buscar matriz..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            {canEditMatrixFreightPrice(item) && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Matriz de Frete</DialogTitle></DialogHeader>
          <MatrixFreightForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Matriz de Frete</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Safra:</span><p className="font-medium">{viewItem.crop_name || viewItem.crop_id}</p></div>
              <div><span className="text-sm text-muted-foreground">Bloco:</span><p className="font-medium">{viewItem.block}</p></div>
              <div><span className="text-sm text-muted-foreground">Percurso:</span><p className="font-medium">{viewItem.route || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Preço:</span><p className="font-medium">{formatBRL(viewItem.price)}</p></div>
              <div><span className="text-sm text-muted-foreground">Início da vigência:</span><p className="font-medium">{formatEffectiveDateTime(viewItem.effective_from)}</p></div>
              <div><span className="text-sm text-muted-foreground">Fim da vigência:</span><p className="font-medium">{formatEffectiveDateTime(viewItem.effective_to)}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
              <div><span className="text-sm text-muted-foreground">Situação da versão:</span><p><SituationBadge item={viewItem} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
