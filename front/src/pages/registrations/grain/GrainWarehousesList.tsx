import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainSupportService, grainWarehousesService } from '@/lib/api-services-grain';
import type { GrainWarehouse } from '@/types/grain';

export default function GrainWarehousesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-warehouses'],
    queryFn: () => grainWarehousesService.getAll({ per_page: 25 }),
  });

  const { data: producers = [] } = useQuery({
    queryKey: ['grain-support-producers'],
    queryFn: grainSupportService.producers,
  });

  const fields: CrudField[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'code', label: 'Código', type: 'text', required: true },
    {
      name: 'producer_id',
      label: 'Produtor (opcional)',
      type: 'combobox',
      options: producers.map((p) => ({ value: p.id, label: p.name })),
    },
    { name: 'address', label: 'Endereço', type: 'text', fullWidth: true },
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
    <CrudResourcePage<GrainWarehouse>
      title="Armazéns"
      description="Armazéns de grãos utilizados no recebimento e na expedição"
      singular="Armazém"
      queryKey="grain-warehouses"
      service={grainWarehousesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'code', 'address']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code,
        producer_id: values.producer_id || null,
        address: values.address || null,
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'producer_name', label: 'Produtor', render: (item) => item.producer_name ?? '-' },
        { key: 'address', label: 'Endereço' },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
