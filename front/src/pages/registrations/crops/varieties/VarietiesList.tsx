import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { varietiesService, culturesService, VarietyCulture, Culture } from '@/lib/api-services';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VarietyForm } from './VarietyForm';
import { useQuery } from '@tanstack/react-query';

export default function VarietiesList() {
  const { data: varieties, isLoading, remove } = useCrud<VarietyCulture>('varieties', varietiesService);
  const { data: cultures = [] } = useQuery<Culture[]>({ queryKey: ['cultures', 'active-options'], queryFn: () => culturesService.getAll({ status: 'A' }) });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<VarietyCulture | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<VarietyCulture | null>(null);

  const data = varieties.map(v => ({
    ...v,
    culture_name: v.culture_name || cultures.find(c => c.id === v.culture_id)?.name || '-',
  }));

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
    { key: 'culture_name', label: 'Cultura' },
    { key: 'technology', label: 'Tecnologia' },
    { key: 'cycle', label: 'Ciclo' },
    { key: 'flowering_days', label: 'Dias de Florescimento', render: (item: VarietyCulture) => item.flowering_days ?? '-' },
    { key: 'status', label: 'Status', render: (item: VarietyCulture) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Variedades</h1>
          <p className="text-muted-foreground mt-1">Gerencie as variedades de cultura</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Nova</Button>
      </div>

      <DataTable data={data} columns={columns} searchKeys={['name', 'culture_name', 'technology']} searchPlaceholder="Buscar variedade..."
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
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Variedade</DialogTitle></DialogHeader>
          <VarietyForm item={editItem} cultures={cultures} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Variedade</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
              <div><span className="text-sm text-muted-foreground">Cultura:</span><p className="font-medium">{viewItem.culture_name}</p></div>
              <div><span className="text-sm text-muted-foreground">Tecnologia:</span><p className="font-medium">{viewItem.technology}</p></div>
              <div><span className="text-sm text-muted-foreground">Ciclo:</span><p className="font-medium">{viewItem.cycle}</p></div>
              <div><span className="text-sm text-muted-foreground">Dias de Florescimento:</span><p className="font-medium">{viewItem.flowering_days ?? '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
