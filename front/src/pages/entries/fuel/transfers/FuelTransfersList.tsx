import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { applyApiErrors } from '@/lib/form-errors';
import { FuelTransfer, fuelTransfersService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';
import { canConfirmTransfer, transferInitialStatus } from '@/lib/fuel-rules';

const STATUS: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  D: { label: 'Rascunho', variant: 'secondary' },
  C: { label: 'Confirmada', variant: 'default' },
  X: { label: 'Cancelada', variant: 'destructive' },
};

export default function FuelTransfersList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useCrud<FuelTransfer>('fuel-transfers', fuelTransfersService);
  const { stationOptions, tanksByStation, productsByStation } = useFuelOptions();
  const [action, setAction] = useState<{ id: string; type: 'confirm' } | null>(null);

  const confirmMutation = useMutation({
    mutationFn: (id: string) => fuelTransfersService.confirm(id),
    onSuccess: () => {
      toast.success('Transferência confirmada: saída na origem e entrada no destino registradas.');
      ['fuel-transfers', 'fuel-stock-movements', 'fuel-station-products', 'fuel-reconciliation'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }));
    },
    onError: (error: unknown) => {
      applyApiErrors(error, undefined, {
        fallbackMessage: 'Nada foi movimentado: não foi possível confirmar a transferência.',
      });
    },
    onSettled: () => setAction(null),
  });

  const runAction = async () => {
    if (!action) return;
    await confirmMutation.mutateAsync(action.id).catch(() => undefined);
  };

  return (
    <>
      <CrudResourcePage<FuelTransfer>
        title="Transferências"
        description="Transferências de produtos entre postos e tanques"
        singular="Transferência"
        queryKey="fuel-transfers"
        relatedQueryKeys={['fuel-stock-movements']}
        service={fuelTransfersService}
        data={data}
        isLoading={isLoading}
        searchKeys={['origin_station_name', 'destination_station_name', 'product_name', 'responsible']}
        numericFields={['quantity']}
        confirmOnSave
        defaultValues={{
          origin_station_id: '', origin_tank_id: '', destination_station_id: '', destination_tank_id: '',
          product_id: '', quantity: '', transfer_date: '', responsible: '', document: '', observation: '', status: transferInitialStatus(),
        }}
        columns={[
          { key: 'transfer_date', label: 'Data', render: (i) => formatDate(i.transfer_date) },
          { key: 'origin_station_name', label: 'Origem' },
          { key: 'destination_station_name', label: 'Destino' },
          { key: 'product_name', label: 'Produto' },
          { key: 'quantity', label: 'Quantidade' },
          { key: 'responsible', label: 'Responsável' },
          { key: 'status', label: 'Status', render: (i) => (
            <Badge variant={STATUS[i.status]?.variant ?? 'secondary'}>{STATUS[i.status]?.label ?? i.status}</Badge>
          ) },
        ]}
        fields={[
          { name: 'origin_station_id', label: 'Posto de origem', type: 'combobox', required: true, options: stationOptions },
          { name: 'origin_tank_id', label: 'Tanque de origem', type: 'combobox', options: (v) => tanksByStation(v.origin_station_id) },
          { name: 'destination_station_id', label: 'Posto de destino', type: 'combobox', required: true, options: stationOptions,
            validate: (v) => (v.destination_station_id === v.origin_station_id && v.destination_tank_id === v.origin_tank_id
              ? 'Origem e destino não podem ser iguais' : undefined) },
          { name: 'destination_tank_id', label: 'Tanque de destino', type: 'combobox', options: (v) => tanksByStation(v.destination_station_id) },
          { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: (v) => productsByStation(v.origin_station_id) },
          { name: 'quantity', label: 'Quantidade', type: 'number', step: '0.0001', required: true,
            validate: (v) => (Number(v.quantity) <= 0 ? 'A quantidade deve ser maior que zero' : undefined) },
          { name: 'transfer_date', label: 'Data', type: 'date', required: true },
          { name: 'responsible', label: 'Responsável', type: 'text', required: true },
          { name: 'document', label: 'Documento', type: 'text' },
          { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
        ]}
        extraActions={(item) => (
          canConfirmTransfer(item.status) ? (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Confirmar" disabled={confirmMutation.isPending} onClick={() => setAction({ id: item.id, type: 'confirm' })}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </>
          ) : null
        )}
      />

      <ConfirmDialog
        open={!!action}
        onOpenChange={() => setAction(null)}
        title="Confirmar transferência"
        description="A transferência está pendente. Ao confirmar, a saída na origem e a entrada no destino são gravadas juntas, em uma única operação. Enquanto não confirmar, nenhum estoque muda."
        confirmLabel="Confirmar"
        onConfirm={runAction}
      />
    </>
  );
}
