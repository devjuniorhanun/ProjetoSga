import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { stockLocationsService, type StockLocation } from '@/lib/api-services-inventory';
import { farmsService } from '@/lib/api-services';

const LOCATION_TYPE_LABELS: Record<string, string> = {
  FUEL_STATION: 'Posto de combustível',
  HEADQUARTERS: 'Sede',
  WAREHOUSE: 'Armazém',
  DEPOT: 'Depósito físico',
  PLOT_FIELD: 'Talhão',
  OTHER: 'Outro',
};

export default function StockLocationsList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['stock-locations'],
    queryFn: () => stockLocationsService.getAll({ per_page: 25 }),
  });

  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: () => farmsService.getAll() });
  const fields: CrudField[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    {
      name: 'location_type',
      label: 'Tipo de local',
      type: 'select',
      required: true,
      options: Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'farm_id',
      label: 'Fazenda (opcional)',
      type: 'combobox',
      options: (values) =>
        farms
          .filter((f) => f.status === 'A' || String(f.id) === values.farm_id)
          .map((f) => ({ value: f.id, label: f.name })),
    },
    {
      name: 'status',
      label: 'Situação',
      type: 'select',
      required: true,
      options: [
        { value: 'A', label: 'Ativo' },
        { value: 'I', label: 'Inativo' },
      ],
    },
    { name: 'notes', label: 'Observações', type: 'textarea', fullWidth: true },
  ];

  return (
    <CrudResourcePage<StockLocation>
      title="Locais de Estoque"
      description="Depósitos, pátios e pontos de guarda de produtos"
      singular="Local de estoque"
      queryKey="stock-locations"
      service={stockLocationsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'location_type']}
      defaultValues={{ status: 'A', location_type: 'DEPOT' }}
      buildPayload={(values) => ({
        name: values.name,
        location_type: values.location_type,
        farm_id: values.farm_id || null,
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'name', label: 'Nome' },
        {
          key: 'location_type',
          label: 'Tipo',
          render: (item) => LOCATION_TYPE_LABELS[item.location_type] ?? item.location_type,
        },
        { key: 'farm_name', label: 'Fazenda', render: (item) => item.farm_name ?? '-' },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
