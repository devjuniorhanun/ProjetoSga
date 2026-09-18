import { useCrud } from '@/hooks/use-crud';
import { CrudResourcePage } from '@/components/crud/CrudResourcePage';
import { formatDate } from '@/lib/utils';
import { FuelEntry, fuelEntriesService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

export default function FuelEntriesList() {
  const { data, isLoading } = useCrud<FuelEntry>('fuel-entries', fuelEntriesService);
  const { stationOptions, productsByStation, supplierOptions } = useFuelOptions();

  return (
    <CrudResourcePage<FuelEntry>
      title="Entradas"
      description="Entradas de combustíveis e lubrificantes nos postos"
      singular="Entrada"
      queryKey="fuel-entries"
      relatedQueryKeys={['fuel-stock', 'fuel-stock-movements', 'fuel-station-products']}
      service={fuelEntriesService}
      data={data}
      isLoading={isLoading}
      searchKeys={['supplier_name', 'station_name', 'product_name', 'document']}
      numericFields={['quantity', 'unit_price']}
      confirmOnSave
      defaultValues={{ supplier_id: '', station_id: '', product_id: '', entry_date: '', quantity: '', unit_price: '', document: '', observation: '' }}
      columns={[
        { key: 'entry_date', label: 'Data', render: (i) => formatDate(i.entry_date) },
        { key: 'supplier_name', label: 'Fornecedor' },
        { key: 'station_name', label: 'Posto' },
        { key: 'product_name', label: 'Produto' },
        { key: 'quantity', label: 'Quantidade' },
        { key: 'unit_price', label: 'Preço unitário' },
        { key: 'document', label: 'Documento' },
      ]}
      fields={[
        { name: 'supplier_id', label: 'Fornecedor', type: 'combobox', required: true, options: supplierOptions },
        { name: 'station_id', label: 'Posto', type: 'combobox', required: true, options: stationOptions },
        { name: 'product_id', label: 'Produto', type: 'combobox', required: true, options: (v) => productsByStation(v.station_id) },
        { name: 'entry_date', label: 'Data', type: 'date', required: true },
        { name: 'quantity', label: 'Quantidade', type: 'number', step: '0.0001', required: true,
          validate: (v) => (Number(v.quantity) <= 0 ? 'A quantidade deve ser maior que zero' : undefined) },
        { name: 'unit_price', label: 'Preço por litro/unidade', type: 'number', step: '0.0001', required: true,
          validate: (v) => (Number(v.unit_price) < 0 ? 'Informe um valor válido' : undefined) },
        { name: 'document', label: 'Documento', type: 'text', required: true },
        { name: 'observation', label: 'Observação', type: 'textarea', fullWidth: true },
      ]}
    />
  );
}
