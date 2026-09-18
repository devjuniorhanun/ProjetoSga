import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainImpurityTypesService } from '@/lib/api-services-grain';
import type { GrainImpurityType } from '@/types/grain';

const fields: CrudField[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true },
  { name: 'code', label: 'Código', type: 'text', required: true },
  {
    name: 'requires_destination',
    label: 'Exige destino',
    type: 'select',
    required: true,
    options: [
      { value: '1', label: 'Sim' },
      { value: '0', label: 'Não' },
    ],
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
  { name: 'description', label: 'Descrição', type: 'textarea', fullWidth: true },
];

export default function GrainImpurityTypesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-impurity-types'],
    queryFn: () => grainImpurityTypesService.getAll({ per_page: 25 }),
  });

  return (
    <CrudResourcePage<GrainImpurityType>
      title="Tipos de Impureza"
      description="Impurezas geradas na limpeza dos grãos"
      singular="Tipo de impureza"
      queryKey="grain-impurity-types"
      service={grainImpurityTypesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'code']}
      defaultValues={{ status: 'A', requires_destination: '0' }}
      toFormValues={(item) => ({ requires_destination: item.requires_destination ? '1' : '0' })}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code,
        measurement_unit: 'KG',
        requires_destination: values.requires_destination === '1',
        status: values.status,
        description: values.description || null,
      })}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'measurement_unit', label: 'Unidade', render: () => 'KG' },
        {
          key: 'requires_destination',
          label: 'Exige destino',
          render: (item) => (item.requires_destination ? 'Sim' : 'Não'),
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
