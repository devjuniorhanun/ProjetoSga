import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { productsService, Product } from '@/lib/api-services-products';
import { formatNumberBR } from '@/lib/format-helpers';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductForm } from './ProductForm';

export default function ProductsList() {
  const { data, isLoading, remove } = useCrud<Product>('products', productsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Product | null>(null);
  const handleDelete = async () => { if (deleteId) { try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir.'); } setDeleteId(null); } };
  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'group_product_name', label: 'Grupo' },
    { key: 'unit', label: 'Unidade', render: (item: Product) => item.unit === 'K' ? 'Kilo' : 'Litro' },
    { key: 'stock', label: 'Estoque', render: (item: Product) => formatNumberBR(item.stock) },
    { key: 'status', label: 'Status', render: (item: Product) => <StatusBadge status={item.status} /> },
  ];
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Produtos</h1><p className="text-muted-foreground mt-1">Gerencie os produtos</p></div><Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button></div>
      <DataTable data={data} columns={columns} searchKeys={['name']} searchPlaceholder="Buscar produto..." actions={(item) => (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)} />
      <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader><ProductForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} /></DialogContent></Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes do Produto</DialogTitle></DialogHeader>{viewItem && (<div className="grid grid-cols-2 gap-4">
        <div><span className="text-sm text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
        <div><span className="text-sm text-muted-foreground">Grupo:</span><p className="font-medium">{viewItem.group_product_name || '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Sub Grupo:</span><p className="font-medium">{viewItem.sub_group_product_name || '-'}</p></div>
        
        <div><span className="text-sm text-muted-foreground">Unidade:</span><p className="font-medium">{viewItem.unit === 'K' ? 'Kilo' : 'Litro'}</p></div>
        <div><span className="text-sm text-muted-foreground">Estoque:</span><p className="font-medium">{formatNumberBR(viewItem.stock)}</p></div>
        <div><span className="text-sm text-muted-foreground">Quantidade Mínima:</span><p className="font-medium">{String(viewItem.minimum_quantity ?? '-').replace('.', ',')}</p></div>
        <div><span className="text-sm text-muted-foreground">Tambor/Caixa:</span><p className="font-medium">{viewItem.drum_box ? String(viewItem.drum_box).replace('.', ',') : '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Galão/Pacote:</span><p className="font-medium">{viewItem.gallon_package ? String(viewItem.gallon_package).replace('.', ',') : '-'}</p></div>
        <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
      </div>)}</DialogContent></Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
