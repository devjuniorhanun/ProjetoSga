import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { seedProductProfilesService, type SeedProductProfile } from '@/lib/api-services-inventory';
import { productsService } from '@/lib/api-services-products';
import { culturesService, varietiesService } from '@/lib/api-services';

export default function SeedProductProfilesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['seed-product-profiles'],
    queryFn: () => seedProductProfilesService.getAll({ per_page: 25 }),
  });

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsService.getAll() });
  const { data: cultures = [] } = useQuery({ queryKey: ['cultures'], queryFn: () => culturesService.getAll() });
  const { data: varieties = [] } = useQuery({ queryKey: ['varieties'], queryFn: () => varietiesService.getAll() });

  const fields: CrudField[] = [
    {
      name: 'product_id',
      label: 'Produto',
      type: 'combobox',
      required: true,
      options: (values) =>
        products
          .filter((p) => p.status === 'A' || String(p.id) === values.product_id)
          .map((p) => ({ value: p.id, label: p.name })),
    },
    {
      name: 'culture_id',
      label: 'Cultura',
      type: 'combobox',
      required: true,
      options: (values) =>
        cultures
          .filter((c) => c.status === 'A' || String(c.id) === values.culture_id)
          .map((c) => ({ value: c.id, label: c.name })),
      clears: ['variety_id'],
    },
    {
      name: 'variety_id',
      label: 'Variedade',
      type: 'combobox',
      required: true,
      options: (values) =>
        varieties
          .filter(
            (v) =>
              String(v.culture_id) === values.culture_id &&
              (v.status === 'A' || String(v.id) === values.variety_id),
          )
          .map((v) => ({ value: v.id, label: v.name })),
    },
    { name: 'category', label: 'Categoria', type: 'text', required: true },
    { name: 'seed_class', label: 'Classe', type: 'text', required: true },
    { name: 'unit', label: 'Unidade', type: 'text', required: true },
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
  ];

  return (
    <CrudResourcePage<SeedProductProfile>
      title="Perfis de Semente"
      description="Cultura, variedade, categoria e classe de cada semente"
      singular="Perfil de semente"
      queryKey="seed-product-profiles"
      service={seedProductProfilesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['product_name', 'culture_name', 'variety_name']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        product_id: values.product_id,
        culture_id: values.culture_id,
        variety_id: values.variety_id,
        category: values.category,
        seed_class: values.seed_class,
        unit: values.unit,
        status: values.status,
      })}
      columns={[
        { key: 'product_name', label: 'Produto', render: (item) => item.product_name ?? '-' },
        { key: 'culture_name', label: 'Cultura', render: (item) => item.culture_name ?? '-' },
        { key: 'variety_name', label: 'Variedade', render: (item) => item.variety_name ?? '-' },
        { key: 'category', label: 'Categoria' },
        { key: 'seed_class', label: 'Classe' },
        { key: 'unit', label: 'Unidade' },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
