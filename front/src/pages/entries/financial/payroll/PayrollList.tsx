import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  payAccountsService,
  PayAccount,
  PAY_ACCOUNT_STATUS_LABELS,
  payAccountAdministrativeCenterName,
  payAccountSupplierName,
  payAccountProducerName,
  payAccountTypeName,
} from '@/lib/api-services-financial-entries';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PayrollForm } from './PayrollForm';

const formatDate = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '';

export default function PayrollList() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PayAccount | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['payroll', {}],
    queryFn: () => payAccountsService.getPayroll(),
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await payAccountsService.delete(deleteId);
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['pay-accounts'] });
      toast.success('Registro excluído!');
    } catch {
      toast.error('Erro ao excluir registro.');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'supplier_name', label: 'Beneficiário', render: payAccountSupplierName },
    { key: 'document_number', label: 'Nº Documento' },
    { key: 'document_date', label: 'Data', render: (item: PayAccount) => formatDate(item.document_date) },
    { key: 'producer_name', label: 'Produtor', render: payAccountProducerName },
    { key: 'administrative_center_name', label: 'Centro Administrativo', render: payAccountAdministrativeCenterName },
    { key: 'type_pay_account_name', label: 'Tipo de Pagamento', render: payAccountTypeName },
    { key: 'description', label: 'Descrição' },
    { key: 'value', label: 'Valor', render: (item: PayAccount) => formatCurrencyBRL(item.value) },
    { key: 'accounted_for', label: 'Contabilizado', render: (item: PayAccount) => (item.accounted_for === 'S' ? 'Sim' : 'Não') },
    { key: 'status', label: 'Unidade', render: (item: PayAccount) => PAY_ACCOUNT_STATUS_LABELS[item.status] ?? item.status },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folha de Pagamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie os pagamentos de folha</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchKeys={['document_number', 'supplier_name', 'producer_name', 'description']}
          searchPlaceholder="Buscar folha..."
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        />
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Folha de Pagamento' : 'Nova Folha de Pagamento'}</DialogTitle>
          </DialogHeader>
          <PayrollForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
