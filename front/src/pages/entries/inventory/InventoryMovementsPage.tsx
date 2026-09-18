import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { inventoryMovementsService } from '@/lib/api-services-inventory-releases';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { MOVEMENT_TYPE_LABELS, labelOr, optionsFrom } from '@/lib/fiscal-labels';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateTimeBR } from '@/lib/grain-format';
import type { InventoryMovement } from '@/types/fiscal';

const number3 = (value?: number | null) =>
  value == null ? '-' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function InventoryMovementsPage() {
  const options = useFiscalOptions();
  const [productId, setProductId] = useState('');
  const [stockLocationId, setStockLocationId] = useState('');
  const [movementType, setMovementType] = useState('');

  const params = useMemo(
    () => ({
      product_id: productId || undefined,
      stock_location_id: stockLocationId || undefined,
      movement_type: movementType || undefined,
      per_page: 50,
    }),
    [productId, stockLocationId, movementType],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', params],
    queryFn: () => inventoryMovementsService.list(params),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimentações de Estoque</h1>
        <p className="mt-1 text-muted-foreground">Histórico de entradas, saídas e devoluções registradas pelo sistema</p>
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
        <div className="space-y-2">
          <Label>Tipo de movimentação</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...optionsFrom(MOVEMENT_TYPE_LABELS)]}
            value={movementType}
            onValueChange={setMovementType}
            placeholder="Todos"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<InventoryMovement>
          data={data?.items ?? []}
          exportTitle="Movimentações de Estoque"
          searchKeys={['product_name', 'stock_location_name', 'movement_type', 'user_name']}
          columns={[
            { key: 'occurred_at', label: 'Data/hora', render: (m) => formatDateTimeBR(m.occurred_at) },
            { key: 'movement_type', label: 'Tipo', render: (m) => labelOr(MOVEMENT_TYPE_LABELS, m.movement_type) },
            { key: 'product_name', label: 'Produto', render: (m) => m.product_name ?? m.product_id },
            { key: 'stock_location_name', label: 'Local', render: (m) => m.stock_location_name ?? '-' },
            { key: 'quantity', label: 'Quantidade', render: (m) => number3(m.quantity) },
            { key: 'balance_after', label: 'Saldo após', render: (m) => number3(m.balance_after) },
            { key: 'unit_cost', label: 'Custo unit.', render: (m) => formatCurrencyBRL(m.unit_cost ?? 0) },
            { key: 'user_name', label: 'Usuário', render: (m) => m.user_name ?? '-' },
          ]}
        />
      )}
    </div>
  );
}
