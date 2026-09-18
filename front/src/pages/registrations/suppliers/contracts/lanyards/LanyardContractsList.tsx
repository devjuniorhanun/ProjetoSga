import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Contract, contractLanyardsService } from '@/lib/api-services-contracts';
import { ContractForm } from '../ContractForm';

const formatDate = (value?: string) => (value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '-');

export default function LanyardContractsList() {
  const { data, isLoading, remove } = useCrud<Contract>('contract-lanyards', contractLanyardsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Contract | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Contract | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir registro.'); }
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'crop_name', label: 'Safra', render: (item: Contract) => item.crop_name || '-' },
    { key: 'opening_date', label: 'Abertura', render: (item: Contract) => formatDate(item.opening_date) },
    { key: 'closing_date', label: 'Fechamento', render: (item: Contract) => formatDate(item.closing_date) },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Colhedores</h1><p className="text-muted-foreground mt-1">Gerencie os contratos de colhedores</p></div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>
      <DataTable data={data} columns={columns} searchKeys={['crop_name']} searchPlaceholder="Buscar contrato..." showExport={false}
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Contrato de Colhedor</DialogTitle></DialogHeader>
          <ContractForm item={editItem} service={contractLanyardsService} queryKey="contract-lanyards" label="Contrato" showShippingCost={false}
            onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Contrato</DialogTitle></DialogHeader>
          {viewItem && (<div className="space-y-4">
            <div><span className="text-sm text-muted-foreground">Safra:</span><p className="font-medium">{viewItem.crop_name || '-'}</p></div>
            <div><span className="text-sm text-muted-foreground">Abertura:</span><p className="font-medium">{formatDate(viewItem.opening_date)}</p></div>
            <div><span className="text-sm text-muted-foreground">Fechamento:</span><p className="font-medium">{formatDate(viewItem.closing_date)}</p></div>
            <div><span className="text-sm text-muted-foreground">Corpo do Contrato:</span>
              <div className="prose prose-sm max-w-none mt-1 dark:prose-invert" dangerouslySetInnerHTML={{ __html: viewItem.body || '-' }} />
            </div>
          </div>)}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
