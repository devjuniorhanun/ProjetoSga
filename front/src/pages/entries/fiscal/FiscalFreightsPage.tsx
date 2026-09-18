import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { fiscalFreightsService } from '@/lib/api-services-fiscal';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import type { EntryInvoiceFreight } from '@/types/fiscal';

const number3 = (value?: number | null) =>
  value == null ? '-' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function FiscalFreightsPage() {
  const options = useFiscalOptions();
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');

  const params = useMemo(
    () => ({ supplier_id: supplierId || undefined, product_id: productId || undefined, per_page: 50 }),
    [supplierId, productId],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['fiscal-freights', params],
    queryFn: () => fiscalFreightsService.list(params),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fretes de Notas</h1>
        <p className="mt-1 text-muted-foreground">Fretes a pagar pela fazenda, com saldo em aberto por nota</p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Transportadora</Label>
          <Combobox
            options={[{ value: '', label: 'Todas' }, ...options.supplierOptions]}
            value={supplierId}
            onValueChange={setSupplierId}
            placeholder="Todas"
          />
        </div>
        <div className="space-y-2">
          <Label>Produto</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...options.productOptions]}
            value={productId}
            onValueChange={setProductId}
            placeholder="Todos"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<EntryInvoiceFreight>
          data={data?.items ?? []}
          exportTitle="Fretes de Notas"
          searchKeys={['carrier_name', 'driver_name', 'plate', 'product_name']}
          columns={[
            { key: 'carrier_name', label: 'Transportadora', render: (f) => f.carrier_name ?? '-' },
            { key: 'product_name', label: 'Produto', render: (f) => f.product_name ?? '-' },
            { key: 'crop_name', label: 'Safra', render: (f) => f.crop_name ?? '-' },
            { key: 'driver_name', label: 'Motorista', render: (f) => f.driver_name ?? '-' },
            { key: 'plate', label: 'Placa', render: (f) => f.plate ?? '-' },
            { key: 'invoice_weight', label: 'Peso (kg)', render: (f) => number3(f.invoice_weight) },
            { key: 'value_per_ton', label: 'R$/t', render: (f) => formatCurrencyBRL(f.value_per_ton ?? 0) },
            { key: 'total_value', label: 'Total', render: (f) => formatCurrencyBRL(f.total_value ?? 0) },
            { key: 'paid_value', label: 'Pago', render: (f) => formatCurrencyBRL(f.paid_value ?? 0) },
            { key: 'balance_value', label: 'Saldo', render: (f) => formatCurrencyBRL(f.balance_value ?? 0) },
          ]}
        />
      )}
    </div>
  );
}
