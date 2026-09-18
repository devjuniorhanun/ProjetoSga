import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FuelRefueling, fuelRefuelingsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions, meterLabels } from '../useFuelOptions';

export default function FuelRefuelingsList() {
  const { data, isLoading } = useCrud<FuelRefueling>('fuel-refuelings', fuelRefuelingsService);
  const { stationOptions, productsByStation, registersBy, fleetOptions, operatorOptions, markingTypeOf } = useFuelOptions();

  return (
    <CrudResourcePage<FuelRefueling>
      title="Abastecimentos"
      description="Abastecimentos das frotas nos postos"
      singular="Abastecimento"
      queryKey="fuel-refuelings"
      relatedQueryKeys={['fuel-stock', 'fuel-stock-movements', 'fuel-consumption']}
      service={fuelRefuelingsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['station_name', 'product_name', 'fleet_name', 'operator_name']}
      numericFields={['quantity', 'value', 'meter_reading']}
      confirmOnSave
      defaultValues={{ station_id: '', product_id: '', fleet_id: '', operator_id: '', register_id: '', refueling_date: '', quantity: '', value: '', meter_reading: '', observation: '' }}
      columns={[
        { key: 'refueling_date', label: 'Data/Hora', render: (i) => formatDate(i.refueling_date) },
        { key: 'station_name', label: 'Posto' },
        { key: 'product_name', label: 'Produto' },
        { key: 'fleet_name', label: 'Frota' },
        { key: 'operator_name', label: 'Operador' },
        { key: 'quantity', label: 'Quantidade' },
        { key: 'value', label: 'Valor' },
        { key: 'meter_reading', label: 'Leitura' },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: (v) => productsByStation(v.station_id) },
        { name: 'register_id', label: 'Registradora', type: 'combobox', options: (v) => registersBy(v.station_id, v.product_id) },
        { name: 'fleet_id', label: 'Frota', type: 'combobox', required: true, options: fleetOptions },
        { name: 'operator_id', label: 'Operador', type: 'combobox', required: true, options: operatorOptions },
        { name: 'refueling_date', label: 'Data e hora', type: 'datetime-local', required: true },
        { name: 'quantity', label: 'Quantidade (L)', type: 'number', step: '0.0001', required: true,
          validate: (v) => (Number(v.quantity) <= 0 ? 'A quantidade deve ser maior que zero' : undefined) },
        { name: 'value', label: 'Valor total', type: 'number', step: '0.01', required: true },
        { name: 'meter_reading', label: (v) => meterLabels(markingTypeOf(v.fleet_id)).current, type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.meter_reading) < 0 ? 'Informe uma leitura válida' : undefined) },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
