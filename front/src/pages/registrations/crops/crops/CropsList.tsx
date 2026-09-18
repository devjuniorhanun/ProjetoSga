import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cropsService, Crop, culturesService } from '@/lib/api-services';
import { formatDate } from '@/lib/utils';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CropForm } from './CropForm';
import { useQuery } from '@tanstack/react-query';

export default function CropsList() {
  const { data, isLoading, remove } = useCrud<Crop>('crops', cropsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Crop | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Crop | null>(null);

  const { data: cultures = [] } = useQuery({
    queryKey: ['cultures'],
    queryFn: culturesService.getAll,
  });

  const getCultureNames = (cultureIds?: string[]) => {
    if (!cultureIds || cultureIds.length === 0) return '-';
    return cultureIds
      .map((id) => cultures.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  };

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
    { key: 'name', label: 'Nome' },
    { key: 'opening_date', label: 'Data Abertura', render: (item: Crop) => formatDate(item.opening_date) },
    { key: 'closing_date', label: 'Data Fechamento', render: (item: Crop) => formatDate(item.closing_date) },
    { key: 'status', label: 'Status', render: (item: Crop) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Safras</h1>
          <p className="text-muted-foreground mt-1">Gerencie as safras do sistema</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Nova</Button>
      </div>

      <DataTable data={data} columns={columns} searchKeys={['name']} searchPlaceholder="Buscar safra..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Safra</DialogTitle></DialogHeader>
          <CropForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Safra</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
              <div><span className="text-sm text-muted-foreground">Abertura:</span><p className="font-medium">{formatDate(viewItem.opening_date)}</p></div>
              <div><span className="text-sm text-muted-foreground">Fechamento:</span><p className="font-medium">{formatDate(viewItem.closing_date)}</p></div>
              <div><span className="text-sm text-muted-foreground">Culturas:</span><p className="font-medium">{getCultureNames(viewItem.culture_ids)}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
