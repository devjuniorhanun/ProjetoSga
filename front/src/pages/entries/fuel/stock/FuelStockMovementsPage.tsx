import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { FuelStockMovement, fuelStockMovementsService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

const TYPES: Record<string, string> = { E: 'Entrada', S: 'Saída', T: 'Transferência', D: 'Devolução', A: 'Ajuste' };

export default function FuelStockMovementsPage() {
  const { stationOptions, productOptions } = useFuelOptions();
  const [filters, setFilters] = useState({ station_id: '', product_id: '', start_date: '', end_date: '' });

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
  const { data = [], isLoading } = useQuery({
    queryKey: ['fuel-stock-movements', params],
    queryFn: () => fuelStockMovementsService.getAll(params),
  });

  const set = (key: keyof typeof filters, value: string) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimentações de Estoque</h1>
        <p className="text-muted-foreground mt-1">Histórico completo de entradas, saídas, transferências e ajustes</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Posto</Label>
            <Combobox options={[{ value: '', label: 'Todos' }, ...stationOptions]} value={filters.station_id} onValueChange={(v) => set('station_id', v)} placeholder="Todos" />
          </div>
          <div className="space-y-2">
            <Label>Produto</Label>
            <Combobox options={[{ value: '', label: 'Todos' }, ...productOptions]} value={filters.product_id} onValueChange={(v) => set('product_id', v)} placeholder="Todos" />
          </div>
          <div className="space-y-2">
            <Label>Data inicial</Label>
            <Input type="date" value={filters.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data final</Label>
            <Input type="date" value={filters.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          data={data}
          columns={[
            { key: 'movement_date', label: 'Data', render: (i: FuelStockMovement) => formatDate(i.movement_date) },
            { key: 'station_name', label: 'Posto' },
            { key: 'tank_name', label: 'Tanque' },
            { key: 'product_name', label: 'Produto' },
            { key: 'type', label: 'Tipo', render: (i: FuelStockMovement) => <Badge variant="secondary">{TYPES[i.type] ?? i.type}</Badge> },
            { key: 'direction', label: 'Sentido', render: (i: FuelStockMovement) => (i.direction === 'I' ? 'Entrada' : 'Saída') },
            { key: 'quantity', label: 'Quantidade' },
            { key: 'next_stock', label: 'Saldo' },
            { key: 'reference', label: 'Referência' },
          ]}
          searchKeys={['station_name', 'product_name', 'reference']}
          searchPlaceholder="Buscar movimentações..."
          exportTitle="Movimentações de Estoque"
        />
      )}
    </div>
  );
}
