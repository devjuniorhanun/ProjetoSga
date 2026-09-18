import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { fleetBrandsService, FleetBrand } from '@/lib/api-services-vehicles';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FleetBrandForm } from './FleetBrandForm';

export default function FleetBrandsList() {
  const { data, isLoading, remove } = useCrud<FleetBrand>('fleet-brands', fleetBrandsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<FleetBrand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<FleetBrand | null>(null);

  const handleDelete = async () => { if (deleteId) { try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir.'); } setDeleteId(null); } };

  const columns = [{ key: 'name', label: 'Nome' }];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Marcas de Frotas</h1><p className="text-muted-foreground mt-1">Gerencie as marcas de frotas</p></div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>
      <DataTable data={data} columns={columns} searchKeys={['name']} searchPlaceholder="Buscar marca..."
        actions={(item) => (<div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>)} />
      <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent><DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Marca de Frota</DialogTitle></DialogHeader><FleetBrandForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} /></DialogContent></Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent><DialogHeader><DialogTitle>Detalhes da Marca</DialogTitle></DialogHeader>{viewItem && (<div className="space-y-4"><div><span className="text-sm text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div></div>)}</DialogContent></Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
