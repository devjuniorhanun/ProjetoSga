import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { agriculturalProductsService, AgriculturalProduct } from '@/lib/api-services-agricultural';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgriculturalProductForm } from './AgriculturalProductForm';

function ingredientsText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === 'string') return v;
        const name = (v as any)?.active_ingredient ?? '';
        const conc = (v as any)?.concentration;
        return name ? (conc ? `${name} (${conc})` : name) : '';
      })
      .filter(Boolean)
      .join(', ');
  }
  return typeof value === 'string' ? value : '-';
}

export default function AgriculturalProductsList() {
  const { data, isLoading, remove } = useCrud<AgriculturalProduct>('agricultural-products', agriculturalProductsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AgriculturalProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<AgriculturalProduct | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir.'); }
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'product_name', label: 'Produto' },
    { key: 'active_ingredient', label: 'Ingredientes Ativos', render: (item: AgriculturalProduct) => ingredientsText(item.active_ingredient) },
    { key: 'formulation', label: 'Formulação' },
    { key: 'status', label: 'Status', render: (item: AgriculturalProduct) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Produto Agrícola</h1><p className="text-muted-foreground mt-1">Gerencie os produtos agrícolas</p></div><Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button></div>
      <DataTable data={data} columns={columns} searchKeys={['product_name', 'formulation']} searchPlaceholder="Buscar produto agrícola..." actions={(item) => (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)} />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Produto Agrícola</DialogTitle></DialogHeader>
          <AgriculturalProductForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Produto Agrícola</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Produto:</span><p className="font-medium">{viewItem.product_name || viewItem.product_id}</p></div>
              <div><span className="text-sm text-muted-foreground">Ingredientes Ativos:</span><p className="font-medium">{ingredientsText(viewItem.active_ingredient)}</p></div>
              <div><span className="text-sm text-muted-foreground">Formulação:</span><p className="font-medium">{viewItem.formulation}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
