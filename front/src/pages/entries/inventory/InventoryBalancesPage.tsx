import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { inventoryBalancesService } from '@/lib/api-services-inventory-releases';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import type { InventoryBalance } from '@/types/fiscal';

const number3 = (value?: number | null) =>
  value == null ? '-' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function InventoryBalancesPage() {
  const options = useFiscalOptions();
  const [productId, setProductId] = useState('');
  const [stockLocationId, setStockLocationId] = useState('');

  const params = useMemo(
    () => ({
      product_id: productId || undefined,
      stock_location_id: stockLocationId || undefined,
      per_page: 50,
    }),
    [productId, stockLocationId],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-balances', params],
    queryFn: () => inventoryBalancesService.list(params),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saldo de Estoque</h1>
        <p className="mt-1 text-muted-foreground">
          Saldos calculados pelo sistema a partir das notas e saídas. Os valores não podem ser editados diretamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Produto</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...options.productOptions]}
            value={productId}
            onValueChange={setProductId}
            placeholder="Todos"
          />
        </div>
        <div className="space-y-2">
          <Label>Local de estoque</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...options.stockLocationOptions]}
            value={stockLocationId}
            onValueChange={setStockLocationId}
            placeholder="Todos"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<InventoryBalance>
          data={data?.items ?? []}
          exportTitle="Saldo de Estoque"
          searchKeys={['product_name', 'stock_location_name', 'batch']}
          columns={[
            { key: 'product_name', label: 'Produto', render: (b) => b.product_name ?? b.product_id },
            { key: 'stock_location_name', label: 'Local', render: (b) => b.stock_location_name ?? '-' },
            { key: 'batch', label: 'Lote', render: (b) => b.batch ?? '-' },
            { key: 'treatment', label: 'Tratamento', render: (b) => b.treatment ?? '-' },
            { key: 'quantity', label: 'Saldo parcial', render: (b) => number3(b.quantity) },
            { key: 'reserved_quantity', label: 'Reservado', render: (b) => number3(b.reserved_quantity) },
            { key: 'available_quantity', label: 'Disponível', render: (b) => number3(b.available_quantity) },
            { key: 'average_cost', label: 'Custo médio', render: (b) => formatCurrencyBRL(b.average_cost ?? 0) },
            { key: 'total_quantity', label: 'Saldo geral', render: (b) => number3(b.total_quantity) },
            { key: 'unit', label: 'Unidade', render: (b) => b.unit ?? '-' },
          ]}
        />
      )}
    </div>
  );
}
