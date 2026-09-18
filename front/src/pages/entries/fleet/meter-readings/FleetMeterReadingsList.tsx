import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FleetMeterReading, fleetMeterReadingsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions, meterLabels } from '../../fuel/useFuelOptions';

export default function FleetMeterReadingsList() {
  const { data, isLoading } = useCrud<FleetMeterReading>('fleet-meter-readings', fleetMeterReadingsService);
  const { fleetOptions, markingTypeOf } = useFuelOptions();

  return (
    <CrudResourcePage<FleetMeterReading>
      title="Leituras de Frota"
      description="Horímetro ou quilometragem das frotas, conforme o tipo de marcação"
      singular="Leitura"
      queryKey="fleet-meter-readings"
      relatedQueryKeys={['fuel-consumption']}
      service={fleetMeterReadingsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['fleet_name']}
      numericFields={['initial_reading', 'final_reading', 'total']}
      defaultValues={{ fleet_id: '', reading_date: '', initial_reading: '0', final_reading: '0', total: '0', observation: '' }}
      columns={[
        { key: 'reading_date', label: 'Data', render: (i) => formatDate(i.reading_date) },
        { key: 'fleet_name', label: 'Frota' },
        { key: 'marking_type', label: 'Marcação', render: (i) => (i.marking_type === 'H' ? 'Horímetro' : 'Quilômetro') },
        { key: 'initial_reading', label: 'Leitura inicial' },
        { key: 'final_reading', label: 'Leitura final' },
        { key: 'total', label: 'Total' },
      ]}
      fields={[
        { name: 'fleet_id', label: 'Frota', type: 'combobox', required: true, options: fleetOptions },
        { name: 'reading_date', label: 'Data', type: 'date', required: true },
        { name: 'initial_reading', label: (v) => meterLabels(markingTypeOf(v.fleet_id)).initial, type: 'number', step: '0.01', required: true },
        { name: 'final_reading', label: (v) => meterLabels(markingTypeOf(v.fleet_id)).final, type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.final_reading) < Number(v.initial_reading) ? 'A leitura final não pode ser menor que a inicial' : undefined) },
        { name: 'total', label: (v) => meterLabels(markingTypeOf(v.fleet_id)).total, type: 'number',
          compute: (v) => String(Math.max(Number(v.final_reading || 0) - Number(v.initial_reading || 0), 0)) },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
