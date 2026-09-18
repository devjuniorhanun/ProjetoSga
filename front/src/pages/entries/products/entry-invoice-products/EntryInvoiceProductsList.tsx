import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { entryInvoiceProductsService, EntryInvoiceProduct } from '@/lib/api-services-entries';
import { formatDate } from '@/lib/utils';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EntryInvoiceProductForm } from './EntryInvoiceProductForm';

export default function EntryInvoiceProductsList() {
  const { data, isLoading, remove } = useCrud<EntryInvoiceProduct>('entry-invoice-products', entryInvoiceProductsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<EntryInvoiceProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<EntryInvoiceProduct | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir registro.'); }
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'note_number', label: 'Nº Nota' },
    { key: 'serie', label: 'Série' },
    { key: 'supplier_name', label: 'Fornecedor' },
    { key: 'producer_name', label: 'Produtor' },
    { key: 'mission_date', label: 'Dt. Emissão', render: (item: EntryInvoiceProduct) => formatDate(item.mission_date) },
    { key: 'total_value', label: 'Valor Total', render: (item: EntryInvoiceProduct) => formatCurrency(item.total_value) },
    { key: 'status', label: 'Status', render: (item: EntryInvoiceProduct) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Nota Fiscal de Entrada</h1><p className="text-muted-foreground mt-1">Gerencie as notas fiscais de entrada de produtos</p></div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Nova</Button>
      </div>
      <DataTable data={data} columns={columns} searchKeys={['note_number', 'supplier_name']} searchPlaceholder="Buscar nota fiscal..."
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
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Nota Fiscal de Entrada</DialogTitle></DialogHeader>
          <EntryInvoiceProductForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes da Nota Fiscal</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Nº Nota:</span><p className="font-medium">{viewItem.note_number}</p></div>
                <div><span className="text-sm text-muted-foreground">Série:</span><p className="font-medium">{viewItem.serie || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">Fornecedor:</span><p className="font-medium">{viewItem.supplier_name || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">Produtor:</span><p className="font-medium">{viewItem.producer_name || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">Data de Emissão:</span><p className="font-medium">{formatDate(viewItem.mission_date)}</p></div>
                <div><span className="text-sm text-muted-foreground">Data de Chegada:</span><p className="font-medium">{formatDate(viewItem.arrival_date)}</p></div>
                <div><span className="text-sm text-muted-foreground">Valor Total:</span><p className="font-medium">{formatCurrency(viewItem.total_value)}</p></div>
                <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
              </div>
              {viewItem.items && viewItem.items.length > 0 && (
                <>
                  <hr />
                  <div>
                    <h3 className="font-medium mb-2">Itens</h3>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/50"><th className="px-3 py-2 text-left">Produto</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2 text-right">Valor Unit.</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                        <tbody>
                          {viewItem.items.map((itm, idx) => (
                            <tr key={idx} className="border-b last:border-0"><td className="px-3 py-2">{itm.product_name}</td><td className="px-3 py-2 text-right">{itm.quantity}</td><td className="px-3 py-2 text-right">{formatCurrency(itm.unit_value)}</td><td className="px-3 py-2 text-right">{formatCurrency(itm.total_value)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
