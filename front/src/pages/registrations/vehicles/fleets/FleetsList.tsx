import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { fleetsService, Fleet } from '@/lib/api-services-vehicles';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FleetForm } from './FleetForm';

export default function FleetsList() {
  const { data, isLoading, remove } = useCrud<Fleet>('fleets', fleetsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Fleet | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Fleet | null>(null);

  const handleDelete = async () => { if (deleteId) { try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir.'); } setDeleteId(null); } };

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'code', label: 'Código' },
    { key: 'plate', label: 'Placa' },
    { key: 'fleet_type', label: 'Tipo', render: (item: Fleet) => item.fleet_type === 'P' ? 'Próprio' : 'Terceiro' },
    { key: 'fleet_group_name', label: 'Grupo' },
    { key: 'fleet_brand_name', label: 'Marca' },
    { key: 'status', label: 'Status', render: (item: Fleet) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Frotas</h1><p className="text-muted-foreground mt-1">Gerencie as frotas</p></div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>
      <DataTable data={data} columns={columns} searchKeys={['name', 'code', 'plate']} searchPlaceholder="Buscar frota..."
        actions={(item) => (<div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>)} />
      <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Frota</DialogTitle></DialogHeader><FleetForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} /></DialogContent></Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes da Frota</DialogTitle></DialogHeader>{viewItem && (<div className="grid grid-cols-2 gap-4">
        <div><span className="text-sm text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
        <div><span className="text-sm text-muted-foreground">Código:</span><p className="font-medium">{viewItem.code}</p></div>
        <div><span className="text-sm text-muted-foreground">Placa:</span><p className="font-medium">{viewItem.plate}</p></div>
        <div><span className="text-sm text-muted-foreground">Tipo:</span><p className="font-medium">{viewItem.fleet_type === 'P' ? 'Próprio' : 'Terceiro'}</p></div>
        <div><span className="text-sm text-muted-foreground">Grupo:</span><p className="font-medium">{viewItem.fleet_group_name || '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Marca:</span><p className="font-medium">{viewItem.fleet_brand_name || '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Modelo:</span><p className="font-medium">{viewItem.fleet_model_name || '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Ano:</span><p className="font-medium">{viewItem.year}</p></div>
        <div><span className="text-sm text-muted-foreground">Chassi:</span><p className="font-medium">{viewItem.chassi || '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Combustível:</span><p className="font-medium">{viewItem.fuel_type === 'A' ? 'S-500' : viewItem.fuel_type === 'B' ? 'S-10' : viewItem.fuel_type || '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
      </div>)}</DialogContent></Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
