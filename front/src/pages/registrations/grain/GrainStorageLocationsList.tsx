import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainStorageLocationsService, grainWarehousesService } from '@/lib/api-services-grain';
import { STORAGE_TYPE_LABELS } from '@/lib/grain-labels';
import { formatWeightKg } from '@/lib/grain-format';
import type { GrainStorageLocation } from '@/types/grain';

export default function GrainStorageLocationsList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-storage-locations'],
    queryFn: () => grainStorageLocationsService.getAll({ per_page: 25 }),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['grain-warehouses', 'active'],
    queryFn: () => grainWarehousesService.getAll({ status: 'A', per_page: 100 }),
  });

  const fields: CrudField[] = [
    {
      name: 'grain_warehouse_id',
      label: 'Armazém',
      type: 'combobox',
      required: true,
      options: warehouses.map((w) => ({ value: w.id, label: w.name })),
    },
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'code', label: 'Código', type: 'text', required: true },
    {
      name: 'storage_type',
      label: 'Tipo de armazenagem',
      type: 'select',
      required: true,
      options: Object.entries(STORAGE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'capacity', label: 'Capacidade (kg)', type: 'number', step: '0.001' },
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
    <CrudResourcePage<GrainStorageLocation>
      title="Locais de Armazenamento"
      description="Silos, bolsas e armazéns vinculados a cada unidade"
      singular="Local de armazenamento"
      queryKey="grain-storage-locations"
      service={grainStorageLocationsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'code']}
      defaultValues={{ status: 'A', storage_type: 'CONVENTIONAL_SILO' }}
      buildPayload={(values) => ({
        grain_warehouse_id: values.grain_warehouse_id,
        name: values.name,
        code: values.code,
        storage_type: values.storage_type,
        capacity: values.capacity ? Number(String(values.capacity).replace(',', '.')) : null,
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'grain_warehouse_name', label: 'Armazém', render: (item) => item.grain_warehouse_name ?? '-' },
        {
          key: 'storage_type',
          label: 'Tipo',
          render: (item) => STORAGE_TYPE_LABELS[item.storage_type] ?? item.storage_type,
        },
        {
          key: 'capacity',
          label: 'Capacidade',
          render: (item) => (item.capacity != null ? formatWeightKg(item.capacity) : '-'),
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
