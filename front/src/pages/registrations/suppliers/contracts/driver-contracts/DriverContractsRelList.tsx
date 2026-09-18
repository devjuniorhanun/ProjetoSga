import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DriverContract, driverContractsService, contractDriversService } from '@/lib/api-services-contracts';
import { DriverContractForm } from './DriverContractForm';
import { printContract, renderContractBody } from '@/lib/contract-print';

export default function DriverContractsRelList() {
  const { data, isLoading, remove } = useCrud<DriverContract>('driver-contracts', driverContractsService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<DriverContract | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); }
      catch { toast.error('Erro ao excluir registro.'); }
      setDeleteId(null);
    }
  };

  const handlePrint = async (item: DriverContract) => {
    setPrintingId(item.id);
    try {
      // Busca o registro completo (traz body e as variáveis do contrato)
      const full = await driverContractsService.getById(item.id);
      let body = full.body;
      if (!body && full.drivers_contract_id) {
        const contract = await contractDriversService.getById(full.drivers_contract_id);
        body = contract.body;
      }
      if (!body) {
        toast.error('Contrato sem conteúdo para impressão.');
        return;
      }
      const html = renderContractBody(body, (full.variables ?? {}) as Record<string, unknown>);
      printContract('Contrato de Motorista', html);
    } catch {
      toast.error('Erro ao gerar o contrato.');
    } finally {
      setPrintingId(null);
    }
  };

  const columns = [
    { key: 'supplier_name', label: 'Fornecedor', render: (item: DriverContract) => item.supplier_name || '-' },
    { key: 'crop_name', label: 'Contrato / Safra', render: (item: DriverContract) => item.crop_name || '-' },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Motorista Contrato</h1>
          <p className="text-muted-foreground mt-1">Vincule fornecedores aos contratos de motoristas</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>

      <DataTable data={data} columns={columns} searchKeys={['supplier_name', 'crop_name']} searchPlaceholder="Buscar..." showExport={false}
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir contrato" disabled={printingId === item.id} onClick={() => handlePrint(item)}>
              {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Motorista Contrato</DialogTitle></DialogHeader>
          <DriverContractForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
