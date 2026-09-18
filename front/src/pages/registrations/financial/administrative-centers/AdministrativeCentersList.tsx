import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { administrativeCentersService, AdministrativeCenter } from '@/lib/api-services-financial';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdministrativeCenterForm } from './AdministrativeCenterForm';

export default function AdministrativeCentersList() {
  const { data, isLoading, remove } = useCrud<AdministrativeCenter>('administrative-centers', administrativeCentersService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AdministrativeCenter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<AdministrativeCenter | null>(null);

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
    { key: 'producer_name', label: 'Produtor' },
    { key: 'farm_name', label: 'Fazenda' },
    { key: 'cei', label: 'CEI' },
    { key: 'state_registration', label: 'Inscrição Estadual' },
    { key: 'status', label: 'Status', render: (item: AdministrativeCenter) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centros Administrativos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os centros administrativos</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>

      <DataTable data={data} columns={columns} searchKeys={['producer_name', 'farm_name', 'cei']} searchPlaceholder="Buscar centro administrativo..."
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
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Centro Administrativo</DialogTitle></DialogHeader>
          <AdministrativeCenterForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Centro Administrativo</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Produtor:</span><p className="font-medium">{viewItem.producer_name || viewItem.producer_id}</p></div>
              <div><span className="text-sm text-muted-foreground">Fazenda:</span><p className="font-medium">{viewItem.farm_name || viewItem.farm_id}</p></div>
              <div><span className="text-sm text-muted-foreground">CEI:</span><p className="font-medium">{viewItem.cei}</p></div>
              <div><span className="text-sm text-muted-foreground">Inscrição Estadual:</span><p className="font-medium">{viewItem.state_registration}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
