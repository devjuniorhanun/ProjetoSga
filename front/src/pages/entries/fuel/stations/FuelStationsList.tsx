import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { FuelStation, fuelStationsService } from '@/lib/api-services-fuel-phase6';

const TYPE_LABELS: Record<string, string> = { F: 'Físico', M: 'Móvel' };

export default function FuelStationsList() {
  const { data, isLoading } = useCrud<FuelStation>('fuel-stations', fuelStationsService);

  return (
    <CrudResourcePage<FuelStation>
      title="Postos"
      description="Gerencie os postos físicos e móveis de combustíveis e lubrificantes"
      singular="Posto"
      queryKey="fuel-stations"
      service={fuelStationsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name']}
      defaultValues={{ name: '', type: 'F', status: 'A', observation: '' }}
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'type', label: 'Tipo', render: (i) => <Badge variant="secondary">{TYPE_LABELS[i.type] ?? i.type}</Badge> },
        { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
        { key: 'observation', label: 'Observação' },
      ]}
      fields={[
        { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Ex: Posto Sede' },
        { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
          { value: 'F', label: 'Físico' },
          { value: 'M', label: 'Móvel' },
        ] },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'A', label: 'Ativo' },
          { value: 'I', label: 'Inativo' },
        ] },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
