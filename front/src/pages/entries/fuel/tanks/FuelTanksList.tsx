import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { FuelTank, fuelTanksService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

export default function FuelTanksList() {
  const { data, isLoading } = useCrud<FuelTank>('fuel-tanks', fuelTanksService);
  const { stationOptions } = useFuelOptions();

  return (
    <CrudResourcePage<FuelTank>
      title="Tanques"
      description="Gerencie os tanques vinculados a cada posto"
      singular="Tanque"
      queryKey="fuel-tanks"
      service={fuelTanksService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'station_name']}
      numericFields={['capacity']}
      defaultValues={{ station_id: '', name: '', capacity: '', status: 'A', observation: '' }}
      columns={[
        { key: 'station_name', label: 'Posto' },
        { key: 'name', label: 'Tanque' },
        { key: 'capacity', label: 'Capacidade' },
        { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
        { key: 'observation', label: 'Observação' },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'name', label: 'Identificação', type: 'text', required: true },
        { name: 'capacity', label: 'Capacidade (L)', type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.capacity) <= 0 ? 'A capacidade deve ser maior que zero' : undefined) },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'A', label: 'Ativo' }, { value: 'I', label: 'Inativo' },
        ] },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
