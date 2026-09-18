import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FleetMaintenanceRecord, fleetMaintenanceRecordsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions, useMaintenancePlanOptions, meterLabels } from '../../fuel/useFuelOptions';

export default function FleetMaintenanceRecordsList() {
  const { data, isLoading } = useCrud<FleetMaintenanceRecord>('fleet-maintenance-records', fleetMaintenanceRecordsService);
  const { fleetOptions, markingTypeOf } = useFuelOptions();
  const { plansByFleet } = useMaintenancePlanOptions();

  return (
    <CrudResourcePage<FleetMaintenanceRecord>
      title="Manutenções"
      description="Registros de manutenção realizados e previsão da próxima"
      singular="Manutenção"
      queryKey="fleet-maintenance-records"
      relatedQueryKeys={['fleet-maintenance-plans']}
      service={fleetMaintenanceRecordsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['fleet_name', 'description']}
      numericFields={['meter_reading']}
      confirmOnSave
      defaultValues={{ fleet_id: '', maintenance_plan_id: '', maintenance_date: '', meter_reading: '', description: '', observation: '' }}
      columns={[
        { key: 'maintenance_date', label: 'Data', render: (i) => formatDate(i.maintenance_date) },
        { key: 'fleet_name', label: 'Frota' },
        { key: 'maintenance_plan_name', label: 'Plano' },
        { key: 'meter_reading', label: 'Leitura' },
        { key: 'next_maintenance', label: 'Próxima' },
        { key: 'remaining', label: 'Faltam' },
        { key: 'description', label: 'Descrição' },
      ]}
      fields={[
        { name: 'fleet_id', label: 'Frota', type: 'combobox', required: true, options: fleetOptions },
        { name: 'maintenance_plan_id', label: 'Plano de manutenção', type: 'combobox', required: true, options: (v) => plansByFleet(v.fleet_id) },
        { name: 'maintenance_date', label: 'Data', type: 'date', required: true },
        { name: 'meter_reading', label: (v) => meterLabels(markingTypeOf(v.fleet_id)).current, type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.meter_reading) < 0 ? 'Informe uma leitura válida' : undefined) },
        { name: 'description', label: 'Descrição', type: 'text', required: true, fullWidth: true },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
