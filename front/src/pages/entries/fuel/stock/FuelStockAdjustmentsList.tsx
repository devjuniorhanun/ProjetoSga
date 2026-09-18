import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FuelStockAdjustment, fuelStockAdjustmentsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

export default function FuelStockAdjustmentsList() {
  const { data, isLoading } = useCrud<FuelStockAdjustment>('fuel-stock-adjustments', fuelStockAdjustmentsService);
  const { stationOptions, tanksByStation, productsByStation } = useFuelOptions();

  return (
    <CrudResourcePage<FuelStockAdjustment>
      title="Ajustes de Estoque"
      description="Ajustes manuais de estoque por posto, tanque e produto"
      singular="Ajuste"
      queryKey="fuel-stock-adjustments"
      relatedQueryKeys={['fuel-stock', 'fuel-stock-movements', 'fuel-reconciliation']}
      service={fuelStockAdjustmentsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['station_name', 'product_name', 'responsible', 'reason']}
      numericFields={['quantity']}
      confirmOnSave
      defaultValues={{ station_id: '', tank_id: '', product_id: '', quantity: '', direction: 'I', reason: '', responsible: '', adjustment_date: '', observation: '' }}
      columns={[
        { key: 'adjustment_date', label: 'Data', render: (i) => formatDate(i.adjustment_date) },
        { key: 'station_name', label: 'Posto' },
        { key: 'tank_name', label: 'Tanque' },
        { key: 'product_name', label: 'Produto' },
        { key: 'direction', label: 'Sentido', render: (i) => (i.direction === 'I' ? 'Entrada' : 'Saída') },
        { key: 'quantity', label: 'Quantidade' },
        { key: 'reason', label: 'Motivo' },
        { key: 'responsible', label: 'Responsável' },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'tank_id', label: 'Tanque', type: 'combobox', options: (v) => tanksByStation(v.station_id) },
        { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: (v) => productsByStation(v.station_id) },
        { name: 'adjustment_date', label: 'Data', type: 'date', required: true },
        { name: 'direction', label: 'Sentido', type: 'select', required: true, options: [
          { value: 'I', label: 'Entrada' }, { value: 'O', label: 'Saída' },
        ] },
        { name: 'quantity', label: 'Quantidade', type: 'number', step: '0.0001', required: true,
          validate: (v) => (Number(v.quantity) <= 0 ? 'A quantidade deve ser maior que zero' : undefined) },
        { name: 'reason', label: 'Motivo', type: 'text', required: true },
        { name: 'responsible', label: 'Responsável', type: 'text', required: true },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
