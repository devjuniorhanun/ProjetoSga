import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GrainTransferForm } from './GrainTransferForm';
import { harvestGrainTransfersService } from '@/lib/api-services-harvest-transfers';
import { cropsService, culturesService, producersService, warehousesService } from '@/lib/api-services';
import { formatNullableNumber } from '@/lib/report-rules';
import { formatDateBR, formatWeight } from '@/lib/grain-format';
import type { HarvestGrainTransfer } from '@/types/harvest-transfers';

export default function GrainTransfersList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<HarvestGrainTransfer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cropFilter, setCropFilter] = useState('');
  const [producerFilter, setProducerFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [cultureFilter, setCultureFilter] = useState('');

  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: producers = [] } = useQuery({ queryKey: ['producers'], queryFn: producersService.getAll });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: warehousesService.getAll });
  const { data: cultures = [] } = useQuery({ queryKey: ['cultures'], queryFn: culturesService.getAll });

  const filters = {
    crop_id: cropFilter || undefined,
    producer_id: producerFilter || undefined,
    warehouse_id: warehouseFilter || undefined,
    culture_id: cultureFilter || undefined,
  };

  const { data = [], isLoading } = useQuery({
    queryKey: ['harvest-grain-transfers', filters],
    queryFn: () => harvestGrainTransfersService.list(filters),
  });

  const remove = useMutation({
    mutationFn: (id: string) => harvestGrainTransfersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvest-grain-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-transfer-balance'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-consolidated-report'] });
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success('Transferência excluída!');
    } catch {
      toast.error('Erro ao excluir transferência.');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'transfer_date', label: 'Data', render: (i: HarvestGrainTransfer) => formatDateBR(i.transfer_date) },
    { key: 'crop_name', label: 'Safra', render: (i: HarvestGrainTransfer) => i.crop_name || '-' },
    { key: 'producer_name', label: 'Produtor', render: (i: HarvestGrainTransfer) => i.producer_name || '-' },
    { key: 'owner_name', label: 'Proprietário', render: (i: HarvestGrainTransfer) => i.owner_name || '-' },
    { key: 'warehouse_name', label: 'Armazém', render: (i: HarvestGrainTransfer) => i.warehouse_name || '-' },
    { key: 'culture_name', label: 'Cultura', render: (i: HarvestGrainTransfer) => i.culture_name || '-' },
    { key: 'quantity_kg', label: 'Quantidade (kg)', render: (i: HarvestGrainTransfer) => formatWeight(i.quantity_kg) },
    { key: 'quantity_bags', label: 'Sacas', render: (i: HarvestGrainTransfer) => formatNullableNumber(i.quantity_bags) },
    { key: 'observation', label: 'Observação', render: (i: HarvestGrainTransfer) => i.observation || '-' },
    { key: 'status', label: 'Status', render: (i: HarvestGrainTransfer) => (i.status === 'I' ? 'Inativo' : 'Ativo') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transferências de Grãos</h1>
          <p className="mt-1 text-muted-foreground">
            Transferências de grãos da colheita para proprietários com pagamento por transferência.
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Safra</Label>
          <Combobox
            options={[{ value: '', label: 'Todas' }, ...crops.map((c) => ({ value: String(c.id), label: c.name }))]}
            value={cropFilter}
            onValueChange={setCropFilter}
            placeholder="Todas as safras"
            searchPlaceholder="Buscar safra..."
          />
        </div>
        <div className="space-y-2">
          <Label>Produtor</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...producers.map((p) => ({ value: String(p.id), label: p.owner_name || String(p.id) }))]}
            value={producerFilter}
            onValueChange={setProducerFilter}
            placeholder="Todos os produtores"
            searchPlaceholder="Buscar produtor..."
          />
        </div>
        <div className="space-y-2">
          <Label>Armazém</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))]}
            value={warehouseFilter}
            onValueChange={setWarehouseFilter}
            placeholder="Todos os armazéns"
            searchPlaceholder="Buscar armazém..."
          />
        </div>
        <div className="space-y-2">
          <Label>Cultura</Label>
          <Combobox
            options={[{ value: '', label: 'Todas' }, ...cultures.map((c) => ({ value: String(c.id), label: c.name }))]}
            value={cultureFilter}
            onValueChange={setCultureFilter}
            placeholder="Todas as culturas"
            searchPlaceholder="Buscar cultura..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchKeys={['crop_name', 'producer_name', 'owner_name', 'warehouse_name', 'culture_name']}
          searchPlaceholder="Buscar transferência..."
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeleteId(item.id)}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditItem(null); } }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar' : 'Nova'} Transferência de Grãos</DialogTitle>
          </DialogHeader>
          <GrainTransferForm
            item={editItem}
            onSave={() => { setShowForm(false); setEditItem(null); }}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
