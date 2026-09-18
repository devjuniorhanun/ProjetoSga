import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BankSupplier, bankSuppliersService } from '@/lib/api-services-bank';
import { BankSupplierForm } from './BankSupplierForm';
import { Supplier } from '@/lib/api-services';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
}

export function BankSuppliersDialog({ supplier, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BankSupplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['bank-suppliers', supplier?.id],
    queryFn: () => bankSuppliersService.getBySupplier(supplier!.id),
    enabled: !!supplier,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await bankSuppliersService.delete(deleteId);
      toast.success('Registro excluído!');
      queryClient.invalidateQueries({ queryKey: ['bank-suppliers', supplier?.id] });
    } catch {
      toast.error('Erro ao excluir registro.');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'supplier_name', label: 'Favorecido' },
    { key: 'bank_name', label: 'Banco' },
    { key: 'agency_number', label: 'Agência' },
    { key: 'account_number', label: 'Conta' },
    { key: 'account_type', label: 'Tipo', render: (i: BankSupplier) => i.account_type === 'C' ? 'Corrente' : i.account_type === 'P' ? 'Poupança' : '-' },
    { key: 'pix_key', label: 'PIX' },
    { key: 'status', label: 'Status', render: (i: BankSupplier) => <StatusBadge status={i.status} /> },
  ];

  return (
    <>
      <Dialog open={!!supplier} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados Bancários — {supplier?.fantasy_name || supplier?.corporate_reason}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <DataTable
                data={data}
                columns={columns}
                searchKeys={['supplier_name', 'bank_name', 'account_number']}
                searchPlaceholder="Buscar dados bancários..."
                exportTitle="Dados Bancários"
                actions={(item: BankSupplier) => (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Dados Bancários</DialogTitle></DialogHeader>
          {supplier && (
            <BankSupplierForm
              supplierId={supplier.id}
              supplierLabel={supplier.fantasy_name || supplier.corporate_reason}
              item={editItem}
              onSave={() => { setShowForm(false); setEditItem(null); }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </>
  );
}
