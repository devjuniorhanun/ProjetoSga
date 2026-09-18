import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { suppliersService, Supplier } from '@/lib/api-services';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplierForm } from './SupplierForm';
import { BankSuppliersDialog } from './BankSuppliersDialog';

export default function SuppliersList() {
  const { data, isLoading, remove } = useCrud<Supplier>('suppliers', suppliersService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Supplier | null>(null);
  const [bankSupplier, setBankSupplier] = useState<Supplier | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir registro.'); }
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'corporate_reason', label: 'Razão Social' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
    { key: 'type', label: 'Tipo', render: (item: Supplier) => item.type === 'F' ? 'Físico' : 'Jurídico' },
    { key: 'status', label: 'Status', render: (item: Supplier) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Fornecedores</h1><p className="text-muted-foreground mt-1">Gerencie os fornecedores</p></div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>
      <DataTable data={data} columns={columns} searchKeys={['corporate_reason', 'fantasy_name', 'cpf_cnpj']} searchPlaceholder="Buscar fornecedor..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Dados Bancários" onClick={() => setBankSupplier(item)}><Landmark className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Fornecedor</DialogTitle></DialogHeader>
          <SupplierForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes do Fornecedor</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Razão Social:</span><p className="font-medium">{viewItem.corporate_reason}</p></div>
                <div><span className="text-sm text-muted-foreground">Nome Fantasia:</span><p className="font-medium">{viewItem.fantasy_name}</p></div>
                <div><span className="text-sm text-muted-foreground">CPF/CNPJ:</span><p className="font-medium">{viewItem.cpf_cnpj}</p></div>
                <div><span className="text-sm text-muted-foreground">RG/IE:</span><p className="font-medium">{viewItem.rg_ie || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">Tipo:</span><p className="font-medium">{viewItem.type === 'F' ? 'Físico' : 'Jurídico'}</p></div>
                <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <BankSuppliersDialog supplier={bankSupplier} onOpenChange={(o) => !o && setBankSupplier(null)} />
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
