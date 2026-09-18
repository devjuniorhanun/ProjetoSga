import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FuelRegisterReading, fuelRegisterReadingsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

export default function FuelRegisterReadingsList() {
  const { data, isLoading } = useCrud<FuelRegisterReading>('fuel-register-readings', fuelRegisterReadingsService);
  const { stationOptions, productsByStation, registersBy } = useFuelOptions();

  return (
    <CrudResourcePage<FuelRegisterReading>
      title="Leituras da Registradora"
      description="Registre as leituras das registradoras; a quantidade é calculada automaticamente"
      singular="Leitura"
      queryKey="fuel-register-readings"
      relatedQueryKeys={['fuel-reconciliation', 'fuel-consumption']}
      service={fuelRegisterReadingsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['station_name', 'product_name', 'register_name']}
      numericFields={['initial_reading', 'final_reading', 'quantity']}
      defaultValues={{ station_id: '', product_id: '', register_id: '', reading_date: '', initial_reading: '0', final_reading: '0', quantity: '0', observation: '' }}
      columns={[
        { key: 'reading_date', label: 'Data', render: (i) => formatDate(i.reading_date) },
        { key: 'station_name', label: 'Posto' },
        { key: 'product_name', label: 'Produto' },
        { key: 'register_name', label: 'Registradora' },
        { key: 'initial_reading', label: 'Leitura inicial' },
        { key: 'final_reading', label: 'Leitura final' },
        { key: 'quantity', label: 'Quantidade' },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: (v) => productsByStation(v.station_id) },
        { name: 'register_id', label: 'Registradora', type: 'combobox', required: true, options: (v) => registersBy(v.station_id, v.product_id) },
        { name: 'reading_date', label: 'Data', type: 'date', required: true },
        { name: 'initial_reading', label: 'Leitura inicial', type: 'number', step: '0.01', required: true },
        { name: 'final_reading', label: 'Leitura final', type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.final_reading) < Number(v.initial_reading) ? 'A leitura final não pode ser menor que a inicial' : undefined) },
        { name: 'quantity', label: 'Quantidade', type: 'number',
          compute: (v) => String(Math.max(Number(v.final_reading || 0) - Number(v.initial_reading || 0), 0)) },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
