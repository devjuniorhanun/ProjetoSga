import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { FleetMaintenancePlan, fleetMaintenancePlansService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../../fuel/useFuelOptions';

export default function FleetMaintenancePlansList() {
  const { data, isLoading } = useCrud<FleetMaintenancePlan>('fleet-maintenance-plans', fleetMaintenancePlansService);
  const { fleetOptions, markingTypeOf } = useFuelOptions();

  return (
    <CrudResourcePage<FleetMaintenancePlan>
      title="Planos de Manutenção"
      description="Intervalos de manutenção preventiva por frota"
      singular="Plano"
      queryKey="fleet-maintenance-plans"
      service={fleetMaintenancePlansService}
      data={data}
      isLoading={isLoading}
      searchKeys={['fleet_name', 'description']}
      numericFields={['interval']}
      defaultValues={{ fleet_id: '', marking_type: 'H', interval: '', description: '', status: 'A' }}
      columns={[
        { key: 'fleet_name', label: 'Frota' },
        { key: 'description', label: 'Descrição' },
        { key: 'marking_type', label: 'Marcação', render: (i) => (i.marking_type === 'H' ? 'Horímetro' : 'Quilômetro') },
        { key: 'interval', label: 'Intervalo' },
        { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
      ]}
      fields={[
        { name: 'fleet_id', label: 'Frota', type: 'combobox', required: true, options: fleetOptions },
        { name: 'marking_type', label: 'Tipo de marcação', type: 'select', required: true,
          compute: (v) => markingTypeOf(v.fleet_id) || v.marking_type || 'H',
          options: [{ value: 'H', label: 'Horímetro' }, { value: 'K', label: 'Quilômetro' }] },
        { name: 'interval', label: 'Intervalo (horas ou km)', type: 'number', step: '1', required: true,
          validate: (v) => (Number(v.interval) <= 0 ? 'O intervalo deve ser maior que zero' : undefined) },
        { name: 'description', label: 'Descrição', type: 'text', required: true, fullWidth: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'A', label: 'Ativo' }, { value: 'I', label: 'Inativo' },
        ] },
      ]}
    />
  );
}
