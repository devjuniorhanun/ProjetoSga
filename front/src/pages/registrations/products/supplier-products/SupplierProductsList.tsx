import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { supplierProductsService, SupplierProduct } from '@/lib/api-services-products';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplierProductForm } from './SupplierProductForm';

export default function SupplierProductsList() {
  const { data, isLoading, remove } = useCrud<SupplierProduct>('supplier-products', supplierProductsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<SupplierProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<SupplierProduct | null>(null);
  const handleDelete = async () => { if (deleteId) { try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir.'); } setDeleteId(null); } };
  const columns = [
    { key: 'supplier_name', label: 'Fornecedor' },
    { key: 'product_name', label: 'Produto' },
    { key: 'product_code', label: 'Código' },
    { key: 'volume', label: 'Volume' },
    { key: 'status', label: 'Status', render: (item: SupplierProduct) => <StatusBadge status={item.status} /> },
  ];
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Produtos Fornecedores</h1><p className="text-muted-foreground mt-1">Gerencie os produtos por fornecedor</p></div><Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button></div>
      <DataTable data={data} columns={columns} searchKeys={['product_code', 'supplier_name']} searchPlaceholder="Buscar produto fornecedor..." actions={(item) => (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)} />
      <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent><DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Produto Fornecedor</DialogTitle></DialogHeader><SupplierProductForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} /></DialogContent></Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent><DialogHeader><DialogTitle>Detalhes</DialogTitle></DialogHeader>{viewItem && (<div className="space-y-4"><div><span className="text-sm text-muted-foreground">Fornecedor:</span><p className="font-medium">{viewItem.supplier_name || '-'}</p></div><div><span className="text-sm text-muted-foreground">Produto:</span><p className="font-medium">{viewItem.product_name || '-'}</p></div><div><span className="text-sm text-muted-foreground">Código:</span><p className="font-medium">{viewItem.product_code}</p></div><div><span className="text-sm text-muted-foreground">Volume:</span><p className="font-medium">{viewItem.volume || '-'}</p></div><div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div></div>)}</DialogContent></Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
