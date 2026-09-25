import { useQuery } from '@tanstack/react-query';
import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import {
  FuelTankGaugeReading,
  fuelGaugeReadingsService,
  fuelGaugeTablesService,
} from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';
import { interpolateLiters } from '@/lib/fuel-rules';

export default function FuelGaugeReadingsList() {
  const { data, isLoading } = useCrud<FuelTankGaugeReading>('fuel-gauge-readings', fuelGaugeReadingsService);
  const { stationOptions, tanksByStation } = useFuelOptions();
  const { data: gaugeRows = [] } = useQuery({ queryKey: ['fuel-gauge-tables', 'active-options'], queryFn: () => fuelGaugeTablesService.getAll({ status: 'A' }) });

  /** Converte centímetros em litros pela régua do tanque, interpolando entre os pontos cadastrados. */
  const litersFor = (tankId: string, centimeters: string): string => {
    if (!tankId) return '';
    const rows = gaugeRows.filter((r) => String(r.tank_id) === String(tankId));
    const liters = interpolateLiters(rows, centimeters);
    return liters === null ? '' : String(Number(liters.toFixed(3)));
  };

  return (
    <CrudResourcePage<FuelTankGaugeReading>
      title="Leituras da Régua"
      description="Conferência física do tanque; os litros vêm da régua por interpolação e não alteram o estoque contábil"
      singular="Leitura da Régua"
      queryKey="fuel-gauge-readings"
      relatedQueryKeys={['fuel-reconciliation']}
      service={fuelGaugeReadingsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['station_name', 'tank_name']}
      numericFields={['centimeters', 'liters']}
      defaultValues={{ station_id: '', tank_id: '', reading_date: '', centimeters: '', liters: '', observation: '' }}
      columns={[
        { key: 'reading_date', label: 'Data', render: (i) => formatDate(i.reading_date) },
        { key: 'station_name', label: 'Posto' },
        { key: 'tank_name', label: 'Tanque' },
        { key: 'centimeters', label: 'Centímetros' },
        { key: 'liters', label: 'Litros' },
        { key: 'observation', label: 'Observação' },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'tank_id', label: 'Tanque', type: 'combobox', required: true, options: (v) => tanksByStation(v.station_id) },
        { name: 'reading_date', label: 'Data', type: 'date', required: true },
        { name: 'centimeters', label: 'Centímetros', type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.centimeters) <= 0 ? 'Informe um valor maior que zero' : undefined) },
        { name: 'liters', label: 'Litros calculados', type: 'number',
          compute: (v) => litersFor(v.tank_id, v.centimeters),
          validate: (v) => (v.liters === '' ? 'Centímetros fora da faixa da régua cadastrada deste tanque' : undefined) },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
      confirmOnSave
    />
  );
}
