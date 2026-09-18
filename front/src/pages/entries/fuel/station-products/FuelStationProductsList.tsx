import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { FuelStationProduct, fuelStationProductsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

export default function FuelStationProductsList() {
  const { data, isLoading } = useCrud<FuelStationProduct>('fuel-station-products', fuelStationProductsService);
  const { stationOptions, productOptions } = useFuelOptions();

  return (
    <CrudResourcePage<FuelStationProduct>
      title="Produtos por Posto"
      description="Defina quais produtos estão disponíveis em cada posto e seus limites de estoque"
      singular="Produto do Posto"
      queryKey="fuel-station-products"
      relatedQueryKeys={['fuel-stock']}
      service={fuelStationProductsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['station_name', 'product_name']}
      numericFields={['minimum_stock', 'maximum_stock', 'actual_stock']}
      defaultValues={{ station_id: '', product_id: '', minimum_stock: '0', maximum_stock: '0', actual_stock: '0', status: 'A' }}
      columns={[
        { key: 'station_name', label: 'Posto' },
        { key: 'product_name', label: 'Produto' },
        { key: 'actual_stock', label: 'Estoque atual' },
        { key: 'minimum_stock', label: 'Estoque mínimo' },
        { key: 'maximum_stock', label: 'Estoque máximo' },
        { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
      ]}
      fields={[
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: productOptions },
        { name: 'minimum_stock', label: 'Estoque mínimo', type: 'number', step: '0.01', required: true },
        { name: 'maximum_stock', label: 'Estoque máximo', type: 'number', step: '0.01', required: true,
          validate: (v) => (Number(v.maximum_stock) < Number(v.minimum_stock) ? 'Máximo não pode ser menor que o mínimo' : undefined) },
        { name: 'actual_stock', label: 'Estoque atual', type: 'number', step: '0.01', readOnly: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'A', label: 'Ativo' }, { value: 'I', label: 'Inativo' },
        ] },
      ]}
    />
  );
}
