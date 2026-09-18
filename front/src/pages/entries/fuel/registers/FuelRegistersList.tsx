import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { FuelRegister, fuelRegistersService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

export default function FuelRegistersList() {
  const { data, isLoading } = useCrud<FuelRegister>('fuel-registers', fuelRegistersService);
  const { stationOptions, productsByStation } = useFuelOptions();

  return (
    <CrudResourcePage<FuelRegister>
      title="Registradoras"
      description="Registradoras vinculadas ao posto e ao produto"
      singular="Registradora"
      queryKey="fuel-registers"
      service={fuelRegistersService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'station_name', 'product_name']}
      defaultValues={{ station_id: '', product_id: '', name: '', status: 'A', observation: '' }}
      columns={[
        { key: 'name', label: 'Identificação' },
        { key: 'station_name', label: 'Posto' },
        { key: 'product_name', label: 'Produto' },
        { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
        { key: 'observation', label: 'Observação' },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: (v) => productsByStation(v.station_id) },
        { name: 'name', label: 'Identificação', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'A', label: 'Ativo' }, { value: 'I', label: 'Inativo' },
        ] },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
