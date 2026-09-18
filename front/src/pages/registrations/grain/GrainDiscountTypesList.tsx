import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import {
  grainDiscountTypesService,
  grainImpurityTypesService,
  grainSupportService,
} from '@/lib/api-services-grain';
import { CALCULATION_METHOD_LABELS } from '@/lib/grain-labels';
import type { GrainDiscountType } from '@/types/grain';

export default function GrainDiscountTypesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-discount-types'],
    queryFn: () => grainDiscountTypesService.getAll({ per_page: 25 }),
  });

  const { data: cultures = [] } = useQuery({
    queryKey: ['grain-support-cultures', 'all'],
    queryFn: grainSupportService.cultures,
  });
  const { data: impurityTypes = [] } = useQuery({
    queryKey: ['grain-impurity-types', 'active'],
    queryFn: () => grainImpurityTypesService.getAll({ status: 'A', per_page: 100 }),
  });

  const fields: CrudField[] = [
    {
      name: 'culture_id',
      label: 'Cultura',
      type: 'combobox',
      required: true,
      options: cultures.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'code', label: 'Código', type: 'text', required: true },
    {
      name: 'calculation_method',
      label: 'Forma de cálculo',
      type: 'select',
      required: true,
      options: Object.entries(CALCULATION_METHOD_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'affects_commercial_weight',
      label: 'Afeta peso comercial',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: 'Sim' },
        { value: '0', label: 'Não' },
      ],
    },
    {
      name: 'generates_impurity',
      label: 'Gera impureza',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: 'Sim' },
        { value: '0', label: 'Não' },
      ],
    },
    {
      name: 'grain_impurity_type_id',
      label: 'Tipo de impureza',
      type: 'combobox',
      hidden: (values) => values.generates_impurity !== '1',
      options: impurityTypes.map((t) => ({ value: t.id, label: t.name })),
      validate: (values) =>
        values.generates_impurity === '1' && !values.grain_impurity_type_id
          ? 'Selecione o tipo de impureza gerado.'
          : undefined,
    },
    { name: 'display_order', label: 'Ordem de exibição', type: 'number', required: true },
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

  return (
    <CrudResourcePage<GrainDiscountType>
      title="Tipos de Desconto"
      description="Descontos de qualidade aplicados por cultura no recebimento"
      singular="Tipo de desconto"
      queryKey="grain-discount-types"
      service={grainDiscountTypesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'code', 'culture_name']}
      defaultValues={{
        status: 'A',
        calculation_method: 'MANUAL',
        affects_commercial_weight: '1',
        generates_impurity: '0',
        display_order: '1',
      }}
      toFormValues={(item) => ({
        affects_commercial_weight: item.affects_commercial_weight ? '1' : '0',
        generates_impurity: item.generates_impurity ? '1' : '0',
      })}
      buildPayload={(values) => ({
        culture_id: values.culture_id,
        name: values.name,
        code: values.code,
        measurement_type: 'PERCENTAGE',
        measurement_unit: 'PERCENT',
        calculation_method: values.calculation_method,
        affects_commercial_weight: values.affects_commercial_weight === '1',
        generates_impurity: values.generates_impurity === '1',
        grain_impurity_type_id:
          values.generates_impurity === '1' ? values.grain_impurity_type_id || null : null,
        display_order: Number(values.display_order) || 0,
        status: values.status,
        description: values.description || null,
      })}
      columns={[
        { key: 'display_order', label: 'Ordem' },
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'culture_name', label: 'Cultura', render: (item) => item.culture_name ?? '-' },
        {
          key: 'calculation_method',
          label: 'Cálculo',
          render: (item) => CALCULATION_METHOD_LABELS[item.calculation_method] ?? item.calculation_method,
        },
        {
          key: 'affects_commercial_weight',
          label: 'Peso comercial',
          render: (item) => (item.affects_commercial_weight ? 'Sim' : 'Não'),
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
