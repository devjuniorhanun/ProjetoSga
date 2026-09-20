import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { HarvestRelease, harvestReleasesService } from '@/lib/api-services-harvest';
import { cropsService, driversService, suppliersService } from '@/lib/api-services';
import { formatDate } from '@/lib/utils';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatBags, formatPercent, formatWeightKg } from '@/lib/harvest-rules';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HarvestReleaseForm } from './HarvestReleaseForm';

export default function HarvestReleasesList() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<HarvestRelease | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cropFilter, setCropFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: driversService.getAll });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });

  const filters = { crop_id: cropFilter, driver_id: driverFilter, supplier_id: supplierFilter };
  const { data = [], isLoading } = useQuery({
    queryKey: ['harvest-releases', filters],
    queryFn: () => harvestReleasesService.list(filters),
  });

  const remove = useMutation({
    mutationFn: (id: string) => harvestReleasesService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['harvest-releases'] }),
  });

  const cropMap = useMemo(() => new Map(crops.map((c) => [String(c.id), c.name])), [crops]);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [String(d.id), d.name])), [drivers]);
  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [String(s.id), s.supplier_name || s.corporate_reason || s.fantasy_name])),
    [suppliers],
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success('Registro excluído!');
    } catch {
      toast.error('Erro ao excluir registro.');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'crop_name', label: 'Safra', render: (i: HarvestRelease) => i.crop_name || cropMap.get(String(i.crop_id)) || '' },
    { key: 'release_date', label: 'Data', render: (i: HarvestRelease) => formatDate(i.release_date) },
    { key: 'driver_name', label: 'Motorista', render: (i: HarvestRelease) => i.driver_name || driverMap.get(String(i.driver_id)) || '' },
    { key: 'driver_supplier_name', label: 'Fornecedor do Motorista', render: (i: HarvestRelease) => i.driver_supplier_name || '' },
    { key: 'owner_name', label: 'Produtor', render: (i: HarvestRelease) => i.owner_name || '' },
    { key: 'state_registration', label: 'Inscrição Estadual', render: (i: HarvestRelease) => i.state_registration || '-' },
    { key: 'plot_field_name', label: 'Talhão', render: (i: HarvestRelease) => i.plot_field_name || i.plot_name || i.field_name || '' },
    { key: 'warehouse_name', label: 'Armazém', render: (i: HarvestRelease) => i.warehouse_name || '' },
    { key: 'lanyard_name', label: 'Colhedor', render: (i: HarvestRelease) => i.lanyard_name || i.lanyard_supplier_name || '' },
    { key: 'shipping_number', label: 'Nº Romaneio' },
    { key: 'control_number', label: 'Nº Controle' },
    { key: 'gross_weight', label: 'Peso Bruto', render: (i: HarvestRelease) => formatWeightKg(i.gross_weight) },
    { key: 'discount', label: 'Desconto %', render: (i: HarvestRelease) => formatPercent(i.discount) },
    { key: 'discount_weight', label: 'Peso Desconto', render: (i: HarvestRelease) => formatWeightKg(i.discount_weight) },
    { key: 'net_weight', label: 'Peso Líquido', render: (i: HarvestRelease) => formatWeightKg(i.net_weight) },
    { key: 'gross_bags', label: 'Sacas Brutas', render: (i: HarvestRelease) => formatBags(i.gross_bags, 2) },
    { key: 'liquid_bags', label: 'Sacas Líquidas', render: (i: HarvestRelease) => formatBags(i.liquid_bags, 3) },
    { key: 'matrix_freight_price', label: 'Preço do Percurso', render: (i: HarvestRelease) => (i.matrix_freight_price != null ? formatCurrencyBRL(i.matrix_freight_price) : '-') },
    { key: 'shipping_value', label: 'Valor do Frete', render: (i: HarvestRelease) => formatCurrencyBRL(i.shipping_value) },
    { key: 'shipping_paid_value', label: 'Valor Pago', render: (i: HarvestRelease) => formatCurrencyBRL(i.shipping_paid_value ?? 0) },
    {
      key: 'balance',
      label: 'Saldo do Frete',
      render: (i: HarvestRelease) => formatCurrencyBRL((i.shipping_value ?? 0) - (i.shipping_paid_value ?? 0)),
    },
    { key: 'status', label: 'Status', render: (i: HarvestRelease) => (i.status === 'I' ? 'Inativo' : 'Ativo') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colheitas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os lançamentos de colheitas</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Safra</Label>
          <Combobox
            options={[{ value: '', label: 'Todas' }, ...crops.map((c) => ({ value: c.id, label: c.name }))]}
            value={cropFilter}
            onValueChange={setCropFilter}
            placeholder="Todas as safras"
            searchPlaceholder="Buscar safra..."
          />
        </div>
        <div className="space-y-2">
          <Label>Motorista</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...drivers.map((d) => ({ value: d.id, label: d.name }))]}
            value={driverFilter}
            onValueChange={setDriverFilter}
            placeholder="Todos os motoristas"
            searchPlaceholder="Buscar motorista..."
          />
        </div>
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Combobox
            options={[
              { value: '', label: 'Todos' },
              ...suppliers.map((s) => ({ value: s.id, label: s.supplier_name || s.corporate_reason || s.fantasy_name })),
            ]}
            value={supplierFilter}
            onValueChange={setSupplierFilter}
            placeholder="Todos os fornecedores"
            searchPlaceholder="Buscar fornecedor..."
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
          searchKeys={['crop_name', 'driver_name', 'owner_name', 'state_registration', 'shipping_number', 'control_number']}
          searchPlaceholder="Buscar colheita..."
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditItem(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar' : 'Nova'} Colheita</DialogTitle>
          </DialogHeader>
          <HarvestReleaseForm
            item={editItem}
            onSave={(keepOpen) => { if (!keepOpen) { setShowForm(false); setEditItem(null); } }}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
