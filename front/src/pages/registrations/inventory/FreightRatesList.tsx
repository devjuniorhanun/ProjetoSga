import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { freightRatesService, type FreightRate } from '@/lib/api-services-inventory';
import { cropsService, suppliersService } from '@/lib/api-services';
import { productsService } from '@/lib/api-services-products';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateBR = (value?: string | null) =>
  value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '-';

export default function FreightRatesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['freight-rates'],
    queryFn: () => freightRatesService.getAll({ per_page: 25 }),
  });

  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: () => cropsService.getAll() });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersService.getAll() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsService.getAll() });

  const fields: CrudField[] = [
    {
      name: 'crop_id',
      label: 'Safra',
      type: 'combobox',
      required: true,
      options: (values) =>
        crops
          .filter((c) => c.status === 'A' || String(c.id) === values.crop_id)
          .map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: 'supplier_id',
      label: 'Transportadora',
      type: 'combobox',
      required: true,
      options: (values) =>
        suppliers
          .filter((s) => s.status === 'A' || String(s.id) === values.supplier_id)
          .map((s) => ({ value: s.id, label: s.supplier_name || s.fantasy_name || s.corporate_reason })),
    },
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
    { name: 'value_per_ton', label: 'Valor por tonelada (R$)', type: 'number', step: '0.01', required: true },
    { name: 'effective_from', label: 'Vigência inicial', type: 'date', required: true },
    {
      name: 'effective_until',
      label: 'Vigência final',
      type: 'date',
      validate: (values) =>
        values.effective_until && values.effective_from && values.effective_until < values.effective_from
          ? 'A vigência final deve ser posterior à inicial'
          : undefined,
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
  ];

  return (
    <CrudResourcePage<FreightRate>
      title="Tarifas de Frete"
      description="Valor por tonelada por safra, transportadora e produto"
      singular="Tarifa de frete"
      queryKey="freight-rates"
      service={freightRatesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['crop_name', 'supplier_name', 'product_name']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        crop_id: values.crop_id,
        supplier_id: values.supplier_id,
        product_id: values.product_id,
        value_per_ton: Number(String(values.value_per_ton ?? '').replace(',', '.')),
        effective_from: values.effective_from,
        effective_until: values.effective_until || null,
        status: values.status,
      })}
      columns={[
        { key: 'crop_name', label: 'Safra', render: (item) => item.crop_name ?? '-' },
        { key: 'supplier_name', label: 'Transportadora', render: (item) => item.supplier_name ?? '-' },
        { key: 'product_name', label: 'Produto', render: (item) => item.product_name ?? '-' },
        {
          key: 'value_per_ton',
          label: 'R$/tonelada',
          render: (item) => formatBRL(Number(item.value_per_ton ?? 0)),
        },
        { key: 'effective_from', label: 'Início', render: (item) => formatDateBR(item.effective_from) },
        { key: 'effective_until', label: 'Fim', render: (item) => formatDateBR(item.effective_until) },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
