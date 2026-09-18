import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ownersService, Owner } from '@/lib/api-services';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OwnerForm } from './OwnerForm';

export default function OwnersList() {
  const { data, isLoading, remove } = useCrud<Owner>('owners', ownersService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Owner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Owner | null>(null);

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
    { key: 'corporate_name', label: 'Razão Social' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'payment_type', label: 'Tipo Pagamento', render: (item: Owner) => item.payment_type === 'D' ? 'Depósito' : item.payment_type === 'T' ? 'Transferência' : item.payment_type },
    { key: 'status', label: 'Status', render: (item: Owner) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proprietários</h1>
          <p className="text-muted-foreground mt-1">Gerencie os proprietários</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>

      <DataTable data={data} columns={columns} searchKeys={['corporate_name', 'fantasy_name']} searchPlaceholder="Buscar proprietário..."
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
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Proprietário</DialogTitle></DialogHeader>
          <OwnerForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Proprietário</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Razão Social:</span><p className="font-medium">{viewItem.corporate_name}</p></div>
              <div><span className="text-sm text-muted-foreground">Nome Fantasia:</span><p className="font-medium">{viewItem.fantasy_name}</p></div>
              <div><span className="text-sm text-muted-foreground">Tipo Pagamento:</span><p className="font-medium">{viewItem.payment_type === 'D' ? 'Depósito' : viewItem.payment_type === 'T' ? 'Transferência' : viewItem.payment_type}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
