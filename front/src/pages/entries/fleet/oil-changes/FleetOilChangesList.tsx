import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FleetOilChange, fleetOilChangesService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions, meterLabels } from '../../fuel/useFuelOptions';

export default function FleetOilChangesList() {
  const { data, isLoading } = useCrud<FleetOilChange>('fleet-oil-changes', fleetOilChangesService);
  const { fleetOptions, productOptions, markingTypeOf } = useFuelOptions();

  return (
    <CrudResourcePage<FleetOilChange>
      title="Troca de Óleo"
      description="Trocas de óleo e lubrificantes por frota"
      singular="Troca de Óleo"
      queryKey="fleet-oil-changes"
      relatedQueryKeys={['fuel-stock', 'fuel-stock-movements']}
      service={fleetOilChangesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['fleet_name', 'product_name']}
      numericFields={['meter_reading', 'quantity']}
      confirmOnSave
      defaultValues={{ fleet_id: '', product_id: '', change_date: '', meter_reading: '', quantity: '', observation: '' }}
      columns={[
        { key: 'change_date', label: 'Data', render: (i) => formatDate(i.change_date) },
        { key: 'fleet_name', label: 'Frota' },
        { key: 'product_name', label: 'Lubrificante' },
        { key: 'meter_reading', label: 'Leitura' },
        { key: 'quantity', label: 'Quantidade' },
      ]}
      fields={[
        { name: 'fleet_id', label: 'Frota', type: 'combobox', required: true, options: fleetOptions },
        { name: 'product_id', label: 'Lubrificante', type: 'combobox', required: true, options: productOptions },
        { name: 'change_date', label: 'Data', type: 'date', required: true },
        { name: 'meter_reading', label: (v) => meterLabels(markingTypeOf(v.fleet_id)).current, type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.meter_reading) < 0 ? 'Informe uma leitura válida' : undefined) },
        { name: 'quantity', label: 'Quantidade', type: 'number', step: '0.0001', required: true,
          validate: (v) => (Number(v.quantity) <= 0 ? 'A quantidade deve ser maior que zero' : undefined) },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
