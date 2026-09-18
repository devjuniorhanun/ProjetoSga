import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { plotFieldsService, PlotField } from '@/lib/api-services';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlotFieldForm } from './PlotFieldForm';

function fmtDate(v?: string) {
  if (!v) return '-';
  const d = new Date(`${String(v).slice(0, 10)}T12:00:00`);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('pt-BR');
}

export default function PlotFieldsList() {
  const { data, isLoading, remove } = useCrud<PlotField>('plot-fields', plotFieldsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PlotField | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<PlotField | null>(null);

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
    { key: 'name', label: 'Nome', render: (item: PlotField) => item.name || '-' },
    { key: 'field_name', label: 'Talhão' },
    { key: 'crop_name', label: 'Safra' },
    { key: 'culture_name', label: 'Cultura' },
    { key: 'area', label: 'Área (ha)' },
    { key: 'status', label: 'Status', render: (item: PlotField) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locação de Talhões</h1>
          <p className="text-muted-foreground mt-1">Gerencie as locações de talhões</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Nova</Button>
      </div>

      <DataTable data={data} columns={columns} searchKeys={['name']} searchPlaceholder="Buscar locação..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Locação de Talhão</DialogTitle></DialogHeader>
          <PlotFieldForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes da Locação</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Talhão:</span><p className="font-medium">{viewItem.field_name || viewItem.field_id}</p></div>
              <div><span className="text-sm text-muted-foreground">Safra:</span><p className="font-medium">{viewItem.crop_name || viewItem.crop_id}</p></div>
              <div><span className="text-sm text-muted-foreground">Cultura:</span><p className="font-medium">{viewItem.culture_name || viewItem.culture_id}</p></div>
              <div><span className="text-sm text-muted-foreground">Variedade:</span><p className="font-medium">{(viewItem as any).variety_culture_name || (viewItem as any).variety_culture_id || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Área:</span><p className="font-medium">{viewItem.area} ha</p></div>
              <div><span className="text-sm text-muted-foreground">PMS (Peso de Mil Sementes):</span><p className="font-medium">{(viewItem as any).pms ?? '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Sementes Lineares:</span><p className="font-medium">{(viewItem as any).linear_seed ?? '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Início do Plantio:</span><p className="font-medium">{fmtDate((viewItem as any).start_planting)}</p></div>
              <div><span className="text-sm text-muted-foreground">Fim do Plantio:</span><p className="font-medium">{fmtDate((viewItem as any).final_planting)}</p></div>
              <div><span className="text-sm text-muted-foreground">Data Prevista:</span><p className="font-medium">{fmtDate((viewItem as any).expected_date)}</p></div>
              <div><span className="text-sm text-muted-foreground">Observações:</span><p className="font-medium whitespace-pre-wrap">{(viewItem as any).observations || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
