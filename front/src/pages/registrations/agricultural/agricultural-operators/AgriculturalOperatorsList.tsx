import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { agriculturalOperatorsService, AgriculturalOperator } from '@/lib/api-services-agricultural';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgriculturalOperatorForm } from './AgriculturalOperatorForm';

export default function AgriculturalOperatorsList() {
  const { data, isLoading, remove } = useCrud<AgriculturalOperator>('agricultural-operators', agriculturalOperatorsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AgriculturalOperator | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<AgriculturalOperator | null>(null);
  const handleDelete = async () => { if (deleteId) { try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir.'); } setDeleteId(null); } };
  const columns = [{ key: 'supplier_name', label: 'Funcionário' }, { key: 'status', label: 'Status', render: (item: AgriculturalOperator) => <StatusBadge status={item.status} /> }];
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Operadores Agrícolas</h1><p className="text-muted-foreground mt-1">Gerencie os operadores agrícolas</p></div><Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button></div>
      <DataTable data={data} columns={columns} searchKeys={['supplier_name']} searchPlaceholder="Buscar operador..." actions={(item) => (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)} />
      <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent><DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Operador Agrícola</DialogTitle></DialogHeader><AgriculturalOperatorForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} /></DialogContent></Dialog>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent><DialogHeader><DialogTitle>Detalhes do Operador</DialogTitle></DialogHeader>{viewItem && (<div className="space-y-4"><div><span className="text-sm text-muted-foreground">Funcionário:</span><p className="font-medium">{viewItem.supplier_name || '-'}</p></div><div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div></div>)}</DialogContent></Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
