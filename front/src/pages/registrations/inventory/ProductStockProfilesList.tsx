import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import {
  BOOL_OPTIONS,
  INVOICE_TYPE_LABELS,
  fromBool,
  productStockProfilesService,
  stockLocationsService,
  toBool,
  type ProductStockProfile,
} from '@/lib/api-services-inventory';
import { productsService } from '@/lib/api-services-products';

export default function ProductStockProfilesList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['product-stock-profiles'],
    queryFn: () => productStockProfilesService.getAll({ per_page: 25 }),
  });

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsService.getAll() });
  const { data: locations = [] } = useQuery({
    queryKey: ['stock-locations', 'active'],
    queryFn: () => stockLocationsService.getAll({ status: 'A', per_page: 100 }),
  });

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
      name: 'invoice_type',
      label: 'Tipo de nota',
      type: 'select',
      required: true,
      options: Object.entries(INVOICE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'default_stock_location_id',
      label: 'Destino padrão',
      type: 'combobox',
      options: (values) =>
        locations
          .filter((l) => l.status === 'A' || String(l.id) === values.default_stock_location_id)
          .map((l) => ({ value: l.id, label: l.name })),
    },
    { name: 'controls_batch', label: 'Controla lote', type: 'select', options: BOOL_OPTIONS },
    { name: 'controls_expiration', label: 'Controla validade', type: 'select', options: BOOL_OPTIONS },
    { name: 'controls_freight', label: 'Controla frete', type: 'select', options: BOOL_OPTIONS },
    { name: 'controls_stock', label: 'Controla estoque', type: 'select', options: BOOL_OPTIONS },
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
    <CrudResourcePage<ProductStockProfile>
      title="Perfis de Produto"
      description="Define como cada produto se comporta no estoque e nas notas"
      singular="Perfil de produto"
      queryKey="product-stock-profiles"
      service={productStockProfilesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['product_name', 'invoice_type']}
      defaultValues={{
        status: 'A',
        invoice_type: 'GENERAL',
        controls_batch: '0',
        controls_expiration: '0',
        controls_freight: '0',
        controls_stock: '1',
      }}
      toFormValues={(item) => ({
        controls_batch: fromBool(item.controls_batch),
        controls_expiration: fromBool(item.controls_expiration),
        controls_freight: fromBool(item.controls_freight),
        controls_stock: fromBool(item.controls_stock),
        default_stock_location_id: item.default_stock_location_id
          ? String(item.default_stock_location_id)
          : '',
      })}
      buildPayload={(values) => ({
        product_id: values.product_id,
        invoice_type: values.invoice_type,
        default_stock_location_id: values.default_stock_location_id || null,
        controls_batch: toBool(values.controls_batch),
        controls_expiration: toBool(values.controls_expiration),
        controls_freight: toBool(values.controls_freight),
        controls_stock: toBool(values.controls_stock),
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'product_name', label: 'Produto', render: (item) => item.product_name ?? '-' },
        {
          key: 'invoice_type',
          label: 'Tipo de nota',
          render: (item) => INVOICE_TYPE_LABELS[item.invoice_type] ?? item.invoice_type,
        },
        {
          key: 'default_stock_location_name',
          label: 'Destino padrão',
          render: (item) => item.default_stock_location_name ?? '-',
        },
        { key: 'controls_batch', label: 'Lote', render: (item) => (item.controls_batch ? 'Sim' : 'Não') },
        {
          key: 'controls_expiration',
          label: 'Validade',
          render: (item) => (item.controls_expiration ? 'Sim' : 'Não'),
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
