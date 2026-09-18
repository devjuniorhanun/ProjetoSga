import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { stockLocationsService, type StockLocation } from '@/lib/api-services-inventory';
import { farmsService } from '@/lib/api-services';
import { grainWarehousesService } from '@/lib/api-services-grain';

export default function StockLocationsList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['stock-locations'],
    queryFn: () => stockLocationsService.getAll({ per_page: 25 }),
  });

  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: () => farmsService.getAll() });
  const { data: warehouses = [] } = useQuery({
    queryKey: ['grain-warehouses', 'active'],
    queryFn: () => grainWarehousesService.getAll({ status: 'A', per_page: 100 }),
  });

  const fields: CrudField[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'code', label: 'Código', type: 'text', required: true },
    { name: 'location_type', label: 'Tipo de local', type: 'text', required: true },
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
      name: 'grain_warehouse_id',
      label: 'Armazém (opcional)',
      type: 'combobox',
      options: (values) =>
        warehouses
          .filter((w) => w.status === 'A' || String(w.id) === values.grain_warehouse_id)
          .map((w) => ({ value: w.id, label: w.name })),
    },
    { name: 'maximum_capacity', label: 'Capacidade máxima', type: 'number', step: '0.001' },
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
      searchKeys={['name', 'code', 'location_type']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code,
        location_type: values.location_type,
        farm_id: values.farm_id || null,
        grain_warehouse_id: values.grain_warehouse_id || null,
        maximum_capacity: values.maximum_capacity
          ? Number(String(values.maximum_capacity).replace(',', '.'))
          : null,
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'location_type', label: 'Tipo' },
        { key: 'farm_name', label: 'Fazenda', render: (item) => item.farm_name ?? '-' },
        {
          key: 'maximum_capacity',
          label: 'Capacidade',
          render: (item) =>
            item.maximum_capacity != null
              ? item.maximum_capacity.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
              : '-',
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
