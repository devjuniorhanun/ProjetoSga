import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainScalesService } from '@/lib/api-services-grain';
import type { GrainScale } from '@/types/grain';

const fields: CrudField[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true },
  { name: 'code', label: 'Código', type: 'text', required: true },
  { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ex.: Toledo' },
  { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ex.: TI420' },
  { name: 'serial_number', label: 'Número de série', type: 'text' },
  { name: 'location', label: 'Localização', type: 'text' },
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

export default function GrainScalesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-scales'],
    queryFn: () => grainScalesService.getAll({ per_page: 25, status: 'A' }),
  });

  return (
    <CrudResourcePage<GrainScale>
      title="Balanças"
      description="Balanças rodoviárias utilizadas na pesagem de grãos"
      singular="Balança"
      queryKey="grain-scales"
      service={grainScalesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'code', 'location']}
      defaultValues={{ status: 'A' }}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'manufacturer', label: 'Fabricante' },
        { key: 'model', label: 'Modelo' },
        { key: 'location', label: 'Localização' },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
