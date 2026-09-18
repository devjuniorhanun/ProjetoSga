import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import {
  BOOL_OPTIONS,
  SERVICE_CATEGORY_LABELS,
  agriculturalServiceTypesService,
  fromBool,
  toBool,
  type AgriculturalServiceType,
} from '@/lib/api-services-inventory';

export default function AgriculturalServiceTypesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['agricultural-service-types'],
    queryFn: () => agriculturalServiceTypesService.getAll({ per_page: 25 }),
  });

  const fields: CrudField[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'code', label: 'Código', type: 'text', required: true },
    {
      name: 'category',
      label: 'Categoria',
      type: 'select',
      required: true,
      options: Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'requires_input', label: 'Exige insumo', type: 'select', options: BOOL_OPTIONS },
    { name: 'requires_rate', label: 'Exige taxa', type: 'select', options: BOOL_OPTIONS },
    { name: 'requires_fleet', label: 'Exige frota', type: 'select', options: BOOL_OPTIONS },
    { name: 'requires_implement', label: 'Exige implemento', type: 'select', options: BOOL_OPTIONS },
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
    <CrudResourcePage<AgriculturalServiceType>
      title="Tipos de Serviço Agrícola"
      description="Categorias de serviço e exigências de insumo, taxa, frota e implemento"
      singular="Tipo de serviço"
      queryKey="agricultural-service-types"
      service={agriculturalServiceTypesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'code']}
      defaultValues={{
        status: 'A',
        category: 'SOIL_PREPARATION',
        requires_input: '0',
        requires_rate: '0',
        requires_fleet: '0',
        requires_implement: '0',
      }}
      toFormValues={(item) => ({
        requires_input: fromBool(item.requires_input),
        requires_rate: fromBool(item.requires_rate),
        requires_fleet: fromBool(item.requires_fleet),
        requires_implement: fromBool(item.requires_implement),
      })}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code,
        category: values.category,
        requires_input: toBool(values.requires_input),
        requires_rate: toBool(values.requires_rate),
        requires_fleet: toBool(values.requires_fleet),
        requires_implement: toBool(values.requires_implement),
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        {
          key: 'category',
          label: 'Categoria',
          render: (item) => SERVICE_CATEGORY_LABELS[item.category] ?? item.category,
        },
        { key: 'requires_input', label: 'Insumo', render: (item) => (item.requires_input ? 'Sim' : 'Não') },
        { key: 'requires_fleet', label: 'Frota', render: (item) => (item.requires_fleet ? 'Sim' : 'Não') },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
